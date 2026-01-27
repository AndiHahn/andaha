FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY [".", "Andaha.Services.BudgetPlan/"]

ARG PatPlaceholder
RUN dotnet restore "Andaha.Services.BudgetPlan/Andaha.Services.BudgetPlan.csproj" --configfile "Andaha.Services.BudgetPlan/nuget.config"
COPY . .
WORKDIR "/src/Andaha.Services.BudgetPlan"
RUN dotnet build "Andaha.Services.BudgetPlan.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Andaha.Services.BudgetPlan.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Andaha.Services.BudgetPlan.dll"]
