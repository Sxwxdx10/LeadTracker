using FluentAssertions;
using LeadTracker.Core.Entities;
using Xunit;

namespace LeadTracker.UnitTests.Entities;

public class LeadTests
{
    [Fact]
    public void Lead_Should_Have_Default_Values()
    {
        // Arrange & Act
        var lead = new Lead();

        // Assert
        lead.Id.Should().NotBeEmpty();
        lead.Title.Should().BeEmpty();
        lead.Status.Should().Be("Open");
        lead.Probability.Should().Be(50);
        lead.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        lead.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        lead.Tasks.Should().NotBeNull().And.BeEmpty();
    }

    [Theory]
    [InlineData("John", "Doe", "John Doe")]
    [InlineData("Jane", "", "Jane")]
    [InlineData("", "Smith", "Smith")]
    [InlineData("", "", "")]
    [InlineData(null, null, "")]
    public void Lead_FullName_Should_Combine_FirstName_And_LastName(string? firstName, string? lastName, string expected)
    {
        // Arrange
        var lead = new Lead
        {
            FirstName = firstName,
            LastName = lastName
        };

        // Act & Assert
        lead.FullName.Should().Be(expected);
    }

    [Theory]
    [InlineData("john@example.com", "+1-555-0123", true)]
    [InlineData("john@example.com", "", false)]
    [InlineData("", "+1-555-0123", false)]
    [InlineData("", "", false)]
    [InlineData(null, null, false)]
    public void Lead_IsQualified_Should_Check_Email_And_Phone(string? email, string? phoneNumber, bool expected)
    {
        // Arrange
        var lead = new Lead
        {
            Email = email,
            PhoneNumber = phoneNumber
        };

        // Act & Assert
        lead.IsQualified.Should().Be(expected);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(25)]
    [InlineData(50)]
    [InlineData(75)]
    [InlineData(100)]
    public void Lead_Probability_Should_Accept_Valid_Range(int probability)
    {
        // Arrange
        var lead = new Lead();

        // Act
        lead.Probability = probability;

        // Assert
        lead.Probability.Should().Be(probability);
    }

    [Fact]
    public void Lead_Should_Initialize_With_Valid_OrganizationId()
    {
        // Arrange
        var organizationId = Guid.NewGuid();
        var stageId = Guid.NewGuid();

        // Act
        var lead = new Lead
        {
            OrganizationId = organizationId,
            StageId = stageId,
            Title = "Test Lead"
        };

        // Assert
        lead.OrganizationId.Should().Be(organizationId);
        lead.StageId.Should().Be(stageId);
        lead.Title.Should().Be("Test Lead");
    }
}
