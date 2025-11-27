namespace BarberBot.Application.Common.Interfaces;

public interface IBotService
{
    Task ProcessIncomingMessageAsync(string from, string message);
}
