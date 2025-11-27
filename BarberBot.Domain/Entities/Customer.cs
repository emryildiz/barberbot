namespace BarberBot.Domain.Entities;

public class Customer
{
    public int Id { get; set; }
    public string PhoneNumber { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    
    // Conversation State
    public string CurrentState { get; set; } = "None"; // None, SelectingService, SelectingBarber, SelectingDate, SelectingTime
    public int? SelectedServiceId { get; set; }
    public int? SelectedUserId { get; set; }
    public DateTime? SelectedDate { get; set; }

    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}
