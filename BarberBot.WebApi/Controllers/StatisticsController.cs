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

    private (DateTime Start, DateTime End) GetDateRange(string timeRange)
    {
        var today = DateTime.Today;
        if (timeRange == "lastMonth")
        {
            var start = new DateTime(today.Year, today.Month, 1).AddMonths(-1);
            var end = start.AddMonths(1).AddDays(-1);
            return (start, end);
        }
        else if (timeRange == "thisYear")
        {
            var start = new DateTime(today.Year, 1, 1);
            var end = new DateTime(today.Year, 12, 31);
            return (start, end);
        }
        // Default: thisMonth
        var startMonth = new DateTime(today.Year, today.Month, 1);
        var endMonth = startMonth.AddMonths(1).AddDays(-1);
        return (startMonth, endMonth);
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboardStats([FromQuery] string timeRange = "thisMonth")
    {
        var (startDate, endDate) = GetDateRange(timeRange);

        var appointments = await _context.Appointments
            .Where(a => a.StartTime >= startDate && a.StartTime <= endDate.AddDays(1)) // Inclusive end date
            .ToListAsync();

        var dailyStats = new List<object>();
        // If range is large (e.g. year), maybe group by month? For now, keep daily but it might be too much data.
        // Let's stick to daily for consistency with frontend chart.
        
        for (var date = startDate; date <= endDate && date <= DateTime.Today; date = date.AddDays(1))
        {
            var dayAppointments = appointments.Where(a => a.StartTime.Date == date).ToList();
            var total = dayAppointments.Count;
            var whatsapp = dayAppointments.Count(a => a.Id % 2 == 0); 

            dailyStats.Add(new 
            { 
                Date = date.ToString("dd MMM"), // e.g. 01 Jan
                FullDate = date.ToString("yyyy-MM-dd"),
                TotalCount = total,
                WhatsappCount = whatsapp
            });
        }

        return Ok(dailyStats);
    }

    [HttpGet("services")]
    public async Task<IActionResult> GetServiceStats([FromQuery] string timeRange = "thisMonth")
    {
        var (startDate, endDate) = GetDateRange(timeRange);

        var appointments = await _context.Appointments
            .Include(a => a.Service)
            .Where(a => a.StartTime >= startDate && a.StartTime <= endDate.AddDays(1))
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
    public async Task<IActionResult> GetSummaryStats([FromQuery] string timeRange = "thisMonth")
    {
        var (startDate, endDate) = GetDateRange(timeRange);
        
        var appointments = await _context.Appointments
            .Include(a => a.Service)
            .Where(a => a.StartTime >= startDate && a.StartTime <= endDate.AddDays(1))
            .ToListAsync();

        var total = appointments.Count;
        var whatsapp = appointments.Count(a => a.Id % 2 == 0); // Mock logic

        // Calculate Occupancy Rate
        double occupancyRate = 0;
        
        // 1. Calculate Total Booked Minutes
        var totalBookedMinutes = appointments.Sum(a => a.Service?.DurationMinutes ?? 30); // Default 30 if null

        // 2. Calculate Total Capacity Minutes
        var barbersCount = await _context.Users
            .CountAsync(u => (u.Role == "Barber" || u.Role == "Owner") && u.IsActive);
        
        if (barbersCount == 0) barbersCount = 1; // Fallback

        var workingHours = await _context.WorkingHours.ToListAsync();
        
        // Calculate days in range (up to today if range includes future)
        var effectiveEndDate = endDate > DateTime.Today ? DateTime.Today : endDate;
        if (startDate > effectiveEndDate) effectiveEndDate = startDate; // Handle edge case

        // If no working hours defined, use default 9-21 (12 hours = 720 mins)
        if (!workingHours.Any())
        {
            var daysInRange = (effectiveEndDate - startDate).Days + 1;
            var totalCapacity = daysInRange * 720 * barbersCount;
            if (totalCapacity > 0)
                occupancyRate = (double)totalBookedMinutes / totalCapacity * 100;
        }
        else
        {
            double totalCapacityMinutes = 0;
            for (var date = startDate; date <= effectiveEndDate; date = date.AddDays(1))
            {
                var dayOfWeek = (int)date.DayOfWeek;
                var hours = workingHours.FirstOrDefault(wh => wh.DayOfWeek == dayOfWeek);

                if (hours != null && !hours.IsClosed)
                {
                    if (TimeSpan.TryParse(hours.StartTime, out var start) && TimeSpan.TryParse(hours.EndTime, out var end))
                    {
                        var minutes = (end - start).TotalMinutes;
                        totalCapacityMinutes += minutes * barbersCount;
                    }
                }
            }

            if (totalCapacityMinutes > 0)
            {
                occupancyRate = (double)totalBookedMinutes / totalCapacityMinutes * 100;
            }
        }

        return Ok(new 
        { 
            TotalAppointments = total,
            WhatsappAppointments = whatsapp,
            OccupancyRate = Math.Round(occupancyRate, 1)
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
