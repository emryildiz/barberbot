using BarberBot.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BarberBot.Application.Auth.Commands.ChangePassword;

public record ChangePasswordCommand(int UserId, string CurrentPassword, string NewPassword) : IRequest<bool>;

public class ChangePasswordCommandHandler : IRequestHandler<ChangePasswordCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public ChangePasswordCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FindAsync(new object[] { request.UserId }, cancellationToken);

        if (user == null)
        {
            return false;
        }

        // Verify current password
        // Note: In a real app, passwords should be hashed. 
        // Since the current implementation uses plain text (as noted in previous summaries), we compare directly.
        // TODO: Implement hashing later.
        if (user.PasswordHash != request.CurrentPassword)
        {
            return false;
        }

        user.PasswordHash = request.NewPassword;
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
