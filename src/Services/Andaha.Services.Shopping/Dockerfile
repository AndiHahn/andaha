FROM mcr.microsoft.com/dotnet/aspnet:6.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build
WORKDIR /src
COPY ["Andaha.Services.Shopping.csproj", "Andaha.Services.Shopping/"]

RUN dotnet restore "Andaha.Services.Shopping/Andaha.Services.Shopping.csproj" --configfile "Andaha.Services.Shopping/nuget.config"
COPY . .
WORKDIR "/src/Andaha.Services.Shopping"
RUN dotnet build "Andaha.Services.Shopping.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Andaha.Services.Shopping.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Andaha.Services.Shopping.dll"]