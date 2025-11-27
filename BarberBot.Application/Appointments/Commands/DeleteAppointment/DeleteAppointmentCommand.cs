using BarberBot.Application.Common.Interfaces;
using MediatR;

namespace BarberBot.Application.Appointments.Commands.DeleteAppointment;

public record DeleteAppointmentCommand(int Id) : IRequest<bool>;

public class DeleteAppointmentCommandHandler : IRequestHandler<DeleteAppointmentCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public DeleteAppointmentCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(DeleteAppointmentCommand request, CancellationToken cancellationToken)
    {
        var appointment = await _context.Appointments.FindAsync(new object[] { request.Id }, cancellationToken);
        if (appointment == null) return false;

        _context.Appointments.Remove(appointment);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
