using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MappingController : ControllerBase
{
    private readonly ILogger<MappingController> _logger;

    public MappingController(ILogger<MappingController> logger)
    {
        _logger = logger;
    }

    [HttpPost("{pmscode}")]
    public async Task<IActionResult> CreateMapping(string pmscode, [FromBody] MappingRequest request)
    {
        _logger.LogInformation("[{Timestamp}] Received PMS mapping onboarding request for PMS code: {PmsCode}", 
            DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), pmscode);

        try
        {
            if (string.IsNullOrWhiteSpace(request.PmsSpec))
            {
                _logger.LogWarning("[{Timestamp}] Empty PMS spec received for {PmsCode}", 
                    DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), pmscode);
                return BadRequest("PMS spec is required in the request body.");
            }

            // Validate PMS code
            if (string.IsNullOrWhiteSpace(pmscode) || !System.Text.RegularExpressions.Regex.IsMatch(pmscode, "^[a-zA-Z0-9_-]+$"))
            {
                _logger.LogWarning("[{Timestamp}] Invalid PMS code received: {PmsCode}", 
                    DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), pmscode);
                return BadRequest("Invalid PMS code. Only letters, numbers, dash, and underscore are allowed.");
            }

            // Create folder under ../pms/{pmscode}
            var pmsFolder = System.IO.Path.Combine("..", "pms", pmscode);
            _logger.LogInformation("[{Timestamp}] Creating PMS folder: {PmsFolder}", 
                DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), pmsFolder);
            Directory.CreateDirectory(pmsFolder);

            // Save PMS spec
            var specPath = System.IO.Path.Combine(pmsFolder, "spec.txt");
            await System.IO.File.WriteAllTextAsync(specPath, request.PmsSpec, Encoding.UTF8);

            // Save PMS name as metadata (optional)
            if (!string.IsNullOrWhiteSpace(request.PmsName))
            {
                var metaPath = System.IO.Path.Combine(pmsFolder, "meta.txt");
                await System.IO.File.WriteAllTextAsync(metaPath, request.PmsName, Encoding.UTF8);
            }

            // Return mock mapping suggestions
            var mockMapping = new
            {
                pmsCode = pmscode,
                pmsName = request.PmsName,
                mappings = new[]
                {
                    new { pmsField = "roomType", rgbridgeField = "InvCode", confidence = 0.95 },
                    new { pmsField = "ratePlan", rgbridgeField = "RatePlanCode", confidence = 0.92 },
                    new { pmsField = "startDate", rgbridgeField = "Start", confidence = 0.90 },
                    new { pmsField = "endDate", rgbridgeField = "End", confidence = 0.90 }
                },
                message = $"Mock mapping suggestion for {pmscode}"
            };

            _logger.LogInformation("[{Timestamp}] Successfully processed PMS mapping onboarding for {PmsCode}", 
                DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), pmscode);

            return Ok(mockMapping);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[{Timestamp}] Error processing PMS mapping onboarding for {PmsCode}: {ErrorMessage}", 
                DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), pmscode, ex.Message);
            return Problem($"Error processing PMS mapping onboarding: {ex.Message}");
        }
    }

    [HttpPost("ai-suggestions")]
    public IActionResult GenerateAiSuggestions([FromBody] AiSuggestionsRequest request)
    {
        _logger.LogInformation("[{Timestamp}] Received AI suggestions request", 
            DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"));

        try
        {
            _logger.LogInformation("[{Timestamp}] Generating AI suggestions for PMS: {PmsCode}, Unmapped fields: {FieldCount}", 
                DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), request.PmsCode, request.UnmappedFields.Length);

            // Generate AI suggestions based on PMS spec and field names
            var suggestions = new Dictionary<string, string[]>();

            foreach (var field in request.UnmappedFields)
            {
                var fieldSuggestions = GenerateFieldSuggestions(field, request.PmsSpec);
                suggestions[field] = fieldSuggestions;
            }

            _logger.LogInformation("[{Timestamp}] Generated {SuggestionCount} AI suggestions", 
                DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), suggestions.Count);

            return Ok(new { suggestions });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[{Timestamp}] Error generating AI suggestions: {ErrorMessage}", 
                DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), ex.Message);
            return Problem($"Error generating AI suggestions: {ex.Message}");
        }
    }

    private static string[] GenerateFieldSuggestions(string fieldName, string pmsSpec)
    {
        var suggestions = new List<string>();
        
        // Analyze field name and generate contextual suggestions
        var fieldLower = fieldName.ToLower();
        
        if (fieldLower.Contains("guest") || fieldLower.Contains("customer") || fieldLower.Contains("client"))
        {
            suggestions.AddRange(new[] { "GuestName", "CustomerName", "ClientName", "ReservationName", "PrimaryGuest" });
        }
        else if (fieldLower.Contains("checkin") || fieldLower.Contains("arrival"))
        {
            suggestions.AddRange(new[] { "CheckInTime", "ArrivalTime", "CheckInDateTime", "ArrivalDateTime", "CheckInDate" });
        }
        else if (fieldLower.Contains("checkout") || fieldLower.Contains("departure"))
        {
            suggestions.AddRange(new[] { "CheckOutTime", "DepartureTime", "CheckOutDateTime", "DepartureDateTime", "CheckOutDate" });
        }
        else if (fieldLower.Contains("room"))
        {
            suggestions.AddRange(new[] { "RoomNumber", "RoomId", "RoomCode", "AccommodationNumber", "RoomType" });
        }
        else if (fieldLower.Contains("amount") || fieldLower.Contains("price") || fieldLower.Contains("cost"))
        {
            suggestions.AddRange(new[] { "TotalAmount", "TotalPrice", "TotalCost", "Amount", "Price" });
        }
        else if (fieldLower.Contains("payment"))
        {
            suggestions.AddRange(new[] { "PaymentMethod", "PaymentType", "PaymentMode", "PaymentOption", "PaymentStatus" });
        }
        else if (fieldLower.Contains("request") || fieldLower.Contains("note") || fieldLower.Contains("comment"))
        {
            suggestions.AddRange(new[] { "SpecialRequests", "SpecialRequirements", "Notes", "Comments", "Remarks" });
        }
        else if (fieldLower.Contains("loyalty") || fieldLower.Contains("point") || fieldLower.Contains("reward"))
        {
            suggestions.AddRange(new[] { "LoyaltyPoints", "RewardPoints", "Points", "LoyaltyBalance", "RewardBalance" });
        }
        else
        {
            // Generic suggestions based on common patterns
            suggestions.AddRange(new[] { 
                $"{char.ToUpper(fieldName[0]) + fieldName.Substring(1)}", 
                $"{fieldName.ToUpper()}", 
                $"{fieldName}Field",
                $"{fieldName}Value"
            });
        }
        
        // Analyze PMS spec for additional context
        if (!string.IsNullOrEmpty(pmsSpec))
        {
            var specLower = pmsSpec.ToLower();
            
            // Look for similar field patterns in the spec
            if (specLower.Contains("guest") && !suggestions.Contains("GuestName"))
                suggestions.Add("GuestName");
            if (specLower.Contains("room") && !suggestions.Contains("RoomNumber"))
                suggestions.Add("RoomNumber");
            if (specLower.Contains("payment") && !suggestions.Contains("PaymentMethod"))
                suggestions.Add("PaymentMethod");
        }
        
        return suggestions.Take(5).ToArray(); // Limit to 5 suggestions
    }

    [HttpGet]
    public IActionResult ListAllIntegrations()
    {
        var pmsRoot = Path.Combine("..", "pms");
        var result = new List<object>();
        if (Directory.Exists(pmsRoot))
        {
            foreach (var dir in Directory.GetDirectories(pmsRoot))
            {
                var manifestPath = Path.Combine(dir, "manifest.json");
                if (System.IO.File.Exists(manifestPath))
                {
                    try
                    {
                        var manifestJson = System.IO.File.ReadAllText(manifestPath);
                        var manifest = System.Text.Json.JsonSerializer.Deserialize<PmsManifest>(manifestJson);
                        if (manifest != null)
                        {
                            result.Add(manifest);
                        }
                    }
                    catch { /* skip invalid manifests */ }
                }
            }
        }
        return Ok(result);
    }

    [HttpGet("{pmscode}")]
    public IActionResult GetIntegration(string pmscode)
    {
        var manifestPath = Path.Combine("..", "pms", pmscode, "manifest.json");
        if (!System.IO.File.Exists(manifestPath))
            return NotFound($"PMS integration '{pmscode}' not found.");
        try
        {
            var manifestJson = System.IO.File.ReadAllText(manifestPath);
            var manifest = System.Text.Json.JsonSerializer.Deserialize<PmsManifest>(manifestJson);
            return Ok(manifest);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading manifest for {PmsCode}", pmscode);
            return Problem($"Error reading manifest: {ex.Message}");
        }
    }

    [HttpPut("{pmscode}")]
    public IActionResult UpdateIntegration(string pmscode, [FromBody] PmsManifest updated)
    {
        var manifestPath = Path.Combine("..", "pms", pmscode, "manifest.json");
        if (!System.IO.File.Exists(manifestPath))
            return NotFound($"PMS integration '{pmscode}' not found.");
        try
        {
            var manifestJson = System.Text.Json.JsonSerializer.Serialize(updated, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
            System.IO.File.WriteAllText(manifestPath, manifestJson);
            _logger.LogInformation("Updated manifest for {PmsCode}", pmscode);
            return Ok(updated);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating manifest for {PmsCode}", pmscode);
            return Problem($"Error updating manifest: {ex.Message}");
        }
    }

    [HttpDelete("{pmscode}")]
    public IActionResult DeleteIntegration(string pmscode)
    {
        var pmsDir = Path.Combine("..", "pms", pmscode);
        if (!Directory.Exists(pmsDir))
            return NotFound($"PMS integration '{pmscode}' not found.");
        try
        {
            Directory.Delete(pmsDir, true);
            _logger.LogInformation("Deleted PMS integration folder for {PmsCode}", pmscode);
            return Ok(new { success = true, message = $"PMS integration '{pmscode}' deleted." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting PMS integration {PmsCode}", pmscode);
            return Problem($"Error deleting PMS integration: {ex.Message}");
        }
    }

    public class PmsManifest
    {
        public string deploymentId { get; set; } = string.Empty;
        public string pmsCode { get; set; } = string.Empty;
        public string pmsName { get; set; } = string.Empty;
        public string status { get; set; } = string.Empty;
        public string deployedAt { get; set; } = string.Empty;
        public int mappingsCount { get; set; }
        public string endpoint { get; set; } = string.Empty;
        public string version { get; set; } = string.Empty;
    }
}

public class MappingRequest
{
    public string PmsSpec { get; set; } = string.Empty;
    public string PmsName { get; set; } = string.Empty;
}

public class AiSuggestionsRequest
{
    public string PmsCode { get; set; } = string.Empty;
    public string PmsSpec { get; set; } = string.Empty;
    public string[] UnmappedFields { get; set; } = Array.Empty<string>();
} 