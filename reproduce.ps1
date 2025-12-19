
$baseUrl = "http://localhost:8000"
$rand = Get-Random
$email = "test_$rand@example.com"
$password = "password123"

Write-Host "Registering $email..."
$regBody = @{
    name           = "Test Company"
    admin_email    = $email
    admin_password = $password
} | ConvertTo-Json

try {
    $resp = Invoke-RestMethod -Uri "$baseUrl/register" -Method Post -Body $regBody -ContentType "application/json"
}
catch {
    Write-Host "Register failed: $($_.Exception.Message)"
    exit
}

Write-Host "Logging in..."
$tokenBody = @{
    username = $email
    password = $password
}
try {
    $tokenResp = Invoke-RestMethod -Uri "$baseUrl/token" -Method Post -Body $tokenBody -ContentType "application/x-www-form-urlencoded"
}
catch {
    Write-Host "Login failed: $($_.Exception.Message)"
    exit
}
$token = $tokenResp.access_token
$headers = @{ Authorization = "Bearer $token" }

Write-Host "Creating Supplier..."
$supBody = @{
    name  = "Supplier 1"
    email = "sup@example.com"
} | ConvertTo-Json
$supResp = Invoke-RestMethod -Uri "$baseUrl/archives/suppliers" -Method Post -Body $supBody -ContentType "application/json" -Headers $headers
$supplierId = $supResp.id

Write-Host "Creating Purchase Order (Minimal)..."
$orderBody = @{
    # order_number = "OC-TEST-MIN"
    order_date  = "2024-12-19"
    supplier_id = $supplierId
    # delivery_date explicitly omitted
    # observations explicitly omitted
    items       = @(
        @{
            # spare_part_id explicitly omitted
            description       = "Item 1"
            quantity          = 5
            unit_price        = 10.5
            received_quantity = 0
            # received_date explicitly omitted
        }
    )
} | ConvertTo-Json

$orderBody | Out-File payload.json -Encoding utf8

Write-Host "Running curl..."
# Quotes around @payload.json are required in PowerShell to avoid splatting interpretation
curl.exe -v -X POST "$baseUrl/stock/purchase-orders" -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d "@payload.json"
