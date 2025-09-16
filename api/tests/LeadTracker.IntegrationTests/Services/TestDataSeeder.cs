using Microsoft.EntityFrameworkCore;
using LeadTracker.Core.Entities;
using LeadTracker.Infrastructure;
using Microsoft.AspNetCore.Identity;

namespace LeadTracker.IntegrationTests.Services;

/// <summary>
/// Simple test data seeder - no over-engineering
/// </summary>
public class TestDataSeeder : ITestDataSeeder
{
    public async System.Threading.Tasks.Task SeedDataAsync(LeadTrackerDbContext context)
    {
        // Skip seeding if we're in a transaction (integrity constraint tests)
        if (context.Database.CurrentTransaction != null)
        {
            Console.WriteLine("Skipping data seeding - running in transaction mode");
            return;
        }
        
        
        // Clean existing data
        await CleanTestDataAsync(context);
        
        // Create roles with standard names (they should be cleaned up properly)
        await EnsureRoleExistsAsync(context, "USER");
        await EnsureRoleExistsAsync(context, "ADMIN");

        // Generate unique IDs for this test run to avoid parallel test conflicts
        var testOrgId = Guid.NewGuid();
        var testUserId = Guid.NewGuid();
        var testStageId = Guid.NewGuid();
        var testLeadId = Guid.NewGuid();
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var uniqueDomain = $"test-company-{testOrgId:N}-{timestamp}";

        // Create test organization
        var testOrg = new Organization 
        { 
            Id = testOrgId, 
            Name = "Test Company", 
            Domain = uniqueDomain, 
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Create test user
        var testUser = new User 
        { 
            Id = testUserId, 
            OrganizationId = testOrg.Id, 
            FirstName = "Test", 
            LastName = "User", 
            Email = $"test.user@{uniqueDomain}",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Create test stage
        var testStage = new Stage 
        { 
            Id = testStageId, 
            OrganizationId = testOrg.Id, 
            Name = "New Lead", 
            Order = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Save in dependency order to avoid foreign key constraint violations
        context.Organizations.Add(testOrg);
        await context.SaveChangesAsync(); // Save organization first
        
        context.BusinessUsers.Add(testUser);
        await context.SaveChangesAsync(); // Save business users first
        
        context.Stages.Add(testStage);
        await context.SaveChangesAsync(); // Save stages
        
        // Create test lead after stages and users are saved
        var testLead = new Lead 
        { 
            Id = testLeadId, 
            OrganizationId = testOrg.Id, 
            Title = "Test Lead",
            FirstName = "Test", 
            LastName = "User", 
            Email = $"test.user@{uniqueDomain}",
            StageId = testStage.Id, // Now safe to use the saved stage
            AssignedUserId = testUser.Id, // Now safe to use the saved user
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        
        context.Leads.Add(testLead);
        await context.SaveChangesAsync(); // Save leads last
    }

    public void SeedData(LeadTrackerDbContext context)
    {
        // Skip seeding if we're in a transaction (integrity constraint tests)
        if (context.Database.CurrentTransaction != null)
        {
            Console.WriteLine("Skipping data seeding - running in transaction mode");
            return;
        }
        
        // Clean existing data
        CleanTestData(context);
        
        // Create roles with standard names (they should be cleaned up properly)
        EnsureRoleExists(context, "USER");
        EnsureRoleExists(context, "ADMIN");

        // Generate unique IDs for this test run to avoid parallel test conflicts
        var testOrgId = Guid.NewGuid();
        var testUserId = Guid.NewGuid();
        var testStageId = Guid.NewGuid();
        var testLeadId = Guid.NewGuid();
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var uniqueDomain = $"test-company-{testOrgId:N}-{timestamp}";

        // Create test organization
        var testOrg = new Organization 
        { 
            Id = testOrgId, 
            Name = "Test Company", 
            Domain = uniqueDomain, 
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Create test user
        var testUser = new User 
        { 
            Id = testUserId, 
            OrganizationId = testOrg.Id, 
            FirstName = "Test", 
            LastName = "User", 
            Email = $"test.user@{uniqueDomain}",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Create test stage
        var testStage = new Stage 
        { 
            Id = testStageId, 
            OrganizationId = testOrg.Id, 
            Name = "New Lead", 
            Order = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Save in dependency order to avoid foreign key constraint violations
        context.Organizations.Add(testOrg);
        context.SaveChanges(); // Save organization first
        
        context.BusinessUsers.Add(testUser);
        context.SaveChanges(); // Save business users first
        
        context.Stages.Add(testStage);
        context.SaveChanges(); // Save stages
        
        // Create test lead after stages and users are saved
        var testLead = new Lead 
        { 
            Id = testLeadId, 
            OrganizationId = testOrg.Id, 
            Title = "Test Lead",
            FirstName = "Test", 
            LastName = "User", 
            Email = $"test.user@{uniqueDomain}",
            StageId = testStage.Id, // Now safe to use the saved stage
            AssignedUserId = testUser.Id, // Now safe to use the saved user
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        
        context.Leads.Add(testLead);
        context.SaveChanges(); // Save leads last
    }

    /// <summary>
    /// Ensures an organization exists before creating dependent entities
    /// </summary>
    public async System.Threading.Tasks.Task<Organization> EnsureOrganizationExistsAsync(LeadTrackerDbContext context, Guid organizationId, string name = "Test Organization", string? domain = null)
    {
        var existingOrg = await context.Organizations.FindAsync(organizationId);
        if (existingOrg != null)
        {
            return existingOrg;
        }

        var organization = new Organization
        {
            Id = organizationId,
            Name = name,
            Domain = domain ?? $"test-{organizationId:N}.com",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Organizations.Add(organization);
        await context.SaveChangesAsync();
        return organization;
    }

    /// <summary>
    /// Ensures an organization exists before creating dependent entities (synchronous version)
    /// </summary>
    public Organization EnsureOrganizationExists(LeadTrackerDbContext context, Guid organizationId, string name = "Test Organization", string? domain = null)
    {
        var existingOrg = context.Organizations.Find(organizationId);
        if (existingOrg != null)
        {
            return existingOrg;
        }

        var organization = new Organization
        {
            Id = organizationId,
            Name = name,
            Domain = domain ?? $"test-{organizationId:N}.com",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Organizations.Add(organization);
        context.SaveChanges();
        return organization;
    }

    public async System.Threading.Tasks.Task CreateDefaultStagesForOrganizationAsync(LeadTrackerDbContext context, Guid organizationId)
    {
        // Check if stages already exist for this organization to avoid constraint violations
        var existingStages = await context.Stages
            .Where(s => s.OrganizationId == organizationId)
            .ToListAsync();
            
        if (existingStages.Any())
        {
            Console.WriteLine($"Stages already exist for organization {organizationId}, skipping creation");
            return;
        }

        // Get the highest order number for this organization to ensure unique ordering
        var maxOrder = await context.Stages
            .Where(s => s.OrganizationId == organizationId)
            .MaxAsync(s => (int?)s.Order) ?? 0;

        var stages = new List<Stage>
        {
            new Stage
            {
                Id = Guid.NewGuid(),
                OrganizationId = organizationId,
                Name = "New Lead",
                Order = maxOrder + 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Stage
            {
                Id = Guid.NewGuid(),
                OrganizationId = organizationId,
                Name = "Qualified",
                Order = maxOrder + 2,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Stage
            {
                Id = Guid.NewGuid(),
                OrganizationId = organizationId,
                Name = "Proposal",
                Order = maxOrder + 3,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Stage
            {
                Id = Guid.NewGuid(),
                OrganizationId = organizationId,
                Name = "Negotiation",
                Order = maxOrder + 4,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Stage
            {
                Id = Guid.NewGuid(),
                OrganizationId = organizationId,
                Name = "Closed Won",
                Order = maxOrder + 5,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        context.Stages.AddRange(stages);
        await context.SaveChangesAsync();
    }

    private async System.Threading.Tasks.Task EnsureRoleExistsAsync(LeadTrackerDbContext context, string roleName)
    {
        // Use a more robust approach to handle race conditions
        try
        {
            var existingRole = await context.Roles
                .FirstOrDefaultAsync(r => r.NormalizedName == roleName.ToUpper());
                
            if (existingRole == null)
            {
                var role = new IdentityRole<Guid> 
                { 
                    Id = Guid.NewGuid(), 
                    Name = roleName, 
                    NormalizedName = roleName.ToUpper(), 
                    ConcurrencyStamp = $"{roleName.ToLower()}-role-stamp-{Guid.NewGuid()}" 
                };
                
                context.Roles.Add(role);
                await context.SaveChangesAsync();
            }
        }
        catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("duplicate key value violates unique constraint") == true)
        {
            // Role already exists due to race condition, ignore
            Console.WriteLine($"Role {roleName} already exists (race condition handled)");
        }
        catch (Exception ex)
        {
            // Handle any other database errors gracefully
            Console.WriteLine($"Warning: Could not create role {roleName}: {ex.Message}");
            // Don't rethrow - continue with test execution
        }
    }

    private void EnsureRoleExists(LeadTrackerDbContext context, string roleName)
    {
        try
        {
            var existingRole = context.Roles
                .FirstOrDefault(r => r.NormalizedName == roleName.ToUpper());
                
            if (existingRole == null)
            {
                var role = new IdentityRole<Guid> 
                { 
                    Id = Guid.NewGuid(), 
                    Name = roleName, 
                    NormalizedName = roleName.ToUpper(), 
                    ConcurrencyStamp = $"{roleName.ToLower()}-role-stamp-{Guid.NewGuid()}" 
                };
                
                context.Roles.Add(role);
                context.SaveChanges();
            }
        }
        catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("duplicate key value violates unique constraint") == true)
        {
            // Role already exists due to race condition, ignore
            Console.WriteLine($"Role {roleName} already exists (race condition handled)");
        }
        catch (Exception ex)
        {
            // Handle any other database errors gracefully
            Console.WriteLine($"Warning: Could not create role {roleName}: {ex.Message}");
            // Don't rethrow - continue with test execution
        }
    }

    private async System.Threading.Tasks.Task CleanTestDataAsync(LeadTrackerDbContext context)
    {
        try
        {
            // Clean in reverse dependency order to avoid foreign key constraint violations
            // First, clean all dependent entities
            
            // Clean user roles first (depends on users and roles)
            var userRolesCount = await context.UserRoles.CountAsync();
            await context.UserRoles.ExecuteDeleteAsync();
            Console.WriteLine($"Cleaned {userRolesCount} user roles");
            
            // Clean tasks (depends on leads and users)
            var tasksCount = await context.Tasks.CountAsync();
            await context.Tasks.ExecuteDeleteAsync();
            Console.WriteLine($"Cleaned {tasksCount} tasks");
            
            // Clean leads (depends on stages and users)
            var leadsCount = await context.Leads.CountAsync();
            if (leadsCount > 0)
            {
                await context.Leads.ExecuteDeleteAsync();
                Console.WriteLine($"Cleaned {leadsCount} leads");
            }
            
            // Force cleanup of any remaining leads (more aggressive approach)
            try
            {
                await context.Database.ExecuteSqlRawAsync("DELETE FROM \"Leads\"");
                Console.WriteLine("Force cleaned all leads");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Force cleanup of leads failed: {ex.Message}");
            }
            
            // Clean stages (depends on organizations)
            var stagesCount = await context.Stages.CountAsync();
            if (stagesCount > 0)
            {
                await context.Stages.ExecuteDeleteAsync();
                Console.WriteLine($"Cleaned {stagesCount} stages");
            }
            
            // Force cleanup of any remaining stages (more aggressive approach)
            try
            {
                await context.Database.ExecuteSqlRawAsync("DELETE FROM \"Stages\"");
                Console.WriteLine("Force cleaned all stages");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Force cleanup of stages failed: {ex.Message}");
            }
            
            // Clean business users BEFORE users (depends on organizations)
            var businessUsersCount = await context.BusinessUsers.CountAsync();
            if (businessUsersCount > 0)
            {
                await context.BusinessUsers.ExecuteDeleteAsync();
                Console.WriteLine($"Cleaned {businessUsersCount} business users");
            }
            
            // Force cleanup of any remaining business users (more aggressive approach)
            try
            {
                await context.Database.ExecuteSqlRawAsync("DELETE FROM \"BusinessUsers\"");
                Console.WriteLine("Force cleaned all business users");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Force cleanup failed: {ex.Message}");
            }
            
            // Clean users (depends on organizations)
            var usersCount = await context.Users.CountAsync();
            await context.Users.ExecuteDeleteAsync();
            Console.WriteLine($"Cleaned {usersCount} users");
            
            // Clean roles to avoid conflicts between tests
            var rolesCount = await context.Roles.CountAsync();
            await context.Roles.ExecuteDeleteAsync();
            Console.WriteLine($"Cleaned {rolesCount} roles");
            
            // Finally, clean parent entities
            var orgsCount = await context.Organizations.CountAsync();
            await context.Organizations.ExecuteDeleteAsync();
            Console.WriteLine($"Cleaned {orgsCount} organizations");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Warning: Could not clean test data: {ex.Message}");
            // If cleanup fails, try to recreate database
            try
            {
                await context.Database.EnsureDeletedAsync();
                await context.Database.EnsureCreatedAsync();
                Console.WriteLine("Database recreated after cleanup failure");
            }
            catch (Exception recreateEx)
            {
                Console.WriteLine($"Warning: Could not recreate database: {recreateEx.Message}");
            }
        }
    }

    private void CleanTestData(LeadTrackerDbContext context)
    {
        try
        {
            // Clean in reverse dependency order to avoid foreign key constraint violations
            // First, clean all dependent entities
            
            // Clean user roles first (depends on users and roles)
            context.UserRoles.RemoveRange(context.UserRoles);
            
            // Clean tasks (depends on leads and users)
            context.Tasks.RemoveRange(context.Tasks);
            
            // Clean leads (depends on stages and users)
            context.Leads.RemoveRange(context.Leads);
            
            // Clean stages (depends on organizations)
            context.Stages.RemoveRange(context.Stages);
            
            // Clean business users BEFORE users (depends on organizations)
            context.BusinessUsers.RemoveRange(context.BusinessUsers);
            
            // Clean users (depends on organizations)
            context.Users.RemoveRange(context.Users);
            
            // Clean roles to avoid conflicts between tests
            context.Roles.RemoveRange(context.Roles);
            
            // Finally, clean parent entities
            context.Organizations.RemoveRange(context.Organizations);
            context.SaveChanges();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Warning: Could not clean test data: {ex.Message}");
            // If cleanup fails, try to recreate database
            try
            {
                context.Database.EnsureDeleted();
                context.Database.EnsureCreated();
                Console.WriteLine("Database recreated after cleanup failure");
            }
            catch (Exception recreateEx)
            {
                Console.WriteLine($"Warning: Could not recreate database: {recreateEx.Message}");
            }
        }
    }
}