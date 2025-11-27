using BarberBot.Application.Common.Interfaces;
using BarberBot.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BarberBot.Application.Barbers.Queries.GetBarbers;

public record GetBarbersQuery : IRequest<List<User>>;

public class GetBarbersQueryHandler : IRequestHandler<GetBarbersQuery, List<User>>
{
    private readonly IApplicationDbContext _context;

    public GetBarbersQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<User>> Handle(GetBarbersQuery request, CancellationToken cancellationToken)
    {
        // Get users with Barber or Owner role (not Admin)
        var users = await _context.Users
            .Where(u => u.Role == "Barber" || u.Role == "Owner")
            .ToListAsync(cancellationToken);

        return users;
    }
}
