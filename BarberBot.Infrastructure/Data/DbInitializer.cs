using BarberBot.Application.Common.Interfaces;
using BarberBot.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BarberBot.Infrastructure.Data;

public static class DbInitializer
{
    public static void Initialize(AppDbContext context, IPasswordHasher passwordHasher)
    {
        if (context.Database.IsRelational())
        {
            context.Database.Migrate();
        }
        else
        {
            context.Database.EnsureCreated();
        }

        // Look for any users.
        if (context.Users.Any())
        {
            return;   // DB has been seeded
        }

        var admin = new User
        {
            Username = "admin",
            PasswordHash = passwordHasher.Hash("1234"),
            Role = "Admin"
        };
        var owner = new User
        {
            Username = "owner",
            PasswordHash = passwordHasher.Hash("1234"),
            Role = "Owner"
        };
        var barber = new User
        {
            Username = "barber",
            PasswordHash = passwordHasher.Hash("1234"),
            Role = "Barber"
        };

        context.Users.AddRange(admin,owner,barber);

        // Seed Services
        if (!context.Services.Any())
        {
            context.Services.AddRange(
                new Service { Name = "Saç Kesimi", Price = 150, DurationMinutes = 30 },
                new Service { Name = "Sakal Kesimi", Price = 100, DurationMinutes = 15 },
                new Service { Name = "Saç + Sakal", Price = 220, DurationMinutes = 45 }
            );
        }

        // Seed Working Hours
        if (!context.WorkingHours.Any())
        {
            var workingHours = new List<WorkingHour>();
            // 0=Sunday, 1=Monday, ..., 6=Saturday
            for (int i = 0; i <= 6; i++)
            {
                workingHours.Add(new WorkingHour
                {
                    DayOfWeek = i,
                    IsClosed = i == 0, // Sunday closed by default
                    StartTime = "09:00",
                    EndTime = "21:00"
                });
            }
            context.WorkingHours.AddRange(workingHours);
        }

        context.SaveChanges();
    }
}
