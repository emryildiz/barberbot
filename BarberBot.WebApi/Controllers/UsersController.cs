using BarberBot.Application.DTOs;
using BarberBot.Application.Users.Commands.CreateUser;
using BarberBot.Application.Users.Commands.DeleteUser;
using BarberBot.Application.Users.Commands.UpdateUserStatus;
using BarberBot.Application.Users.Queries.GetUsers;
using BarberBot.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BarberBot.WebApi.Controllers;

[Authorize(Roles = "Admin,Owner")]
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IMediator _mediator;

    public UsersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<User>>> GetUsers()
    {
        var users = await _mediator.Send(new GetUsersQuery());
        return Ok(users);
    }

    [HttpPost]
    public async Task<ActionResult<User>> CreateUser(CreateUserRequest request)
    {
        try
        {
            var command = new CreateUserCommand
            {
                Username = request.Username,
                Password = request.Password,
                Role = request.Role ?? "Barber" // Default to Barber if not specified
            };

            var user = await _mediator.Send(command);
            return CreatedAtAction(nameof(GetUsers), new { id = user.Id }, user);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var result = await _mediator.Send(new DeleteUserCommand(id));

        if (!result)
        {
            return NotFound();
        }

        return NoContent();
    }
    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateUserStatus(int id, [FromBody] UpdateUserStatusRequest request)
    {
        var result = await _mediator.Send(new UpdateUserStatusCommand(id, request.IsActive, request.IsOnLeave));

        if (!result)
        {
            return NotFound();
        }

        return NoContent();
    }
}

public record UpdateUserStatusRequest(bool IsActive, bool IsOnLeave);

