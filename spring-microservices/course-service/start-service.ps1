# Build và khởi chạy course service
Set-Location "e:\TLCN\TLCN_E-Learning\spring-microservices\course-service"

Write-Host "Building course-service..." -ForegroundColor Green
.\mvnw.cmd clean compile -DskipTests

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful! Starting the service..." -ForegroundColor Green
    .\mvnw.cmd spring-boot:run
} else {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}