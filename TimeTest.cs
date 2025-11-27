using System;

public class Program
{
    public static void Main()
    {
        string message = "10:00";
        string startTimeStr = "09:00";
        string endTimeStr = "21:00";
        int durationMinutes = 30;

        if (TimeSpan.TryParse(message, out TimeSpan time))
        {
            var start = TimeSpan.Parse(startTimeStr);
            var end = TimeSpan.Parse(endTimeStr);
            
            // Simulate start time calculation
            // Note: In the actual code, startTime is a DateTime, but here we are just checking the time part logic
            // The issue might be related to how endTime.TimeOfDay is calculated if it crosses midnight, 
            // but 10:00 + 30 mins = 10:30 is well within range.
            
            var endTimeOfDay = time.Add(TimeSpan.FromMinutes(durationMinutes));

            Console.WriteLine($"Time: {time}");
            Console.WriteLine($"Start Limit: {start}");
            Console.WriteLine($"End Limit: {end}");
            Console.WriteLine($"Calculated End Time: {endTimeOfDay}");

            if (time < start || endTimeOfDay > end)
            {
                 Console.WriteLine("Validation Failed!");
            }
            else
            {
                 Console.WriteLine("Validation Passed!");
            }
        }
    }
}
