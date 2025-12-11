$body = @{
    email = "admin@brief.ai"
    password = "ChangeMe123!"
} | ConvertTo-Json

curl.exe -i -X POST "http://localhost:3500/api/auth/login" -H "Content-Type: application/json" -d $body
