using BarberBot.Application.Common.Interfaces;
using BarberBot.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BarberBot.Application.Auth.Commands.Login;

public record LoginCommand(string Username, string Password) : IRequest<User?>;

public class LoginCommandHandler : IRequestHandler<LoginCommand, User?>
{
    private readonly IApplicationDbContext _context;

    public LoginCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<User?> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Username == request.Username, cancellationToken);

        if (user == null || user.PasswordHash != request.Password) // In real app, verify hash
        {
            return null;
        }

        return user;
    }
}
