# Build the React client from source on every deployment.
FROM node:22-bookworm-slim AS client-build
WORKDIR /src/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY server/ ./server/
COPY --from=client-build /src/server/TaskManagerPro.Api/wwwroot/ ./server/TaskManagerPro.Api/wwwroot/
RUN dotnet publish server/TaskManagerPro.Api -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://0.0.0.0:3000
ENV Database__Provider=Sqlite
EXPOSE 3000
ENTRYPOINT ["dotnet", "TaskManagerPro.Api.dll"]
