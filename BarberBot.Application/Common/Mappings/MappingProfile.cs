using AutoMapper;
using BarberBot.Application.Appointments.Commands.CreateAppointment;
using BarberBot.Application.Appointments.Commands.UpdateAppointment;

using BarberBot.Application.DTOs;
using BarberBot.Application.Services.Commands.CreateService;
using BarberBot.Application.Services.Commands.UpdateService;
using BarberBot.Application.Users.Commands.CreateUser;
using BarberBot.Application.WorkingHours.Commands.UpdateWorkingHours;
using BarberBot.Domain.Entities;

namespace BarberBot.Application.Common.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // Services
        CreateMap<CreateServiceRequest, CreateServiceCommand>();
        CreateMap<UpdateServiceRequest, UpdateServiceCommand>();
        CreateMap<CreateServiceCommand, Service>();
        CreateMap<UpdateServiceCommand, Service>();

        // Barbers
        // Barbers - Removed as we use Users now
        // CreateMap<CreateBarberRequest, CreateBarberCommand>();
        // CreateMap<UpdateBarberRequest, UpdateBarberCommand>();
        // CreateMap<CreateBarberCommand, Barber>();
        // CreateMap<UpdateBarberCommand, Barber>();

        // WorkingHours
        CreateMap<UpdateWorkingHourRequest, WorkingHour>();

        // Appointments
        CreateMap<CreateAppointmentRequest, CreateAppointmentCommand>();
        CreateMap<UpdateAppointmentRequest, UpdateAppointmentCommand>();
        CreateMap<CreateAppointmentCommand, Appointment>();
        CreateMap<UpdateAppointmentCommand, Appointment>();

        // Users
        CreateMap<CreateUserRequest, CreateUserCommand>();
        CreateMap<CreateUserCommand, User>();
    }
}
