using System;
using System.Xml;
using System.Xml.Schema;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Schema;
using System.Collections.Generic;

namespace api.Services
{
    public class SchemaValidationService
    {
        public (bool isValid, string? error) ValidateJson(string payload, string schema)
        {
            try
            {
                var jSchema = JSchema.Parse(schema);
                var jToken = JToken.Parse(payload);
                var isValid = jToken.IsValid(jSchema, out IList<string> errors);
                return (isValid, isValid ? null : string.Join("; ", errors));
            }
            catch (Exception ex)
            {
                return (false, $"JSON validation error: {ex.Message}");
            }
        }

        public (bool isValid, string? error) ValidateXml(string payload, string xsd)
        {
            try
            {
                var settings = new XmlReaderSettings();
                settings.Schemas.Add(null, XmlReader.Create(new System.IO.StringReader(xsd)));
                settings.ValidationType = ValidationType.Schema;
                string? validationError = null;
                settings.ValidationEventHandler += (sender, args) =>
                {
                    validationError = args.Message;
                };
                using var reader = XmlReader.Create(new System.IO.StringReader(payload), settings);
                while (reader.Read()) { }
                return (validationError == null, validationError);
            }
            catch (Exception ex)
            {
                return (false, $"XML validation error: {ex.Message}");
            }
        }
    }
} 