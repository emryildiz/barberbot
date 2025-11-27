namespace BarberBot.Application.Common.Interfaces;

public interface IWhatsAppService
{
    Task SendMessageAsync(string to, string message);
}
