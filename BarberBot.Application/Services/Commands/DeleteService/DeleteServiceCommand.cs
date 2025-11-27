using BarberBot.Application.Common.Interfaces;
using MediatR;

namespace BarberBot.Application.Services.Commands.DeleteService;

public record DeleteServiceCommand(int Id) : IRequest<bool>;

public class DeleteServiceCommandHandler : IRequestHandler<DeleteServiceCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public DeleteServiceCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(DeleteServiceCommand request, CancellationToken cancellationToken)
    {
        var service = await _context.Services.FindAsync(new object[] { request.Id }, cancellationToken);

        if (service == null)
        {
            return false;
        }

        _context.Services.Remove(service);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
