using BarberBot.Application.Common.Interfaces;
using BarberBot.Domain.Entities;
using MediatR;

namespace BarberBot.Application.Appointments.Commands.UpdateAppointment;

public record UpdateAppointmentCommand : IRequest<Appointment?>
{
    public int Id { get; init; }
    public DateTime StartTime { get; init; }
    public DateTime EndTime { get; init; }
    public string Status { get; init; } = string.Empty;
}

public class UpdateAppointmentCommandHandler : IRequestHandler<UpdateAppointmentCommand, Appointment?>
{
    private readonly IApplicationDbContext _context;
    private readonly IWhatsAppService _whatsAppService;

    public UpdateAppointmentCommandHandler(IApplicationDbContext context, IWhatsAppService whatsAppService)
    {
        _context = context;
        _whatsAppService = whatsAppService;
    }

    public async Task<Appointment?> Handle(UpdateAppointmentCommand request, CancellationToken cancellationToken)
    {
        var appointment = await _context.Appointments.FindAsync(new object[] { request.Id }, cancellationToken);
        if (appointment == null) return null;

        // Check if status changed to Confirmed
        if (appointment.Status != "Confirmed" && request.Status == "Confirmed")
        {
            // Send WhatsApp notification
            var customer = await _context.Customers.FindAsync(new object[] { appointment.CustomerId }, cancellationToken);
            if (customer != null && !string.IsNullOrEmpty(customer.PhoneNumber))
            {
                await _whatsAppService.SendMessageAsync(customer.PhoneNumber, $"Randevunuz onaylandı! {appointment.StartTime:dd.MM.yyyy HH:mm} tarihinde bekliyoruz.");
            }
        }

        appointment.StartTime = request.StartTime;
        appointment.EndTime = request.EndTime;
        appointment.Status = request.Status;

        await _context.SaveChangesAsync(cancellationToken);

        return appointment;
    }
}
