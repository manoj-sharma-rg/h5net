using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using OpenAI_API;
using OpenAI_API.Completions;

namespace api.Services
{
    public class AiIntegrationService
    {
        private readonly ILogger<AiIntegrationService> _logger;
        private readonly OpenAIAPI _openAiApi;
        private readonly string _model;

        public AiIntegrationService(ILogger<AiIntegrationService> logger, IConfiguration config)
        {
            _logger = logger;
            var apiKey = config["OpenAI:ApiKey"] ?? Environment.GetEnvironmentVariable("OPENAI_API_KEY");
            _model = config["OpenAI:Model"] ?? "gpt-3.5-turbo";
            if (string.IsNullOrEmpty(apiKey))
                throw new InvalidOperationException("OpenAI API key is not configured.");
            _openAiApi = new OpenAIAPI(apiKey);
        }

        public async Task<List<string>> GetMappingSuggestionsAsync(string pmsSpec, string[] fieldNames)
        {
            var prompt = $"Given the following PMS spec:\n{pmsSpec}\n\nSuggest the best RGBridge field mapping for each of these PMS fields: {string.Join(", ", fieldNames)}. Return only the suggested RGBridge field for each, in order.";
            var result = await _openAiApi.Completions.CreateCompletionAsync(new CompletionRequest
            {
                Prompt = prompt,
                Model = _model,
                MaxTokens = 256,
                Temperature = 0.2,
                N = 1
            });
            var suggestions = new List<string>();
            if (result != null && result.Completions.Count > 0)
            {
                var lines = result.Completions[0].Text.Split('\n', StringSplitOptions.RemoveEmptyEntries);
                foreach (var line in lines)
                {
                    suggestions.Add(line.Trim());
                }
            }
            return suggestions;
        }

        public async Task<string> GenerateTranslatorCodeAsync(string pmsSpec, string pmsCode)
        {
            var prompt = $"Given the following PMS spec:\n{pmsSpec}\n\nGenerate a C# class implementing IPmsTranslator for PMS code '{pmsCode}'. The class should translate PMS messages to RGBridge format.";
            var result = await _openAiApi.Completions.CreateCompletionAsync(new CompletionRequest
            {
                Prompt = prompt,
                Model = _model,
                MaxTokens = 1024,
                Temperature = 0.2,
                N = 1
            });
            return result?.Completions[0].Text ?? string.Empty;
        }

        public async Task<List<string>> GenerateTestCasesAsync(string pmsSpec, object mappings)
        {
            var prompt = $"Given the following PMS spec:\n{pmsSpec}\n\nAnd these field mappings:\n{System.Text.Json.JsonSerializer.Serialize(mappings)}\n\nGenerate 3 sample PMS payloads and their expected RGBridge translations.";
            var result = await _openAiApi.Completions.CreateCompletionAsync(new CompletionRequest
            {
                Prompt = prompt,
                Model = _model,
                MaxTokens = 512,
                Temperature = 0.2,
                N = 1
            });
            var testCases = new List<string>();
            if (result != null && result.Completions.Count > 0)
            {
                var blocks = result.Completions[0].Text.Split("---", StringSplitOptions.RemoveEmptyEntries);
                foreach (var block in blocks)
                {
                    testCases.Add(block.Trim());
                }
            }
            return testCases;
        }
    }
} 