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

// Placeholder PMS API endpoint
app.MapPost("/pms/{pmscode}", async (string pmscode, HttpRequest request) =>
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
        return Results.Ok($"PMS spec saved for {pmscode}. Folder: {pmsFolder}");
    }
    catch (Exception ex)
    {
        return Results.Problem($"Error processing PMS integration: {ex.Message}");
    }
})
.WithName("PmsMessageIntake");

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
