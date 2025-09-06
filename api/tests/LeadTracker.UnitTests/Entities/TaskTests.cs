using FluentAssertions;
using LeadTracker.Core.Entities;
using TaskEntity = LeadTracker.Core.Entities.Task;
using Xunit;

namespace LeadTracker.UnitTests.Entities;

public class TaskTests
{
    [Fact]
    public void Task_Should_Have_Default_Values()
    {
        // Arrange & Act
        var task = new TaskEntity();

        // Assert
        task.Id.Should().NotBeEmpty();
        task.Title.Should().BeEmpty();
        task.Type.Should().Be("Call");
        task.Status.Should().Be("Pending");
        task.Priority.Should().Be("Medium");
        task.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        task.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
    }

    [Theory]
    [InlineData("Completed", true)]
    [InlineData("Pending", false)]
    [InlineData("Cancelled", false)]
    [InlineData("InProgress", false)]
    public void Task_IsCompleted_Should_Check_Status(string status, bool expected)
    {
        // Arrange
        var task = new TaskEntity
        {
            Status = status
        };

        // Act & Assert
        task.IsCompleted.Should().Be(expected);
    }

    [Fact]
    public void Task_IsOverdue_Should_Check_DueDate_And_Status()
    {
        // Arrange
        var pastDate = DateTime.UtcNow.AddDays(-1);
        var futureDate = DateTime.UtcNow.AddDays(1);

        var overdueTask = new TaskEntity
        {
            DueDate = pastDate,
            Status = "Pending"
        };

        var completedOverdueTask = new TaskEntity
        {
            DueDate = pastDate,
            Status = "Completed"
        };

        var futureTask = new TaskEntity
        {
            DueDate = futureDate,
            Status = "Pending"
        };

        // Act & Assert
        overdueTask.IsOverdue.Should().BeTrue();
        completedOverdueTask.IsOverdue.Should().BeFalse();
        futureTask.IsOverdue.Should().BeFalse();
    }

    [Fact]
    public void Task_IsToday_Should_Check_DueDate()
    {
        // Arrange
        var today = DateTime.UtcNow.Date;
        var tomorrow = DateTime.UtcNow.AddDays(1);

        var todayTask = new TaskEntity
        {
            DueDate = today
        };

        var tomorrowTask = new TaskEntity
        {
            DueDate = tomorrow
        };

        // Act & Assert
        todayTask.IsToday.Should().BeTrue();
        tomorrowTask.IsToday.Should().BeFalse();
    }

    [Theory]
    [InlineData("Call")]
    [InlineData("Email")]
    [InlineData("Meeting")]
    [InlineData("Follow-up")]
    [InlineData("Demo")]
    public void Task_Type_Should_Accept_Valid_Values(string type)
    {
        // Arrange
        var task = new TaskEntity();

        // Act
        task.Type = type;

        // Assert
        task.Type.Should().Be(type);
    }

    [Theory]
    [InlineData("Low")]
    [InlineData("Medium")]
    [InlineData("High")]
    [InlineData("Urgent")]
    public void Task_Priority_Should_Accept_Valid_Values(string priority)
    {
        // Arrange
        var task = new TaskEntity();

        // Act
        task.Priority = priority;

        // Assert
        task.Priority.Should().Be(priority);
    }
}
