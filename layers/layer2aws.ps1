# ============================
# Publish Lambda Layer Script
# ============================

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

# ------------------------------------------------------------
# CONFIGURATION (edit per layer)
# ------------------------------------------------------------
$LayerName = "word-processing-layer"   # e.g. poppler-pdf2image | word-processing-layer
$LayerZip  = "word-processing-layer.zip"
$Description = "DOCX processing (python-docx + mammoth + lxml)"

$CompatibleRuntimes = @(
    "python3.10",
    "python3.11"
)

$CompatibleArchitectures = @("x86_64")

$AwsProfile = "AdministratorAccess-999999999999"
$AwsRegion  = "xx-xxxx-x"

# ------------------------------------------------------------
# PATH RESOLUTION
# ------------------------------------------------------------
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ZipFile   = Join-Path $ScriptDir $LayerZip

# ------------------------------------------------------------
# LOGGING
# ------------------------------------------------------------
function Log {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Fail {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
    exit 1
}

# ------------------------------------------------------------
# PREREQUISITES
# ------------------------------------------------------------
function Test-Command {
    param([string]$Cmd)
    if (-not (Get-Command $Cmd -ErrorAction SilentlyContinue)) {
        Fail "Required command '$Cmd' not found"
    }
}

Test-Command "aws"

# ------------------------------------------------------------
# VALIDATION
# ------------------------------------------------------------
if (-not (Test-Path $ZipFile)) {
    Fail "Layer ZIP not found: $ZipFile"
}

Log "Validating ZIP structure..."

$tempDir = Join-Path $env:TEMP "lambda-layer-validate"
if (Test-Path $tempDir) {
    Remove-Item -Recurse -Force $tempDir
}

Expand-Archive -Path $ZipFile -DestinationPath $tempDir

$valid =
    (Test-Path "$tempDir\python") -or
    (Test-Path "$tempDir\opt\python")

if (-not $valid) {
    Fail "Invalid Lambda layer structure. Expected 'python/' or 'opt/python/' at ZIP root."
}

Remove-Item -Recurse -Force $tempDir

Log "ZIP structure OK"

# ------------------------------------------------------------
# PUBLISH LAYER
# ------------------------------------------------------------
try {
    Log "Publishing Lambda layer..."
    Log "Layer name: $LayerName"
    Log "ZIP file: $ZipFile"
    Log "Region: $AwsRegion"
    Log "Profile: $AwsProfile"

    aws lambda publish-layer-version `
        --layer-name $LayerName `
        --zip-file "fileb://$ZipFile" `
        --compatible-runtimes $CompatibleRuntimes `
        --compatible-architectures $CompatibleArchitectures `
        --description $Description `
        --profile $AwsProfile `
        --region $AwsRegion | Out-Host

    Log "SUCCESS: Lambda layer published"
}
catch {
    Fail "Failed to publish layer: $($_.Exception.Message)"
}
