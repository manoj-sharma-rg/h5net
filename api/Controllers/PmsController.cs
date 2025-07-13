using Microsoft.AspNetCore.Mvc;
using System.Text;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PmsController : ControllerBase
{
    private readonly ILogger<PmsController> _logger;

    public PmsController(ILogger<PmsController> logger)
    {
        _logger = logger;
    }

    [HttpPost("{pmscode}")]
    public IActionResult ProcessPmsFeed(string pmscode, [FromBody] PmsFeedRequest request)
    {
        _logger.LogInformation("[{Timestamp}] Received PMS feed request for PMS code: {PmsCode}", 
            DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), pmscode);

        try
        {
            if (string.IsNullOrWhiteSpace(request.FeedData))
            {
                _logger.LogWarning("[{Timestamp}] Empty PMS feed received for {PmsCode}", 
                    DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), pmscode);
                return BadRequest("PMS feed is required in the request body.");
            }

            // Validate PMS code
            if (string.IsNullOrWhiteSpace(pmscode) || !System.Text.RegularExpressions.Regex.IsMatch(pmscode, "^[a-zA-Z0-9_-]+$"))
            {
                _logger.LogWarning("[{Timestamp}] Invalid PMS code received: {PmsCode}", 
                    DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), pmscode);
                return BadRequest("Invalid PMS code. Only letters, numbers, dash, and underscore are allowed.");
            }

            // Mock translation for now
            var translatedData = $"Translated data for {pmscode}: {request.FeedData}";
            
            _logger.LogInformation("[{Timestamp}] Successfully processed PMS feed for {PmsCode}", 
                DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), pmscode);

            return Ok(new { translatedData });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[{Timestamp}] Error processing PMS feed for {PmsCode}: {ErrorMessage}", 
                DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), pmscode, ex.Message);
            return Problem($"Error processing PMS feed: {ex.Message}");
        }
    }

    [HttpPost("{pmscode}/test")]
    public IActionResult TestTranslation(string pmscode, [FromBody] TestTranslationRequest request)
    {
        _logger.LogInformation("[{Timestamp}] Received test translation request for PMS code: {PmsCode}", 
            DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), pmscode);

        try
        {
            // Mock test translation
            var testResult = $"Test translation successful for {pmscode}. Sample data: {request.TestData}";
            
            return Ok(new { 
                success = true, 
                message = testResult,
                timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff")
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[{Timestamp}] Error during test translation for {PmsCode}: {ErrorMessage}", 
                DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), pmscode, ex.Message);
            return Problem($"Error during test translation: {ex.Message}");
        }
    }
}

public class PmsFeedRequest
{
    public string FeedData { get; set; } = string.Empty;
}

public class TestTranslationRequest
{
    public string TestData { get; set; } = string.Empty;
} 