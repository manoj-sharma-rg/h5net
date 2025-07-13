using System.Threading.Tasks;

public interface IPmsTranslator
{
    string PmsCode { get; }
    Task<string> TranslateToRgbridgeAsync(string pmsPayload);
}

// Sample implementation for a PMS called "samplepms"
public class SamplePmsTranslator : IPmsTranslator
{
    public string PmsCode => "samplepms";

    public Task<string> TranslateToRgbridgeAsync(string pmsPayload)
    {
        // TODO: Implement real translation logic
        return Task.FromResult($"<RGBridgeMessage>Translated from {PmsCode}: {pmsPayload}</RGBridgeMessage>");
    }
} 