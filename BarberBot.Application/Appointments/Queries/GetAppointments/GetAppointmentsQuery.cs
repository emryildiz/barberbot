using BarberBot.Application.Common.Interfaces;
using BarberBot.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BarberBot.Application.Appointments.Queries.GetAppointments;

public record GetAppointmentsQuery : IRequest<List<Appointment>>;

public class GetAppointmentsQueryHandler : IRequestHandler<GetAppointmentsQuery, List<Appointment>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetAppointmentsQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<List<Appointment>> Handle(GetAppointmentsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Appointments
            .Include(a => a.Customer)
            .Include(a => a.User)
            .Include(a => a.Service)
            .AsQueryable();

        if (_currentUserService.Role == "Barber" || _currentUserService.Role == "Owner")
        {
            var userId = int.Parse(_currentUserService.UserId!);
            query = query.Where(a => a.UserId == userId);
        }

        return await query.ToListAsync(cancellationToken);
    }
}
