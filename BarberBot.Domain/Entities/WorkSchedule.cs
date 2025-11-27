namespace BarberBot.Domain.Entities;

public class WorkSchedule
{
    public int Id { get; set; }
    public int BarberId { get; set; }
    public Barber Barber { get; set; } = null!;
    public DayOfWeek DayOfWeek { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public bool IsAvailable { get; set; } = true;
}
