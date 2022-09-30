FROM mcr.microsoft.com/dotnet/aspnet:7.0-bullseye-slim AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:7.0-bullseye-slim AS build
WORKDIR /src
COPY [".", "Andaha.Services.Collaboration/"]

ARG PatPlaceholder
RUN dotnet restore "Andaha.Services.Collaboration/Andaha.Services.Collaboration.csproj" --configfile "Andaha.Services.Collaboration/nuget.config"
COPY . .
WORKDIR "/src/Andaha.Services.Collaboration"
RUN dotnet build "Andaha.Services.Collaboration.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Andaha.Services.Collaboration.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Andaha.Services.Collaboration.dll"]