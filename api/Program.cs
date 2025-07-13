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
    logger.LogInformation("Received PMS feed request for PMS code: {PmsCode}", pmscode);
    
    try
    {
        // Read PMS feed from body
        string pmsFeed;
        using (var reader = new StreamReader(request.Body, Encoding.UTF8))
        {
            pmsFeed = await reader.ReadToEndAsync();
        }
        
        logger.LogInformation("Read PMS feed for {PmsCode}, length: {FeedLength} characters", pmscode, pmsFeed?.Length ?? 0);
        
        if (string.IsNullOrWhiteSpace(pmsFeed))
        {
            logger.LogWarning("Empty PMS feed received for {PmsCode}", pmscode);
            return Results.BadRequest("PMS feed is required in the request body.");
        }
        
        // Validate PMS code
        if (string.IsNullOrWhiteSpace(pmscode) || !System.Text.RegularExpressions.Regex.IsMatch(pmscode, "^[a-zA-Z0-9_-]+$"))
        {
            logger.LogWarning("Invalid PMS code received: {PmsCode}", pmscode);
            return Results.BadRequest("Invalid PMS code. Only letters, numbers, dash, and underscore are allowed.");
        }
        
        // Auto-discover and load the correct translator
        logger.LogInformation("Attempting to load translator for PMS code: {PmsCode}", pmscode);
        var translator = GetTranslator(pmscode);
        if (translator == null)
        {
            logger.LogError("No translator found for PMS code: {PmsCode}", pmscode);
            return Results.NotFound($"No translator found for PMS code: {pmscode}");
        }
        
        logger.LogInformation("Successfully loaded translator for {PmsCode}: {TranslatorType}", pmscode, translator.GetType().Name);
        
        // Use the translator to process the feed
        logger.LogInformation("Translating PMS feed to RGBridge format for {PmsCode}", pmscode);
        var rgbridgeMessage = await translator.TranslateToRgbridgeAsync(pmsFeed);
        
        logger.LogInformation("Successfully translated PMS feed for {PmsCode}, response length: {ResponseLength} characters", 
            pmscode, rgbridgeMessage?.Length ?? 0);
        
        // Return the translated message
        return Results.Text(rgbridgeMessage, "application/xml");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Error processing PMS feed for {PmsCode}: {ErrorMessage}", pmscode, ex.Message);
        return Results.Problem($"Error processing PMS feed: {ex.Message}");
    }
})
.WithName("PmsMessageIntake");

app.MapPost("/mappings/{pmscode}", async (string pmscode, HttpRequest request, ILogger<Program> logger) =>
{
    logger.LogInformation("Received PMS mapping onboarding request for PMS code: {PmsCode}", pmscode);
    
    try
    {
        // Read PMS name from header (optional)
        string pmsName = request.Headers["X-PMS-Name"].FirstOrDefault() ?? "";
        logger.LogInformation("PMS name from header: {PmsName}", pmsName);

        // Read PMS spec from body
        string pmsSpec;
        using (var reader = new StreamReader(request.Body, Encoding.UTF8))
        {
            pmsSpec = await reader.ReadToEndAsync();
        }
        
        logger.LogInformation("Read PMS spec for {PmsCode}, length: {SpecLength} characters", pmscode, pmsSpec?.Length ?? 0);
        
        if (string.IsNullOrWhiteSpace(pmsSpec))
        {
            logger.LogWarning("Empty PMS spec received for {PmsCode}", pmscode);
            return Results.BadRequest("PMS spec is required in the request body.");
        }
        
        // Validate PMS code (alphanumeric, dash, underscore)
        if (string.IsNullOrWhiteSpace(pmscode) || !System.Text.RegularExpressions.Regex.IsMatch(pmscode, "^[a-zA-Z0-9_-]+$"))
        {
            logger.LogWarning("Invalid PMS code received: {PmsCode}", pmscode);
            return Results.BadRequest("Invalid PMS code. Only letters, numbers, dash, and underscore are allowed.");
        }
        
        // Create folder under ../pms/{pmscode}
        var pmsFolder = Path.Combine("..", "pms", pmscode);
        logger.LogInformation("Creating PMS folder: {PmsFolder}", pmsFolder);
        Directory.CreateDirectory(pmsFolder);
        logger.LogInformation("Successfully created PMS folder: {PmsFolder}", pmsFolder);
        
        // Save PMS spec
        var specPath = Path.Combine(pmsFolder, "spec.txt");
        logger.LogInformation("Saving PMS spec to: {SpecPath}", specPath);
        await File.WriteAllTextAsync(specPath, pmsSpec, Encoding.UTF8);
        logger.LogInformation("Successfully saved PMS spec to: {SpecPath}", specPath);
        
        // Save PMS name as metadata (optional)
        if (!string.IsNullOrWhiteSpace(pmsName))
        {
            var metaPath = Path.Combine(pmsFolder, "meta.txt");
            logger.LogInformation("Saving PMS metadata to: {MetaPath}", metaPath);
            await File.WriteAllTextAsync(metaPath, pmsName, Encoding.UTF8);
            logger.LogInformation("Successfully saved PMS metadata to: {MetaPath}", metaPath);
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
        
        logger.LogInformation("Successfully processed PMS mapping onboarding for {PmsCode}, returning {MappingCount} mapping suggestions", 
            pmscode, mockMapping.mappings.Length);
        
        return Results.Json(mockMapping);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Error processing PMS mapping onboarding for {PmsCode}: {ErrorMessage}", pmscode, ex.Message);
        return Results.Problem($"Error processing PMS mapping onboarding: {ex.Message}");
    }
}).WithName("PmsMappingOnboarding");

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
