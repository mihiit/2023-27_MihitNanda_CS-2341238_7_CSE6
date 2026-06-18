# Oracle Database Setup Script for SAIL Helpdesk
# PowerShell script to automate Oracle database creation
# Run this from the project root directory

param(
    [string]$SYSPassword = "change_me",
    [string]$DBService = "XEPDB1",
    [string]$SQLPlusPath = "sqlplus"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SAIL Helpdesk Oracle Database Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if sqlplus is available
Write-Host "[1/4] Checking Oracle sqlplus availability..." -ForegroundColor Yellow
try {
    & $SQLPlusPath -version | Out-Null
    Write-Host "✓ sqlplus found" -ForegroundColor Green
} catch {
    Write-Host "✗ sqlplus not found in PATH" -ForegroundColor Red
    Write-Host "Please install Oracle Instant Client and add to PATH" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 1: Create schema user as SYSDBA
Write-Host "[2/4] Creating sail_helpdesk schema user..." -ForegroundColor Yellow

$createUserSQL = @"
CONNECT / AS SYSDBA;
CREATE USER sail_helpdesk IDENTIFIED BY "SailHelp@2024";
GRANT CONNECT, RESOURCE, CREATE SESSION TO sail_helpdesk;
GRANT UNLIMITED TABLESPACE TO sail_helpdesk;
COMMIT;
EXIT;
"@

$createUserSQL | & $SQLPlusPath -S /nolog

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Schema user created successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to create schema user (exit code: $LASTEXITCODE)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Create schema objects
Write-Host "[3/4] Creating schema and tables..." -ForegroundColor Yellow

$schemaSQL = @"
CONNECT sail_helpdesk/SailHelp@2024@$DBService;
@database/schema/01_create_tables.sql;
COMMIT;
EXIT;
"@

$schemaSQL | & $SQLPlusPath -S /nolog

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Schema created successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to create schema (exit code: $LASTEXITCODE)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Load sample data
Write-Host "[4/4] Loading sample data..." -ForegroundColor Yellow

$dataSQL = @"
CONNECT sail_helpdesk/SailHelp@2024@$DBService;
@database/data/02_sample_data.sql;
COMMIT;
EXIT;
"@

$dataSQL | & $SQLPlusPath -S /nolog

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Sample data loaded successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to load sample data (exit code: $LASTEXITCODE)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ Oracle Database Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update backend/.env with Oracle credentials"
Write-Host "2. Run: npm install (in backend/)"
Write-Host "3. Run: npm run dev (to start backend server)"
Write-Host ""
Write-Host "Default credentials:" -ForegroundColor Cyan
Write-Host "  Username: sail_helpdesk" -ForegroundColor Gray
Write-Host "  Password: SailHelp@2024" -ForegroundColor Gray
Write-Host "  Service: $DBService" -ForegroundColor Gray
Write-Host ""
