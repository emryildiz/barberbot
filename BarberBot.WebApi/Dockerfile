# See https://aka.ms/customizecontainer to learn how to customize your debug container and how Visual Studio uses this Dockerfile to build your images for faster debugging.

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["BarberBot.WebApi/BarberBot.WebApi.csproj", "BarberBot.WebApi/"]
COPY ["BarberBot.Application/BarberBot.Application.csproj", "BarberBot.Application/"]
COPY ["BarberBot.Domain/BarberBot.Domain.csproj", "BarberBot.Domain/"]
COPY ["BarberBot.Infrastructure/BarberBot.Infrastructure.csproj", "BarberBot.Infrastructure/"]
RUN dotnet restore "BarberBot.WebApi/BarberBot.WebApi.csproj"
COPY . .
WORKDIR "/src/BarberBot.WebApi"
RUN dotnet build "BarberBot.WebApi.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "BarberBot.WebApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "BarberBot.WebApi.dll"]
