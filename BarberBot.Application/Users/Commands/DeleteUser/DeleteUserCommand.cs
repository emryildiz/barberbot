using BarberBot.Application.Common.Interfaces;
using MediatR;

namespace BarberBot.Application.Users.Commands.DeleteUser;

public record DeleteUserCommand(int Id) : IRequest<bool>;

public class DeleteUserCommandHandler : IRequestHandler<DeleteUserCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public DeleteUserCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(DeleteUserCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FindAsync(new object[] { request.Id }, cancellationToken);
        if (user == null)
        {
            return false;
        }

        if (user.Role == "Admin") 
        {
             // Prevent deleting the last admin or self if needed, but for now simple check
             // Ideally check if it's the current user
        }

        _context.Users.Remove(user);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
