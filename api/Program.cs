using System.Reflection;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// TODO: Add plugin system, mapping loader, AI integration, authentication, etc.
builder.Services.AddOpenApi();

// Add CORS to allow frontend communication
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Enable CORS
app.UseCors();

// Helper to auto-discover translators
static IPmsTranslator? GetTranslator(string pmscode)
{
    var translatorType = Assembly.GetExecutingAssembly()
        .GetTypes()
        .FirstOrDefault(t => typeof(IPmsTranslator).IsAssignableFrom(t) && !t.IsInterface && !t.IsAbstract &&
            string.Equals((string?)t.GetProperty("PmsCode")?.GetValue(Activator.CreateInstance(t)), pmscode, StringComparison.OrdinalIgnoreCase));
    return translatorType != null ? (IPmsTranslator?)Activator.CreateInstance(translatorType) : null;
}

// Placeholder PMS API endpoint
app.MapPost("/pms/{pmscode}", async (string pmscode, HttpRequest request, ILogger<Program> logger) =>
{
    logger.LogInformation("[{Timestamp}] Received PMS feed request for PMS code: {PmsCode}", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), pmscode);
    
    try
    {
        // Read PMS feed from body
        string pmsFeed;
        using (var reader = new StreamReader(request.Body, Encoding.UTF8))
        {
            pmsFeed = await reader.ReadToEndAsync();
        }
        
        logger.LogInformation("[{Timestamp}] Read PMS feed for {PmsCode}, length: {FeedLength} characters", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), pmscode, pmsFeed?.Length ?? 0);
        
        if (string.IsNullOrWhiteSpace(pmsFeed))
        {
            logger.LogWarning("[{Timestamp}] Empty PMS feed received for {PmsCode}", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), pmscode);
            return Results.BadRequest("PMS feed is required in the request body.");
        }
        
        // Validate PMS code
        if (string.IsNullOrWhiteSpace(pmscode) || !System.Text.RegularExpressions.Regex.IsMatch(pmscode, "^[a-zA-Z0-9_-]+$"))
        {
            logger.LogWarning("[{Timestamp}] Invalid PMS code received: {PmsCode}", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), pmscode);
            return Results.BadRequest("Invalid PMS code. Only letters, numbers, dash, and underscore are allowed.");
        }
        
        // Auto-discover and load the correct translator
        logger.LogInformation("[{Timestamp}] Attempting to load translator for PMS code: {PmsCode}", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), pmscode);
        var translator = GetTranslator(pmscode);
        if (translator == null)
        {
            logger.LogError("[{Timestamp}] No translator found for PMS code: {PmsCode}", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), pmscode);
            return Results.NotFound($"No translator found for PMS code: {pmscode}");
        }
        
        logger.LogInformation("[{Timestamp}] Successfully loaded translator for {PmsCode}: {TranslatorType}", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), pmscode, translator.GetType().Name);
        
        // Use the translator to process the feed
        logger.LogInformation("[{Timestamp}] Translating PMS feed to RGBridge format for {PmsCode}", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), pmscode);
        var rgbridgeMessage = await translator.TranslateToRgbridgeAsync(pmsFeed);
        
        logger.LogInformation("[{Timestamp}] Successfully translated PMS feed for {PmsCode}, response length: {ResponseLength} characters", 
            DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), pmscode, rgbridgeMessage?.Length ?? 0);
        
        // Return the translated message
        return Results.Text(rgbridgeMessage, "application/xml");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "[{Timestamp}] Error processing PMS feed for {PmsCode}: {ErrorMessage}", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), pmscode, ex.Message);
        return Results.Problem($"Error processing PMS feed: {ex.Message}");
    }
})
.WithName("PmsMessageIntake");

