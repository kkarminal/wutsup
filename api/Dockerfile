# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /src

# Restore dependencies (cached when .csproj unchanged)
COPY Wutsup.Api.csproj .
RUN dotnet restore

# Copy source and build
COPY . .
RUN dotnet build -c Release

# Stage 2: Publish
FROM build AS publish
RUN dotnet publish -c Release --no-build -o /app/publish

# Stage 3: Run
FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS run
WORKDIR /app
COPY --from=publish /app/publish .
EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
ENTRYPOINT ["dotnet", "Wutsup.Api.dll"]
