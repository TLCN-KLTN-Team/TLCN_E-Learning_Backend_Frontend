# Elasticsearch Search Testing Script
# Sử dụng PowerShell để test các API tìm kiếm

$baseUrl = "http://localhost:8084"  # Thay đổi port nếu cần

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Elasticsearch Admin & Search Testing" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# ====================
# ADMIN APIs
# ====================

Write-Host "[1] Kiểm tra trạng thái index" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$baseUrl/api/admin/elasticsearch/index/status" -Method GET
Write-Host "Response:" -ForegroundColor Green
$response | ConvertTo-Json -Depth 5
Write-Host ""

Write-Host "[2] Reindex tất cả courses" -ForegroundColor Yellow
Write-Host "Đang reindex... (có thể mất vài giây)" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/admin/elasticsearch/reindex-courses" -Method POST
    Write-Host "Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "[3] Kiểm tra lại trạng thái sau khi reindex" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$baseUrl/api/admin/elasticsearch/index/status" -Method GET
Write-Host "Response:" -ForegroundColor Green
$response | ConvertTo-Json -Depth 5
Write-Host ""

# ====================
# SEARCH TESTS
# ====================

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Testing Search Queries" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Exact match
Write-Host "[Test 1] Exact match - 'Công nghệ thông tin'" -ForegroundColor Yellow
$searchBody = @{
    keyword = "Công nghệ thông tin"
    page = 0
    size = 5
    sortBy = ""
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/public/courses/search" `
        -Method POST `
        -ContentType "application/json" `
        -Body $searchBody
    
    Write-Host "Found: $($response.result.totalElements) courses" -ForegroundColor Green
    Write-Host "Top results:" -ForegroundColor Green
    $response.result.content | Select-Object -First 3 | ForEach-Object {
        Write-Host "  - $($_.courseName) (Rating: $($_.rating), Students: $($_.studentCount))" -ForegroundColor White
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 2: Phrase match
Write-Host "[Test 2] Phrase match - 'lập trình Java'" -ForegroundColor Yellow
$searchBody = @{
    keyword = "lập trình Java"
    page = 0
    size = 5
    sortBy = ""
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/public/courses/search" `
        -Method POST `
        -ContentType "application/json" `
        -Body $searchBody
    
    Write-Host "Found: $($response.result.totalElements) courses" -ForegroundColor Green
    Write-Host "Top results:" -ForegroundColor Green
    $response.result.content | Select-Object -First 3 | ForEach-Object {
        Write-Host "  - $($_.courseName) (Rating: $($_.rating))" -ForegroundColor White
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 3: Single word search
Write-Host "[Test 3] Single word - 'Python'" -ForegroundColor Yellow
$searchBody = @{
    keyword = "Python"
    page = 0
    size = 5
    sortBy = ""
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/public/courses/search" `
        -Method POST `
        -ContentType "application/json" `
        -Body $searchBody
    
    Write-Host "Found: $($response.result.totalElements) courses" -ForegroundColor Green
    Write-Host "Top results:" -ForegroundColor Green
    $response.result.content | Select-Object -First 3 | ForEach-Object {
        Write-Host "  - $($_.courseName) (Rating: $($_.rating))" -ForegroundColor White
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 4: Fuzzy search with typo
Write-Host "[Test 4] Fuzzy search - 'javscript' (typo)" -ForegroundColor Yellow
$searchBody = @{
    keyword = "javscript"
    page = 0
    size = 5
    sortBy = ""
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/public/courses/search" `
        -Method POST `
        -ContentType "application/json" `
        -Body $searchBody
    
    Write-Host "Found: $($response.result.totalElements) courses" -ForegroundColor Green
    Write-Host "Top results:" -ForegroundColor Green
    $response.result.content | Select-Object -First 3 | ForEach-Object {
        Write-Host "  - $($_.courseName)" -ForegroundColor White
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 5: Search with filters
Write-Host "[Test 5] Search with category filter - keyword: 'web', category: 'Lập trình'" -ForegroundColor Yellow
$searchBody = @{
    keyword = "web"
    categories = @("Lập trình")
    page = 0
    size = 5
    sortBy = ""
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/public/courses/search" `
        -Method POST `
        -ContentType "application/json" `
        -Body $searchBody
    
    Write-Host "Found: $($response.result.totalElements) courses" -ForegroundColor Green
    Write-Host "Top results:" -ForegroundColor Green
    $response.result.content | Select-Object -First 3 | ForEach-Object {
        Write-Host "  - $($_.courseName) | Category: $($_.category)" -ForegroundColor White
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 6: Search with price range
Write-Host "[Test 6] Search with price range - minPrice: 0, maxPrice: 500000" -ForegroundColor Yellow
$searchBody = @{
    keyword = ""
    minPrice = 0
    maxPrice = 500000
    page = 0
    size = 5
    sortBy = "price_asc"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/public/courses/search" `
        -Method POST `
        -ContentType "application/json" `
        -Body $searchBody
    
    Write-Host "Found: $($response.result.totalElements) courses" -ForegroundColor Green
    Write-Host "Top results:" -ForegroundColor Green
    $response.result.content | Select-Object -First 3 | ForEach-Object {
        Write-Host "  - $($_.courseName) | Price: $($_.coursePrice)" -ForegroundColor White
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 7: Sort by rating
Write-Host "[Test 7] Get all courses sorted by rating" -ForegroundColor Yellow
$searchBody = @{
    keyword = ""
    page = 0
    size = 5
    sortBy = "rating"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/public/courses/search" `
        -Method POST `
        -ContentType "application/json" `
        -Body $searchBody
    
    Write-Host "Found: $($response.result.totalElements) courses" -ForegroundColor Green
    Write-Host "Top rated courses:" -ForegroundColor Green
    $response.result.content | Select-Object -First 5 | ForEach-Object {
        Write-Host "  - $($_.courseName) | Rating: $($_.rating) | Students: $($_.studentCount)" -ForegroundColor White
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

# ====================
# AUTOCOMPLETE TEST
# ====================

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Testing Autocomplete" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[Autocomplete] Query: 'java'" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/public/courses/autocomplete?q=java&size=5" -Method GET
    
    Write-Host "Suggestions:" -ForegroundColor Green
    $response.result.titleSuggestions | ForEach-Object {
        Write-Host "  - $_" -ForegroundColor White
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Testing Complete!" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
