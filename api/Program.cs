using Microsoft.EntityFrameworkCore;

using Wutsup.Api.Configuration;
using Wutsup.Api.Data;
using Wutsup.Api.Services;

var builder = WebApplication.CreateBuilder(args);

var environment = builder.Configuration["App:Environment"] ?? "Local";
builder.Configuration.AddJsonFile($"appsettings.{environment}.json", optional: true, reloadOnChange: true);

// Re-add environment variables so they take precedence over values in appsettings JSON files.
// This ensures Docker Compose env vars (e.g. ConnectionStrings__DefaultConnection) override
// the localhost values baked into appsettings.Local.json.
builder.Configuration.AddEnvironmentVariables();

builder.Services.AddSingleton<IConfigValidator, ConfigValidator>();
builder.Services.AddSingleton<ILogLevelFilter, LogLevelFilter>();
builder.Services.AddSingleton<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<ILoggingService, LoggingService>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<INavigationService, NavigationService>();
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// CORS: allow requests from the Admin Portal origin
var adminOrigin = builder.Configuration["Cors:AdminOrigin"] ?? string.Empty;
builder.Services.AddCors(options =>
{
    options.AddPolicy("AdminPortalPolicy", policy =>
    {
        policy.WithOrigins(adminOrigin)
              .WithHeaders("Content-Type")
              .WithMethods("POST", "GET", "OPTIONS");
    });
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

// Apply EF Core migrations on startup in Local environment
if (string.Equals(environment, "Local", StringComparison.OrdinalIgnoreCase))
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    dbContext.Database.Migrate();
}

// Validate configuration on startup
var configValidator = app.Services.GetRequiredService<IConfigValidator>();
var missingKeys = configValidator.Validate(app.Configuration, environment);
if (missingKeys.Count > 0)
{
    throw new InvalidOperationException(
        $"Missing required configuration keys: {string.Join(", ", missingKeys)}");
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AdminPortalPolicy");
app.MapControllers();

app.Run();

// Make the auto-generated Program class accessible to the test project
// for WebApplicationFactory<Program> usage.
public partial class Program { }
