using BarberBot.Application.Common.Interfaces;
using BarberBot.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BarberBot.Application.Services;

public class BotService : IBotService
{
    private readonly IWhatsAppService _whatsAppService;
    private readonly IApplicationDbContext _context;

    public BotService(IWhatsAppService whatsAppService, IApplicationDbContext context)
    {
        _whatsAppService = whatsAppService;
        _context = context;
    }

    public async Task ProcessIncomingMessageAsync(string from, string message)
    {
        // Normalize phone number
        if (from.StartsWith("whatsapp:"))
        {
            from = from.Replace("whatsapp:", "");
        }
        
        // Ensure consistent format (e.g. remove spaces, maybe handle +)
        // For now, just relying on stripping whatsapp: is a good start. 
        // Ideally we should store E.164.

        var customer = await _context.Customers.FirstOrDefaultAsync(c => c.PhoneNumber == from);
        if (customer == null)
        {
            customer = new Customer { PhoneNumber = from, Name = "Guest" };
            _context.Customers.Add(customer);
            await _context.SaveChangesAsync(CancellationToken.None);
        }

        message = message.Trim();

        // ... (rest of the switch)
        switch (customer.CurrentState)
        {
            case "EnteringName":
                await HandleNameEntry(customer, message);
                break;
            case "None":
                await HandleGreeting(customer, message);
                break;
            case "SelectingService":
                await HandleServiceSelection(customer, message);
                break;
            case "SelectingBarber":
                await HandleBarberSelection(customer, message);
                break;
            case "SelectingDate":
                await HandleDateSelection(customer, message);
                break;
            case "SelectingTime":
                await HandleTimeSelection(customer, message);
                break;
            default:
                await ResetState(customer, "Bir hata oluştu. Başa dönüyoruz.");
                break;
        }
    }

    private async Task HandleGreeting(Customer customer, string message)
    {
        if (customer.Name == "Guest")
        {
            await _whatsAppService.SendMessageAsync(customer.PhoneNumber, "Merhaba! Size hitap edebilmemiz için lütfen adınızı soyadınızı yazar mısınız?");
            customer.CurrentState = "EnteringName";
            await _context.SaveChangesAsync(CancellationToken.None);
            return;
        }

        if (message.Equals("Randevu", StringComparison.OrdinalIgnoreCase))
        {
            var services = await _context.Services.ToListAsync();
            var serviceList = string.Join("\n", services.Select(s => $"{s.Id}. {s.Name} ({s.Price} TL)"));
            
            await _whatsAppService.SendMessageAsync(customer.PhoneNumber, $"Hoş geldiniz {customer.Name}! Lütfen bir hizmet seçin (ID yazın):\n{serviceList}");
            
            customer.CurrentState = "SelectingService";
            await _context.SaveChangesAsync(CancellationToken.None);
        }
        else
        {
            await _whatsAppService.SendMessageAsync(customer.PhoneNumber, $"Merhaba {customer.Name}! Randevu almak için 'Randevu' yazınız.");
        }
    }

    private async Task HandleNameEntry(Customer customer, string message)
    {
        if (string.IsNullOrWhiteSpace(message))
        {
            await _whatsAppService.SendMessageAsync(customer.PhoneNumber, "Lütfen geçerli bir isim giriniz.");
            return;
        }

        customer.Name = message.Trim();
        customer.CurrentState = "None";
        await _context.SaveChangesAsync(CancellationToken.None);

        await _whatsAppService.SendMessageAsync(customer.PhoneNumber, $"Memnun oldum {customer.Name}! Randevu almak için 'Randevu' yazabilirsin.");
    }

    private async Task HandleServiceSelection(Customer customer, string message)
    {
        if (int.TryParse(message, out int serviceId))
        {
            var service = await _context.Services.FindAsync(serviceId);
            if (service != null)
            {
                customer.SelectedServiceId = serviceId;
                
                var barbers = await _context.Users
                    .Where(u => u.Role == "Barber" || u.Role == "Owner")
                    .ToListAsync();
                var barberList = string.Join("\n", barbers.Select(b => $"{b.Id}. {b.Username}"));

                await _whatsAppService.SendMessageAsync(customer.PhoneNumber, $"Harika! {service.Name} seçtiniz. Şimdi bir berber seçin:\n{barberList}");
                
                customer.CurrentState = "SelectingBarber";
                await _context.SaveChangesAsync(CancellationToken.None);
                return;
            }
        }
        
        await _whatsAppService.SendMessageAsync(customer.PhoneNumber, "Geçersiz hizmet ID'si. Lütfen tekrar deneyin.");
    }

    private async Task HandleBarberSelection(Customer customer, string message)
    {
        if (int.TryParse(message, out int userId))
        {
            var user = await _context.Users.FindAsync(userId);
            if (user != null && (user.Role == "Barber" || user.Role == "Owner"))
            {
                customer.SelectedUserId = userId;
                
                await _whatsAppService.SendMessageAsync(customer.PhoneNumber, $"{user.Username} seçildi. Hangi tarihte gelmek istersiniz? (Örn: 25.11.2023, Bugün, Yarın)");
                
                customer.CurrentState = "SelectingDate";
                await _context.SaveChangesAsync(CancellationToken.None);
                return;
            }
        }

        await _whatsAppService.SendMessageAsync(customer.PhoneNumber, "Geçersiz berber ID'si. Lütfen tekrar deneyin.");
    }

