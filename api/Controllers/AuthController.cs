using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ILogger<AuthController> _logger;
    private readonly IConfiguration _configuration;

    public AuthController(ILogger<AuthController> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        try
        {
            // In production, validate against database
            if (IsValidCredentials(request.Username, request.Password))
            {
                var token = GenerateJwtToken(request.Username);
                
                _logger.LogInformation("User {Username} logged in successfully", request.Username);
                
                return Ok(new { 
                    token = token,
                    expiresIn = 3600, // 1 hour
                    message = "Login successful"
                });
            }
            
            _logger.LogWarning("Failed login attempt for user {Username}", request.Username);
            return Unauthorized(new { message = "Invalid credentials" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for user {Username}", request.Username);
            return Problem("Error during authentication");
        }
    }

    [HttpPost("validate")]
    public IActionResult ValidateToken([FromBody] TokenValidationRequest request)
    {
        try
        {
            var isValid = ValidateJwtToken(request.Token);
            return Ok(new { isValid = isValid });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating token");
            return Problem("Error validating token");
        }
    }

    private bool IsValidCredentials(string username, string password)
    {
        // In production, validate against database with hashed passwords
        // For now, use simple validation
        var validUsers = _configuration.GetSection("ValidUsers").Get<Dictionary<string, string>>();
        
        if (validUsers == null || !validUsers.ContainsKey(username))
            return false;
            
        return validUsers[username] == password; // In production, use proper password hashing
    }

    private string GenerateJwtToken(string username)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"] ?? "default-secret-key-change-in-production"));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.Name, username),
            new Claim(ClaimTypes.Role, "PmsUser"),
            new Claim("pms_access", "true")
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"] ?? "h5net-pms",
            audience: _configuration["Jwt:Audience"] ?? "h5net-pms-api",
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private bool ValidateJwtToken(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_configuration["Jwt:Key"] ?? "default-secret-key-change-in-production");
            
            tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = _configuration["Jwt:Issuer"] ?? "h5net-pms",
                ValidateAudience = true,
                ValidAudience = _configuration["Jwt:Audience"] ?? "h5net-pms-api",
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            }, out SecurityToken validatedToken);

            return true;
        }
        catch
        {
            return false;
        }
    }
}

public class LoginRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class TokenValidationRequest
{
    public string Token { get; set; } = string.Empty;
} 