using System.Reflection;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// TODO: Add plugin system, mapping loader, AI integration, authentication, etc.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

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
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Enable CORS
app.UseCors();

// Use controllers
app.MapControllers();

// Helper to auto-discover translators (commented out until plugin system is implemented)
// static IPmsTranslator? GetTranslator(string pmscode)
// {
//     var translatorType = Assembly.GetExecutingAssembly()
//         .GetTypes()
//         .FirstOrDefault(t => typeof(IPmsTranslator).IsAssignableFrom(t) && !t.IsInterface && !t.IsAbstract &&
//             string.Equals((string?)t.GetProperty("PmsCode")?.GetValue(Activator.CreateInstance(t)), pmscode, StringComparison.OrdinalIgnoreCase));
//     return translatorType != null ? (IPmsTranslator?)Activator.CreateInstance(translatorType) : null;
// }



app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
