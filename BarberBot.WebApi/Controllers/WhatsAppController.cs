using BarberBot.Application.Common.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace BarberBot.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WhatsAppController : ControllerBase
{
    private readonly IBotService _botService;
    private readonly ILogger<WhatsAppController> _logger;

    public WhatsAppController(IBotService botService, ILogger<WhatsAppController> logger)
    {
        _botService = botService;
        _logger = logger;
    }

    [HttpPost("webhook")]
    [Consumes("application/x-www-form-urlencoded")]
    public async Task<IActionResult> ReceiveMessage([FromForm] TwilioWebhookModel request)
    {
        _logger.LogInformation($"Received WhatsApp message from {request.From}: {request.Body}");

        if (string.IsNullOrEmpty(request.From) || string.IsNullOrEmpty(request.Body))
        {
            return BadRequest("Invalid payload");
        }

        await _botService.ProcessIncomingMessageAsync(request.From, request.Body);
        
        // Twilio expects TwiML response, but for async processing we can return empty or specific TwiML.
        // Returning simple OK is often fine if we reply asynchronously via API, 
        // but strictly speaking we should return TwiML or empty content type.
        // For simplicity, we return OK.
        return Ok();
    }
}

public class TwilioWebhookModel
{
    [FromForm(Name = "From")]
    public string From { get; set; } = string.Empty;

    [FromForm(Name = "Body")]
    public string Body { get; set; } = string.Empty;
}
