using AutoMapper;
using BarberBot.Application.Common.Interfaces;
using BarberBot.Domain.Entities;
using MediatR;

namespace BarberBot.Application.Services.Commands.UpdateService;

public record UpdateServiceCommand : IRequest<Service?>
{
    public int Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public decimal Price { get; init; }
    public int DurationMinutes { get; init; }
}

public class UpdateServiceCommandHandler : IRequestHandler<UpdateServiceCommand, Service?>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public UpdateServiceCommandHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Service?> Handle(UpdateServiceCommand request, CancellationToken cancellationToken)
    {
        var service = await _context.Services.FindAsync(new object[] { request.Id }, cancellationToken);

        if (service == null)
        {
            return null;
        }

        _mapper.Map(request, service);

        await _context.SaveChangesAsync(cancellationToken);

        return service;
    }
}
