using BarberBot.Application.Common.Interfaces;
using BarberBot.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BarberBot.Application.WorkingHours.Queries.GetWorkingHours;

public record GetWorkingHoursQuery : IRequest<List<WorkingHour>>;

public class GetWorkingHoursQueryHandler : IRequestHandler<GetWorkingHoursQuery, List<WorkingHour>>
{
    private readonly IApplicationDbContext _context;

    public GetWorkingHoursQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<WorkingHour>> Handle(GetWorkingHoursQuery request, CancellationToken cancellationToken)
    {
        return await _context.WorkingHours
            .OrderBy(w => w.DayOfWeek)
            .ToListAsync(cancellationToken);
    }
}
