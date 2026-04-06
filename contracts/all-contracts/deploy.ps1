# SolMind Testnet Deployment Script
# Run this script after installing prerequisites

Write-Host "=== SolMind Testnet Deployment ===" -ForegroundColor Cyan

# Check prerequisites
Write-Host "`nChecking prerequisites..." -ForegroundColor Yellow

$errors = @()

if (-not (Get-Command solana -ErrorAction SilentlyContinue)) {
    $errors += "Solana CLI not found. Install from: https://docs.solana.com/cli/install-solana-cli-tools"
}

if (-not (Get-Command anchor -ErrorAction SilentlyContinue)) {
    $errors += "Anchor CLI not found. Install with: cargo install --git https://github.com/coral-xyz/anchor avm --locked --force"
}

if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
    $errors += "Cargo (Rust) not found. Install from: https://rustup.rs/"
}

if ($errors.Count -gt 0) {
    Write-Host "`nMissing prerequisites:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host "`nPlease install the missing tools and run this script again." -ForegroundColor Yellow
    Write-Host "See DEPLOY.md for detailed instructions." -ForegroundColor Yellow
    exit 1
}

Write-Host "All prerequisites found!" -ForegroundColor Green

# Configure Solana for testnet
Write-Host "`nConfiguring Solana for testnet..." -ForegroundColor Yellow
solana config set --url https://api.testnet.solana.com

# Check balance
Write-Host "`nChecking wallet balance..." -ForegroundColor Yellow
$balance = solana balance --output json | ConvertFrom-Json
$balanceValue = [double]$balance

if ($balanceValue -lt 1) {
    Write-Host "Low balance detected. Requesting airdrop..." -ForegroundColor Yellow
    solana airdrop 2
    Start-Sleep -Seconds 5
}

Write-Host "Current balance: $balanceValue SOL" -ForegroundColor Green

# Build the program
Write-Host "`nBuilding Anchor program..." -ForegroundColor Yellow
anchor build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed! Check errors above." -ForegroundColor Red
    exit 1
}

Write-Host "Build successful!" -ForegroundColor Green

# Deploy to testnet
Write-Host "`nDeploying to testnet..." -ForegroundColor Yellow
anchor deploy --provider.cluster testnet

if ($LASTEXITCODE -ne 0) {
    Write-Host "Deployment failed! Check errors above." -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Deployment Successful! ===" -ForegroundColor Green
Write-Host "Program ID: Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS" -ForegroundColor Cyan
Write-Host "View on Explorer: https://explorer.solana.com/address/Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS?cluster=testnet" -ForegroundColor Cyan

