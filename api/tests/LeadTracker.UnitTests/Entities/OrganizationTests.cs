using FluentAssertions;
using LeadTracker.Core.Entities;
using Xunit;

namespace LeadTracker.UnitTests.Entities;

public class OrganizationTests
{
    [Fact]
    public void Organization_Should_Have_Default_Values()
    {
        // Arrange & Act
        var organization = new Organization();

        // Assert
        organization.Id.Should().NotBeEmpty();
        organization.Name.Should().BeEmpty();
        organization.Domain.Should().BeEmpty();
        organization.TimeZone.Should().Be("UTC");
        organization.Currency.Should().Be("USD");
        organization.IsActive.Should().BeTrue();
        organization.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        organization.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public void Organization_Should_Initialize_Collections()
    {
        // Arrange & Act
        var organization = new Organization();

        // Assert
        organization.Users.Should().NotBeNull().And.BeEmpty();
        organization.Leads.Should().NotBeNull().And.BeEmpty();
        organization.Stages.Should().NotBeNull().And.BeEmpty();
    }

    [Theory]
    [InlineData("")]
    [InlineData("a")]
    [InlineData("valid-domain")]
    [InlineData("company-123")]
    public void Organization_Domain_Should_Accept_Valid_Values(string domain)
    {
        // Arrange
        var organization = new Organization();

        // Act
        organization.Domain = domain;

        // Assert
        organization.Domain.Should().Be(domain);
    }

    [Theory]
    [InlineData("UTC")]
    [InlineData("America/New_York")]
    [InlineData("Europe/London")]
    public void Organization_TimeZone_Should_Accept_Valid_Values(string timeZone)
    {
        // Arrange
        var organization = new Organization();

        // Act
        organization.TimeZone = timeZone;

        // Assert
        organization.TimeZone.Should().Be(timeZone);
    }
}
