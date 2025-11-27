using BarberBot.Application.Common.Interfaces;
using BarberBot.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BarberBot.Application.Services.Queries.GetServices;

public record GetServicesQuery : IRequest<List<Service>>;

public class GetServicesQueryHandler : IRequestHandler<GetServicesQuery, List<Service>>
{
    private readonly IApplicationDbContext _context;

    public GetServicesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Service>> Handle(GetServicesQuery request, CancellationToken cancellationToken)
    {
        return await _context.Services.ToListAsync(cancellationToken);
    }
}
