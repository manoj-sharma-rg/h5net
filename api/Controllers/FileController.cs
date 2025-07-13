using Microsoft.AspNetCore.Mvc;
using iText.Kernel.Pdf;
using iText.Kernel.Pdf.Canvas.Parser;
using iText.Kernel.Pdf.Canvas.Parser.Listener;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FileController : ControllerBase
{
    private readonly ILogger<FileController> _logger;

    public FileController(ILogger<FileController> logger)
    {
        _logger = logger;
    }

    [HttpPost("extract-pdf")]
    public IActionResult ExtractPdfText(IFormFile file)
    {
        _logger.LogInformation("[{Timestamp}] Received PDF extraction request", 
            DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"));

        try
        {
            if (file == null)
            {
                _logger.LogWarning("[{Timestamp}] No file found in request", 
                    DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"));
                return BadRequest("PDF file is required");
            }

            if (!file.ContentType.Equals("application/pdf", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning("[{Timestamp}] Invalid file type: {ContentType}", 
                    DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), file.ContentType);
                return BadRequest("Only PDF files are supported");
            }

            _logger.LogInformation("[{Timestamp}] Processing PDF file: {FileName}, Size: {FileSize} bytes", 
                DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), file.FileName, file.Length);

            // Extract text from PDF
            string extractedText = "";
            using (var stream = file.OpenReadStream())
            using (var pdfReader = new PdfReader(stream))
            using (var pdfDocument = new PdfDocument(pdfReader))
            {
                for (int page = 1; page <= pdfDocument.GetNumberOfPages(); page++)
                {
                    var strategy = new SimpleTextExtractionStrategy();
                    var text = PdfTextExtractor.GetTextFromPage(pdfDocument.GetPage(page), strategy);
                    extractedText += $"--- Page {page} ---\n{text}\n\n";
                }
            }

            _logger.LogInformation("[{Timestamp}] Successfully extracted text from PDF: {FileName}, Text length: {TextLength} characters", 
                DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), file.FileName, extractedText.Length);

            return Ok(new { extractedText });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[{Timestamp}] Error extracting PDF text: {ErrorMessage}", 
                DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff"), ex.Message);
            return Problem($"Error extracting PDF text: {ex.Message}");
        }
    }
} 