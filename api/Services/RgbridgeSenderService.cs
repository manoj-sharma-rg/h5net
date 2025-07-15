using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;

namespace api.Services
{
    public class RgbridgeSenderService
    {
        private readonly ILogger<RgbridgeSenderService> _logger;
        private readonly HttpClient _httpClient;
        private readonly string _endpoint;
        private readonly string _username;
        private readonly string _password;
        private readonly int _maxRetries;

        public RgbridgeSenderService(ILogger<RgbridgeSenderService> logger, IConfiguration config)
        {
            _logger = logger;
            _httpClient = new HttpClient();
            _endpoint = config["Rgbridge:Endpoint"] ?? "https://internal-api.example.com/rgbridge";
            _username = config["Rgbridge:Username"] ?? "user";
            _password = config["Rgbridge:Password"] ?? "pass";
            _maxRetries = int.TryParse(config["Rgbridge:MaxRetries"], out var r) ? r : 3;
        }

        public async Task<(bool success, string? response, string? error)> SendXmlAsync(string xmlPayload)
        {
            var content = new StringContent(xmlPayload, Encoding.UTF8, "application/xml");
            var authValue = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{_username}:{_password}"));
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", authValue);

            for (int attempt = 1; attempt <= _maxRetries; attempt++)
            {
                try
                {
                    var response = await _httpClient.PostAsync(_endpoint, content);
                    var respContent = await response.Content.ReadAsStringAsync();
                    if (response.IsSuccessStatusCode)
                    {
                        _logger.LogInformation("RGBridge message sent successfully on attempt {Attempt}", attempt);
                        return (true, respContent, null);
                    }
                    else
                    {
                        _logger.LogWarning("RGBridge delivery failed (attempt {Attempt}): {Status} {Content}", attempt, response.StatusCode, respContent);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error sending RGBridge message (attempt {Attempt})", attempt);
                    if (attempt == _maxRetries)
                        return (false, null, ex.Message);
                }
                await Task.Delay(1000 * attempt); // Exponential backoff
            }
            return (false, null, "Max retry attempts reached");
        }
    }
} 