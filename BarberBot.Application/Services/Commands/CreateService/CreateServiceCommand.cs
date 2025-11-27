using AutoMapper;
using BarberBot.Application.Common.Interfaces;
using BarberBot.Domain.Entities;
using MediatR;

namespace BarberBot.Application.Services.Commands.CreateService;

public record CreateServiceCommand : IRequest<Service>
{
    public string Name { get; init; } = string.Empty;
    public decimal Price { get; init; }
    public int DurationMinutes { get; init; }
}

public class CreateServiceCommandHandler : IRequestHandler<CreateServiceCommand, Service>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public CreateServiceCommandHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Service> Handle(CreateServiceCommand request, CancellationToken cancellationToken)
    {
        var service = _mapper.Map<Service>(request);

        _context.Services.Add(service);
        await _context.SaveChangesAsync(cancellationToken);

        return service;
    }
}
