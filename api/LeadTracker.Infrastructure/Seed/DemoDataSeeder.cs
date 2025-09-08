using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using LeadTracker.Infrastructure;
using LeadTracker.Core.Entities;
using TaskEntity = LeadTracker.Core.Entities.Task;

namespace LeadTracker.Infrastructure.Seed;

/// <summary>
/// Service for seeding realistic demo data including 50 leads with varied data
/// </summary>
public class DemoDataSeeder
{
    private readonly LeadTrackerDbContext _context;
    private readonly ILogger<DemoDataSeeder> _logger;
    private readonly Random _random;

    public DemoDataSeeder(LeadTrackerDbContext context, ILogger<DemoDataSeeder> logger)
    {
        _context = context;
        _logger = logger;
        _random = new Random(42); // Fixed seed for consistent data
    }

    /// <summary>
    /// Seeds comprehensive demo data including 50 leads
    /// </summary>
    public async System.Threading.Tasks.Task SeedDemoDataAsync()
    {
        _logger.LogInformation("Starting comprehensive demo data seeding...");

        try
        {
            // Ensure we have the basic data first
            await EnsureBasicDataAsync();
            
            // Seed additional stages for more variety
            await SeedAdditionalStagesAsync();
            
            // Save stages first
            await _context.SaveChangesAsync();
            
            // Seed 50 realistic leads
            await SeedRealisticLeadsAsync();
            
            // Save leads before creating tasks
            await _context.SaveChangesAsync();
            
            // Seed associated tasks and reminders
            await SeedLeadTasksAsync();

            await _context.SaveChangesAsync();
            _logger.LogInformation("Demo data seeding completed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while seeding demo data");
            throw;
        }
    }

    private async System.Threading.Tasks.Task EnsureBasicDataAsync()
    {
        // Ensure we have at least one organization
        if (!await _context.Organizations.AnyAsync())
        {
            var org = new Organization
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Name = "Demo Corporation",
                Domain = "demo-corp",
                Description = "A demo organization for testing purposes",
                TimeZone = "UTC",
                Currency = "USD",
                IsActive = true
            };
            _context.Organizations.Add(org);
        }

