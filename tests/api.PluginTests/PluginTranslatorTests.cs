using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;
using api.Services;

namespace api.PluginTests
{
    public class PluginTranslatorTests
    {
        [Fact]
        public async Task AllPmsTranslators_Should_Pass_AiGeneratedTestCases()
        {
            // Arrange
            var registry = new TranslatorRegistry(new Microsoft.Extensions.Logging.Abstractions.NullLogger<TranslatorRegistry>());
            var pmsRoot = Path.Combine("..", "..", "pms");
            Assert.True(Directory.Exists(pmsRoot), $"PMS directory not found: {pmsRoot}");
            var failures = new List<string>();

            foreach (var dir in Directory.GetDirectories(pmsRoot))
            {
                var pmsCode = Path.GetFileName(dir);
                var translator = registry.GetTranslator(pmsCode);
                if (translator == null)
                {
                    failures.Add($"No translator found for PMS code: {pmsCode}");
                    continue;
                }
                var testCasePath = Path.Combine(dir, "testcases.json");
                if (!File.Exists(testCasePath))
                {
                    failures.Add($"No testcases.json found for PMS code: {pmsCode}");
                    continue;
                }
                var testCases = JsonSerializer.Deserialize<List<TestCase>>(File.ReadAllText(testCasePath));
                if (testCases == null || testCases.Count == 0)
                {
                    failures.Add($"No test cases found in testcases.json for PMS code: {pmsCode}");
                    continue;
                }
                foreach (var test in testCases)
                {
                    var inputJson = JsonSerializer.Serialize(test.input);
                    var output = await translator.TranslateToRgbridgeAsync(inputJson);
                    var expectedJson = JsonSerializer.Serialize(test.expected);
                    // Compare as normalized JSON
                    var outputObj = JsonSerializer.Deserialize<Dictionary<string, object>>(output);
                    var expectedObj = JsonSerializer.Deserialize<Dictionary<string, object>>(expectedJson);
                    if (!DictionariesEqual(outputObj, expectedObj))
                    {
                        failures.Add($"Test failed for PMS {pmsCode}:\nInput: {inputJson}\nExpected: {expectedJson}\nActual: {output}");
                    }
                }
            }
            if (failures.Count > 0)
            {
                throw new Exception($"Plugin translator test failures:\n" + string.Join("\n\n", failures));
            }
        }

        private bool DictionariesEqual(Dictionary<string, object>? a, Dictionary<string, object>? b)
        {
            if (a == null || b == null) return false;
            if (a.Count != b.Count) return false;
            foreach (var kvp in a)
            {
                if (!b.TryGetValue(kvp.Key, out var bValue)) return false;
                if (!object.Equals(kvp.Value, bValue)) return false;
            }
            return true;
        }

        private class TestCase
        {
            public Dictionary<string, object> input { get; set; } = new();
            public Dictionary<string, object> expected { get; set; } = new();
        }
    }
} 