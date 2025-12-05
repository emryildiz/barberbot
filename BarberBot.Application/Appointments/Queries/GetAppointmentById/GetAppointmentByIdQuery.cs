using BarberBot.Application.Common.Interfaces;
using BarberBot.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BarberBot.Application.Appointments.Queries.GetAppointmentById;

public class GetAppointmentByIdQuery : IRequest<Appointment>
{
    public int Id { get; set; }
}

public class GetAppointmentByIdQueryHandler : IRequestHandler<GetAppointmentByIdQuery, Appointment>
{
    private readonly IApplicationDbContext _context;

    public GetAppointmentByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Appointment> Handle(GetAppointmentByIdQuery request, CancellationToken cancellationToken)
    {
        return await _context.Appointments
            .Include(a => a.Customer)
            .Include(a => a.User)
            .Include(a => a.Service)
            .FirstOrDefaultAsync(a => a.Id == request.Id, cancellationToken);
    }
}
