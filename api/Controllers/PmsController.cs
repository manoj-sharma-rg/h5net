using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.IO;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PmsController : ControllerBase
{
    private readonly ILogger<PmsController> _logger;
    private readonly Services.SchemaValidationService _schemaValidator;
    private readonly Services.RgbridgeSenderService _rgbridgeSender;
    private readonly Services.TranslatorRegistry _translatorRegistry;

    public PmsController(ILogger<PmsController> logger, Services.SchemaValidationService schemaValidator, Services.RgbridgeSenderService rgbridgeSender, Services.TranslatorRegistry translatorRegistry)
    {
        _logger = logger;
        _schemaValidator = schemaValidator;
        _rgbridgeSender = rgbridgeSender;
        _translatorRegistry = translatorRegistry;
    }

    [HttpPost("{pmscode}")]
    public async Task<IActionResult> ProcessPmsFeed(string pmscode, [FromBody] PmsFeedRequest request)
    {
        _logger.LogInformation("[{Timestamp}] Received PMS feed request for PMS code: {PmsCode}", 
            DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), pmscode);

        var statsPath = Path.Combine("pms", pmscode, "stats.json");
        var stats = Stats.Load(statsPath);

        try
        {
            if (string.IsNullOrWhiteSpace(request.FeedData))
            {
                _logger.LogWarning("[{Timestamp}] Empty PMS feed received for {PmsCode}", 
                    DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), pmscode);
                stats.Errors++;
                stats.Save(statsPath);
                return BadRequest("PMS feed is required in the request body.");
            }

            // Validate PMS code
            if (string.IsNullOrWhiteSpace(pmscode) || !System.Text.RegularExpressions.Regex.IsMatch(pmscode, "^[a-zA-Z0-9_-]+$"))
            {
                _logger.LogWarning("[{Timestamp}] Invalid PMS code received: {PmsCode}", 
                    DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), pmscode);
                stats.Errors++;
                stats.Save(statsPath);
                return BadRequest("Invalid PMS code. Only letters, numbers, dash, and underscore are allowed.");
            }

            // === SCHEMA VALIDATION ===
            var pmsFolder = Path.Combine("pms", pmscode);
            string? validationError = null;
            bool isValid = true;
            if (request.FeedData.TrimStart().StartsWith("{"))
            {
                // JSON: look for schema.json
                var schemaPath = Path.Combine(pmsFolder, "schema.json");
                if (System.IO.File.Exists(schemaPath))
                {
                    var schema = await System.IO.File.ReadAllTextAsync(schemaPath);
                    (isValid, validationError) = _schemaValidator.ValidateJson(request.FeedData, schema);
                }
            }
            else if (request.FeedData.TrimStart().StartsWith("<"))
            {
                // XML: look for schema.xsd
                var xsdPath = Path.Combine(pmsFolder, "schema.xsd");
                if (System.IO.File.Exists(xsdPath))
                {
                    var xsd = await System.IO.File.ReadAllTextAsync(xsdPath);
                    (isValid, validationError) = _schemaValidator.ValidateXml(request.FeedData, xsd!);
                }
            }
            if (!isValid)
            {
                var errorMsg = validationError ?? "Unknown schema validation error";
                _logger.LogWarning("[{Timestamp}] Schema validation failed for {PmsCode}: {Error}", 
                    DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), pmscode, errorMsg);
                stats.Errors++;
                stats.Save(statsPath);
                return BadRequest($"Schema validation failed: {errorMsg}");
            }
            // === END SCHEMA VALIDATION ===

            // Try to load and use the generated translator
            var translatedData = await LoadAndUseTranslator(pmscode, request.FeedData);

            // === OUTBOUND RGBridge DELIVERY ===
            string deliveryStatus = null;
            if (translatedData.TrimStart().StartsWith("<"))
            {
                var (success, response, error) = await _rgbridgeSender.SendXmlAsync(translatedData);
                if (success)
                {
                    deliveryStatus = $"RGBridge delivery successful: {response}";
                }
                else
                {
                    deliveryStatus = $"RGBridge delivery failed: {error}";
                    _logger.LogWarning("RGBridge delivery failed for {PmsCode}: {Error}", pmscode, error);
                }
            }
            // === END OUTBOUND RGBridge DELIVERY ===

            _logger.LogInformation("[{Timestamp}] Successfully processed PMS feed for {PmsCode}", 
                DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), pmscode);

            stats.RecordsProcessed++;
            stats.LastSync = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss.fff");
            stats.Save(statsPath);

            return Ok(new { translatedData, deliveryStatus });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[{Timestamp}] Error processing PMS feed for {PmsCode}: {ErrorMessage}", 
                DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), pmscode, ex.Message);
            stats.Errors++;
            stats.Save(statsPath);
            return Problem($"Error processing PMS feed: {ex.Message}");
        }
    }

    private async Task<string> LoadAndUseTranslator(string pmscode, string feedData)
    {
        // Try plugin auto-discovery first
        var plugin = _translatorRegistry.GetTranslator(pmscode);
        if (plugin != null)
        {
            _logger.LogInformation("Using plugin translator for PMS code: {PmsCode}", pmscode);
            return await plugin.TranslateToRgbridgeAsync(feedData);
        }
        // Fallback to mapping logic
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
                        if (mapping?.SourceField != null && mapping?.TargetField != null)
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

    [HttpGet("integrated")]
    public IActionResult GetIntegratedPmsList()
    {
        var pmsRoot = Path.Combine("pms");
        var result = new List<object>();
        if (Directory.Exists(pmsRoot))
        {
            foreach (var dir in Directory.GetDirectories(pmsRoot))
            {
                var manifestPath = Path.Combine(dir, "manifest.json");
                var statsPath = Path.Combine(dir, "stats.json");
                int recordsProcessed = 0;
                int errors = 0;
                string? lastSync = null;
                if (System.IO.File.Exists(statsPath))
                {
                    try
                    {
                        var stats = System.Text.Json.JsonSerializer.Deserialize<Stats>(System.IO.File.ReadAllText(statsPath));
                        if (stats != null)
                        {
                            recordsProcessed = stats.RecordsProcessed;
                            errors = stats.Errors;
                            lastSync = stats.LastSync;
                        }
                    }
                    catch { }
                }
                if (System.IO.File.Exists(manifestPath))
                {
                    try
                    {
                        var manifestJson = System.IO.File.ReadAllText(manifestPath);
                        var manifest = System.Text.Json.JsonSerializer.Deserialize<IntegratedPmsManifest>(manifestJson);
                        if (manifest != null)
                        {
                            result.Add(new
                            {
                                code = manifest.pmsCode,
                                name = manifest.pmsName,
                                status = manifest.status,
                                lastSync = lastSync ?? manifest.deployedAt,
                                recordsProcessed = recordsProcessed,
                                errors = errors,
                                version = manifest.version
                            });
                        }
                    }
                    catch { /* skip invalid manifests */ }
                }
            }
        }
        return Ok(result);
    }

    public class IntegratedPmsManifest
    {
        public string pmsCode { get; set; } = string.Empty;
        public string pmsName { get; set; } = string.Empty;
        public string status { get; set; } = string.Empty;
        public string deployedAt { get; set; } = string.Empty;
        public int mappingsCount { get; set; }
        public string endpoint { get; set; } = string.Empty;
        public string version { get; set; } = string.Empty;
    }

    public class Stats
    {
        public int RecordsProcessed { get; set; } = 0;
        public int Errors { get; set; } = 0;
        public string? LastSync { get; set; } = null;

        public static Stats Load(string path)
        {
            if (System.IO.File.Exists(path))
            {
                try
                {
                    return System.Text.Json.JsonSerializer.Deserialize<Stats>(System.IO.File.ReadAllText(path)) ?? new Stats();
                }
                catch { return new Stats(); }
            }
            return new Stats();
        }
        public void Save(string path)
        {
            System.IO.File.WriteAllText(path, System.Text.Json.JsonSerializer.Serialize(this, new System.Text.Json.JsonSerializerOptions { WriteIndented = true }));
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