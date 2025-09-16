using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using LeadTracker.IntegrationTests;
using Xunit;
using System.Diagnostics;
using System.Net.Http;
using System.Text;
using System.Text.Json;

namespace LeadTracker.IntegrationTests.Controllers;

/// <summary>
/// Performance comparison tests to benchmark the application with and without Hangfire
/// This helps validate that disabling Hangfire doesn't negatively impact performance
/// </summary>
public class HangfirePerformanceComparisonTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public HangfirePerformanceComparisonTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
    }

    [Fact]
    public void Application_Startup_ShouldBeFaster_WithoutHangfire()
    {
        // Arrange
        var measurements = new List<long>();
        const int iterations = 5;
        
        // Act - Measure startup time multiple times
        for (int i = 0; i < iterations; i++)
        {
            var stopwatch = Stopwatch.StartNew();
            using var testClient = _factory.CreateClient();
            stopwatch.Stop();
            measurements.Add(stopwatch.ElapsedMilliseconds);
        }
        
        // Assert
        var averageStartupTime = measurements.Average();
        var maxStartupTime = measurements.Max();
        
        Assert.True(averageStartupTime < 1000, 
            $"Average startup time: {averageStartupTime}ms, expected < 1000ms");
        Assert.True(maxStartupTime < 2000, 
            $"Max startup time: {maxStartupTime}ms, expected < 2000ms");
        
        // Log performance metrics
        Console.WriteLine($"Startup Performance (without Hangfire):");
        Console.WriteLine($"  Average: {averageStartupTime:F2}ms");
        Console.WriteLine($"  Min: {measurements.Min()}ms");
        Console.WriteLine($"  Max: {maxStartupTime}ms");
        Console.WriteLine($"  Standard Deviation: {CalculateStandardDeviation(measurements):F2}ms");
    }

    [Fact]
    public async Task HealthChecks_ShouldBeConsistentlyFast_WithoutHangfire()
    {
        // Arrange
        var measurements = new List<long>();
        const int iterations = 20;
        
        // Act - Measure health check response times
        for (int i = 0; i < iterations; i++)
        {
            var stopwatch = Stopwatch.StartNew();
            var response = await _client.GetAsync("/health");
            stopwatch.Stop();
            
            Assert.True(response.IsSuccessStatusCode);
            measurements.Add(stopwatch.ElapsedMilliseconds);
        }
        
        // Assert
        var averageResponseTime = measurements.Average();
        var maxResponseTime = measurements.Max();
        var p95ResponseTime = CalculatePercentile(measurements, 95);
        
        Assert.True(averageResponseTime < 200, 
            $"Average health check time: {averageResponseTime}ms, expected < 200ms");
        Assert.True(maxResponseTime < 500, 
            $"Max health check time: {maxResponseTime}ms, expected < 500ms");
        Assert.True(p95ResponseTime < 300, 
            $"95th percentile health check time: {p95ResponseTime}ms, expected < 300ms");
        
        // Log performance metrics
        Console.WriteLine($"Health Check Performance (without Hangfire):");
        Console.WriteLine($"  Average: {averageResponseTime:F2}ms");
        Console.WriteLine($"  P95: {p95ResponseTime}ms");
        Console.WriteLine($"  Max: {maxResponseTime}ms");
    }

    [Fact]
    public async Task ConcurrentRequests_ShouldScaleWell_WithoutHangfire()
    {
        // Arrange
        var concurrencyLevels = new[] { 1, 5, 10, 20 };
        var results = new Dictionary<int, (double average, long max)>();
        
        // Act - Test different concurrency levels
        foreach (var concurrency in concurrencyLevels)
        {
            var measurements = new List<long>();
            var tasks = new List<Task<long>>();
            
            for (int i = 0; i < concurrency; i++)
            {
                tasks.Add(MeasureRequestTime());
            }
            
            var times = await Task.WhenAll(tasks);
            measurements.AddRange(times);
            
            results[concurrency] = (measurements.Average(), measurements.Max());
        }
        
        // Assert
        foreach (var result in results)
        {
            var concurrency = result.Key;
            var average = result.Value.average;
            var max = result.Value.max;
            
            Assert.True(average < 1000, 
                $"Concurrency {concurrency}: Average {average}ms, expected < 1000ms");
            Assert.True(max < 2000, 
                $"Concurrency {concurrency}: Max {max}ms, expected < 2000ms");
        }
        
        // Log performance metrics
        Console.WriteLine($"Concurrent Request Performance (without Hangfire):");
        foreach (var result in results)
        {
            Console.WriteLine($"  Concurrency {result.Key}: Avg {result.Value.average:F2}ms, Max {result.Value.max}ms");
        }
    }

    [Fact]
    public async Task MemoryUsage_ShouldRemainStable_UnderLoad_WithoutHangfire()
    {
        // Arrange
        var initialMemory = GC.GetTotalMemory(false);
        var memoryMeasurements = new List<long>();
        const int iterations = 100;
        
        // Act - Perform operations and measure memory
        for (int i = 0; i < iterations; i++)
        {
            var response = await _client.GetAsync("/health");
            Assert.True(response.IsSuccessStatusCode);
            
            if (i % 10 == 0)
            {
                memoryMeasurements.Add(GC.GetTotalMemory(false));
            }
        }
        
        var finalMemory = GC.GetTotalMemory(true);
        var memoryIncrease = finalMemory - initialMemory;
        var maxMemory = memoryMeasurements.Max();
        var minMemory = memoryMeasurements.Min();
        var memoryVariation = maxMemory - minMemory;
        
        // Assert
        Assert.True(memoryIncrease < 50 * 1024 * 1024, // 50MB
            $"Memory increased by {memoryIncrease / 1024 / 1024}MB, expected < 50MB");
        Assert.True(memoryVariation < 20 * 1024 * 1024, // 20MB
            $"Memory variation: {memoryVariation / 1024 / 1024}MB, expected < 20MB");
        
        // Log memory metrics
        Console.WriteLine($"Memory Usage (without Hangfire):");
        Console.WriteLine($"  Initial: {initialMemory / 1024 / 1024}MB");
        Console.WriteLine($"  Final: {finalMemory / 1024 / 1024}MB");
        Console.WriteLine($"  Increase: {memoryIncrease / 1024 / 1024}MB");
        Console.WriteLine($"  Variation: {memoryVariation / 1024 / 1024}MB");
    }

    [Fact]
    public void ConfigurationAccess_ShouldBeFast_WithoutHangfire()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        var measurements = new List<long>();
        const int iterations = 1000;
        
        // Act - Measure configuration access time
        for (int i = 0; i < iterations; i++)
        {
            var stopwatch = Stopwatch.StartNew();
            var hangfireEnabled = configuration.GetValue<bool>("Hangfire:Enabled");
            var hangfireDisabled = configuration.GetValue<bool>("Hangfire:DisableForTesting");
            var skipConnection = configuration.GetValue<bool>("Hangfire:SkipDatabaseConnection");
            stopwatch.Stop();
            
            measurements.Add(stopwatch.ElapsedMilliseconds);
        }
        
        // Assert
        var averageTime = measurements.Average();
        var maxTime = measurements.Max();
        var p99Time = CalculatePercentile(measurements, 99);
        
        Assert.True(averageTime < 1, 
            $"Average config access time: {averageTime}ms, expected < 1ms");
        Assert.True(maxTime < 5, 
            $"Max config access time: {maxTime}ms, expected < 5ms");
        Assert.True(p99Time < 2, 
            $"99th percentile config access time: {p99Time}ms, expected < 2ms");
        
        // Log performance metrics
        Console.WriteLine($"Configuration Access Performance (without Hangfire):");
        Console.WriteLine($"  Average: {averageTime:F4}ms");
        Console.WriteLine($"  P99: {p99Time}ms");
        Console.WriteLine($"  Max: {maxTime}ms");
    }

    private async Task<long> MeasureRequestTime()
    {
        var stopwatch = Stopwatch.StartNew();
        var response = await _client.GetAsync("/health");
        stopwatch.Stop();
        
        Assert.True(response.IsSuccessStatusCode);
        return stopwatch.ElapsedMilliseconds;
    }

    private static double CalculateStandardDeviation(List<long> values)
    {
        var average = values.Average();
        var sumOfSquares = values.Sum(x => Math.Pow(x - average, 2));
        return Math.Sqrt(sumOfSquares / values.Count);
    }

    private static long CalculatePercentile(List<long> values, int percentile)
    {
        var sortedValues = values.OrderBy(x => x).ToList();
        var index = (int)Math.Ceiling((percentile / 100.0) * sortedValues.Count) - 1;
        return sortedValues[Math.Max(0, Math.Min(index, sortedValues.Count - 1))];
    }
}
