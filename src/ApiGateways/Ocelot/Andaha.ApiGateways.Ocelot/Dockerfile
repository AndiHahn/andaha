FROM mcr.microsoft.com/dotnet/aspnet:6.0-bullseye-slim AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:6.0-bullseye-slim AS build
WORKDIR /src
COPY [".", "Andaha.ApiGateways.Ocelot/"]
RUN dotnet restore "Andaha.ApiGateways.Ocelot/Andaha.ApiGateways.Ocelot.csproj"
COPY . .
WORKDIR "/src/Andaha.ApiGateways.Ocelot"
RUN dotnet build "Andaha.ApiGateways.Ocelot.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Andaha.ApiGateways.Ocelot.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Andaha.ApiGateways.Ocelot.dll"]