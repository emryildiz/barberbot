using System;
using System.Globalization;
using System.Threading;

public class Program
{
    public static void Main()
    {
        var culture = new CultureInfo("tr-TR");
        Thread.CurrentThread.CurrentCulture = culture;

        string message = "10.00";
        string dbStartTime = "09:00";
        string dbEndTime = "21:00";

        Console.WriteLine($"Current Culture: {CultureInfo.CurrentCulture.Name}");

        if (TimeSpan.TryParse(message, out TimeSpan time))
        {
            Console.WriteLine($"Parsed User Input '{message}': {time}");
        }
        else
        {
            Console.WriteLine($"Failed to parse '{message}'");
        }

        if (TimeSpan.TryParse(dbStartTime, out TimeSpan start))
        {
             Console.WriteLine($"Parsed DB Start '{dbStartTime}': {start}");
        }
        else
        {
             Console.WriteLine($"Failed to parse DB Start '{dbStartTime}'");
        }
        
        // Check logic
        if (TimeSpan.TryParse(message, out TimeSpan t) && TimeSpan.TryParse(dbStartTime, out TimeSpan s))
        {
            if (t < s)
            {
                Console.WriteLine($"{t} is less than {s} (Validation Fail)");
            }
            else
            {
                Console.WriteLine($"{t} is >= {s} (Validation Pass)");
            }
        }
    }
}
