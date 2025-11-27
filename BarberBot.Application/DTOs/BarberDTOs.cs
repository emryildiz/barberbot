namespace BarberBot.Application.DTOs;

public class CreateBarberRequest
{
    public string Name { get; set; } = string.Empty;
}

public class UpdateBarberRequest
{
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}
