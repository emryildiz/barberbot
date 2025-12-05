using BarberBot.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BarberBot.Application.Appointments.Queries.GetAvailableSlots;

public record GetAvailableSlotsQuery : IRequest<List<string>>
{
    public int BarberId { get; init; }
    public int ServiceId { get; init; }
    public DateTime Date { get; init; }
}

public class GetAvailableSlotsQueryHandler : IRequestHandler<GetAvailableSlotsQuery, List<string>>
{
    private readonly IApplicationDbContext _context;

    public GetAvailableSlotsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<string>> Handle(GetAvailableSlotsQuery request, CancellationToken cancellationToken)
    {
        var dayOfWeek = (int)request.Date.DayOfWeek;
        var workingHour = await _context.WorkingHours.FirstOrDefaultAsync(w => w.DayOfWeek == dayOfWeek, cancellationToken);

        if (workingHour == null || workingHour.IsClosed)
        {
            return new List<string>();
        }

        // Parse DB times strictly
        if (!TimeSpan.TryParse(workingHour.StartTime, out TimeSpan start)) start = new TimeSpan(9, 0, 0);
        if (!TimeSpan.TryParse(workingHour.EndTime, out TimeSpan end)) end = new TimeSpan(21, 0, 0);

        // Fetch existing appointments for the selected barber and date
        // Appointments are stored in UTC
        var existingAppointments = await _context.Appointments
            .Where(a => a.UserId == request.BarberId &&
                        a.StartTime.Date == request.Date.Date &&
                        a.Status != "Cancelled")
            .ToListAsync(cancellationToken);

        var service = await _context.Services.FindAsync(new object[] { request.ServiceId }, cancellationToken);
        var serviceDuration = service?.DurationMinutes ?? 30;

        var slots = new List<string>();
        var current = start;

        // Turkey Time (UTC+3)
        var turkeyTime = DateTime.UtcNow.AddHours(3);
        var isToday = request.Date.Date == turkeyTime.Date;

        while (current < end)
        {
            // If it's today, filter out passed times (buffer 15 mins)
            if (isToday && current <= turkeyTime.TimeOfDay.Add(TimeSpan.FromMinutes(15)))
            {
                current = current.Add(TimeSpan.FromMinutes(30));
                continue;
            }

            // Check for overlap with existing appointments
            var slotStart = current;
            var slotEnd = current.Add(TimeSpan.FromMinutes(serviceDuration));

            // Ensure slot doesn't exceed working hours
            if (slotEnd > end)
            {
                current = current.Add(TimeSpan.FromMinutes(30));
                continue;
            }

            // Existing appointments are in UTC, convert to TRT for comparison
            // Or better: convert slot to UTC and compare
            // Let's stick to the logic used in BotService which seemed to convert App times to TRT
            
            var isOverlapping = existingAppointments.Any(a =>
                a.StartTime.AddHours(3).TimeOfDay < slotEnd && a.EndTime.AddHours(3).TimeOfDay > slotStart);

            if (!isOverlapping)
            {
                slots.Add(current.ToString(@"hh\:mm"));
            }

            current = current.Add(TimeSpan.FromMinutes(30));
        }

        return slots;
    }
}
