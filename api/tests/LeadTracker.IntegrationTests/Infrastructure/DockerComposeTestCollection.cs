using Xunit;
using LeadTracker.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Diagnostics;
using System.IO;

namespace LeadTracker.IntegrationTests.Infrastructure;

[CollectionDefinition("DockerComposeTests")]
public class DockerComposeTestCollection : ICollectionFixture<DockerComposeTestFixture>
{
    // This class has no code, and is never created. Its purpose is simply
    // to be the place to apply [CollectionDefinition] and all the
    // ICollectionFixture interfaces.
}

/// <summary>
/// Collection fixture for Docker Compose tests with proper lifecycle management
/// </summary>
public class DockerComposeTestFixture : IAsyncLifetime
{
    public LeadTrackerDbContext Context { get; private set; } = null!;
    public IServiceProvider ServiceProvider { get; private set; } = null!;
    private Process? _dockerComposeProcess;

    // Configuration pour Docker Compose
    private const string ConnectionString = "Host=localhost;Port=5433;Database=leadtracker_test;Username=test;Password=test;";
    private const string DockerComposeFile = "docker-compose.test.yml";
    private const int MaxRetries = 30;
    private const int RetryDelaySeconds = 2;

    public async Task InitializeAsync()
    {
        // Set testing environment to disable tenant filters
        Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Testing");
        Environment.SetEnvironmentVariable("TESTING_MODE", "true");
        
        // Start Docker Compose
        await StartDockerComposeAsync();
        
        // Wait for database to be ready
        await WaitForDatabaseAsync();
        
        // Configure services
        var services = new ServiceCollection();
        
        // Add logging
        services.AddLogging(builder => builder.AddConsole());
        
        // Add configuration
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = ConnectionString
            })
            .Build();
        services.AddSingleton<IConfiguration>(configuration);
        
        // Add DbContext with PostgreSQL (Docker Compose)
        services.AddDbContext<LeadTrackerDbContext>(options =>
        {
            options.UseNpgsql(ConnectionString);
            options.EnableSensitiveDataLogging();
        });

        ServiceProvider = services.BuildServiceProvider();
        Context = ServiceProvider.GetRequiredService<LeadTrackerDbContext>();
        
        // Ensure database is created
        await Context.Database.EnsureCreatedAsync();
    }

    public async Task DisposeAsync()
    {
        if (Context != null)
        {
            await Context.DisposeAsync();
        }
        if (ServiceProvider != null)
        {
            if (ServiceProvider is IDisposable disposable)
            {
                disposable.Dispose();
            }
        }
        
        // Stop Docker Compose
        await StopDockerComposeAsync();
    }

    private async Task StartDockerComposeAsync()
    {
        try
        {
            // Check if Docker Compose is available
            var dockerComposeCheck = Process.Start(new ProcessStartInfo
            {
                FileName = "docker-compose",
                Arguments = "--version",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false
            });
            
            if (dockerComposeCheck != null)
            {
                await dockerComposeCheck.WaitForExitAsync();
                if (dockerComposeCheck.ExitCode != 0)
                {
                    throw new InvalidOperationException("Docker Compose is not available");
                }
            }

            // Start Docker Compose
            var startInfo = new ProcessStartInfo
            {
                FileName = "docker-compose",
                Arguments = $"-f {DockerComposeFile} up -d",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                WorkingDirectory = Path.GetDirectoryName(Path.GetFullPath(DockerComposeFile)) ?? Directory.GetCurrentDirectory()
            };

            _dockerComposeProcess = Process.Start(startInfo);
            if (_dockerComposeProcess != null)
            {
                await _dockerComposeProcess.WaitForExitAsync();
                if (_dockerComposeProcess.ExitCode != 0)
                {
                    var error = await _dockerComposeProcess.StandardError.ReadToEndAsync();
                    throw new InvalidOperationException($"Failed to start Docker Compose: {error}");
                }
            }
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Docker Compose setup failed: {ex.Message}", ex);
        }
    }

    private async Task StopDockerComposeAsync()
    {
        try
        {
            var stopInfo = new ProcessStartInfo
            {
                FileName = "docker-compose",
                Arguments = $"-f {DockerComposeFile} down",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                WorkingDirectory = Path.GetDirectoryName(Path.GetFullPath(DockerComposeFile)) ?? Directory.GetCurrentDirectory()
            };

            var stopProcess = Process.Start(stopInfo);
            if (stopProcess != null)
            {
                await stopProcess.WaitForExitAsync();
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Warning: Failed to stop Docker Compose: {ex.Message}");
        }
    }

    private async Task WaitForDatabaseAsync()
    {
        Console.WriteLine($"Waiting for database to be ready on {ConnectionString}...");
        
        for (int i = 0; i < MaxRetries; i++)
        {
            try
            {
                using var testContext = new LeadTrackerDbContext(new DbContextOptionsBuilder<LeadTrackerDbContext>()
                    .UseNpgsql(ConnectionString)
                    .Options);
                
                await testContext.Database.CanConnectAsync();
                Console.WriteLine($"Database is ready after {i + 1} attempts");
                return; // Database is ready
            }
            catch (Exception ex)
            {
                if (i == MaxRetries - 1)
                {
                    Console.WriteLine($"Database connection failed after {MaxRetries} attempts. Last error: {ex.Message}");
                    throw new InvalidOperationException($"Database not ready after {MaxRetries} attempts: {ex.Message}", ex);
                }
                
                Console.WriteLine($"Database not ready, attempt {i + 1}/{MaxRetries}. Waiting {RetryDelaySeconds}s... Error: {ex.Message}");
                await Task.Delay(TimeSpan.FromSeconds(RetryDelaySeconds));
            }
        }
    }
}
