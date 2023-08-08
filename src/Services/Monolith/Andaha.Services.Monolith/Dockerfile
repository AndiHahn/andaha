FROM mcr.microsoft.com/dotnet/aspnet:7.0-bullseye-slim AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:7.0-bullseye-slim AS build
WORKDIR /src
COPY ["src/Services/Monolith/Andaha.Services.Monolith/", "Monolith/Andaha.Services.Monolith/"]
COPY ["src/Services/BudgetPlan/Andaha.Services.BudgetPlan/", "BudgetPlan/Andaha.Services.BudgetPlan/"]
COPY ["src/Services/Collaboration/Andaha.Services.Collaboration/", "Collaboration/Andaha.Services.Collaboration/"]
COPY ["src/Services/Shopping/Andaha.Services.Shopping/", "Shopping/Andaha.Services.Shopping/"]
COPY ["src/Services/Work/Andaha.Services.Work/", "Work/Andaha.Services.Work/"]

ARG PatPlaceholder
RUN dotnet restore "Monolith/Andaha.Services.Monolith/Andaha.Services.Monolith.csproj" --configfile "Monolith/Andaha.Services.Monolith/nuget.config"
COPY . .
WORKDIR "/src/Monolith/Andaha.Services.Monolith"
RUN dotnet build "Andaha.Services.Monolith.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Andaha.Services.Monolith.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Andaha.Services.Monolith.dll"]
