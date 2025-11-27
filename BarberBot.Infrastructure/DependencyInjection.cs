using BarberBot.Application.Common.Interfaces;
using BarberBot.Infrastructure.Authentication;
using BarberBot.Infrastructure.Data;
using BarberBot.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace BarberBot.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseInMemoryDatabase("BarberBotDb"));

        services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<AppDbContext>());
        services.AddTransient<IWhatsAppService, WhatsAppService>();
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddHostedService<AppointmentReminderService>();

        return services;
    }
}
