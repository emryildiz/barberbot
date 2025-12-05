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
            case "SelectingCancellation":
                await HandleCancellationSelection(customer, message);
                break;
            case "ConfirmingCancellation":
                await HandleCancellationConfirmation(customer, message);
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
            var services = await _context.Services.OrderBy(s => s.Id).ToListAsync();
            var serviceList = string.Join("\n", services.Select((s, index) => $"{index + 1}. {s.Name} ({s.Price} TL)"));
            
            await _whatsAppService.SendMessageAsync(customer.PhoneNumber, $"Hoş geldiniz {customer.Name}! Lütfen bir hizmet seçin (Numarasını yazın):\n{serviceList}");
            
            customer.CurrentState = "SelectingService";
            await _context.SaveChangesAsync(CancellationToken.None);
        }
        else if (message.Equals("İptal", StringComparison.OrdinalIgnoreCase))
        {
            var upcomingAppointments = await _context.Appointments
                .Include(a => a.Service)
                .Include(a => a.User)
                .Where(a => a.CustomerId == customer.Id && a.StartTime > DateTime.UtcNow && a.Status != "Cancelled")
                .OrderBy(a => a.StartTime)
                .ToListAsync();

            if (!upcomingAppointments.Any())
            {
                await _whatsAppService.SendMessageAsync(customer.PhoneNumber, "İptal edilecek aktif randevunuz bulunmamaktadır.");
                return;
            }

            var appointmentList = string.Join("\n", upcomingAppointments.Select((a, index) => 
                $"{index + 1}. {a.StartTime.AddHours(3):dd.MM.yyyy HH:mm} - {a.Service.Name} ({a.User.Username})"));

            await _whatsAppService.SendMessageAsync(customer.PhoneNumber, $"Lütfen iptal etmek istediğiniz randevunun numarasını yazınız:\n{appointmentList}");
            
            customer.CurrentState = "SelectingCancellation";
            await _context.SaveChangesAsync(CancellationToken.None);
        }
        else
        {
            await _whatsAppService.SendMessageAsync(customer.PhoneNumber, $"Merhaba {customer.Name}! Randevu almak için 'Randevu', randevu iptali için 'İptal' yazınız.");
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
        if (int.TryParse(message, out int selectionIndex) && selectionIndex > 0)
        {
            var services = await _context.Services.OrderBy(s => s.Id).ToListAsync();
            
            if (selectionIndex <= services.Count)
            {
                var service = services[selectionIndex - 1];
                customer.SelectedServiceId = service.Id;
                
                var barbers = await _context.Users
                    .Where(u => (u.Role == "Barber" || u.Role == "Owner") && u.IsActive && !u.IsOnLeave)
                    .OrderBy(u => u.Id)
                    .ToListAsync();
                var barberList = string.Join("\n", barbers.Select((b, index) => $"{index + 1}. {b.Username}"));

                await _whatsAppService.SendMessageAsync(customer.PhoneNumber, $"Harika! {service.Name} seçtiniz. Şimdi bir berber seçin:\n{barberList}");
                
                customer.CurrentState = "SelectingBarber";
                await _context.SaveChangesAsync(CancellationToken.None);
                return;
            }
        }
        
        await _whatsAppService.SendMessageAsync(customer.PhoneNumber, "Geçersiz hizmet numarası. Lütfen tekrar deneyin.");
    }

    private async Task HandleBarberSelection(Customer customer, string message)
    {
        if (int.TryParse(message, out int selectionIndex) && selectionIndex > 0)
        {
            var barbers = await _context.Users
                .Where(u => (u.Role == "Barber" || u.Role == "Owner") && u.IsActive && !u.IsOnLeave)
                .OrderBy(u => u.Id)
                .ToListAsync();

            if (selectionIndex <= barbers.Count)
            {
                var user = barbers[selectionIndex - 1];
                customer.SelectedUserId = user.Id;
                
                await _whatsAppService.SendMessageAsync(customer.PhoneNumber, $"{user.Username} seçildi. Hangi tarihte gelmek istersiniz? (Örn: 25.11.2023, Bugün, Yarın)");
                
                customer.CurrentState = "SelectingDate";
                await _context.SaveChangesAsync(CancellationToken.None);
                return;
            }
        }

        await _whatsAppService.SendMessageAsync(customer.PhoneNumber, "Geçersiz berber numarası. Lütfen tekrar deneyin.");
    }

    private async Task HandleDateSelection(Customer customer, string message)
    {
        DateTime? selectedDate = null;

        var turkeyNow = DateTime.UtcNow.AddHours(3);

        if (message.Equals("bugün", StringComparison.OrdinalIgnoreCase))
        {
            selectedDate = turkeyNow.Date;
        }
        else if (message.Equals("yarın", StringComparison.OrdinalIgnoreCase))
        {
            selectedDate = turkeyNow.Date.AddDays(1);
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
            
            // Parse DB times strictly
            if (!TimeSpan.TryParse(workingHour.StartTime, out TimeSpan start)) start = new TimeSpan(9, 0, 0);
            if (!TimeSpan.TryParse(workingHour.EndTime, out TimeSpan end)) end = new TimeSpan(21, 0, 0);

            // Fetch existing appointments for the selected barber and date
            var existingAppointments = await _context.Appointments
                .Where(a => a.UserId == customer.SelectedUserId && 
                            a.StartTime.Date == selectedDate.Value.Date && 
                            a.Status != "Cancelled")
                .ToListAsync();

            var service = await _context.Services.FindAsync(customer.SelectedServiceId);
            var serviceDuration = service?.DurationMinutes ?? 30;

            var slots = new List<string>();
            var current = start;
            
            // Turkey Time (UTC+3)
            var turkeyTime = DateTime.UtcNow.AddHours(3);
            var isToday = selectedDate.Value.Date == turkeyTime.Date;

            while (current < end)
            {
                // If it's today, filter out passed times (buffer 15 mins)
                if (isToday && current <= turkeyTime.TimeOfDay.Add(TimeSpan.FromMinutes(15)))
                {
                    current = current.Add(TimeSpan.FromMinutes(30));
                    continue;
                }

                // Check for overlap with existing appointments
                var slotStart = current;
                var slotEnd = current.Add(TimeSpan.FromMinutes(serviceDuration));
                
                // Ensure slot doesn't exceed working hours
                if (slotEnd > end)
                {
                     current = current.Add(TimeSpan.FromMinutes(30));
                     continue;
                }

                // Existing appointments are in UTC, convert to TRT for comparison
                var isOverlapping = existingAppointments.Any(a => 
                    a.StartTime.AddHours(3).TimeOfDay < slotEnd && a.EndTime.AddHours(3).TimeOfDay > slotStart);

                if (!isOverlapping)
                {
                    slots.Add(current.ToString(@"hh\:mm"));
                }
                
                current = current.Add(TimeSpan.FromMinutes(30));
            }

            if (!slots.Any())
            {
                 await _whatsAppService.SendMessageAsync(customer.PhoneNumber, "Seçtiğiniz tarihte uygun saat kalmadı. Lütfen başka bir tarih seçiniz.");
                 return;
            }

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

            // Convert to UTC for DB operations (TRT - 3 hours)
            var startTimeUtc = startTime.AddHours(-3);
            var endTimeUtc = endTime.AddHours(-3);

            // Check availability using UTC times
            var isAvailable = !await _context.Appointments
                .AnyAsync(a => a.UserId == customer.SelectedUserId &&
                               a.StartTime < endTimeUtc &&
                               a.EndTime > startTimeUtc &&
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
                StartTime = startTimeUtc,
                EndTime = endTimeUtc,
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

    private async Task HandleCancellationSelection(Customer customer, string message)
    {
        if (int.TryParse(message, out int selectionIndex) && selectionIndex > 0)
        {
            var upcomingAppointments = await _context.Appointments
                .Include(a => a.Service)
                .Include(a => a.User)
                .Where(a => a.CustomerId == customer.Id && a.StartTime > DateTime.UtcNow && a.Status != "Cancelled")
                .OrderBy(a => a.StartTime)
                .ToListAsync();

            if (selectionIndex <= upcomingAppointments.Count)
            {
                var appointment = upcomingAppointments[selectionIndex - 1];
                // Store AppointmentId in SelectedServiceId (reusing field)
                customer.SelectedServiceId = appointment.Id;
                
                await _whatsAppService.SendMessageAsync(customer.PhoneNumber, $"{appointment.StartTime.AddHours(3):dd.MM.yyyy HH:mm} tarihli randevunuzu iptal etmek istediğinize emin misiniz? (Evet/Hayır)");
                
                customer.CurrentState = "ConfirmingCancellation";
                await _context.SaveChangesAsync(CancellationToken.None);
                return;
            }
        }
        
        await _whatsAppService.SendMessageAsync(customer.PhoneNumber, "Geçersiz numara. Lütfen tekrar deneyin veya 'vazgeç' yazın.");
    }

    private async Task HandleCancellationConfirmation(Customer customer, string message)
    {
        if (message.Equals("evet", StringComparison.OrdinalIgnoreCase))
        {
            if (customer.SelectedServiceId.HasValue)
            {
                var appointment = await _context.Appointments.FindAsync(customer.SelectedServiceId.Value);
                if (appointment != null)
                {
                    appointment.Status = "Cancelled";
                    await _context.SaveChangesAsync(CancellationToken.None);
                    
                    await ResetState(customer, "Randevunuz başarıyla iptal edilmiştir.");
                    return;
                }
                else
                {
                    await ResetState(customer, "Randevu bulunamadı.");
                    return;
                }
            }
        }
        else if (message.Equals("hayır", StringComparison.OrdinalIgnoreCase) || message.Equals("vazgeç", StringComparison.OrdinalIgnoreCase))
        {
            await ResetState(customer, "İptal işlemi vazgeçildi.");
            return;
        }

        await _whatsAppService.SendMessageAsync(customer.PhoneNumber, "Lütfen 'Evet' veya 'Hayır' yazınız.");
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
