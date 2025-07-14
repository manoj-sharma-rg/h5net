using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using System.IO;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly ILogger<HealthController> _logger;
    private readonly IConfiguration _configuration;

    public HealthController(ILogger<HealthController> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    [HttpGet]
    public IActionResult GetHealth()
    {
        try
        {
            var healthStatus = new
            {
                status = "healthy",
                timestamp = DateTime.UtcNow,
                version = GetApplicationVersion(),
                uptime = GetUptime(),
                environment = _configuration["Environment"] ?? "Development",
                checks = new
                {
                    database = CheckDatabaseConnection(),
                    fileSystem = CheckFileSystemAccess(),
                    memory = CheckMemoryUsage(),
                    disk = CheckDiskSpace()
                }
            };

            _logger.LogDebug("Health check completed successfully");
            return Ok(healthStatus);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Health check failed");
            return StatusCode(503, new { status = "unhealthy", error = ex.Message });
        }
    }

    [HttpGet("ready")]
    public IActionResult GetReadiness()
    {
        try
        {
            var readiness = new
            {
                status = "ready",
                timestamp = DateTime.UtcNow,
                checks = new
                {
                    database = CheckDatabaseConnection(),
                    fileSystem = CheckFileSystemAccess(),
                    configuration = CheckConfiguration()
                }
            };

            // Return 200 if all checks pass, 503 if any fail
            var allChecksPass = readiness.checks.database && 
                              readiness.checks.fileSystem && 
                              readiness.checks.configuration;

            if (allChecksPass)
            {
                return Ok(readiness);
            }
            else
            {
                return StatusCode(503, readiness);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Readiness check failed");
            return StatusCode(503, new { status = "not ready", error = ex.Message });
        }
    }

    [HttpGet("metrics")]
    public IActionResult GetMetrics()
    {
        try
        {
            var process = Process.GetCurrentProcess();
            var metrics = new
            {
                timestamp = DateTime.UtcNow,
                process = new
                {
                    id = process.Id,
                    name = process.ProcessName,
                    startTime = process.StartTime,
                    totalProcessorTime = process.TotalProcessorTime.TotalSeconds,
                    workingSet = process.WorkingSet64,
                    privateMemory = process.PrivateMemorySize64,
                    virtualMemory = process.VirtualMemorySize64,
                    threadCount = process.Threads.Count,
                    handleCount = process.HandleCount
                },
                system = new
                {
                    cpuUsage = GetCpuUsage(),
                    memoryUsage = GetSystemMemoryUsage(),
                    diskUsage = GetDiskUsage()
                },
                application = new
                {
                    activeConnections = GetActiveConnections(),
                    requestCount = GetRequestCount(),
                    errorCount = GetErrorCount()
                }
            };

            return Ok(metrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get metrics");
            return Problem("Failed to get metrics");
        }
    }

    private string GetApplicationVersion()
    {
        return typeof(Program).Assembly.GetName().Version?.ToString() ?? "1.0.0";
    }

    private TimeSpan GetUptime()
    {
        return DateTime.UtcNow - Process.GetCurrentProcess().StartTime.ToUniversalTime();
    }

    private bool CheckDatabaseConnection()
    {
        // In production, check actual database connection
        // For now, return true as we're using file-based storage
        return true;
    }

    private bool CheckFileSystemAccess()
    {
        try
        {
            var testPath = Path.Combine("pms", "health-check");
            Directory.CreateDirectory(testPath);
            var testFile = Path.Combine(testPath, "test.txt");
           System.IO. File.WriteAllText(testFile, "health check");
          System.IO.  File.Delete(testFile);
            Directory.Delete(testPath);
            return true;
        }
        catch
        {
            return false;
        }
    }

    private bool CheckMemoryUsage()
    {
        var process = Process.GetCurrentProcess();
        var memoryUsageMB = process.WorkingSet64 / (1024 * 1024);
        return memoryUsageMB < 1024; // Less than 1GB
    }

    private bool CheckDiskSpace()
    {
        try
        {
            var drive = new DriveInfo(Directory.GetCurrentDirectory());
            var freeSpaceGB = drive.AvailableFreeSpace / (1024 * 1024 * 1024);
            return freeSpaceGB > 1; // More than 1GB free
        }
        catch
        {
            return false;
        }
    }

    private bool CheckConfiguration()
    {
        try
        {
            // Check if essential configuration is present
            var requiredSettings = new[] { "Jwt:Key", "Environment" };
            foreach (var setting in requiredSettings)
            {
                if (string.IsNullOrEmpty(_configuration[setting]))
                {
                    return false;
                }
            }
            return true;
        }
        catch
        {
            return false;
        }
    }

    private double GetCpuUsage()
    {
        // Simplified CPU usage calculation
        // In production, use more sophisticated monitoring
        return 0.0;
    }

    private double GetSystemMemoryUsage()
    {
        try
        {
            var process = Process.GetCurrentProcess();
            var totalMemory = GC.GetTotalMemory(false);
            return (double)totalMemory / (1024 * 1024); // MB
        }
        catch
        {
            return 0.0;
        }
    }

    private double GetDiskUsage()
    {
        try
        {
            var drive = new DriveInfo(Directory.GetCurrentDirectory());
            var totalSize = drive.TotalSize;
            var freeSpace = drive.AvailableFreeSpace;
            return (double)(totalSize - freeSpace) / totalSize * 100; // Percentage
        }
        catch
        {
            return 0.0;
        }
    }

    private int GetActiveConnections()
    {
        // In production, track actual connection count
        return 0;
    }

    private int GetRequestCount()
    {
        // In production, track actual request count
        return 0;
    }

    private int GetErrorCount()
    {
        // In production, track actual error count
        return 0;
    }
} 