        // Ensure we have users
        if (!await _context.BusinessUsers.AnyAsync())
        {
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
                    OrganizationId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                    FirstName = "Mike",
                    LastName = "Johnson",
                    Email = "mike.johnson@demo-corp.com",
                    PhoneNumber = "+1-555-0103",
                    JobTitle = "Business Development",
                    IsActive = true
                }
            };
            _context.BusinessUsers.AddRange(users);
        }
    }

    private async System.Threading.Tasks.Task SeedAdditionalStagesAsync()
    {
        if (await _context.Stages.CountAsync() >= 7) return; // Already have enough stages

        var additionalStages = new[]
        {
            new Stage
            {
                Id = Guid.Parse("BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB"),
                OrganizationId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Name = "Initial Contact",
                Description = "First contact made with prospect",
                Order = 1,
                Color = "#6B7280",
                IsActive = true
            },
            new Stage
            {
                Id = Guid.Parse("CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCCCC"),
                OrganizationId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Name = "Qualified",
                Description = "Lead has been qualified and shows interest",
                Order = 2,
                Color = "#8B5CF6",
                IsActive = true
            },
            new Stage
            {
                Id = Guid.Parse("DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDDDD"),
                OrganizationId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Name = "Needs Analysis",
                Description = "Analyzing customer needs and requirements",
                Order = 3,
                Color = "#F59E0B",
                IsActive = true
            },
            new Stage
            {
                Id = Guid.Parse("EEEEEEEE-EEEE-EEEE-EEEE-EEEEEEEEEEEE"),
                OrganizationId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Name = "Proposal",
                Description = "Proposal sent to customer",
                Order = 4,
                Color = "#3B82F6",
                IsActive = true
            },
            new Stage
            {
                Id = Guid.Parse("FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF"),
                OrganizationId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Name = "Negotiation",
                Description = "Negotiating terms and pricing",
                Order = 5,
                Color = "#F97316",
                IsActive = true
            },
            new Stage
            {
                Id = Guid.Parse("AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA"),
                OrganizationId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Name = "Closed Won",
                Description = "Deal successfully closed",
                Order = 6,
                Color = "#10B981",
                IsWonStage = true,
                IsActive = true
            },
            new Stage
            {
                Id = Guid.Parse("99999999-9999-9999-9999-999999999999"),
                OrganizationId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Name = "Closed Lost",
                Description = "Deal lost to competitor or no decision",
                Order = 7,
                Color = "#EF4444",
                IsLostStage = true,
                IsActive = true
            }
        };

        _context.Stages.AddRange(additionalStages);
        _logger.LogInformation("Added {Count} additional stages", additionalStages.Length);
    }

    private async System.Threading.Tasks.Task SeedRealisticLeadsAsync()
    {
        // Clear existing leads to ensure we have exactly 50
        var existingLeads = await _context.Leads.ToListAsync();
        _context.Leads.RemoveRange(existingLeads);

        var leads = GenerateRealisticLeads();
        _context.Leads.AddRange(leads);
        
        _logger.LogInformation("Generated {Count} realistic leads", leads.Count);
    }

    private List<Lead> GenerateRealisticLeads()
    {
        var leads = new List<Lead>();
        var orgId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        
        // Realistic company data
        var companies = new[]
        {
            "TechCorp Solutions", "InnovateLtd", "FutureSoft Inc", "DataDyne Systems", "CloudFirst Technologies",
            "NextGen Analytics", "SmartFlow Corp", "DigitalEdge Ltd", "ProActive Solutions", "EliteTech Group",
            "Velocity Dynamics", "PrimeTech Systems", "Advanced Solutions", "CoreTech Industries", "Strategic Partners",
            "GlobalTech Corp", "Innovation Labs", "TechVision Inc", "Digital Partners", "SmartTech Solutions",
            "Enterprise Systems", "TechFlow Inc", "DataVision Corp", "CloudTech Solutions", "NextWave Technologies",
            "ProTech Systems", "Digital Dynamics", "SmartCore Inc", "TechEdge Solutions", "FutureVision Corp",
            "Advanced Analytics", "CoreFlow Systems", "Elite Solutions", "TechPartners Inc", "DigitalCore Corp",
            "SmartFlow Technologies", "ProVision Systems", "TechDynamics Inc", "DataCore Solutions", "CloudEdge Corp",
            "NextGen Systems", "Innovation Tech", "Strategic Solutions", "TechVision Corp", "DigitalFlow Inc",
            "SmartTech Partners", "ProCore Systems", "TechAnalytics Inc", "DataFlow Solutions", "CloudVision Corp"
        };

        var firstNames = new[]
        {
            "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Quinn", "Blake", "Cameron",
            "Drew", "Emery", "Finley", "Hayden", "Jamie", "Kendall", "Logan", "Parker", "Reese", "Sage",
            "Skyler", "Tatum", "Valentine", "Winter", "Zion", "Adrian", "Blair", "Cameron", "Dana", "Eden",
            "Frankie", "Gray", "Harper", "Indigo", "Jules", "Kai", "Lane", "Marlowe", "Nico", "Ocean",
            "Peyton", "River", "Sage", "Tatum", "Vale", "Wren", "Xen", "Yael", "Zephyr", "Ari"
        };

        var lastNames = new[]
        {
            "Anderson", "Brown", "Clark", "Davis", "Evans", "Foster", "Garcia", "Harris", "Jackson", "Johnson",
            "King", "Lee", "Miller", "Nelson", "O'Connor", "Parker", "Quinn", "Roberts", "Smith", "Taylor",
            "Underwood", "Valdez", "Williams", "Xavier", "Young", "Zimmerman", "Adams", "Baker", "Campbell", "Carter",
            "Edwards", "Flores", "Green", "Hall", "Jones", "Lopez", "Martin", "Martinez", "Moore", "Murphy",
            "Perez", "Reed", "Rivera", "Rodriguez", "Sanchez", "Thompson", "Turner", "Walker", "White", "Wilson"
        };

        var jobTitles = new[]
        {
            "CEO", "CTO", "VP Sales", "Marketing Director", "Operations Manager", "Product Manager",
            "Business Development", "Sales Director", "Account Manager", "Project Manager",
            "Technical Lead", "Software Engineer", "Data Analyst", "Marketing Manager", "HR Director",
            "Finance Manager", "Customer Success", "Partnership Manager", "Strategy Director", "Innovation Lead"
        };

        var sources = new[]
        {
            "Website", "Referral", "Cold Call", "Email Campaign", "Social Media", "Trade Show",
            "LinkedIn", "Google Ads", "Content Marketing", "Partner Channel", "Webinar", "Case Study",
            "White Paper", "Demo Request", "Free Trial", "Newsletter", "Blog", "Podcast", "Video", "Press Release"
        };

        var industries = new[]
        {
            "Technology", "Healthcare", "Finance", "Manufacturing", "Retail", "Education", "Government",
            "Non-profit", "Real Estate", "Consulting", "Media", "Transportation", "Energy", "Telecommunications",
            "Automotive", "Aerospace", "Pharmaceuticals", "Food & Beverage", "Construction", "Entertainment"
        };

        var stages = new[]
        {
            Guid.Parse("BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB"), // Initial Contact
            Guid.Parse("CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCCCC"), // Qualified
            Guid.Parse("DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDDDD"), // Needs Analysis
            Guid.Parse("EEEEEEEE-EEEE-EEEE-EEEE-EEEEEEEEEEEE"), // Proposal
            Guid.Parse("FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF"), // Negotiation
            Guid.Parse("AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA"), // Closed Won
            Guid.Parse("99999999-9999-9999-9999-999999999999")  // Closed Lost
        };

        var userIds = new[]
        {
            Guid.Parse("33333333-3333-3333-3333-333333333333"), // John Doe
            Guid.Parse("44444444-4444-4444-4444-444444444444"), // Jane Smith
            Guid.Parse("55555555-5555-5555-5555-555555555555")  // Mike Johnson
        };

        // Generate 50 leads with realistic distribution
        for (int i = 0; i < 50; i++)
        {
            var firstName = firstNames[_random.Next(firstNames.Length)];
            var lastName = lastNames[_random.Next(lastNames.Length)];
            var company = companies[i]; // Use each company once
            var industry = industries[_random.Next(industries.Length)];
            var jobTitle = jobTitles[_random.Next(jobTitles.Length)];
            var source = sources[_random.Next(sources.Length)];
            var stage = stages[_random.Next(stages.Length)];
            var assignedUser = userIds[_random.Next(userIds.Length)];

            // Create realistic probability based on stage
            var probability = stage switch
            {
                var s when s == Guid.Parse("BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB") => _random.Next(10, 30), // Initial Contact
                var s when s == Guid.Parse("CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCCCC") => _random.Next(30, 50), // Qualified
                var s when s == Guid.Parse("DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDDDD") => _random.Next(50, 70), // Needs Analysis
                var s when s == Guid.Parse("EEEEEEEE-EEEE-EEEE-EEEE-EEEEEEEEEEEE") => _random.Next(70, 85), // Proposal
                var s when s == Guid.Parse("FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF") => _random.Next(85, 95), // Negotiation
                var s when s == Guid.Parse("AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA") => 100, // Closed Won
                var s when s == Guid.Parse("99999999-9999-9999-9999-999999999999") => 0,   // Closed Lost
                _ => _random.Next(20, 80)
            };

            // Create realistic estimated value based on industry and job title
            var baseValue = jobTitle switch
            {
                "CEO" or "CTO" => _random.Next(100000, 500000),
                "VP Sales" or "Marketing Director" => _random.Next(50000, 200000),
                "Operations Manager" or "Product Manager" => _random.Next(25000, 100000),
                _ => _random.Next(10000, 75000)
            };

            var estimatedValue = baseValue + (_random.Next(-20, 21) * baseValue / 100); // ±20% variation

            // Create realistic close date based on stage
            var daysToClose = stage switch
            {
                var s when s == Guid.Parse("BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB") => _random.Next(30, 120), // Initial Contact
                var s when s == Guid.Parse("CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCCCC") => _random.Next(20, 90),  // Qualified
                var s when s == Guid.Parse("DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDDDD") => _random.Next(15, 60),  // Needs Analysis
                var s when s == Guid.Parse("EEEEEEEE-EEEE-EEEE-EEEE-EEEEEEEEEEEE") => _random.Next(7, 30),   // Proposal
                var s when s == Guid.Parse("FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF") => _random.Next(1, 14),   // Negotiation
                var s when s == Guid.Parse("AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA") => _random.Next(-30, 0),  // Closed Won (past)
                var s when s == Guid.Parse("99999999-9999-9999-9999-999999999999") => _random.Next(-60, -1), // Closed Lost (past)
                _ => _random.Next(7, 90)
            };

            var expectedCloseDate = DateTime.UtcNow.AddDays(daysToClose);
            var lastContactedAt = DateTime.UtcNow.AddDays(-_random.Next(1, 30));

            var lead = new Lead
            {
                Id = Guid.NewGuid(),
                OrganizationId = orgId,
                Title = $"{company} - {firstName} {lastName}",
                FirstName = firstName,
                LastName = lastName,
                Email = $"{firstName.ToLower()}.{lastName.ToLower()}@{company.ToLower().Replace(" ", "").Replace("Inc", "").Replace("Corp", "").Replace("Ltd", "").Replace("Technologies", "Tech").Replace("Solutions", "Sol")}.com",
                PhoneNumber = $"+1-{_random.Next(200, 999)}-{_random.Next(100, 999)}-{_random.Next(1000, 9999)}",
                Company = company,
                JobTitle = jobTitle,
                EstimatedValue = estimatedValue,
                Probability = probability,
                ExpectedCloseDate = expectedCloseDate,
                Source = source,
                Status = stage == Guid.Parse("AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA") ? "Won" :
                         stage == Guid.Parse("99999999-9999-9999-9999-999999999999") ? "Lost" : "Open",
                StageId = stage,
                AssignedUserId = assignedUser,
                LastContactedAt = lastContactedAt,
                Notes = GenerateRealisticNotes(industry, source, stage),
                CreatedAt = DateTime.UtcNow.AddDays(-_random.Next(1, 90)),
                UpdatedAt = DateTime.UtcNow.AddDays(-_random.Next(0, 7))
            };

            leads.Add(lead);
        }

        return leads;
    }

    private string GenerateRealisticNotes(string industry, string source, Guid stage)
    {
        var stageName = stage switch
        {
            var s when s == Guid.Parse("BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB") => "Initial Contact",
            var s when s == Guid.Parse("CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCCCC") => "Qualified",
            var s when s == Guid.Parse("DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDDDD") => "Needs Analysis",
            var s when s == Guid.Parse("EEEEEEEE-EEEE-EEEE-EEEE-EEEEEEEEEEEE") => "Proposal",
            var s when s == Guid.Parse("FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF") => "Negotiation",
            var s when s == Guid.Parse("AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA") => "Closed Won",
            var s when s == Guid.Parse("99999999-9999-9999-9999-999999999999") => "Closed Lost",
            _ => "Unknown"
        };

        var notes = new[]
        {
            $"Lead from {source}. Currently in {stageName} stage. Interested in our {industry.ToLower()} solutions.",
            $"Initial contact made via {source}. {industry} industry. {stageName} stage - following up on requirements.",
            $"Prospect found through {source}. {industry} sector. {stageName} - evaluating our platform capabilities.",
            $"Lead generated from {source}. {industry} company. {stageName} - discussing implementation timeline.",
            $"Contact established via {source}. {industry} business. {stageName} - reviewing proposal details."
        };

        return notes[_random.Next(notes.Length)];
    }

    private async System.Threading.Tasks.Task SeedLeadTasksAsync()
    {
        // Clear existing tasks
        var existingTasks = await _context.Tasks.ToListAsync();
        _context.Tasks.RemoveRange(existingTasks);

        var leads = await _context.Leads.ToListAsync();
        var tasks = new List<TaskEntity>();

        var taskTypes = new[] { "Call", "Email", "Meeting", "Follow-up", "Demo", "Proposal", "Contract Review" };
        var priorities = new[] { "Low", "Medium", "High", "Urgent" };
        var statuses = new[] { "Pending", "Completed", "Cancelled" };

        foreach (var lead in leads)
        {
            // Create 1-3 tasks per lead
            var taskCount = _random.Next(1, 4);
            for (int i = 0; i < taskCount; i++)
            {
                var taskType = taskTypes[_random.Next(taskTypes.Length)];
                var priority = priorities[_random.Next(priorities.Length)];
                var status = statuses[_random.Next(statuses.Length)];
                var isCompleted = status == "Completed";
                var isOverdue = !isCompleted && _random.Next(10) == 0; // 10% chance of being overdue

                var dueDate = isOverdue 
                    ? DateTime.UtcNow.AddDays(-_random.Next(1, 30))
                    : DateTime.UtcNow.AddDays(_random.Next(1, 30));

                var completedAt = isCompleted ? (DateTime?)dueDate.AddDays(-_random.Next(0, 7)) : null;

                var task = new TaskEntity
                {
                    Id = Guid.NewGuid(),
                    OrganizationId = lead.OrganizationId,
                    LeadId = lead.Id,
                    AssignedUserId = lead.AssignedUserId,
                    Title = $"{taskType} - {lead.Company}",
                    Description = GenerateTaskDescription(taskType, lead, priority),
                    Type = taskType,
                    Status = status,
                    Priority = priority,
                    DueDate = dueDate,
                    CompletedAt = completedAt,
                    Notes = isCompleted ? GenerateCompletedTaskNotes(taskType) : null,
                    DurationMinutes = isCompleted ? _random.Next(15, 120) : null,
                    CreatedAt = DateTime.UtcNow.AddDays(-_random.Next(1, 30)),
                    UpdatedAt = DateTime.UtcNow.AddDays(-_random.Next(0, 7))
                };

                tasks.Add(task);
            }
        }

        _context.Tasks.AddRange(tasks);
        _logger.LogInformation("Generated {Count} tasks for leads", tasks.Count);
    }

    private string GenerateTaskDescription(string taskType, Lead lead, string priority)
    {
        return taskType switch
        {
            "Call" => $"Call {lead.FullName} at {lead.Company} to discuss {lead.JobTitle} requirements. Priority: {priority}",
            "Email" => $"Send follow-up email to {lead.Email} regarding our {lead.Company} proposal. Priority: {priority}",
            "Meeting" => $"Schedule meeting with {lead.FullName} to present our solution to {lead.Company}. Priority: {priority}",
            "Demo" => $"Conduct product demo for {lead.Company} team led by {lead.FullName}. Priority: {priority}",
            "Proposal" => $"Prepare and send detailed proposal to {lead.Company} for {lead.JobTitle} requirements. Priority: {priority}",
            "Contract Review" => $"Review contract terms with {lead.FullName} at {lead.Company}. Priority: {priority}",
            "Follow-up" => $"Follow up with {lead.FullName} on previous discussion about {lead.Company} needs. Priority: {priority}",
            _ => $"Task related to {lead.Company} - {lead.FullName}. Priority: {priority}"
        };
    }

    private string GenerateCompletedTaskNotes(string taskType)
    {
        var notes = new[]
        {
            "Task completed successfully. Positive response from prospect.",
            "Completed as planned. Good engagement and interest shown.",
            "Task finished on time. Prospect requested additional information.",
            "Successfully completed. Next steps discussed and scheduled.",
            "Task completed with positive outcome. Moving to next stage.",
            "Finished successfully. Prospect showed strong interest.",
            "Completed as expected. Follow-up actions identified.",
            "Task done. Good progress made on this opportunity."
        };

        return notes[_random.Next(notes.Length)];
    }
}
