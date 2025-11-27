using BarberBot.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Twilio;
using Twilio.Rest.Api.V2010.Account;
using Twilio.Types;

namespace BarberBot.Infrastructure.Services;

public class WhatsAppService : IWhatsAppService
{
    private readonly ILogger<WhatsAppService> _logger;
    private readonly IConfiguration _configuration;
    private readonly string _accountSid;
    private readonly string _authToken;
    private readonly string _fromNumber;

    public WhatsAppService(ILogger<WhatsAppService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
        
        _accountSid = _configuration["TwilioSettings:AccountSid"]!;
        _authToken = _configuration["TwilioSettings:AuthToken"]!;
        _fromNumber = _configuration["TwilioSettings:PhoneNumber"]!;

        if (!string.IsNullOrEmpty(_accountSid) && !string.IsNullOrEmpty(_authToken) && _accountSid != "YOUR_ACCOUNT_SID")
        {
            TwilioClient.Init(_accountSid, _authToken);
        }
    }

    public async Task SendMessageAsync(string to, string message)
    {
        if (string.IsNullOrEmpty(_accountSid) || _accountSid == "YOUR_ACCOUNT_SID")
        {
            _logger.LogWarning($"Twilio not configured. Message to {to}: {message}");
            return;
        }

        try
        {
            if (!to.StartsWith("whatsapp:"))
            {
                to = "whatsapp:" + to;
            }

            var messageResource = await MessageResource.CreateAsync(
                body: message,
                from: new PhoneNumber(_fromNumber),
                to: new PhoneNumber(to)
            );

            _logger.LogInformation($"WhatsApp message sent to {to}. SID: {messageResource.Sid}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error sending WhatsApp message to {to}");
        }
    }
}
