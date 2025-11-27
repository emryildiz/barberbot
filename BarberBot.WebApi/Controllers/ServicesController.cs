using AutoMapper;
using BarberBot.Application.DTOs;
using BarberBot.Application.Services.Commands.CreateService;
using BarberBot.Application.Services.Commands.DeleteService;
using BarberBot.Application.Services.Commands.UpdateService;
using BarberBot.Application.Services.Queries.GetServices;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BarberBot.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServicesController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IMapper _mapper;

    public ServicesController(IMediator mediator, IMapper mapper)
    {
        _mediator = mediator;
        _mapper = mapper;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Owner,Barber")]
    public async Task<IActionResult> GetAll()
    {
        var services = await _mediator.Send(new GetServicesQuery());
        return Ok(services);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Owner")]
    public async Task<IActionResult> Create([FromBody] CreateServiceRequest request)
    {
        var command = _mapper.Map<CreateServiceCommand>(request);
        var service = await _mediator.Send(command);
        return Ok(service);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Owner")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateServiceRequest request)
    {
        var command = _mapper.Map<UpdateServiceCommand>(request);
        // We need to set the Id manually as it comes from the route, not the body (usually)
        // Or we can use a custom resolver, but manual assignment is fine here for now since the record is immutable-ish (init only)
        // Wait, records with init-only properties can be tricky to update after mapping if not mapped correctly.
        // Actually, I can just map it and then use `with` or just rely on the mapper if I add Id to the DTO or map it manually.
        // The DTO doesn't have ID.
        // Let's create the command using the mapper and then create a new one with the ID, or just map manually for the ID.
        // Better: Map request to command, then create a new command with the ID.
        
        // Actually, `UpdateServiceCommand` has `Id`. `UpdateServiceRequest` does not.
        // I can map request to command, but Id will be 0.
        // Since it's a record, I can use `with { Id = id }`.
        
        command = command with { Id = id };

        var service = await _mediator.Send(command);

        if (service == null)
        {
            return NotFound();
        }

        return Ok(service);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Owner")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _mediator.Send(new DeleteServiceCommand(id));

        if (!result)
        {
            return NotFound();
        }

        return NoContent();
    }
}
