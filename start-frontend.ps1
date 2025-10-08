# PowerShell script to start frontend dev server
Set-Location "c:\Users\phila\Desktop\WCNotes-new-master\frontend"
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Green
Write-Host "Starting Vite dev server..." -ForegroundColor Cyan
npm run dev
