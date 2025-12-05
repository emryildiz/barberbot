using BarberBot.Application.Common.Interfaces;
using BarberBot.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BarberBot.Application.Appointments.Commands.CreateAppointment;

public record CreateAppointmentCommand : IRequest<Appointment>
{
    public int? CustomerId { get; init; }
    public int UserId { get; init; }
    public int ServiceId { get; init; }
    public DateTime StartTime { get; init; }
    public DateTime EndTime { get; init; }
    public string? NewCustomerName { get; init; }
    public string? NewCustomerPhone { get; init; }
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
        // Convert to Turkey Time for validation
        var turkeyTime = request.StartTime.AddHours(3);
        var turkeyEndTime = request.EndTime.AddHours(3);

        // Check if shop is open on that day
        var dayOfWeek = (int)turkeyTime.DayOfWeek;
        var workingHour = await _context.WorkingHours.FirstOrDefaultAsync(w => w.DayOfWeek == dayOfWeek, cancellationToken);

        if (workingHour == null || workingHour.IsClosed)
        {
            throw new ArgumentException("Seçilen tarihte işletme kapalıdır.");
        }

        // Check time range
        var time = turkeyTime.TimeOfDay;
        var start = TimeSpan.Parse(workingHour.StartTime);
        var end = TimeSpan.Parse(workingHour.EndTime);

        if (time < start || turkeyEndTime.TimeOfDay > end)
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

        int customerId;

        if (request.CustomerId.HasValue)
        {
            customerId = request.CustomerId.Value;
        }
        else if (!string.IsNullOrEmpty(request.NewCustomerName) && !string.IsNullOrEmpty(request.NewCustomerPhone))
        {
            var customer = new Customer
            {
                Name = request.NewCustomerName,
                PhoneNumber = request.NewCustomerPhone
            };
            _context.Customers.Add(customer);
            await _context.SaveChangesAsync(cancellationToken);
            customerId = customer.Id;
        }
        else
        {
            throw new ArgumentException("Müşteri seçilmeli veya yeni müşteri bilgileri girilmelidir.");
        }

        var appointment = new Appointment
        {
            CustomerId = customerId,
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
