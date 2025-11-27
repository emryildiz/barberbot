namespace BarberBot.Domain.Entities;

public class WorkingHour
{
    public int Id { get; set; }
    public int DayOfWeek { get; set; } // 0 = Sunday, 1 = Monday, ... 6 = Saturday
    public bool IsClosed { get; set; }
    public string StartTime { get; set; } = "09:00";
    public string EndTime { get; set; } = "21:00";
}
