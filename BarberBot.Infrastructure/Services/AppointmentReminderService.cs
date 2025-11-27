using BarberBot.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace BarberBot.Infrastructure.Services;

public class AppointmentReminderService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<AppointmentReminderService> _logger;

    public AppointmentReminderService(IServiceProvider serviceProvider, ILogger<AppointmentReminderService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Appointment Reminder Service started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CheckAndSendReminders(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while sending appointment reminders.");
            }

            // Check every minute
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }

    private async Task CheckAndSendReminders(CancellationToken stoppingToken)
    {
        using (var scope = _serviceProvider.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
            var whatsAppService = scope.ServiceProvider.GetRequiredService<IWhatsAppService>();

            var now = DateTime.Now;
            var oneHourLater = now.AddHours(1);
            var tolerance = TimeSpan.FromMinutes(5); // Window of 5 minutes

            // Find confirmed appointments starting in about 1 hour that haven't been reminded
            var upcomingAppointments = await context.Appointments
                .Include(a => a.Customer)
                .Where(a => a.Status == "Confirmed" &&
                            !a.IsReminderSent &&
                            a.StartTime >= oneHourLater.Subtract(tolerance) &&
                            a.StartTime <= oneHourLater.Add(tolerance))
                .ToListAsync(stoppingToken);

            foreach (var appointment in upcomingAppointments)
            {
                if (!string.IsNullOrEmpty(appointment.Customer.PhoneNumber))
                {
                    var message = $"Hatırlatma: Randevunuz 1 saat sonra ({appointment.StartTime:HH:mm}) başlayacaktır. Lütfen zamanında geliniz.";
                    await whatsAppService.SendMessageAsync(appointment.Customer.PhoneNumber, message);
                    
                    appointment.IsReminderSent = true;
                    _logger.LogInformation($"Reminder sent to {appointment.Customer.PhoneNumber} for appointment {appointment.Id}");
                }
            }

            if (upcomingAppointments.Any())
            {
                await context.SaveChangesAsync(stoppingToken);
            }
        }
    }
}
