using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Microsoft.Extensions.Logging;

namespace api.Services
{
    public class TranslatorRegistry
    {
        private readonly ConcurrentDictionary<string, IPmsTranslator> _translators = new();
        private readonly ILogger<TranslatorRegistry> _logger;

        public TranslatorRegistry(ILogger<TranslatorRegistry> logger)
        {
            _logger = logger;
            DiscoverTranslators();
        }

        private void DiscoverTranslators()
        {
            var translatorType = typeof(IPmsTranslator);
            var assemblies = AppDomain.CurrentDomain.GetAssemblies();
            var types = assemblies
                .SelectMany(a => SafeGetTypes(a))
                .Where(t => translatorType.IsAssignableFrom(t) && !t.IsInterface && !t.IsAbstract)
                .ToList();
            foreach (var type in types)
            {
                try
                {
                    var instance = Activator.CreateInstance(type) as IPmsTranslator;
                    if (instance == null)
                    {
                        _logger.LogWarning("Could not instantiate translator: {Type}", type.FullName);
                        continue;
                    }
                    if (!_translators.TryAdd(instance.PmsCode.ToLowerInvariant(), instance))
                    {
                        _logger.LogWarning("Duplicate translator for PMS code: {PmsCode}", instance.PmsCode);
                    }
                    else
                    {
                        _logger.LogInformation("Registered PMS translator: {Type} for code {PmsCode}", type.Name, instance.PmsCode);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to instantiate translator: {Type}", type.FullName);
                }
            }
        }

        private static IEnumerable<Type> SafeGetTypes(Assembly assembly)
        {
            try { return assembly.GetTypes(); } catch { return Array.Empty<Type>(); }
        }

        public IPmsTranslator? GetTranslator(string pmsCode)
        {
            if (string.IsNullOrWhiteSpace(pmsCode)) return null;
            _translators.TryGetValue(pmsCode.ToLowerInvariant(), out var translator);
            return translator;
        }
    }
} 