using BarberBot.Application.Common.Interfaces;
using BarberBot.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BarberBot.Application.Appointments.Commands.CreateAppointment;

public record CreateAppointmentCommand : IRequest<Appointment>
{
    public int CustomerId { get; init; }
    public int UserId { get; init; }
    public int ServiceId { get; init; }
    public DateTime StartTime { get; init; }
    public DateTime EndTime { get; init; }
}

public class CreateAppointmentCommandHandler : IRequestHandler<CreateAppointmentCommand, Appointment>
{
    private readonly IApplicationDbContext _context;

    public CreateAppointmentCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Appointment> Handle(CreateAppointmentCommand request, CancellationToken cancellationToken)
    {
        // Check if shop is open on that day
        var dayOfWeek = (int)request.StartTime.DayOfWeek;
        var workingHour = await _context.WorkingHours.FirstOrDefaultAsync(w => w.DayOfWeek == dayOfWeek, cancellationToken);

        if (workingHour == null || workingHour.IsClosed)
        {
            throw new ArgumentException("Seçilen tarihte işletme kapalıdır.");
        }

        // Check time range
        var time = request.StartTime.TimeOfDay;
        var start = TimeSpan.Parse(workingHour.StartTime);
        var end = TimeSpan.Parse(workingHour.EndTime);

        if (time < start || request.EndTime.TimeOfDay > end)
        {
            throw new ArgumentException($"Randevu saatleri çalışma saatleri ({workingHour.StartTime} - {workingHour.EndTime}) arasında olmalıdır.");
        }

        // Check for overlapping appointments for the same user
        var hasOverlap = await _context.Appointments
            .AnyAsync(a => a.UserId == request.UserId &&
                           a.StartTime < request.EndTime &&
                           a.EndTime > request.StartTime &&
                           a.Status != "Cancelled", cancellationToken); // Added check for Cancelled

        if (hasOverlap)
        {
            throw new ArgumentException("Seçilen berberin bu saat aralığında başka bir randevusu bulunmaktadır.");
        }

        var appointment = new Appointment
        {
            CustomerId = request.CustomerId,
            UserId = request.UserId,
            ServiceId = request.ServiceId,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            Status = "Confirmed"
        };

        _context.Appointments.Add(appointment);
        await _context.SaveChangesAsync(cancellationToken);

        return appointment;
    }
}