    private async Task HandleDateSelection(Customer customer, string message)
    {
        DateTime? selectedDate = null;

        if (message.Equals("bugün", StringComparison.OrdinalIgnoreCase))
        {
            selectedDate = DateTime.Today;
        }
        else if (message.Equals("yarın", StringComparison.OrdinalIgnoreCase))
        {
            selectedDate = DateTime.Today.AddDays(1);
        }

        else if (DateTime.TryParseExact(message, new[] { "dd.MM.yyyy", "d.M.yyyy", "dd-MM-yyyy", "yyyy-MM-dd" }, 
                 System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out DateTime date))
        {
            selectedDate = date.Date;
        }

        if (selectedDate.HasValue)
        {
            // Check working hours
            var dayOfWeek = (int)selectedDate.Value.DayOfWeek;
            var workingHour = await _context.WorkingHours.FirstOrDefaultAsync(w => w.DayOfWeek == dayOfWeek);

            if (workingHour == null || workingHour.IsClosed)
            {
                await _whatsAppService.SendMessageAsync(customer.PhoneNumber, $"Seçtiğiniz tarihte ({selectedDate.Value:dd.MM.yyyy}) işletmemiz kapalıdır. Lütfen başka bir tarih giriniz (Örn: Yarın, {DateTime.Now.AddDays(2):dd.MM.yyyy}).");
                return; // Stay in SelectingDate state
            }

            customer.SelectedDate = selectedDate.Value;
            
            // Simplified: Assume slots are 10:00, 11:00, ... 19:30
            // In real app, check availability
            var slots = new List<string> 
            { 
                "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", 
                "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", 
                "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", 
                "19:00", "19:30" 
            };
            var slotList = string.Join("\n", slots);

            await _whatsAppService.SendMessageAsync(customer.PhoneNumber, $"Tarih: {selectedDate.Value.ToString("dd.MM.yyyy")}. Lütfen saat seçin:\n{slotList}");
            
            customer.CurrentState = "SelectingTime";
            await _context.SaveChangesAsync(CancellationToken.None);
        }
        else
        {
            await _whatsAppService.SendMessageAsync(customer.PhoneNumber, "Geçersiz tarih formatı. 'Bugün', 'Yarın' veya GG.AA.YYYY formatında girin (Örn: 25.11.2023).");
        }
    }

    private async Task HandleTimeSelection(Customer customer, string message)
    {
        // Try multiple formats
        string[] formats = { "h\\:mm", "hh\\:mm", "H\\:mm", "HH\\:mm", "h\\.mm", "hh\\.mm", "H\\.mm", "HH\\.mm" };
        
        if (TimeSpan.TryParseExact(message, formats, System.Globalization.CultureInfo.InvariantCulture, out TimeSpan time))
        {
            var startTime = customer.SelectedDate!.Value.Date.Add(time); // Ensure Date part is clean
            var service = await _context.Services.FindAsync(customer.SelectedServiceId);
            var endTime = startTime.AddMinutes(service!.DurationMinutes);

            // Check working hours
            var dayOfWeek = (int)startTime.DayOfWeek;
            var workingHour = await _context.WorkingHours.FirstOrDefaultAsync(w => w.DayOfWeek == dayOfWeek);

            if (workingHour == null || workingHour.IsClosed)
            {
                await _whatsAppService.SendMessageAsync(customer.PhoneNumber, "Üzgünüz, seçtiğiniz tarihte işletmemiz kapalıdır. Lütfen başka bir tarih seçiniz.");
                return;
            }

            // Parse DB times strictly
            var start = TimeSpan.Parse(workingHour.StartTime);
            var end = TimeSpan.Parse(workingHour.EndTime);

            // Logging for debug
            Console.WriteLine($"Time Check: Input={time}, Start={start}, End={end}, EndTimeOfDay={endTime.TimeOfDay}");

            if (time < start || endTime.TimeOfDay > end)
            {
                await _whatsAppService.SendMessageAsync(customer.PhoneNumber, $"Üzgünüz, çalışma saatlerimiz {workingHour.StartTime} - {workingHour.EndTime} arasındadır. Lütfen bu saatler arasında bir zaman seçiniz.");
                return;
            }

            // Check availability
            var isAvailable = !await _context.Appointments
                .AnyAsync(a => a.UserId == customer.SelectedUserId &&
                               a.StartTime < endTime &&
                               a.EndTime > startTime &&
                               a.Status != "Cancelled"); // Ignore cancelled appointments

            if (!isAvailable)
            {
                await _whatsAppService.SendMessageAsync(customer.PhoneNumber, "Seçtiğiniz saat dolu. Lütfen başka bir saat belirtiniz.");
                return;
            }

            var appointment = new Appointment
            {
                CustomerId = customer.Id,
                UserId = customer.SelectedUserId!.Value,
                ServiceId = customer.SelectedServiceId!.Value,
                StartTime = startTime,
                EndTime = endTime,
                Status = "Pending"
            };

            _context.Appointments.Add(appointment);
            
            // Reset state
            customer.CurrentState = "None";
            customer.SelectedServiceId = null;
            customer.SelectedUserId = null;
            customer.SelectedDate = null;

            await _context.SaveChangesAsync(CancellationToken.None);

            await _whatsAppService.SendMessageAsync(customer.PhoneNumber, $"Randevu talebiniz alındı! {startTime:dd.MM.yyyy HH:mm} tarihi için onay bekleniyor. Onaylandığında size bilgi vereceğiz.");
        }
        else
        {
            await _whatsAppService.SendMessageAsync(customer.PhoneNumber, "Geçersiz saat formatı. Lütfen SS:DD formatında girin (Örn: 09:00 veya 14.30).");
        }
    }

    private async Task ResetState(Customer customer, string message)
    {
        customer.CurrentState = "None";
        customer.SelectedServiceId = null;
        customer.SelectedUserId = null;
        customer.SelectedDate = null;
        await _context.SaveChangesAsync(CancellationToken.None);
        await _whatsAppService.SendMessageAsync(customer.PhoneNumber, message);
    }
}
