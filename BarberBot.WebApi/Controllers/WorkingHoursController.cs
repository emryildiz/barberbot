using BarberBot.Application.DTOs;
using BarberBot.Application.WorkingHours.Commands.UpdateWorkingHours;
using BarberBot.Application.WorkingHours.Queries.GetWorkingHours;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BarberBot.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Owner")]
public class WorkingHoursController : ControllerBase
{
    private readonly IMediator _mediator;

    public WorkingHoursController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var workingHours = await _mediator.Send(new GetWorkingHoursQuery());
        return Ok(workingHours);
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] List<UpdateWorkingHourRequest> requests)
    {
        await _mediator.Send(new UpdateWorkingHoursCommand(requests));
        return NoContent();
    }
}
