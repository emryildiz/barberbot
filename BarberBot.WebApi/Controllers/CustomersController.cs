using BarberBot.Application.Common.Interfaces;
using BarberBot.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BarberBot.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public CustomersController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Barber,Owner")]
    public async Task<IActionResult> GetAll()
    {
        var customers = await _context.Customers
            .Include(c => c.Appointments)
            .Select(c => new 
            {
                c.Id,
                c.Name,
                c.PhoneNumber,
                VisitCount = c.Appointments.Count(a => a.Status != "Cancelled")
            })
            .OrderByDescending(c => c.VisitCount)
            .ToListAsync();

        return Ok(customers);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Barber,Owner")]
    public async Task<IActionResult> Create([FromBody] CreateCustomerRequest request)
    {
        // Check if customer with this phone number already exists
        var existingCustomer = await _context.Customers
            .FirstOrDefaultAsync(c => c.PhoneNumber == request.PhoneNumber);

        if (existingCustomer != null)
        {
            return BadRequest(new { message = "Bu telefon numarası ile kayıtlı bir müşteri zaten mevcut." });
        }

        var customer = new Customer
        {
            Name = request.Name,
            PhoneNumber = request.PhoneNumber
        };

        _context.Customers.Add(customer);
        await _context.SaveChangesAsync(CancellationToken.None);

        return Ok(customer);
    }
}

public class CreateCustomerRequest
{
    public string Name { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
}
