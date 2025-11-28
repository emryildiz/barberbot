using BarberBot.Application.Common.Interfaces;
using MediatR;

namespace BarberBot.Application.Users.Commands.UpdateUserStatus;

public record UpdateUserStatusCommand(int Id, bool IsActive, bool IsOnLeave) : IRequest<bool>;

public class UpdateUserStatusCommandHandler : IRequestHandler<UpdateUserStatusCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public UpdateUserStatusCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(UpdateUserStatusCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FindAsync(new object[] { request.Id }, cancellationToken);

        if (user == null)
        {
            return false;
        }

        user.IsActive = request.IsActive;
        user.IsOnLeave = request.IsOnLeave;

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
