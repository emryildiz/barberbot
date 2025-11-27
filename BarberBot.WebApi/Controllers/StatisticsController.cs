using BarberBot.Application.Common.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BarberBot.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Owner")]
public class StatisticsController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public StatisticsController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboardStats()
    {
        var today = DateTime.Today;
        var last30Days = today.AddDays(-30);

        var appointments = await _context.Appointments
            .Where(a => a.StartTime >= last30Days)
            .ToListAsync();

        // Mocking "WhatsApp" vs "Other" distinction for now since we don't track source explicitly yet.
        // In a real app, we would have a 'Source' field.
        // For demo, let's assume if created by "Guest" named user it might be WhatsApp, or just random for visual.
        
        var dailyStats = new List<object>();
        for (var date = last30Days; date <= today; date = date.AddDays(1))
        {
            var dayAppointments = appointments.Where(a => a.StartTime.Date == date).ToList();
            var total = dayAppointments.Count;
            // Randomly assigning some as WhatsApp for visualization purposes as requested by UI
            var whatsapp = dayAppointments.Count(a => a.Id % 2 == 0); 

            dailyStats.Add(new 
            { 
                Date = date.ToString("dd"), // Just day number for x-axis
                FullDate = date.ToString("yyyy-MM-dd"),
                TotalCount = total,
                WhatsappCount = whatsapp
            });
        }

        return Ok(dailyStats);
    }

    [HttpGet("services")]
    public async Task<IActionResult> GetServiceStats()
    {
        var appointments = await _context.Appointments
            .Include(a => a.Service)
            .ToListAsync();

        var totalAppointments = appointments.Count;
        if (totalAppointments == 0) return Ok(new { PieChart = new List<object>(), Popular = new List<object>() });

        var serviceGroups = appointments
            .GroupBy(a => a.Service.Name)
            .Select(g => new 
            { 
                Name = g.Key, 
                Count = g.Count(),
                Percentage = (double)g.Count() / totalAppointments * 100
            })
            .OrderByDescending(x => x.Count)
            .ToList();

        // Colors for pie chart
        var colors = new[] { "#2e2e3e", "#d32f2f", "#4caf50", "#ff9800", "#2196f3" };
        var pieChartData = serviceGroups.Select((s, index) => new 
        {
            name = s.Name,
            value = s.Percentage,
            color = colors[index % colors.Length]
        }).ToList();

        return Ok(new 
        { 
            PieChart = pieChartData, 
            Popular = serviceGroups 
        });
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummaryStats()
    {
        var today = DateTime.Today;
        var startOfMonth = new DateTime(today.Year, today.Month, 1);
        
        var appointments = await _context.Appointments
            .Where(a => a.StartTime >= startOfMonth)
            .ToListAsync();

        var total = appointments.Count;
        var whatsapp = appointments.Count(a => a.Id % 2 == 0); // Mock logic
        var occupancy = 94; // Mock value for demo

        return Ok(new 
        { 
            TotalAppointments = total,
            WhatsappAppointments = whatsapp,
            OccupancyRate = occupancy
        });
    }

    [HttpGet("customers")]
    public async Task<IActionResult> GetCustomerStats()
    {
        var stats = await _context.Appointments
            .Include(a => a.Customer)
            .GroupBy(a => new { a.Customer.PhoneNumber, a.Customer.Name })
            .Select(g => new 
            { 
                PhoneNumber = g.Key.PhoneNumber, 
                Name = g.Key.Name, 
                VisitCount = g.Count(),
                LastVisit = g.Max(a => a.StartTime)
            })
            .OrderByDescending(x => x.VisitCount)
            .ToListAsync();

        return Ok(stats);
    }
}
