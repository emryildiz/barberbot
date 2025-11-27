using BarberBot.Application.Common.Interfaces;
using BarberBot.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BarberBot.Application.Auth.Queries.GetMe;

public record GetMeQuery(int UserId) : IRequest<User?>;

public class GetMeQueryHandler : IRequestHandler<GetMeQuery, User?>
{
    private readonly IApplicationDbContext _context;

    public GetMeQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<User?> Handle(GetMeQuery request, CancellationToken cancellationToken)
    {
        return await _context.Users.FindAsync(new object[] { request.UserId }, cancellationToken);
    }
}
