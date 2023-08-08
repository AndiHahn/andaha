FROM mcr.microsoft.com/dotnet/aspnet:7.0-bullseye-slim AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:7.0-bullseye-slim AS build
WORKDIR /src
COPY [".", "Andaha.Services.Work/"]

ARG PatPlaceholder
RUN dotnet restore "Andaha.Services.Work/Andaha.Services.Work.csproj" --configfile "Andaha.Services.Work/nuget.config"
COPY . .
WORKDIR "/src/Andaha.Services.Work"
RUN dotnet build "Andaha.Services.Work.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Andaha.Services.Work.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Andaha.Services.Work.dll"]