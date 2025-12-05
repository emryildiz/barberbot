using BarberBot.Application.Appointments.Commands.CreateAppointment;
using BarberBot.Application.Appointments.Commands.DeleteAppointment;
using BarberBot.Application.Appointments.Commands.UpdateAppointment;
using BarberBot.Application.Appointments.Queries.GetAppointmentById;
using BarberBot.Application.Appointments.Queries.GetAppointments;
using BarberBot.Application.Appointments.Queries.GetAvailableSlots;
using BarberBot.Application.DTOs;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BarberBot.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Barber,Owner")]
public class AppointmentsController : ControllerBase
{
    private readonly IMediator _mediator;

    public AppointmentsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var appointments = await _mediator.Send(new GetAppointmentsQuery());
        return Ok(appointments);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var appointment = await _mediator.Send(new GetAppointmentByIdQuery { Id = id });
        if (appointment == null)
        {
            return NotFound();
        }
        return Ok(appointment);
    }

    [HttpGet("available-slots")]
    public async Task<IActionResult> GetAvailableSlots([FromQuery] int barberId, [FromQuery] int serviceId, [FromQuery] DateTime date)
    {
        var query = new GetAvailableSlotsQuery
        {
            BarberId = barberId,
            ServiceId = serviceId,
            Date = date
        };
        var slots = await _mediator.Send(query);
        return Ok(slots);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAppointmentRequest request)
    {
        try
        {
            var command = new CreateAppointmentCommand
            {
                CustomerId = request.CustomerId,
                UserId = request.UserId,
                ServiceId = request.ServiceId,
                StartTime = request.StartTime,
                EndTime = request.EndTime,
                NewCustomerName = request.NewCustomerName,
                NewCustomerPhone = request.NewCustomerPhone
            };

            var appointment = await _mediator.Send(command);
            return CreatedAtAction(nameof(GetAll), new { id = appointment.Id }, appointment);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateAppointmentRequest request)
    {
        var command = new UpdateAppointmentCommand
        {
            Id = id,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            Status = request.Status
        };

        var appointment = await _mediator.Send(command);

        if (appointment == null)
        {
            return NotFound();
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _mediator.Send(new DeleteAppointmentCommand(id));

        if (!result)
        {
            return NotFound();
        }

        return NoContent();
    }
}
