# Script để seed dữ liệu khóa học
Write-Host "Seeding 100 published courses..." -ForegroundColor Green

$uri = "http://localhost:8088/course-management/api/data-seeder/seed-courses"

try {
    $response = Invoke-RestMethod -Uri $uri -Method POST -ContentType "application/json"
    Write-Host "Success: $response" -ForegroundColor Green
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Yellow
    }
}