# Run at project root:
# powershell -ExecutionPolicy Bypass -File scripts\verify-full-on-windows.ps1
# Backend SQLite + frontend production build + Chromium E2E. Logs are preserved.
# Run Newman separately with the backend online as explained in README.md.
$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot
$front = Join-Path $root "frontend"
$evidence = Join-Path $root "evidence\integration-tests"
New-Item -ItemType Directory -Force -Path $evidence | Out-Null
$results = @()
$env:NO_COLOR = "1"

function Run-Step($name, $folder, $command, $file) {
  $log = Join-Path $evidence $file
  "# $(Get-Date -Format o) step=$name`r`n# command=$command" | Out-File -Encoding utf8 $log
  Push-Location $folder
  cmd /c "$command >> `"$log`" 2>&1"
  $code = $LASTEXITCODE
  Pop-Location
  "# exit code: $code" | Out-File -Encoding utf8 -Append $log
  Write-Host "[$name] exit code $code"
  if ($code -ne 0) { Get-Content $log -Tail 30 }
  $script:results += [pscustomobject]@{ Step = $name; ExitCode = $code }
  return $code
}

Write-Host "===== BACKEND / SQLITE ====="
# Existing script generates the migrations and evidence logs.
& powershell -ExecutionPolicy Bypass -File (Join-Path $root "scripts\verify-on-windows.ps1")
$backendScriptExit = $LASTEXITCODE
$requiredLogs = @("01-npm-install.log","02-prisma-generate.log","03-prisma-migrate-dev.log","04-prisma-migrate-test.log","05-integration-prisma.log","06-all-tests-coverage.log")
$backendOk = ($backendScriptExit -eq 0)
foreach ($filename in $requiredLogs) {
  $filepath = Join-Path $evidence $filename
  if (-not (Test-Path $filepath)) { Write-Host "Missing backend log: $filename"; $backendOk = $false; continue }
  if (-not (Select-String -Path $filepath -Pattern '^# exit code: 0$' -Quiet)) { Write-Host "Failed or incomplete backend log: $filename"; $backendOk = $false }
}
$results += [pscustomobject]@{ Step = "Backend verification and SQLite"; ExitCode = $(if ($backendOk) {0} else {1}) }
if (-not $backendOk) { Write-Host "Backend verification not green; stop before browser tests."; $results | Format-Table -AutoSize; exit 1 }

if ((Run-Step "Frontend npm install" $front "npm install" "07-frontend-npm-install.log") -ne 0) { exit 1 }
if ((Run-Step "Frontend typecheck and production build" $front "npm run build" "08-frontend-build.log") -ne 0) { exit 1 }
if ((Run-Step "Prepare isolated E2E database" $root "node scripts\prepare-e2e.mjs" "09-prepare-e2e.log") -ne 0) { exit 1 }
if ((Run-Step "Install Playwright Chromium" $front "npx playwright install chromium" "10-playwright-install.log") -ne 0) { exit 1 }
if ((Run-Step "Playwright E2E browser tests" $front "npm run test:e2e" "11-playwright-e2e.log") -ne 0) { exit 1 }

Write-Host "`n===== COMPLETE VERIFICATION SUMMARY ====="
$results | Format-Table -AutoSize
Write-Host "Logs: evidence\integration-tests\*.log"
Write-Host "Postman/Newman: run separately while the backend is online (see README.md)."
