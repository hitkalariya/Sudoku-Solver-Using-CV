# run.ps1 - Sudoku Solver Premium Launch Script

Write-Host "Elevating Sudoku Vision..." -ForegroundColor Yellow

# Path to the frontend directory
$frontendPath = Join-Path $PSScriptRoot "frontend"
$backendPath = Join-Path $PSScriptRoot "backend"

# Start Frontend
if (Test-Path $frontendPath) {
    Write-Host "Initiating Frontend in a new window..." -ForegroundColor Cyan
    # Start npm run dev in a new cmd window
    Start-Process cmd.exe -ArgumentList "/k cd /d `"$frontendPath`" && npm run dev"
} else {
    Write-Error "Frontend directory not found. Please ensure the project is set up correctly."
}

# Start Backend
if (Test-Path $backendPath) {
    Write-Host "Initiating Backend in a new window..." -ForegroundColor Green
    # Start python run.py in a new cmd window
    # Assumes python is available in PATH and dependencies are installed
    Start-Process cmd.exe -ArgumentList "/k cd /d `"$backendPath`" && python run.py"
} else {
    Write-Error "Backend directory not found. Please ensure the project is set up correctly."
}
