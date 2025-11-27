namespace BarberBot.Application.DTOs;

public class CreateAppointmentRequest
{
    public int CustomerId { get; set; }
    public int UserId { get; set; }
    public int ServiceId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
}

public class UpdateAppointmentRequest
{
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string Status { get; set; } = string.Empty;
}
