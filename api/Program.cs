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
app.MapPost("/pms/{pmscode}", (string pmscode, HttpRequest request) =>
{
    // TODO: Authenticate request
    // TODO: Load PMS-specific plugin/translator
    // TODO: Validate incoming message (schema)
    // TODO: Map/translate to RGBridge format (use mapping knowledge base)
    // TODO: Call AI service for mapping suggestions if needed
    // TODO: Send RGBridge message to internal API
    // TODO: Log and handle errors
    return Results.Ok($"Received message for PMS: {pmscode}");
})
.WithName("PmsMessageIntake");

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
