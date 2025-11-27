using BarberBot.Application.Common.Interfaces;
using BarberBot.Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BarberBot.Application.WorkingHours.Commands.UpdateWorkingHours;

public record UpdateWorkingHoursCommand(List<UpdateWorkingHourRequest> WorkingHours) : IRequest<Unit>;

public class UpdateWorkingHoursCommandHandler : IRequestHandler<UpdateWorkingHoursCommand, Unit>
{
    private readonly IApplicationDbContext _context;

    public UpdateWorkingHoursCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Unit> Handle(UpdateWorkingHoursCommand request, CancellationToken cancellationToken)
    {
        foreach (var req in request.WorkingHours)
        {
            var workingHour = await _context.WorkingHours
                .FirstOrDefaultAsync(w => w.DayOfWeek == req.DayOfWeek, cancellationToken);

            if (workingHour != null)
            {
                workingHour.IsClosed = req.IsClosed;
                workingHour.StartTime = req.StartTime;
                workingHour.EndTime = req.EndTime;
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
