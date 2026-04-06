# Solana Testnet Deployment Guide

This guide will help you deploy the SolMind program to Solana testnet.

## Prerequisites

You need to install the following tools:

### 1. Install Rust and Cargo
```powershell
# Download and run the Rust installer
# Visit: https://rustup.rs/
# Or use winget:
winget install Rustlang.Rustup
```

### 2. Install Solana CLI
```powershell
# Download Solana CLI for Windows
# Visit: https://docs.solana.com/cli/install-solana-cli-tools#windows
# Or use PowerShell:
cmd /c "curl https://release.solana.com/stable/install | powershell"
```

After installation, add Solana to your PATH:
```powershell
$env:Path += ";$env:USERPROFILE\.local\share\solana\install\active_release\bin"
```

### 3. Install Anchor CLI
```powershell
# Install via cargo (after Rust is installed)
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

### 4. Verify Installations
```powershell
rustc --version
cargo --version
solana --version
anchor --version
```

## Setup Steps

### 1. Configure Solana CLI for Testnet
```powershell
# Set cluster to testnet
solana config set --url https://api.testnet.solana.com

# Generate a new keypair if you don't have one
solana-keygen new

# Check your wallet address
solana address

# Airdrop test SOL (for testnet)
solana airdrop 2
```

### 2. Update Program ID (if needed)
The program ID is already set in `contracts/lib.rs`:
```rust
declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");
```

If you need to generate a new program ID:
```powershell
cd contracts
solana-keygen new -o target/deploy/solmind-keypair.json
anchor keys list
```

### 3. Build the Program
```powershell
# From project root
anchor build
```

### 4. Deploy to Testnet
```powershell
# Deploy the program
anchor deploy --provider.cluster testnet

# Or use solana deploy directly
solana program deploy target/deploy/solmind.so --url testnet
```

### 5. Verify Deployment
```powershell
# Check program account
solana program show Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS --url testnet
```

## Troubleshooting

### Build Errors
- Ensure you're using Anchor 0.30.0 (check `contracts/Cargo.toml`)
- Run `anchor clean` and rebuild if you encounter issues

### Deployment Errors
- Ensure you have enough SOL in your wallet: `solana balance`
- Get testnet SOL: `solana airdrop 2`
- Check your keypair: `solana config get`

### Program ID Mismatch
- If you get program ID errors, ensure the ID in `lib.rs` matches your keypair
- Regenerate ID: `anchor keys sync`

## Next Steps

After deployment:
1. Update your frontend/backend to use the deployed program ID
2. Test the program with your frontend application
3. Monitor transactions on Solana Explorer: https://explorer.solana.com/?cluster=testnet

