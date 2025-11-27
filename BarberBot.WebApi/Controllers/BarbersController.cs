using BarberBot.Application.Barbers.Queries.GetBarbers;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BarberBot.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BarbersController : ControllerBase
{
    private readonly IMediator _mediator;

    public BarbersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Owner,Barber")]
    public async Task<IActionResult> GetAll()
    {
        // Returns users with Barber or Owner role
        var barbers = await _mediator.Send(new GetBarbersQuery());
        return Ok(barbers);
    }
}
