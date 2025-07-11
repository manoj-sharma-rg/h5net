var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// TODO: Add plugin system, mapping loader, AI integration, authentication, etc.
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

using System.Reflection;

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
app.MapPost("/pms/{pmscode}", async (string pmscode, HttpRequest request) =>
{
    try
    {
        // Read PMS feed from body
        string pmsFeed;
        using (var reader = new StreamReader(request.Body, Encoding.UTF8))
        {
            pmsFeed = await reader.ReadToEndAsync();
        }
        if (string.IsNullOrWhiteSpace(pmsFeed))
        {
            return Results.BadRequest("PMS feed is required in the request body.");
        }
        // Validate PMS code
        if (string.IsNullOrWhiteSpace(pmscode) || !System.Text.RegularExpressions.Regex.IsMatch(pmscode, "^[a-zA-Z0-9_-]+$"))
        {
            return Results.BadRequest("Invalid PMS code. Only letters, numbers, dash, and underscore are allowed.");
        }
        // Auto-discover and load the correct translator
        var translator = GetTranslator(pmscode);
        if (translator == null)
        {
            return Results.NotFound($"No translator found for PMS code: {pmscode}");
        }
        // Use the translator to process the feed
        var rgbridgeMessage = await translator.TranslateToRgbridgeAsync(pmsFeed);
        // Return the translated message
        return Results.Text(rgbridgeMessage, "application/xml");
    }
    catch (Exception ex)
    {
        return Results.Problem($"Error processing PMS feed: {ex.Message}");
    }
})
.WithName("PmsMessageIntake");

app.MapPost("/mappings/{pmscode}", async (string pmscode, HttpRequest request) =>
{
    try
    {
        // Read PMS name from header (optional)
        string pmsName = request.Headers["X-PMS-Name"].FirstOrDefault() ?? "";

        // Read PMS spec from body
        string pmsSpec;
        using (var reader = new StreamReader(request.Body, Encoding.UTF8))
        {
            pmsSpec = await reader.ReadToEndAsync();
        }
        if (string.IsNullOrWhiteSpace(pmsSpec))
        {
            return Results.BadRequest("PMS spec is required in the request body.");
        }
        // Validate PMS code (alphanumeric, dash, underscore)
        if (string.IsNullOrWhiteSpace(pmscode) || !System.Text.RegularExpressions.Regex.IsMatch(pmscode, "^[a-zA-Z0-9_-]+$"))
        {
            return Results.BadRequest("Invalid PMS code. Only letters, numbers, dash, and underscore are allowed.");
        }
        // Create folder under ../pms/{pmscode}
        var pmsFolder = Path.Combine("..", "pms", pmscode);
        Directory.CreateDirectory(pmsFolder);
        // Save PMS spec
        var specPath = Path.Combine(pmsFolder, "spec.txt");
        await File.WriteAllTextAsync(specPath, pmsSpec, Encoding.UTF8);
        // Save PMS name as metadata (optional)
        if (!string.IsNullOrWhiteSpace(pmsName))
        {
            var metaPath = Path.Combine(pmsFolder, "meta.txt");
            await File.WriteAllTextAsync(metaPath, pmsName, Encoding.UTF8);
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
        return Results.Json(mockMapping);
    }
    catch (Exception ex)
    {
        return Results.Problem($"Error processing PMS mapping onboarding: {ex.Message}");
    }
}).WithName("PmsMappingOnboarding");

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
