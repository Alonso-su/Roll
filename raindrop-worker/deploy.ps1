# deploy.ps1 — Helper to create secret and publish the Worker
# Usage: Open PowerShell in this folder and run: .\deploy.ps1

# Check wrangler
try {
  & wrangler --version > $null 2>&1
} catch {
  Write-Host "wrangler not found — installing globally via npm..."
  npm install -g wrangler
}

Write-Host "Make sure you have run: wrangler login"

# Prompt for RAINDROP_TOKEN securely
$secure = Read-Host -AsSecureString "Enter RAINDROP_TOKEN (will not be shown)"
# Marshal secure string to plain text temporarily
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
$token = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)

# Write to temp file and push to wrangler secret (safer than passing on CLI)
$tempFile = [System.IO.Path]::GetTempFileName()
Set-Content -Path $tempFile -Value $token -Force

Write-Host "Setting Cloudflare Worker secret RAINDROP_TOKEN..."
# wrangler secret put supports stdin redirection on many systems
# Use interactive fallback if redirection fails
try {
  cmd /c "type $tempFile | wrangler secret put RAINDROP_TOKEN"
} catch {
  Write-Host "Automatic secret set failed. Running interactive 'wrangler secret put RAINDROP_TOKEN'..."
  wrangler secret put RAINDROP_TOKEN
}

Remove-Item $tempFile -ErrorAction SilentlyContinue

Write-Host "Publishing Worker..."
wrangler publish

Write-Host "Done. Test by visiting the published URL or your bound route: /api/raindrops"
