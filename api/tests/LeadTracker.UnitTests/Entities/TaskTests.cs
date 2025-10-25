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

    [Fact]
    public void Task_IsOverdue_Should_Not_Be_Overdue_When_Scheduled_For_Later_Today()
    {
        // Arrange - Create a task scheduled for 3 PM today
        var now = DateTime.UtcNow;
        var todayAt3PM = new DateTime(now.Year, now.Month, now.Day, 15, 0, 0, DateTimeKind.Utc);
        
        // If it's already past 3 PM, schedule for 4 PM instead
        var scheduledTime = now.Hour >= 15 ? 
            new DateTime(now.Year, now.Month, now.Day, 16, 0, 0, DateTimeKind.Utc) :
            todayAt3PM;

        var task = new TaskEntity
        {
            DueDate = scheduledTime,
            Status = "Pending"
        };

        // Act & Assert
        // The task should NOT be overdue if it's scheduled for later today
        task.IsOverdue.Should().BeFalse($"Task scheduled for {scheduledTime:yyyy-MM-dd HH:mm} should not be overdue when current time is {now:yyyy-MM-dd HH:mm}");
    }

    [Fact]
    public void Task_IsOverdue_Should_Be_Overdue_When_Scheduled_For_Earlier_Today()
    {
        // Arrange - Create a task scheduled for 9 AM today
        var now = DateTime.UtcNow;
        var todayAt9AM = new DateTime(now.Year, now.Month, now.Day, 9, 0, 0, DateTimeKind.Utc);
        
        // Only test if it's currently past 9 AM
        if (now.Hour >= 9)
        {
            var task = new TaskEntity
            {
                DueDate = todayAt9AM,
                Status = "Pending"
            };

            // Act & Assert
            task.IsOverdue.Should().BeTrue($"Task scheduled for {todayAt9AM:yyyy-MM-dd HH:mm} should be overdue when current time is {now:yyyy-MM-dd HH:mm}");
        }
    }

    [Fact]
    public void Task_IsOverdue_Should_Handle_Timezone_Correctly()
    {
        // Arrange - Simulate the exact scenario from the user
        // Current time is 2025-10-21 11:23 EDT (which is 15:23 UTC)
        var now = DateTime.UtcNow;
        var todayAt3PM = new DateTime(now.Year, now.Month, now.Day, 15, 0, 0, DateTimeKind.Utc);
        var todayAt4PM = new DateTime(now.Year, now.Month, now.Day, 16, 0, 0, DateTimeKind.Utc);
        
        var task3PM = new TaskEntity
        {
            DueDate = todayAt3PM,
            Status = "Pending"
        };

        var task4PM = new TaskEntity
        {
            DueDate = todayAt4PM,
            Status = "Pending"
        };

        // Act & Assert
        // Both tasks should NOT be overdue if current time is before 3 PM UTC
        if (now.Hour < 15)
        {
            task3PM.IsOverdue.Should().BeFalse($"Task at 3 PM UTC should not be overdue when current time is {now:yyyy-MM-dd HH:mm} UTC");
            task4PM.IsOverdue.Should().BeFalse($"Task at 4 PM UTC should not be overdue when current time is {now:yyyy-MM-dd HH:mm} UTC");
        }
        else if (now.Hour < 16)
        {
            task3PM.IsOverdue.Should().BeTrue($"Task at 3 PM UTC should be overdue when current time is {now:yyyy-MM-dd HH:mm} UTC");
            task4PM.IsOverdue.Should().BeFalse($"Task at 4 PM UTC should not be overdue when current time is {now:yyyy-MM-dd HH:mm} UTC");
        }
        else
        {
            task3PM.IsOverdue.Should().BeTrue($"Task at 3 PM UTC should be overdue when current time is {now:yyyy-MM-dd HH:mm} UTC");
            task4PM.IsOverdue.Should().BeTrue($"Task at 4 PM UTC should be overdue when current time is {now:yyyy-MM-dd HH:mm} UTC");
        }
    }

    [Fact]
    public void Task_IsOverdue_Should_Handle_Local_Timezone_Correctly()
    {
        // Arrange - Test the scenario where user creates task at 3 PM local time (EDT)
        // EDT is UTC-4, so 3 PM EDT = 7 PM UTC
        var now = DateTime.UtcNow;
        var todayAt3PMEDT = new DateTime(now.Year, now.Month, now.Day, 19, 0, 0, DateTimeKind.Utc); // 3 PM EDT = 7 PM UTC
        var todayAt4PMEDT = new DateTime(now.Year, now.Month, now.Day, 20, 0, 0, DateTimeKind.Utc); // 4 PM EDT = 8 PM UTC
        
        var task3PMEDT = new TaskEntity
        {
            DueDate = todayAt3PMEDT,
            Status = "Pending"
        };

        var task4PMEDT = new TaskEntity
        {
            DueDate = todayAt4PMEDT,
            Status = "Pending"
        };

        // Act & Assert
        // Both tasks should NOT be overdue if current time is before 7 PM UTC (3 PM EDT)
        if (now.Hour < 19)
        {
            task3PMEDT.IsOverdue.Should().BeFalse($"Task at 3 PM EDT (7 PM UTC) should not be overdue when current time is {now:yyyy-MM-dd HH:mm} UTC");
            task4PMEDT.IsOverdue.Should().BeFalse($"Task at 4 PM EDT (8 PM UTC) should not be overdue when current time is {now:yyyy-MM-dd HH:mm} UTC");
        }
        else if (now.Hour < 20)
        {
            task3PMEDT.IsOverdue.Should().BeTrue($"Task at 3 PM EDT (7 PM UTC) should be overdue when current time is {now:yyyy-MM-dd HH:mm} UTC");
            task4PMEDT.IsOverdue.Should().BeFalse($"Task at 4 PM EDT (8 PM UTC) should not be overdue when current time is {now:yyyy-MM-dd HH:mm} UTC");
        }
        else
        {
            task3PMEDT.IsOverdue.Should().BeTrue($"Task at 3 PM EDT (7 PM UTC) should be overdue when current time is {now:yyyy-MM-dd HH:mm} UTC");
            task4PMEDT.IsOverdue.Should().BeTrue($"Task at 4 PM EDT (8 PM UTC) should be overdue when current time is {now:yyyy-MM-dd HH:mm} UTC");
        }
    }
}
