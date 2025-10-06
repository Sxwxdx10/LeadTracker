using LeadTracker.Core.Entities;
using LeadTracker.Core.Services;
using LeadTracker.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace LeadTracker.Infrastructure.Services;

/// <summary>
/// Service for seeding test data for leads
/// </summary>
public class LeadSeederService : ILeadSeederService
{
    private readonly LeadTrackerDbContext _context;
    private readonly ILogger<LeadSeederService> _logger;

    public LeadSeederService(LeadTrackerDbContext context, ILogger<LeadSeederService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<int> SeedTestLeadsAsync(Guid organizationId, int count = 20)
    {
        _logger.LogInformation("Starting to seed {Count} test leads for organization {OrganizationId}", count, organizationId);

        // Get existing stages for the organization
        var stages = await _context.Stages
            .Where(s => s.OrganizationId == organizationId)
            .OrderBy(s => s.Order)
            .ToListAsync();

        if (!stages.Any())
        {
            _logger.LogWarning("No stages found for organization {OrganizationId}. Creating default stages first.", organizationId);
            await SeedDefaultStagesAsync(organizationId);
            stages = await _context.Stages
                .Where(s => s.OrganizationId == organizationId)
                .OrderBy(s => s.Order)
                .ToListAsync();
        }

        // Get existing users for assignment
        var users = await _context.BusinessUsers
            .Where(u => u.OrganizationId == organizationId)
            .ToListAsync();

        var leads = GenerateTestLeads(organizationId, count, stages, users);
        
        _context.Leads.AddRange(leads);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Successfully seeded {Count} test leads for organization {OrganizationId}", leads.Count, organizationId);
        return leads.Count;
    }

    public async Task<int> SeedDefaultStagesAsync(Guid organizationId)
    {
        _logger.LogInformation("Seeding default stages for organization {OrganizationId}", organizationId);

        var defaultStages = new[]
        {
            new Stage
            {
                Id = Guid.NewGuid(),
                OrganizationId = organizationId,
                Name = "Nouveau",
                Description = "Lead nouvellement créé",
                Color = "#3B82F6",
                Order = 1,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Stage
            {
                Id = Guid.NewGuid(),
                OrganizationId = organizationId,
                Name = "Qualifié",
                Description = "Lead qualifié et intéressé",
                Color = "#10B981",
                Order = 2,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Stage
            {
                Id = Guid.NewGuid(),
                OrganizationId = organizationId,
                Name = "Proposition",
                Description = "Proposition envoyée",
                Color = "#F59E0B",
                Order = 3,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Stage
            {
                Id = Guid.NewGuid(),
                OrganizationId = organizationId,
                Name = "Négociation",
                Description = "En cours de négociation",
                Color = "#8B5CF6",
                Order = 4,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Stage
            {
                Id = Guid.NewGuid(),
                OrganizationId = organizationId,
                Name = "Fermé - Gagné",
                Description = "Deal conclu avec succès",
                Color = "#059669",
                Order = 5,
                IsActive = true,
                IsWonStage = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Stage
            {
                Id = Guid.NewGuid(),
                OrganizationId = organizationId,
                Name = "Fermé - Perdu",
                Description = "Deal perdu",
                Color = "#DC2626",
                Order = 6,
                IsActive = true,
                IsLostStage = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        _context.Stages.AddRange(defaultStages);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Successfully seeded {Count} default stages for organization {OrganizationId}", defaultStages.Length, organizationId);
        return defaultStages.Length;
    }

    public async Task<int> SeedTestUsersAsync(Guid organizationId)
    {
        _logger.LogInformation("Seeding test users for organization {OrganizationId}", organizationId);

        var testUsers = new[]
        {
            new User
            {
                Id = Guid.NewGuid(),
                OrganizationId = organizationId,
                FirstName = "Marie",
                LastName = "Dubois",
                Email = "marie.dubois@example.com",
                PhoneNumber = "+33123456789",
                JobTitle = "Commerciale Senior",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new User
            {
                Id = Guid.NewGuid(),
                OrganizationId = organizationId,
                FirstName = "Pierre",
                LastName = "Martin",
                Email = "pierre.martin@example.com",
                PhoneNumber = "+33987654321",
                JobTitle = "Responsable Commercial",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new User
            {
                Id = Guid.NewGuid(),
                OrganizationId = organizationId,
                FirstName = "Sophie",
                LastName = "Bernard",
                Email = "sophie.bernard@example.com",
                PhoneNumber = "+33555666777",
                JobTitle = "Chargée de Prospection",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        _context.BusinessUsers.AddRange(testUsers);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Successfully seeded {Count} test users for organization {OrganizationId}", testUsers.Length, organizationId);
        return testUsers.Length;
    }

    private List<Lead> GenerateTestLeads(Guid organizationId, int count, List<Stage> stages, List<User> users)
    {
        var random = new Random();
        var leads = new List<Lead>();

        // Sample data for realistic leads
        var firstNames = new[] { "Jean", "Marie", "Pierre", "Sophie", "Paul", "Julie", "Marc", "Claire", "Thomas", "Nathalie", "David", "Isabelle", "Nicolas", "Céline", "Antoine", "Valérie", "Julien", "Sandrine", "Fabien", "Caroline" };
        var lastNames = new[] { "Martin", "Bernard", "Dubois", "Thomas", "Robert", "Petit", "Durand", "Leroy", "Moreau", "Simon", "Laurent", "Lefebvre", "Michel", "Garcia", "David", "Bertrand", "Roux", "Vincent", "Fournier", "Morel" };
        var companies = new[] { "TechCorp", "InnovateLab", "Digital Solutions", "Future Systems", "Smart Technologies", "NextGen Corp", "Alpha Industries", "Beta Solutions", "Gamma Tech", "Delta Enterprises", "Epsilon Group", "Zeta Systems", "Theta Corp", "Lambda Labs", "Sigma Industries" };
        var jobTitles = new[] { "CEO", "CTO", "Directeur Marketing", "Responsable IT", "Chef de Projet", "Directeur Commercial", "Responsable Achats", "Directeur Général", "Responsable RH", "Directeur Financier" };
        var sources = new[] { "Site Web", "Réseaux Sociaux", "Recommandation", "Salon", "Email Marketing", "Téléphone", "LinkedIn", "Google Ads", "Partenaire", "Événement" };
        for (int i = 0; i < count; i++)
        {
            var firstName = firstNames[random.Next(firstNames.Length)];
            var lastName = lastNames[random.Next(lastNames.Length)];
            var company = companies[random.Next(companies.Length)];
            var jobTitle = jobTitles[random.Next(jobTitles.Length)];
            var source = sources[random.Next(sources.Length)];
            
            // Determine stage and status with guaranteed consistency
            var stageStatusChoice = random.Next(100);
            Stage selectedStage;
            string selectedStatus;
            
            if (stageStatusChoice < 60) // 60% chance for active leads (Open status)
            {
                // Select from active stages only (exclude Won/Lost stages)
                var activeStages = stages.Where(s => s.Name != "Won" && s.Name != "Lost" && 
                                                      s.Name != "Fermé - Gagné" && s.Name != "Fermé - Perdu").ToList();
                selectedStage = activeStages[random.Next(activeStages.Count)];
                selectedStatus = "Open";
                
                // Ensure the selected stage is indeed an active stage
                if (selectedStage.Name == "Won" || selectedStage.Name == "Lost" || 
                    selectedStage.Name == "Fermé - Gagné" || selectedStage.Name == "Fermé - Perdu")
                {
                    // Fallback to first active stage if somehow we got a closed stage
                    selectedStage = activeStages.FirstOrDefault() ?? stages.First(s => 
                        s.Name != "Won" && s.Name != "Lost" && 
                        s.Name != "Fermé - Gagné" && s.Name != "Fermé - Perdu");
                }
            }
            else if (stageStatusChoice < 80) // 20% chance for Won leads
            {
                // Force status to "Won" and assign to Won stage (check both English and French names)
                selectedStage = stages.FirstOrDefault(s => s.Name == "Won" || s.Name == "Fermé - Gagné");
                selectedStatus = "Won";
                
                // If no Won stage exists, create a fallback logic
                if (selectedStage == null)
                {
                    selectedStage = stages.FirstOrDefault(s => s.Name == "Lost" || s.Name == "Fermé - Perdu") ?? stages.OrderByDescending(s => s.Order).First();
                    if (selectedStage != null)
                    {
                        selectedStatus = "Open"; // Fallback to Open if no Won stage
                    }
                }
            }
            else // 20% chance for Lost leads
            {
                // Force status to "Lost" and assign to Lost stage (check both English and French names)
                selectedStage = stages.FirstOrDefault(s => s.Name == "Lost" || s.Name == "Fermé - Perdu");
                selectedStatus = "Lost";
                
                // If no Lost stage exists, create a fallback logic
                if (selectedStage == null)
                {
                    selectedStage = stages.FirstOrDefault(s => s.Name == "Won" || s.Name == "Fermé - Gagné") ?? stages.OrderByDescending(s => s.Order).First();
                    if (selectedStage != null)
                    {
                        selectedStatus = "Open"; // Fallback to Open if no Lost stage
                    }
                }
            }
            var assignedUser = users.Any() ? users[random.Next(users.Count)] : null;

            var lead = new Lead
            {
                Id = Guid.NewGuid(),
                OrganizationId = organizationId,
                Title = $"{firstName} {lastName} - {company}",
                FirstName = firstName,
                LastName = lastName,
                Email = $"{firstName.ToLower()}.{lastName.ToLower()}@{company.ToLower().Replace(" ", "")}.com",
                PhoneNumber = $"+331{random.Next(10000000, 99999999)}",
                Company = company,
                JobTitle = jobTitle,
                EstimatedValue = random.Next(5000, 100000),
                Probability = random.Next(10, 95),
                ExpectedCloseDate = DateTime.UtcNow.AddDays(random.Next(30, 180)),
                Notes = GenerateRandomNotes(random),
                Source = source,
                Status = selectedStatus,
                IsActive = true,
                LastContactedAt = DateTime.UtcNow.AddDays(-random.Next(0, 30)),
                StageId = selectedStage.Id,
                AssignedUserId = assignedUser?.Id,
                CreatedAt = DateTime.UtcNow.AddDays(-random.Next(0, 90)),
                UpdatedAt = DateTime.UtcNow.AddDays(-random.Next(0, 7))
            };

            leads.Add(lead);
        }

        return leads;
    }

    private string GenerateRandomNotes(Random random)
    {
        var noteTemplates = new[]
        {
        "Lead très intéressé par notre solution. Rendez-vous prévu la semaine prochaine.",
        "Contact initial positif. Envoi de documentation technique demandé.",
        "Budget confirmé pour Q2. Décision attendue dans 2 semaines.",
        "Concurrent principal identifié. Proposition personnalisée en cours.",
        "Décideur final identifié. Processus d'achat complexe avec comité.",
        "Urgence côté client. Accélération du processus possible.",
        "Besoin technique spécifique. Démonstration personnalisée nécessaire.",
        "Prix sensible. Négociation en cours sur les conditions.",
        "Référence client disponible. Témoignage positif à organiser.",
        "Processus d'achat long. Suivi régulier nécessaire."
        };

        return noteTemplates[random.Next(noteTemplates.Length)];
    }
}
