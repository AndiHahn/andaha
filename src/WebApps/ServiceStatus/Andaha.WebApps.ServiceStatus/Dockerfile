FROM mcr.microsoft.com/dotnet/aspnet:6.0-bullseye-slim AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:6.0-bullseye-slim AS build
WORKDIR /src
COPY [".", "Andaha.WebApps.ServiceStatus/"]
RUN dotnet restore "Andaha.WebApps.ServiceStatus/Andaha.WebApps.ServiceStatus.csproj"
COPY . .
WORKDIR "/src/Andaha.WebApps.ServiceStatus"
RUN dotnet build "Andaha.WebApps.ServiceStatus.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Andaha.WebApps.ServiceStatus.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Andaha.WebApps.ServiceStatus.dll"]