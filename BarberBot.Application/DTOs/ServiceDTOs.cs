namespace BarberBot.Application.DTOs;

public class CreateServiceRequest
{
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int DurationMinutes { get; set; }
}

public class UpdateServiceRequest
{
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int DurationMinutes { get; set; }
}
