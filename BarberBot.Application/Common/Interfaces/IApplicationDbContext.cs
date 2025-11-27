using BarberBot.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BarberBot.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<Customer> Customers { get; }
    DbSet<Service> Services { get; }
    DbSet<WorkingHour> WorkingHours { get; }
    DbSet<Appointment> Appointments { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
