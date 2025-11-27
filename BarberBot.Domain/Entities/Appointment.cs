namespace BarberBot.Domain.Entities;

public class Appointment
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int ServiceId { get; set; }
    public Service Service { get; set; } = null!;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Confirmed, Cancelled
    public bool IsReminderSent { get; set; } = false;
}