app.MapPost("/mappings/{pmscode}", async (string pmscode, HttpRequest request, ILogger<Program> logger) =>
{
    logger.LogInformation("[{Timestamp}] Received PMS mapping onboarding request for PMS code: {PmsCode}", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), pmscode);
    
    try
    {
        // Read PMS name from header (optional)
        string pmsName = request.Headers["X-PMS-Name"].FirstOrDefault() ?? "";
        logger.LogInformation("[{Timestamp}] PMS name from header: {PmsName}", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), pmsName);

        // Read PMS spec from body
        string pmsSpec;
        using (var reader = new StreamReader(request.Body, Encoding.UTF8))
        {
            pmsSpec = await reader.ReadToEndAsync();
        }
        
        logger.LogInformation("[{Timestamp}] Read PMS spec for {PmsCode}, length: {SpecLength} characters", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), pmscode, pmsSpec?.Length ?? 0);
        
        if (string.IsNullOrWhiteSpace(pmsSpec))
        {
            logger.LogWarning("[{Timestamp}] Empty PMS spec received for {PmsCode}", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), pmscode);
            return Results.BadRequest("PMS spec is required in the request body.");
        }
        
        // Validate PMS code (alphanumeric, dash, underscore)
        if (string.IsNullOrWhiteSpace(pmscode) || !System.Text.RegularExpressions.Regex.IsMatch(pmscode, "^[a-zA-Z0-9_-]+$"))
        {
            logger.LogWarning("[{Timestamp}] Invalid PMS code received: {PmsCode}", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), pmscode);
            return Results.BadRequest("Invalid PMS code. Only letters, numbers, dash, and underscore are allowed.");
        }
        
        // Create folder under ../pms/{pmscode}
        var pmsFolder = Path.Combine("..", "pms", pmscode);
        logger.LogInformation("[{Timestamp}] Creating PMS folder: {PmsFolder}", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), pmsFolder);
        Directory.CreateDirectory(pmsFolder);
        logger.LogInformation("[{Timestamp}] Successfully created PMS folder: {PmsFolder}", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), pmsFolder);
        
        // Save PMS spec
        var specPath = Path.Combine(pmsFolder, "spec.txt");
        logger.LogInformation("[{Timestamp}] Saving PMS spec to: {SpecPath}", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), specPath);
        await File.WriteAllTextAsync(specPath, pmsSpec, Encoding.UTF8);
        logger.LogInformation("[{Timestamp}] Successfully saved PMS spec to: {SpecPath}", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), specPath);
        
        // Save PMS name as metadata (optional)
        if (!string.IsNullOrWhiteSpace(pmsName))
        {
            var metaPath = Path.Combine(pmsFolder, "meta.txt");
            logger.LogInformation("[{Timestamp}] Saving PMS metadata to: {MetaPath}", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), metaPath);
            await File.WriteAllTextAsync(metaPath, pmsName, Encoding.UTF8);
            logger.LogInformation("[{Timestamp}] Successfully saved PMS metadata to: {MetaPath}", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), metaPath);
        }
        
        // Return a mock mapping suggestion (in real use, call AI or mapping logic)
        var mockMapping = new
        {
            pmsCode = pmscode,
            pmsName = pmsName,
            mappings = new[]
            {
                new { pmsField = "roomType", rgbridgeField = "InvCode", confidence = 0.95 },
                new { pmsField = "ratePlan", rgbridgeField = "RatePlanCode", confidence = 0.92 },
                new { pmsField = "startDate", rgbridgeField = "Start", confidence = 0.90 },
                new { pmsField = "endDate", rgbridgeField = "End", confidence = 0.90 }
            },
            message = $"Mock mapping suggestion for {pmscode}"
        };
        
        logger.LogInformation("[{Timestamp}] Successfully processed PMS mapping onboarding for {PmsCode}, returning {MappingCount} mapping suggestions", 
            DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), pmscode, mockMapping.mappings.Length);
        
        return Results.Json(mockMapping);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "[{Timestamp}] Error processing PMS mapping onboarding for {PmsCode}: {ErrorMessage}", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), pmscode, ex.Message);
        return Results.Problem($"Error processing PMS mapping onboarding: {ex.Message}");
    }
}).WithName("PmsMappingOnboarding");

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
