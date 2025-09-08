using LeadTracker.Infrastructure;
using LeadTracker.Infrastructure.Configuration;
using LeadTracker.Core.Services;
using LeadTracker.Infrastructure.Middleware;
using LeadTracker.Infrastructure.Services;
using LeadTracker.Api.Filters;
using LeadTracker.Infrastructure.Seed;
using LeadTracker.Core.Entities;
using LeadTracker.Api.Commands;
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

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);
    
    // Configure Serilog
    builder.Host.UseSerilog((context, services, configuration) => configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .WriteTo.Console()
        .WriteTo.File("logs/leadtracker-.txt", rollingInterval: RollingInterval.Day));

    // Add services to the container
    builder.Services.AddControllers()
        .AddJsonOptions(options =>
        {
            // Configure JSON serialization to handle circular references
            options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
            options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
            options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
            options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        });
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

    // Database Configuration
    builder.Services.AddDbContext<LeadTrackerDbContext>(options =>
    {
        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"),
            b => b.MigrationsAssembly("LeadTracker.Infrastructure"));
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

    // CORS
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("DefaultPolicy", policy =>
        {
            var allowedOrigins = builder.Configuration.GetSection("CORS:AllowedOrigins").Get<string[]>() 
                ?? new[] { "http://localhost:3000" };
                
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
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

    // AutoMapper
    builder.Services.AddAutoMapper(Assembly.GetExecutingAssembly());

    // Custom Services
    builder.Services.AddScoped<ITenantContext, TenantContext>();
    builder.Services.AddScoped<ITenantFilterService, TenantFilterService>();
    builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
    builder.Services.AddScoped<IJwtService, JwtService>();
    builder.Services.AddScoped<IAuthService, AuthService>();
    builder.Services.AddScoped<ILeadService, LeadService>();
    
    // Seed Command
    builder.Services.AddSeedCommand();

    var app = builder.Build();

    // Configure the HTTP request pipeline
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "Lead Tracker API v1");
            c.RoutePrefix = "swagger";
        });
    }

    app.UseHttpsRedirection();
    app.UseCors("DefaultPolicy");
    // app.UseRateLimiter(); // Commented out for .NET 7 compatibility

    // Custom Middleware
    app.UseMiddleware<RequestCorrelationMiddleware>();
    app.UseMiddleware<GlobalExceptionMiddleware>();

    app.UseAuthentication();
    app.UseAuthorization();
    
    // Tenant resolution must be after authentication
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
    }

    // Health Checks
    app.MapHealthChecks("/health");
    app.MapHealthChecks("/health/ready");
    app.MapHealthChecks("/health/live");

    app.MapControllers();

    // Database Migration and Seeding
    using (var scope = app.Services.CreateScope())
    {
        var context = scope.ServiceProvider.GetRequiredService<LeadTrackerDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        
        try
        {
            // Only run migrations for non-testing environments
            if (!app.Environment.IsEnvironment("Testing"))
            {
                logger.LogInformation("Applying database migrations...");
                await context.Database.MigrateAsync();
                logger.LogInformation("Database migrations applied successfully");
            }
            
            if (app.Environment.IsDevelopment())
            {
                logger.LogInformation("Seeding development data...");
                await SeedData.SeedAsync(context, scope.ServiceProvider);
                logger.LogInformation("Development data seeded successfully");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while migrating or seeding the database");
            throw;
        }
    }

    Log.Information("Starting Lead Tracker API");
    await app.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

// Public Program class for testing
public partial class Program { }