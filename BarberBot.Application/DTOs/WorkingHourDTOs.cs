namespace BarberBot.Application.DTOs;

public class UpdateWorkingHourRequest
{
    public int DayOfWeek { get; set; }
    public bool IsClosed { get; set; }
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
}
