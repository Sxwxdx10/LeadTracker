using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using LeadTracker.IntegrationTests;
using Xunit;
using System.Diagnostics;
using System.Net.Http;
using System.Text;
using System.Text.Json;

namespace LeadTracker.IntegrationTests.Controllers;

/// <summary>
/// Stress tests to validate that the application can handle high load without Hangfire
/// and maintains stability under stress conditions
/// </summary>
public class StressTestWithoutHangfireIntegrationTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public StressTestWithoutHangfireIntegrationTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task HighConcurrency_ShouldMaintainStability_WithoutHangfire()
    {
        // Arrange
        const int concurrentRequests = 50;
        const int requestsPerClient = 10;
        var tasks = new List<Task<StressTestResult>>();
        var stopwatch = Stopwatch.StartNew();
        
        // Act - Create multiple concurrent clients and send requests
        for (int i = 0; i < concurrentRequests; i++)
        {
            tasks.Add(SimulateClientLoad(requestsPerClient));
        }
        
        var results = await Task.WhenAll(tasks);
        stopwatch.Stop();
        
        // Assert
        var totalRequests = results.Sum(r => r.RequestCount);
        var successfulRequests = results.Sum(r => r.SuccessfulRequests);
        var averageResponseTime = results.Average(r => r.AverageResponseTime);
        var maxResponseTime = results.Max(r => r.MaxResponseTime);
        var errorRate = (double)(totalRequests - successfulRequests) / totalRequests * 100;
        
        Assert.True(successfulRequests > totalRequests * 0.95, 
            $"Success rate: {successfulRequests}/{totalRequests} ({successfulRequests/totalRequests*100:F1}%), expected > 95%");
        Assert.True(averageResponseTime < 1000, 
            $"Average response time: {averageResponseTime}ms, expected < 1000ms");
        Assert.True(maxResponseTime < 5000, 
            $"Max response time: {maxResponseTime}ms, expected < 5000ms");
        Assert.True(errorRate < 5, 
            $"Error rate: {errorRate:F1}%, expected < 5%");
        
        // Log stress test results
        Console.WriteLine($"High Concurrency Stress Test (without Hangfire):");
        Console.WriteLine($"  Total Requests: {totalRequests}");
        Console.WriteLine($"  Successful: {successfulRequests}");
        Console.WriteLine($"  Success Rate: {successfulRequests/totalRequests*100:F1}%");
        Console.WriteLine($"  Average Response Time: {averageResponseTime:F2}ms");
        Console.WriteLine($"  Max Response Time: {maxResponseTime}ms");
        Console.WriteLine($"  Error Rate: {errorRate:F1}%");
        Console.WriteLine($"  Total Time: {stopwatch.ElapsedMilliseconds}ms");
    }

    [Fact]
    public async Task SustainedLoad_ShouldMaintainPerformance_WithoutHangfire()
    {
        // Arrange
        const int durationSeconds = 30;
        const int requestsPerSecond = 10;
        var startTime = DateTime.UtcNow;
        var endTime = startTime.AddSeconds(durationSeconds);
        var results = new List<StressTestResult>();
        var stopwatch = Stopwatch.StartNew();
        
        // Act - Sustained load test
        while (DateTime.UtcNow < endTime)
        {
            var batchTasks = new List<Task<StressTestResult>>();
            
            // Send batch of requests
            for (int i = 0; i < requestsPerSecond; i++)
            {
                batchTasks.Add(SimulateClientLoad(1));
            }
            
            var batchResults = await Task.WhenAll(batchTasks);
            results.AddRange(batchResults);
            
            // Wait for next second
            await Task.Delay(1000);
        }
        
        stopwatch.Stop();
        
        // Assert
        var totalRequests = results.Sum(r => r.RequestCount);
        var successfulRequests = results.Sum(r => r.SuccessfulRequests);
        var averageResponseTime = results.Average(r => r.AverageResponseTime);
        var maxResponseTime = results.Max(r => r.MaxResponseTime);
        var errorRate = (double)(totalRequests - successfulRequests) / totalRequests * 100;
        
        Assert.True(successfulRequests > totalRequests * 0.90, 
            $"Success rate: {successfulRequests}/{totalRequests} ({successfulRequests/totalRequests*100:F1}%), expected > 90%");
        Assert.True(averageResponseTime < 1500, 
            $"Average response time: {averageResponseTime}ms, expected < 1500ms");
        Assert.True(maxResponseTime < 10000, 
            $"Max response time: {maxResponseTime}ms, expected < 10000ms");
        Assert.True(errorRate < 10, 
            $"Error rate: {errorRate:F1}%, expected < 10%");
        
        // Log sustained load results
        Console.WriteLine($"Sustained Load Test (without Hangfire):");
        Console.WriteLine($"  Duration: {durationSeconds}s");
        Console.WriteLine($"  Total Requests: {totalRequests}");
        Console.WriteLine($"  Successful: {successfulRequests}");
        Console.WriteLine($"  Success Rate: {successfulRequests/totalRequests*100:F1}%");
        Console.WriteLine($"  Average Response Time: {averageResponseTime:F2}ms");
        Console.WriteLine($"  Max Response Time: {maxResponseTime}ms");
        Console.WriteLine($"  Error Rate: {errorRate:F1}%");
        Console.WriteLine($"  Requests/Second: {totalRequests / durationSeconds:F1}");
    }

    [Fact]
    public async Task MemoryLeak_ShouldNotOccur_UnderSustainedLoad_WithoutHangfire()
    {
        // Arrange
        const int iterations = 100;
        var memoryMeasurements = new List<long>();
        var initialMemory = GC.GetTotalMemory(false);
        
        // Act - Perform operations and measure memory
        for (int i = 0; i < iterations; i++)
        {
            // Simulate client load
            var result = await SimulateClientLoad(5);
            Assert.True(result.SuccessfulRequests > 0);
            
            // Measure memory every 10 iterations
            if (i % 10 == 0)
            {
                GC.Collect();
                GC.WaitForPendingFinalizers();
                GC.Collect();
                memoryMeasurements.Add(GC.GetTotalMemory(false));
            }
        }
        
        var finalMemory = GC.GetTotalMemory(true);
        var memoryIncrease = finalMemory - initialMemory;
        var maxMemory = memoryMeasurements.Max();
        var minMemory = memoryMeasurements.Min();
        var memoryVariation = maxMemory - minMemory;
        
        // Assert
        Assert.True(memoryIncrease < 100 * 1024 * 1024, // 100MB
            $"Memory increased by {memoryIncrease / 1024 / 1024}MB, expected < 100MB");
        Assert.True(memoryVariation < 50 * 1024 * 1024, // 50MB
            $"Memory variation: {memoryVariation / 1024 / 1024}MB, expected < 50MB");
        
        // Log memory leak test results
        Console.WriteLine($"Memory Leak Test (without Hangfire):");
        Console.WriteLine($"  Initial Memory: {initialMemory / 1024 / 1024}MB");
        Console.WriteLine($"  Final Memory: {finalMemory / 1024 / 1024}MB");
        Console.WriteLine($"  Memory Increase: {memoryIncrease / 1024 / 1024}MB");
        Console.WriteLine($"  Memory Variation: {memoryVariation / 1024 / 1024}MB");
        Console.WriteLine($"  Iterations: {iterations}");
    }

    [Fact]
    public async Task ErrorHandling_ShouldRemainStable_UnderStress_WithoutHangfire()
    {
        // Arrange
        const int errorRequests = 100;
        var tasks = new List<Task<HttpResponseMessage>>();
        var stopwatch = Stopwatch.StartNew();
        
        // Act - Send requests that will cause errors
        for (int i = 0; i < errorRequests; i++)
        {
            tasks.Add(_client.GetAsync($"/api/nonexistent-{i}"));
        }
        
        var responses = await Task.WhenAll(tasks);
        stopwatch.Stop();
        
        // Assert
        var notFoundResponses = responses.Count(r => r.StatusCode == System.Net.HttpStatusCode.NotFound);
        var errorRate = (double)(errorRequests - notFoundResponses) / errorRequests * 100;
        var averageResponseTime = responses.Average(r => r.Headers.Date?.Subtract(DateTime.UtcNow).TotalMilliseconds ?? 0);
        
        Assert.True(notFoundResponses > errorRequests * 0.95, 
            $"Error handling success rate: {notFoundResponses}/{errorRequests} ({notFoundResponses/errorRequests*100:F1}%), expected > 95%");
        Assert.True(errorRate < 5, 
            $"Error rate: {errorRate:F1}%, expected < 5%");
        Assert.True(stopwatch.ElapsedMilliseconds < 10000, 
            $"Error handling took {stopwatch.ElapsedMilliseconds}ms, expected < 10000ms");
        
        // Log error handling results
        Console.WriteLine($"Error Handling Stress Test (without Hangfire):");
        Console.WriteLine($"  Error Requests: {errorRequests}");
        Console.WriteLine($"  Successful Error Handling: {notFoundResponses}");
        Console.WriteLine($"  Success Rate: {notFoundResponses/errorRequests*100:F1}%");
        Console.WriteLine($"  Error Rate: {errorRate:F1}%");
        Console.WriteLine($"  Total Time: {stopwatch.ElapsedMilliseconds}ms");
    }

    [Fact]
    public async Task ResourceCleanup_ShouldWorkCorrectly_UnderStress_WithoutHangfire()
    {
        // Arrange
        const int iterations = 50;
        var initialHandles = Process.GetCurrentProcess().HandleCount;
        var handleMeasurements = new List<int>();
        
        // Act - Create and dispose clients repeatedly
        for (int i = 0; i < iterations; i++)
        {
            using var client = _factory.CreateClient();
            var response = await client.GetAsync("/health");
            Assert.True(response.IsSuccessStatusCode);
            
            if (i % 10 == 0)
            {
                handleMeasurements.Add(Process.GetCurrentProcess().HandleCount);
            }
        }
        
        var finalHandles = Process.GetCurrentProcess().HandleCount;
        var handleIncrease = finalHandles - initialHandles;
        var maxHandles = handleMeasurements.Max();
        var minHandles = handleMeasurements.Min();
        var handleVariation = maxHandles - minHandles;
        
        // Assert
        Assert.True(handleIncrease < 100, 
            $"Handle count increased by {handleIncrease}, expected < 100");
        Assert.True(handleVariation < 50, 
            $"Handle variation: {handleVariation}, expected < 50");
        
        // Log resource cleanup results
        Console.WriteLine($"Resource Cleanup Test (without Hangfire):");
        Console.WriteLine($"  Initial Handles: {initialHandles}");
        Console.WriteLine($"  Final Handles: {finalHandles}");
        Console.WriteLine($"  Handle Increase: {handleIncrease}");
        Console.WriteLine($"  Handle Variation: {handleVariation}");
        Console.WriteLine($"  Iterations: {iterations}");
    }

    private async Task<StressTestResult> SimulateClientLoad(int requestCount)
    {
        var responseTimes = new List<long>();
        var successfulRequests = 0;
        
        for (int i = 0; i < requestCount; i++)
        {
            try
            {
                var stopwatch = Stopwatch.StartNew();
                var response = await _client.GetAsync("/health");
                stopwatch.Stop();
                
                if (response.IsSuccessStatusCode)
                {
                    successfulRequests++;
                }
                
                responseTimes.Add(stopwatch.ElapsedMilliseconds);
            }
            catch
            {
                // Count as failed request
                responseTimes.Add(5000); // Assume 5s timeout for failed requests
            }
        }
        
        return new StressTestResult
        {
            RequestCount = requestCount,
            SuccessfulRequests = successfulRequests,
            AverageResponseTime = responseTimes.Average(),
            MaxResponseTime = responseTimes.Max()
        };
    }

    private class StressTestResult
    {
        public int RequestCount { get; set; }
        public int SuccessfulRequests { get; set; }
        public double AverageResponseTime { get; set; }
        public long MaxResponseTime { get; set; }
    }
}
