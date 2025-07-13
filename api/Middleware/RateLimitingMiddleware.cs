using System.Collections.Concurrent;

namespace api.Middleware;

public class RateLimitingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RateLimitingMiddleware> _logger;
    private readonly ConcurrentDictionary<string, RateLimitInfo> _rateLimitStore = new();
    private readonly int _maxRequestsPerMinute;
    private readonly int _maxRequestsPerHour;

    public RateLimitingMiddleware(RequestDelegate next, ILogger<RateLimitingMiddleware> logger, IConfiguration configuration)
    {
        _next = next;
        _logger = logger;
        _maxRequestsPerMinute = int.Parse(configuration["RateLimiting:RequestsPerMinute"] ?? "100");
        _maxRequestsPerHour = int.Parse(configuration["RateLimiting:RequestsPerHour"] ?? "1000");
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var clientId = GetClientIdentifier(context);
        
        if (!await IsRateLimitExceeded(clientId))
        {
            await _next(context);
        }
        else
        {
            _logger.LogWarning("Rate limit exceeded for client {ClientId}", clientId);
            context.Response.StatusCode = 429; // Too Many Requests
            context.Response.ContentType = "application/json";
            
            var response = new
            {
                error = "Rate limit exceeded",
                message = "Too many requests. Please try again later.",
                retryAfter = GetRetryAfterSeconds(clientId)
            };
            
            await context.Response.WriteAsJsonAsync(response);
        }
    }

    private string GetClientIdentifier(HttpContext context)
    {
        // In production, use API key, user ID, or IP address
        var apiKey = context.Request.Headers["X-API-Key"].FirstOrDefault();
        if (!string.IsNullOrEmpty(apiKey))
        {
            return $"api:{apiKey}";
        }

        var userAgent = context.Request.Headers["User-Agent"].FirstOrDefault();
        var ipAddress = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        
        return $"ip:{ipAddress}:{userAgent}";
    }

    private async Task<bool> IsRateLimitExceeded(string clientId)
    {
        var now = DateTime.UtcNow;
        var rateLimitInfo = _rateLimitStore.GetOrAdd(clientId, _ => new RateLimitInfo());

        // Clean up old entries
        rateLimitInfo.Requests.RemoveAll(r => r < now.AddMinutes(-1));
        rateLimitInfo.HourlyRequests.RemoveAll(r => r < now.AddHours(-1));

        // Check minute limit
        if (rateLimitInfo.Requests.Count >= _maxRequestsPerMinute)
        {
            return true;
        }

        // Check hour limit
        if (rateLimitInfo.HourlyRequests.Count >= _maxRequestsPerHour)
        {
            return true;
        }

        // Add current request
        rateLimitInfo.Requests.Add(now);
        rateLimitInfo.HourlyRequests.Add(now);

        return false;
    }

    private int GetRetryAfterSeconds(string clientId)
    {
        if (_rateLimitStore.TryGetValue(clientId, out var rateLimitInfo))
        {
            var oldestRequest = rateLimitInfo.Requests.OrderBy(r => r).FirstOrDefault();
            if (oldestRequest != default)
            {
                var timeUntilReset = 60 - (int)(DateTime.UtcNow - oldestRequest).TotalSeconds;
                return Math.Max(1, timeUntilReset);
            }
        }
        return 60; // Default 1 minute
    }
}

public class RateLimitInfo
{
    public List<DateTime> Requests { get; set; } = new List<DateTime>();
    public List<DateTime> HourlyRequests { get; set; } = new List<DateTime>();
}

public static class RateLimitingMiddlewareExtensions
{
    public static IApplicationBuilder UseRateLimiting(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<RateLimitingMiddleware>();
    }
} 