using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using LeadTracker.Infrastructure;
using LeadTracker.Core.Entities;
using TaskEntity = LeadTracker.Core.Entities.Task;

namespace LeadTracker.Infrastructure.Seed;

public static class SeedData
{
    public static async System.Threading.Tasks.Task SeedAsync(DbContext context, IServiceProvider serviceProvider)
    {
        var logger = serviceProvider.GetRequiredService<ILogger<object>>();
        var leadTrackerContext = (LeadTrackerDbContext)context;
        
        logger.LogInformation("Seeding development data...");

        try
        {
            // Seed Roles
            await SeedRolesAsync(leadTrackerContext, logger);
            
            // Seed Organizations
            await SeedOrganizationsAsync(leadTrackerContext, logger);
            
            // Seed Users
            await SeedUsersAsync(leadTrackerContext, logger);
            
            // Seed Stages
            await SeedStagesAsync(leadTrackerContext, logger);
            
            // Seed Leads
            await SeedLeadsAsync(leadTrackerContext, logger);
            
            // Seed Tasks
            await SeedTasksAsync(leadTrackerContext, logger);

            await leadTrackerContext.SaveChangesAsync();
            logger.LogInformation("Database seeding completed successfully");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while seeding the database");
            throw;
        }
    }

    private static async System.Threading.Tasks.Task SeedRolesAsync(LeadTrackerDbContext context, ILogger logger)
    {
        if (await context.Roles.AnyAsync())
        {
            logger.LogInformation("Roles already exist, skipping seed");
            return;
        }

        var roles = new[]
        {
            new Microsoft.AspNetCore.Identity.IdentityRole<Guid>
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                Name = "Admin",
                NormalizedName = "ADMIN"
            },
            new Microsoft.AspNetCore.Identity.IdentityRole<Guid>
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                Name = "User",
                NormalizedName = "USER"
            },
            new Microsoft.AspNetCore.Identity.IdentityRole<Guid>
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000003"),
                Name = "Manager",
                NormalizedName = "MANAGER"
            }
        };

        context.Roles.AddRange(roles);
        logger.LogInformation("Seeded {Count} roles", roles.Length);
    }

    private static async System.Threading.Tasks.Task SeedOrganizationsAsync(LeadTrackerDbContext context, ILogger logger)
    {
        if (await context.Organizations.AnyAsync())
        {
            logger.LogInformation("Organizations already exist, skipping seed");
            return;
        }

        var organizations = new[]
        {
            new Organization
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Name = "Demo Corporation",
                Domain = "demo-corp",
                Description = "A demo organization for testing purposes",
                TimeZone = "UTC",
                Currency = "USD",
                IsActive = true
            },
            new Organization
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                Name = "Acme Industries",
                Domain = "acme-industries",
                Description = "Leading provider of industrial solutions",
                TimeZone = "America/New_York",
                Currency = "USD",
                IsActive = true
            }
        };

        await context.Organizations.AddRangeAsync(organizations);
        logger.LogInformation($"Added {organizations.Length} organizations");
    }

    private static async System.Threading.Tasks.Task SeedUsersAsync(LeadTrackerDbContext context, ILogger logger)
    {
        if (await context.BusinessUsers.AnyAsync())
        {
            logger.LogInformation("Business users already exist, skipping seed");
            return;
        }

        var users = new[]
        {
            new User
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                OrganizationId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                FirstName = "John",
                LastName = "Doe",
                Email = "john.doe@demo-corp.com",
                PhoneNumber = "+1-555-0101",
                JobTitle = "Sales Manager",
                IsActive = true
            },
            new User
            {
                Id = Guid.Parse("44444444-4444-4444-4444-444444444444"),
                OrganizationId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                FirstName = "Jane",
                LastName = "Smith",
                Email = "jane.smith@demo-corp.com",
                PhoneNumber = "+1-555-0102",
                JobTitle = "Account Executive",
                IsActive = true
            },
            new User
            {
                Id = Guid.Parse("55555555-5555-5555-5555-555555555555"),
                OrganizationId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                FirstName = "Bob",
                LastName = "Wilson",
                Email = "bob.wilson@acme-industries.com",
                PhoneNumber = "+1-555-0201",
                JobTitle = "Business Development",
                IsActive = true
            }
        };

        await context.BusinessUsers.AddRangeAsync(users);
        logger.LogInformation($"Added {users.Length} business users");
    }

    private static async System.Threading.Tasks.Task SeedStagesAsync(LeadTrackerDbContext context, ILogger logger)
    {
        if (await context.Stages.AnyAsync())
        {
            logger.LogInformation("Stages already exist, skipping seed");
            return;
        }

        var stages = new[]
        {
            // Demo Corp stages
            new Stage
            {
                Id = Guid.Parse("66666666-6666-6666-6666-666666666666"),
                OrganizationId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Name = "New Lead",
                Description = "Newly acquired leads",
                Order = 1,
                Color = "#3B82F6",
                IsActive = true
            },
            new Stage
            {
                Id = Guid.Parse("77777777-7777-7777-7777-777777777777"),
                OrganizationId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Name = "Qualified",
                Description = "Qualified prospects",
                Order = 2,
                Color = "#8B5CF6",
                IsActive = true
            },
            new Stage
            {
                Id = Guid.Parse("88888888-8888-8888-8888-888888888888"),
                OrganizationId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Name = "Proposal",
                Description = "Proposal sent",
                Order = 3,
                Color = "#F59E0B",
                IsActive = true
            },
            new Stage
            {
                Id = Guid.Parse("99999999-9999-9999-9999-999999999999"),
                OrganizationId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Name = "Won",
                Description = "Closed won",
                Order = 4,
                Color = "#10B981",
                IsWonStage = true,
                IsActive = true
            },
            new Stage
            {
                Id = Guid.Parse("AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA"),
                OrganizationId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Name = "Lost",
                Description = "Closed lost",
                Order = 5,
                Color = "#EF4444",
                IsLostStage = true,
                IsActive = true
            }
        };

        await context.Stages.AddRangeAsync(stages);
        logger.LogInformation($"Added {stages.Length} stages");
    }

    private static async System.Threading.Tasks.Task SeedLeadsAsync(LeadTrackerDbContext context, ILogger logger)
    {
        if (await context.Leads.AnyAsync())
        {
            logger.LogInformation("Leads already exist, skipping seed");
            return;
        }

        var random = new Random(42); // Fixed seed for consistent data
        var companies = new[] { "TechCorp", "InnovateLtd", "FutureSoft", "DataDyne", "CloudFirst" };
        var sources = new[] { "Website", "Referral", "Cold Call", "Email", "Social Media" };
        var firstNames = new[] { "Alice", "Bob", "Charlie", "Diana", "Edward" };
        var lastNames = new[] { "Anderson", "Brown", "Clark", "Davis", "Evans" };

        var leads = new List<Lead>();

        // Generate 10 leads for Demo Corp
        var demoStages = new[] 
        {
            Guid.Parse("66666666-6666-6666-6666-666666666666"), // New Lead
            Guid.Parse("77777777-7777-7777-7777-777777777777"), // Qualified
            Guid.Parse("88888888-8888-8888-8888-888888888888"), // Proposal
        };

        for (int i = 0; i < 10; i++)
        {
            var firstName = firstNames[random.Next(firstNames.Length)];
            var lastName = lastNames[random.Next(lastNames.Length)];
            var company = companies[random.Next(companies.Length)];

            leads.Add(new Lead
            {
                OrganizationId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Title = $"{company} - {firstName} {lastName}",
                FirstName = firstName,
                LastName = lastName,
                Email = $"{firstName.ToLower()}.{lastName.ToLower()}@{company.ToLower()}.com",
                PhoneNumber = $"+1-555-{random.Next(1000, 9999)}",
                Company = company,
                JobTitle = new[] { "CEO", "CTO", "VP Sales", "Marketing Director" }[random.Next(4)],
                EstimatedValue = random.Next(5000, 50000),
                Probability = random.Next(20, 90),
                ExpectedCloseDate = DateTime.UtcNow.AddDays(random.Next(7, 180)),
                Source = sources[random.Next(sources.Length)],
                Status = "Open",
                StageId = demoStages[random.Next(demoStages.Length)],
                AssignedUserId = random.Next(2) == 0 
                    ? Guid.Parse("33333333-3333-3333-3333-333333333333") 
                    : Guid.Parse("44444444-4444-4444-4444-444444444444"),
                Notes = $"Lead from {sources[random.Next(sources.Length)]}. Interested in our solutions.",
                LastContactedAt = DateTime.UtcNow.AddDays(-random.Next(1, 30))
            });
        }

        await context.Leads.AddRangeAsync(leads);
        logger.LogInformation($"Added {leads.Count} leads");
    }

    private static async System.Threading.Tasks.Task SeedTasksAsync(LeadTrackerDbContext context, ILogger logger)
    {
        if (await context.Tasks.AnyAsync())
        {
            logger.LogInformation("Tasks already exist, skipping seed");
            return;
        }

        var random = new Random(42);
        var taskTypes = new[] { "Call", "Email", "Meeting", "Follow-up" };
        var priorities = new[] { "Low", "Medium", "High" };
        var leads = await context.Leads.Take(5).ToListAsync(); // Get first 5 leads

        var tasks = new List<TaskEntity>();

        foreach (var lead in leads)
        {
            // Create 1-2 tasks per lead
            var taskCount = random.Next(1, 3);
            for (int i = 0; i < taskCount; i++)
            {
                var taskType = taskTypes[random.Next(taskTypes.Length)];
                var isCompleted = random.Next(3) == 0; // 33% chance of being completed

                tasks.Add(new TaskEntity
                {
                    OrganizationId = lead.OrganizationId,
                    LeadId = lead.Id,
                    AssignedUserId = lead.AssignedUserId,
                    Title = $"{taskType} - {lead.Company}",
                    Description = $"{taskType} with {lead.FullName} at {lead.Company}",
                    Type = taskType,
                    Status = isCompleted ? "Completed" : "Pending",
                    Priority = priorities[random.Next(priorities.Length)],
                    DueDate = isCompleted 
                        ? DateTime.UtcNow.AddDays(-random.Next(1, 30))
                        : DateTime.UtcNow.AddDays(random.Next(1, 14)),
                    CompletedAt = isCompleted ? DateTime.UtcNow.AddDays(-random.Next(1, 7)) : null,
                    Notes = isCompleted ? "Task completed successfully" : null,
                    DurationMinutes = isCompleted ? random.Next(15, 60) : null
                });
            }
        }

        await context.Tasks.AddRangeAsync(tasks);
        logger.LogInformation($"Added {tasks.Count} tasks");
    }
}
