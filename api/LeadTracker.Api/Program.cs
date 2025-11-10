using LeadTracker.Infrastructure;
using LeadTracker.Infrastructure.Configuration;
using LeadTracker.Core.Services;
using LeadTracker.Infrastructure.Middleware;
using LeadTracker.Infrastructure.Services;
using LeadTracker.Api.Filters;
using LeadTracker.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Serilog;
using Serilog.Events;
using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.OpenApi.Models;
using System.Reflection;
using FluentValidation;
using MediatR;
using AutoMapper;
// Rate limiting for .NET 7
// using Microsoft.AspNetCore.RateLimiting;
// using System.Threading.RateLimiting;

// Configure Serilog bootstrap logger
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);
    
    // Configure Serilog based on environment
    if (!builder.Environment.IsEnvironment("Testing"))
    {
        builder.Host.UseSerilog((context, services, configuration) => configuration
            .ReadFrom.Configuration(context.Configuration)
            .ReadFrom.Services(services)
            .Enrich.FromLogContext()
            .WriteTo.Console()
            .WriteTo.File("logs/leadtracker-.txt", rollingInterval: RollingInterval.Day));
    }

    // Add services to the container
    builder.Services.AddHttpContextAccessor(); // Required for Serilog enrichers
    builder.Services.AddControllers(options =>
    {
        // Temporarily disabled - causes model binding exception
        // options.Filters.Add<FluentValidationFilter>();
    })
        .AddJsonOptions(options =>
        {
            // Configure JSON serialization to handle circular references
            options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
            options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
            options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
            options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        });
    
    // Add SignalR
    builder.Services.AddSignalR();
    
    builder.Services.AddEndpointsApiExplorer();
    
    // Configure Swagger/OpenAPI
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo 
        { 
            Title = "Lead Tracker API", 
            Version = "v1",
            Description = "Multi-tenant Lead Management System API",
            Contact = new OpenApiContact
            {
                Name = "Lead Tracker Team",
                Email = "support@leadtracker.com"
            }
        });
        
        // Add JWT authentication to Swagger
        c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
            Name = "Authorization",
            In = ParameterLocation.Header,
            Type = SecuritySchemeType.ApiKey,
            Scheme = "Bearer"
        });
        
        c.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    }
                },
                Array.Empty<string>()
            }
        });
        
        // Include XML comments
        var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
        var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
        if (File.Exists(xmlPath))
        {
            c.IncludeXmlComments(xmlPath);
        }
    });

    // Register TenantFilterService BEFORE DbContext
    builder.Services.AddScoped<ITenantContext, TenantContext>();
    builder.Services.AddScoped<ITenantFilterService, TenantFilterService>();
    
    // Database Configuration
    builder.Services.AddDbContext<LeadTrackerDbContext>(options =>
    {
        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"),
            b => b.MigrationsAssembly("LeadTracker.Infrastructure"))
               .EnableDetailedErrors()  // Enable detailed errors for debugging
               .EnableSensitiveDataLogging();  // Show parameter values in logs
    });

    // Identity Configuration
    builder.Services.AddIdentity<ApplicationUser, IdentityRole<Guid>>(options =>
    {
        // Password settings
        options.Password.RequireDigit = true;
        options.Password.RequireLowercase = true;
        options.Password.RequireNonAlphanumeric = false;
        options.Password.RequireUppercase = true;
        options.Password.RequiredLength = 8;
        options.Password.RequiredUniqueChars = 1;

        // Lockout settings
        options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
        options.Lockout.MaxFailedAccessAttempts = 5;
        options.Lockout.AllowedForNewUsers = true;

        // User settings
        options.User.AllowedUserNameCharacters =
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._@+";
        options.User.RequireUniqueEmail = true;
    })
    .AddEntityFrameworkStores<LeadTrackerDbContext>()
    .AddDefaultTokenProviders();

    // JWT Authentication
    var jwtSettings = builder.Configuration.GetSection("JWT");
    var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey is required");
    
    builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            ClockSkew = TimeSpan.Zero
        };
    });

    // Authorization
    builder.Services.AddAuthorization();

    // CORS - Configuration permissive pour le développement
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("DefaultPolicy", policy =>
        {
            // En développement, accepter toutes les origins
            if (builder.Environment.IsDevelopment())
            {
                policy.AllowAnyOrigin()
                      .AllowAnyMethod()
                      .AllowAnyHeader();
            }
            else
            {
                var allowedOrigins = builder.Configuration.GetSection("CORS:AllowedOrigins").Get<string[]>() 
                    ?? new[] { "http://localhost:3000", "https://localhost:3000" };
                    
                policy.WithOrigins(allowedOrigins)
                      .AllowAnyMethod()
                      .AllowAnyHeader()
                      .AllowCredentials();
            }
        });
    });

    // Rate Limiting (commented out for .NET 7 compatibility)
    // builder.Services.AddRateLimiter(options =>
    // {
    //     options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
    //         RateLimitPartition.GetFixedWindowLimiter(
    //             partitionKey: context.User?.Identity?.Name ?? context.Request.Headers.Host.ToString(),
    //             factory: partition => new FixedWindowRateLimiterOptions
    //             {
    //                 AutoReplenishment = true,
    //                 PermitLimit = 100,
    //                 Window = TimeSpan.FromMinutes(1)
    //             }));
    // });

    // Hangfire configuration - only if enabled and not in testing environment
    var isHangfireEnabled = builder.Configuration.GetValue<bool>("Hangfire:Enabled", true);
    var isHangfireDisabledForTesting = builder.Configuration.GetValue<bool>("Hangfire:DisableForTesting", false);
    var skipDatabaseConnection = builder.Configuration.GetValue<bool>("Hangfire:SkipDatabaseConnection", false);
    var isTestingEnvironment = builder.Environment.IsEnvironment("Testing") || 
                              builder.Environment.IsEnvironment("Test") ||
                              Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Testing" ||
                              Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Test" ||
                              Environment.GetEnvironmentVariable("DISABLE_HANGFIRE") == "true";
    
    // Only configure Hangfire if it's enabled and not in testing environment
    if (isHangfireEnabled && !isTestingEnvironment && !isHangfireDisabledForTesting && !skipDatabaseConnection)
    {
        // For production environment, use production database
        builder.Services.AddHangfire(config => config
            .SetDataCompatibilityLevel(CompatibilityLevel.Version_170)
            .UseSimpleAssemblyNameTypeSerializer()
            .UseRecommendedSerializerSettings()
            .UsePostgreSqlStorage(options =>
            {
                options.UseNpgsqlConnection(builder.Configuration.GetConnectionString("DefaultConnection"));
            }));
        
        builder.Services.AddHangfireServer();
    }
    // For testing environment, Hangfire is completely disabled

    // Application Insights
    builder.Services.AddApplicationInsightsTelemetry();

    // Health Checks
    builder.Services.AddHealthChecks()
        .AddNpgSql(builder.Configuration.GetConnectionString("DefaultConnection")!);

    // Redis Cache
    var redisConnectionString = builder.Configuration.GetConnectionString("Redis");
    if (!string.IsNullOrEmpty(redisConnectionString))
    {
        builder.Services.AddStackExchangeRedisCache(options =>
        {
            options.Configuration = redisConnectionString;
        });
    }
    else
    {
        builder.Services.AddMemoryCache();
    }

    // MediatR
    builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly()));

    // FluentValidation
    builder.Services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());
    builder.Services.AddValidatorsFromAssembly(typeof(LeadTracker.Core.Validators.RegisterRequestValidator).Assembly);
    builder.Services.AddScoped<FluentValidationFilter>();
    

    // AutoMapper
    builder.Services.AddAutoMapper(Assembly.GetExecutingAssembly());

    // Custom Services
    builder.Services.AddScoped<ITenantContext, TenantContext>();
    builder.Services.AddScoped<ITenantFilterService, TenantFilterService>();
    builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
    builder.Services.AddScoped<IJwtService, JwtService>();
    builder.Services.AddScoped<IAuthService, LeadTracker.Infrastructure.Services.AuthService>();
    builder.Services.AddScoped<ILeadService, LeadService>();
    builder.Services.AddScoped<IKanbanService, LeadTracker.Infrastructure.Services.KanbanService>();
    builder.Services.AddScoped<IKanbanNotificationService, LeadTracker.Api.Services.SimpleKanbanNotificationService>();
    builder.Services.AddScoped<IEmailService, LeadTracker.Infrastructure.Services.EmailService>();
    builder.Services.AddScoped<IUserInvitationService, LeadTracker.Infrastructure.Services.UserInvitationService>();
    builder.Services.AddScoped<ILeadSeederService, LeadTracker.Infrastructure.Services.LeadSeederService>();
    builder.Services.AddScoped<IMonitoringService, LeadTracker.Infrastructure.Services.MonitoringService>();
    builder.Services.AddScoped<IAlertService, LeadTracker.Infrastructure.Services.AlertService>();
    builder.Services.AddScoped<IAnalyticsService, LeadTracker.Infrastructure.Services.AnalyticsService>();
    builder.Services.AddScoped<IOrganizationService, LeadTracker.Infrastructure.Services.OrganizationService>();
    // Kanban services
    builder.Services.AddScoped<IKanbanService, LeadTracker.Infrastructure.Services.KanbanService>();
    builder.Services.AddScoped<IKanbanNotificationService, LeadTracker.Api.Services.KanbanNotificationService>();
    
    // Activity, Comment, Attachment, and Task services
    builder.Services.AddScoped<IActivityService, ActivityService>();
    builder.Services.AddScoped<ICommentService, CommentService>();
    builder.Services.AddScoped<IAttachmentService, AttachmentService>();
    builder.Services.AddScoped<ITaskService, TaskService>();
    builder.Services.AddScoped<INotificationService, NotificationService>();
    builder.Services.AddScoped<ITaskReminderService, TaskReminderService>();
    
    // Add controllers
    builder.Services.AddScoped<LeadTracker.Api.Controllers.MonitoringController>();
    
    // SignalR
    builder.Services.AddSignalR();

    var app = builder.Build();

    // Configure the HTTP request pipeline
    // DISABLED - causes issues with external requests
    // app.UseDeveloperExceptionPage();
    
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "Lead Tracker API v1");
            c.RoutePrefix = "swagger";
        });
    }

    // ALL MIDDLEWARE DISABLED FOR DEBUGGING
    // app.UseHttpsRedirection();
    app.UseCors("DefaultPolicy");
    // app.UseRateLimiter(); // Commented out for .NET 7 compatibility

    // Custom Middleware
    app.UseMiddleware<RequestCorrelationMiddleware>();
    app.UseMiddleware<GlobalExceptionMiddleware>();

    app.UseAuthentication();
    app.UseAuthorization();
    
    // Tenant resolution MUST be after authentication
    app.UseMiddleware<TenantResolutionMiddleware>();


    // Hangfire Dashboard - only in non-testing environments
    var isHangfireDashboardEnabled = builder.Configuration.GetValue<bool>("Hangfire:EnableDashboard", false);
    var isHangfireEnabledForDashboard = builder.Configuration.GetValue<bool>("Hangfire:Enabled", true);
    var isHangfireDisabledForTestingDashboard = builder.Configuration.GetValue<bool>("Hangfire:DisableForTesting", false);
    var skipDatabaseConnectionForDashboard = builder.Configuration.GetValue<bool>("Hangfire:SkipDatabaseConnection", false);
    
    if (isHangfireDashboardEnabled && isHangfireEnabledForDashboard && !isHangfireDisabledForTestingDashboard && !skipDatabaseConnectionForDashboard && !isTestingEnvironment)
    {
        app.UseHangfireDashboard("/hangfire", new DashboardOptions
        {
            Authorization = new[] { new HangfireAuthorizationFilter() }
        });
        
        // Configure recurring jobs for task reminders and recurring tasks
        // Only schedule jobs in non-testing environments where Hangfire is enabled
        RecurringJob.AddOrUpdate<ITaskReminderService>(
            "check-overdue-tasks",
            service => service.CheckOverdueTasksAsync(),
            "*/15 * * * *" // Every 15 minutes
        );

        RecurringJob.AddOrUpdate<ITaskReminderService>(
            "process-recurring-tasks",
            service => service.ProcessRecurringTasksAsync(),
            "0 0 * * *" // Daily at midnight UTC
        );

        RecurringJob.AddOrUpdate<INotificationService>(
            "cleanup-old-notifications",
            service => service.DeleteOldReadNotificationsAsync(30),
            "0 2 * * *" // Daily at 2:00 AM UTC
        );
    }

    // Health Checks
    app.MapHealthChecks("/health");
    app.MapHealthChecks("/health/ready");
    app.MapHealthChecks("/health/live");

    // SignalR Hubs
    app.MapHub<LeadTracker.Api.Hubs.KanbanHub>("/kanban-hub");

    app.MapControllers();
    
    // SignalR hubs
    app.MapHub<LeadTracker.Api.Hubs.KanbanHub>("/kanbanhub");

    // Database Migration
    using (var scope = app.Services.CreateScope())
    {
        var context = scope.ServiceProvider.GetRequiredService<LeadTrackerDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        
        try
        {
            // Only run migrations for non-testing environments
            if (!app.Environment.IsEnvironment("Testing"))
            {
                logger.LogInformation("Skipping database migrations for now...");
                // TODO: Fix migration conflicts
                // await context.Database.MigrateAsync();
            }
            
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while migrating the database");
            throw;
        }
    }

    if (!app.Environment.IsEnvironment("Testing"))
    {
        Log.Information("Starting Lead Tracker API");
    }
    
    // Force listening on all interfaces
    var urls = Environment.GetEnvironmentVariable("ASPNETCORE_URLS") ?? "http://0.0.0.0:8080";
    app.Urls.Add(urls);
    Log.Information($"API will listen on: {urls}");
    
    await app.RunAsync();
}
catch (Exception ex)
{
    if (!args.Contains("--environment") || !args.Contains("Testing"))
    {
        Log.Fatal(ex, "Application terminated unexpectedly");
    }
    throw; // Re-throw the exception for proper error handling
}
finally
{
    if (!args.Contains("--environment") || !args.Contains("Testing"))
    {
        Log.CloseAndFlush();
    }
}

// Public Program class for testing
public partial class Program { }