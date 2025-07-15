using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using api.Services;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AiIntegrationController : ControllerBase
{
    private readonly AiIntegrationService _aiService;
    private readonly ILogger<AiIntegrationController> _logger;

    public AiIntegrationController(AiIntegrationService aiService, ILogger<AiIntegrationController> logger)
    {
        _aiService = aiService;
        _logger = logger;
    }

    [HttpPost("suggest-mapping")]
    public async Task<IActionResult> SuggestMapping([FromBody] MappingSuggestionRequest request)
    {
        var suggestions = await _aiService.GetMappingSuggestionsAsync(request.PmsSpec, request.FieldNames);
        return Ok(new { suggestions });
    }

    [HttpPost("generate-code")]
    public async Task<IActionResult> GenerateCode([FromBody] CodeGenerationRequest request)
    {
        var code = await _aiService.GenerateTranslatorCodeAsync(request.PmsSpec, request.PmsCode);
        return Ok(new { code });
    }

    [HttpPost("generate-test-cases")]
    public async Task<IActionResult> GenerateTestCases([FromBody] TestCaseGenerationRequest request)
    {
        var testCases = await _aiService.GenerateTestCasesAsync(request.PmsSpec, request.Mappings);
        return Ok(new { testCases });
    }
}

public class MappingSuggestionRequest
{
    public string PmsSpec { get; set; } = string.Empty;
    public string[] FieldNames { get; set; } = System.Array.Empty<string>();
}

public class CodeGenerationRequest
{
    public string PmsSpec { get; set; } = string.Empty;
    public string PmsCode { get; set; } = string.Empty;
}

public class TestCaseGenerationRequest
{
    public string PmsSpec { get; set; } = string.Empty;
    public object Mappings { get; set; } = null!;
} 