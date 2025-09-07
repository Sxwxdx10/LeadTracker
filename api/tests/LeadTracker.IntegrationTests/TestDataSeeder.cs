using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using LeadTracker.Core.Entities;
using LeadTracker.Infrastructure;
using System;
using System.Threading.Tasks;
using TaskEntity = LeadTracker.Core.Entities.Task;

namespace LeadTracker.IntegrationTests;

/// <summary>
/// Seeds test data for integration tests
/// </summary>
public class TestDataSeeder : ITestDataSeeder
{
    private readonly LeadTrackerDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole<Guid>> _roleManager;

    public TestDataSeeder(LeadTrackerDbContext context, UserManager<ApplicationUser> userManager, RoleManager<IdentityRole<Guid>> roleManager)
    {
        _context = context;
        _userManager = userManager;
        _roleManager = roleManager;
    }

    public async System.Threading.Tasks.Task SeedAsync()
    {
        Console.WriteLine("TestDataSeeder: Starting seed process...");
        
        // Ensure roles exist
        if (!await _roleManager.RoleExistsAsync("Admin"))
        {
            Console.WriteLine("TestDataSeeder: Creating Admin role...");
            await _roleManager.CreateAsync(new IdentityRole<Guid>("Admin"));
        }
        else
        {
            Console.WriteLine("TestDataSeeder: Admin role already exists");
        }
        
        if (!await _roleManager.RoleExistsAsync("User"))
        {
            Console.WriteLine("TestDataSeeder: Creating User role...");
            await _roleManager.CreateAsync(new IdentityRole<Guid>("User"));
        }
        else
        {
            Console.WriteLine("TestDataSeeder: User role already exists");
        }

        // Ensure organizations exist
        var org1 = await _context.Organizations.FirstOrDefaultAsync(o => o.Domain == "example.com");
        if (org1 == null)
        {
            Console.WriteLine("TestDataSeeder: Creating example.com organization...");
            org1 = new Organization
            {
                Id = Guid.NewGuid(),
                Name = "Example Org",
                Domain = "example.com",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Organizations.Add(org1);
            await _context.SaveChangesAsync();
        }
        else
        {
            Console.WriteLine("TestDataSeeder: example.com organization already exists");
        }

        // Ensure a user exists for the organization
        var user = await _userManager.FindByEmailAsync("testuser@example.com");
        if (user == null)
        {
            Console.WriteLine("TestDataSeeder: Creating testuser@example.com user...");
            user = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                UserName = "testuser@example.com",
                Email = "testuser@example.com",
                EmailConfirmed = true,
                OrganizationId = org1.Id
            };
            await _userManager.CreateAsync(user, "Password123!");
            await _userManager.AddToRoleAsync(user, "User");
        }
        else
        {
            Console.WriteLine("TestDataSeeder: testuser@example.com user already exists");
        }
        
        Console.WriteLine("TestDataSeeder: Seed process completed");
    }
}
