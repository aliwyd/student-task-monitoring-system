# Run from the project root in PowerShell:   powershell -ExecutionPolicy Bypass -File scripts\verify-on-windows.ps1
# Sets up the database and runs the SAME API tests against real SQLite (via Prisma).
# Raw outputs are saved to evidence\integration-tests\ . Nothing is edited or hidden.
$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root "backend"
$evidence = Join-Path $root "evidence\integration-tests"
New-Item -ItemType Directory -Force -Path $evidence | Out-Null
$env:NO_COLOR = "1"
$results = @()

function Run-Step($name, $command, $logName) {
  $log = Join-Path $evidence $logName
  "# $(Get-Date -Format o)  step=$name`r`n# cmd: $command" | Out-File -Encoding utf8 $log
  Push-Location $backend
  cmd /c "$command >> `"$log`" 2>&1"
  $code = $LASTEXITCODE
  Pop-Location
  "# exit code: $code" | Out-File -Append -Encoding utf8 $log
  Write-Host "[$name] exit code $code  (log: $log)"
  if ($code -ne 0) { Get-Content $log -Tail 25 }
  $script:results += [pscustomobject]@{ Step = $name; ExitCode = $code }
  return $code
}

# 1. dependencies
if ((Run-Step "npm install" "npm install" "01-npm-install.log") -ne 0) { Write-Host "Stopping: npm install failed."; exit 1 }

# 2. .env (never overwritten if it exists)
$envFile = Join-Path $backend ".env"
if (-not (Test-Path $envFile)) {
  $secret = -join ((48..57) + (97..122) | Get-Random -Count 48 | ForEach-Object { [char]$_ })
  "DATABASE_URL=`"file:./dev.db`"`r`nJWT_SECRET=`"$secret`"`r`nPORT=4000`r`nCORS_ORIGIN=`"http://localhost:5173`"" | Out-File -Encoding ascii $envFile
  Write-Host "Created backend\.env with a random JWT_SECRET."
}

# 3. Prisma client + development database + migration files (commit prisma\migrations afterwards)
if ((Run-Step "prisma generate" "npx prisma generate" "02-prisma-generate.log") -ne 0) { exit 1 }
if ((Run-Step "prisma migrate dev (dev.db)" "npx prisma migrate dev --name init" "03-prisma-migrate-dev.log") -ne 0) { exit 1 }

# 4. separate TEST database (never the dev database)
Remove-Item (Join-Path $backend "prisma\test.db*") -ErrorAction SilentlyContinue
$env:DATABASE_URL = "file:./test.db"
if ((Run-Step "prisma migrate deploy (test.db)" "npx prisma migrate deploy" "04-prisma-migrate-test.log") -ne 0) { exit 1 }

# 5. all tests: memory AND Prisma/SQLite backends (files run one at a time because they share test.db)
$env:RUN_PRISMA = "1"
Run-Step "integration tests (memory + prisma)" "npx vitest run tests/integration --no-file-parallelism" "05-integration-prisma.log" | Out-Null
Run-Step "all tests + coverage" "npx vitest run --coverage --no-file-parallelism" "06-all-tests-coverage.log" | Out-Null

Write-Host "`n===== SUMMARY ====="
$results | Format-Table -AutoSize
Write-Host "Send these files back (or commit them): evidence\integration-tests\*.log and backend\prisma\migrations\"
