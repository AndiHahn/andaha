FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
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