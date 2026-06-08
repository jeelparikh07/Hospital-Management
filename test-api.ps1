$data = @{
    email = "patient@example.com"
    password = "password123"
} | ConvertTo-Json

Write-Host "Testing login..."
try {
    $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' -Method Post -Body $data -ContentType 'application/json'
    Write-Host "Login successful!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Login failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host $_.ErrorDetails.Message
}
