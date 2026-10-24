# Task Manager Pro - multi-stage container build
# Stage 1: build the API (and the SPA is already pre-built into wwwroot;
#          to rebuild the SPA in Docker too, add a node stage before this one)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY server/ ./server/
RUN dotnet publish server/TaskManagerPro.Api -c Release -o /app/publish

# Stage 2: minimal ASP.NET Core runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://0.0.0.0:3000
EXPOSE 3000
# SQLite demo mode by default - see README "Running with SQL Server" for production
ENTRYPOINT ["dotnet", "TaskManagerPro.Api.dll", "--urls", "http://0.0.0.0:3000", "--sqlite"]
