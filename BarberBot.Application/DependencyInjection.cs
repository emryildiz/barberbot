using BarberBot.Application.Common.Interfaces;
using MediatR;
using Microsoft.Extensions.DependencyInjection;

namespace BarberBot.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddTransient<IBotService, Services.BotService>();
        services.AddMediatR(cfg => {
            cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly);
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(Common.Behaviors.LoggingBehavior<,>));
        });
        services.AddAutoMapper(typeof(DependencyInjection).Assembly);
        return services;
    }
}
