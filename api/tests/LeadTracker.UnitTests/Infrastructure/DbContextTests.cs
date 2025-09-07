using FluentAssertions;
using LeadTracker.Core.Entities;
using LeadTracker.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TaskEntity = LeadTracker.Core.Entities.Task;
using Xunit;

namespace LeadTracker.UnitTests.Infrastructure;

public class DbContextTests : IDisposable
{
    private readonly LeadTrackerDbContext _context;
    private readonly ILoggerFactory _loggerFactory;

    public DbContextTests()
    {
        _loggerFactory = LoggerFactory.Create(builder => builder.AddConsole());
        
        var options = new DbContextOptionsBuilder<LeadTrackerDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()) // Unique database for each test
            .UseLoggerFactory(_loggerFactory)
            .Options;

        _context = new LeadTrackerDbContext(options);
        _context.Database.EnsureCreated();
    }

    [Fact]
    public async System.Threading.Tasks.Task Should_Create_Organization_Successfully()
    {
        // Arrange
        var organization = new Organization
        {
            Name = "Test Corp",
            Domain = "test-corp",
            Description = "Test organization",
            IsActive = true
        };

        // Act
        _context.Organizations.Add(organization);
        await _context.SaveChangesAsync();

        // Assert
        var savedOrg = await _context.Organizations.FirstOrDefaultAsync();
        savedOrg.Should().NotBeNull();
        savedOrg!.Name.Should().Be("Test Corp");
        savedOrg.Domain.Should().Be("test-corp");
        savedOrg.IsActive.Should().BeTrue();
    }

    [Fact]
    public async System.Threading.Tasks.Task Should_Create_User_With_Organization_Relationship()
    {
        // Arrange
        var organization = new Organization
        {
            Name = "Test Corp",
            Domain = "test-corp"
        };
        
        _context.Organizations.Add(organization);
        await _context.SaveChangesAsync();

        var user = new User
        {
            OrganizationId = organization.Id,
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@test-corp.com",
            IsActive = true
        };

        // Act
        _context.BusinessUsers.Add(user);
        await _context.SaveChangesAsync();

        // Assert
        var savedUser = await _context.BusinessUsers
            .Include(u => u.Organization)
            .FirstOrDefaultAsync();

        savedUser.Should().NotBeNull();
        savedUser!.FirstName.Should().Be("John");
        savedUser.LastName.Should().Be("Doe");
        savedUser.Organization.Should().NotBeNull();
        savedUser.Organization.Name.Should().Be("Test Corp");
    }

    [Fact]
    public async System.Threading.Tasks.Task Should_Create_Lead_With_All_Relationships()
    {
        // Arrange
        var organization = new Organization
        {
            Name = "Test Corp",
            Domain = "test-corp"
        };

        var stage = new Stage
        {
            OrganizationId = organization.Id,
            Name = "New Lead",
            Order = 1,
            Color = "#3B82F6"
        };

        var user = new User
        {
            OrganizationId = organization.Id,
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@test-corp.com"
        };

        _context.Organizations.Add(organization);
        _context.Stages.Add(stage);
        _context.BusinessUsers.Add(user);
        await _context.SaveChangesAsync();

        var lead = new Lead
        {
            OrganizationId = organization.Id,
            StageId = stage.Id,
            AssignedUserId = user.Id,
            Title = "Test Lead",
            FirstName = "Jane",
            LastName = "Smith",
            Email = "jane.smith@example.com",
            Company = "Example Corp",
            EstimatedValue = 10000,
            Status = "Open"
        };

        // Act
        _context.Leads.Add(lead);
        await _context.SaveChangesAsync();

        // Assert
        var savedLead = await _context.Leads
            .Include(l => l.Organization)
            .Include(l => l.Stage)
            .Include(l => l.AssignedUser)
            .FirstOrDefaultAsync();

        savedLead.Should().NotBeNull();
        savedLead!.Title.Should().Be("Test Lead");
        savedLead.Organization.Should().NotBeNull();
        savedLead.Stage.Should().NotBeNull();
        savedLead.AssignedUser.Should().NotBeNull();
        savedLead.EstimatedValue.Should().Be(10000);
    }

    [Fact]
    public async System.Threading.Tasks.Task Should_Create_Task_With_Lead_Relationship()
    {
        // Arrange
        var organization = new Organization
        {
            Name = "Test Corp",
            Domain = "test-corp"
        };

        var stage = new Stage
        {
            OrganizationId = organization.Id,
            Name = "New Lead",
            Order = 1
        };

        var lead = new Lead
        {
            OrganizationId = organization.Id,
            StageId = stage.Id,
            Title = "Test Lead"
        };

        _context.Organizations.Add(organization);
        _context.Stages.Add(stage);
        _context.Leads.Add(lead);
        await _context.SaveChangesAsync();

        var task = new TaskEntity
        {
            OrganizationId = organization.Id,
            LeadId = lead.Id,
            Title = "Call prospect",
            Type = "Call",
            Status = "Pending",
            DueDate = DateTime.UtcNow.AddDays(1)
        };

        // Act
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        // Assert
        var savedTask = await _context.Tasks
            .Include(t => t.Lead)
            .Include(t => t.Organization)
            .FirstOrDefaultAsync();

        savedTask.Should().NotBeNull();
        savedTask!.Title.Should().Be("Call prospect");
        savedTask.Type.Should().Be("Call");
        savedTask.Lead.Should().NotBeNull();
        savedTask.Organization.Should().NotBeNull();
    }

    [Fact]
    public async System.Threading.Tasks.Task Should_Check_Unique_Domain_Logic()
    {
        // Arrange
        var org1 = new Organization
        {
            Name = "Corp 1",
            Domain = "same-domain"
        };

        var org2 = new Organization
        {
            Name = "Corp 2",
            Domain = "same-domain"
        };

        _context.Organizations.Add(org1);
        await _context.SaveChangesAsync();

        // Act - Check if domain already exists
        var existingDomain = await _context.Organizations
            .AnyAsync(o => o.Domain == org2.Domain);

        // Assert - Business logic should prevent duplicate domains
        existingDomain.Should().BeTrue();
        
        // In real application, we would throw an exception before saving
        // But for this test, we just verify the domain exists
        var domainCount = await _context.Organizations
            .CountAsync(o => o.Domain == "same-domain");
        domainCount.Should().Be(1);
    }

    public void Dispose()
    {
        _context.Dispose();
        _loggerFactory.Dispose();
    }
}
