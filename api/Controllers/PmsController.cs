using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.IO;

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
    public async Task<IActionResult> ProcessPmsFeed(string pmscode, [FromBody] PmsFeedRequest request)
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

            // Try to load and use the generated translator
            var translatedData = await LoadAndUseTranslator(pmscode, request.FeedData);
            
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

    private async Task<string> LoadAndUseTranslator(string pmscode, string feedData)
    {
        try
        {
            // Load mapping configuration
            var mappingPath = Path.Combine("pms", pmscode, "mapping.json");
            var mappings = new Dictionary<string, string>();
            
            if (System.IO.File.Exists(mappingPath))
            {
                var mappingJson = await System.IO.File.ReadAllTextAsync(mappingPath);
                var mappingData = System.Text.Json.JsonSerializer.Deserialize<MappingData>(mappingJson);
                if (mappingData?.Mappings != null)
                {
                    foreach (var mapping in mappingData.Mappings)
                    {
                        mappings[mapping.SourceField] = mapping.TargetField;
                    }
                }
                
                _logger.LogInformation("Loaded {MappingCount} mappings for {PmsCode}", mappings.Count, pmscode);
            }
            else
            {
                _logger.LogWarning("Mapping file not found for {PmsCode}, using fallback translation", pmscode);
                return FallbackTranslation(pmscode, feedData);
            }

            // Apply mappings to the feed data
            var translatedData = ApplyMappings(feedData, mappings, pmscode);
            
            return translatedData;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error loading translator for {PmsCode}, using fallback", pmscode);
            return FallbackTranslation(pmscode, feedData);
        }
    }

    private string ApplyMappings(string feedData, Dictionary<string, string> mappings, string pmscode)
    {
        try
        {
            // Try to parse the feed data as JSON first
            if (feedData.Trim().StartsWith("{"))
            {
                var jsonData = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(feedData);
                if (jsonData == null)
                    throw new Exception("Failed to parse feedData as JSON.");
                var translatedJson = new Dictionary<string, object>();
                
                foreach (var kvp in jsonData)
                {
                    var targetField = mappings.ContainsKey(kvp.Key) ? mappings[kvp.Key] : kvp.Key;
                    translatedJson[targetField] = kvp.Value;
                }
                
                return System.Text.Json.JsonSerializer.Serialize(translatedJson, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
            }
            
            // If not JSON, try XML
            if (feedData.Trim().StartsWith("<"))
            {
                // Simple XML transformation (in a real implementation, you'd use proper XML parsing)
                var translatedXml = feedData;
                foreach (var mapping in mappings)
                {
                    translatedXml = translatedXml.Replace($"<{mapping.Key}>", $"<{mapping.Value}>");
                    translatedXml = translatedXml.Replace($"</{mapping.Key}>", $"</{mapping.Value}>");
                }
                return translatedXml;
            }
            
            // Fallback for plain text
            return $"Translated data for {pmscode}: {feedData}";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error applying mappings for {PmsCode}", pmscode);
            return $"Translated data for {pmscode}: {feedData}";
        }
    }

    private string FallbackTranslation(string pmscode, string feedData)
    {
        // Simple fallback translation
        return $"Translated data for {pmscode}: {feedData}";
    }

    [HttpPost("{pmscode}/test")]
    public async Task<IActionResult> TestTranslation(string pmscode, [FromBody] TestTranslationRequest request)
    {
        _logger.LogInformation("[{Timestamp}] Received test translation request for PMS code: {PmsCode}", 
            DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), pmscode);

        try
        {
            // Use the actual translator for testing
            var testResult = await LoadAndUseTranslator(pmscode, request.TestData);
            
            return Ok(new { 
                success = true, 
                message = testResult,
                timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"),
                pmsCode = pmscode
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

public class MappingData
{
    public string PmsCode { get; set; } = string.Empty;
    public string PmsName { get; set; } = string.Empty;
    public List<Mapping> Mappings { get; set; } = new List<Mapping>();
    public string DeployedAt { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
}

public class Mapping
{
    public string SourceField { get; set; } = string.Empty;
    public string TargetField { get; set; } = string.Empty;
    public double Confidence { get; set; }
} 