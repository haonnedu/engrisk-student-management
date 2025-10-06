# PowerShell script to setup Docker on server via SSH
# Run this script from Windows to setup Docker on your Linux server

param(
    [string]$ServerIP = "103.216.117.100",
    [string]$Username = "root",
    [string]$Password = "tMlB5PJbeO7%rJpJE#Wc",
    [int]$Port = 24700
)

Write-Host "🚀 Setting up Docker on server via SSH..." -ForegroundColor Green

# Check if sshpass is available (via WSL or Git Bash)
$sshpassCmd = Get-Command sshpass -ErrorAction SilentlyContinue
if (-not $sshpassCmd) {
    Write-Host "❌ sshpass not found. Please install it via:" -ForegroundColor Red
    Write-Host "   - WSL: sudo apt install sshpass" -ForegroundColor Yellow
    Write-Host "   - Git Bash: Download from https://sourceforge.net/projects/sshpass/" -ForegroundColor Yellow
    Write-Host "   - Or use PuTTY/Windows Terminal with SSH" -ForegroundColor Yellow
    exit 1
}

# Copy setup script to server
Write-Host "📤 Copying setup script to server..." -ForegroundColor Blue
$copyResult = & sshpass -p $Password scp -P $Port -o StrictHostKeyChecking=no deploy/setup-docker.sh ${Username}@${ServerIP}:/tmp/ 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to copy script: $copyResult" -ForegroundColor Red
    exit 1
}

# Run setup script on server
Write-Host "🔧 Running Docker setup on server..." -ForegroundColor Blue
$setupResult = & sshpass -p $Password ssh -p $Port -o StrictHostKeyChecking=no ${Username}@${ServerIP} "chmod +x /tmp/setup-docker.sh && /tmp/setup-docker.sh" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Setup failed: $setupResult" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker setup completed on server!" -ForegroundColor Green
Write-Host "You can now run the GitHub Actions deployment." -ForegroundColor Cyan
