# ==============================================================================
# TechInPedia SEO Automation - Logger Module
# Timezone: Asia/Kolkata
# ==============================================================================

function Get-KolkataTime {
    try {
        $tz = [System.TimeZoneInfo]::FindSystemTimeZoneById("India Standard Time")
        return [System.TimeZoneInfo]::ConvertTimeFromUtc([System.DateTime]::UtcNow, $tz)
    } catch {
        return (Get-Date).ToUniversalTime().AddHours(5).AddMinutes(30)
    }
}

function Write-SeoLog {
    param(
        [Parameter(Mandatory=$true)][string]$Message,
        [ValidateSet("INFO", "WARN", "ERROR", "SUCCESS")][string]$Level = "INFO",
        [string]$Agent = "SYSTEM"
    )

    $now = Get-KolkataTime
    $timestamp = $now.ToString("yyyy-MM-dd HH:mm:ss")
    $logEntry = "[$timestamp IST] [$Level] [$Agent] $Message"

    switch ($Level) {
        "INFO"    { Write-Host $logEntry -ForegroundColor Cyan }
        "WARN"    { Write-Host $logEntry -ForegroundColor Yellow }
        "ERROR"   { Write-Host $logEntry -ForegroundColor Red }
        "SUCCESS" { Write-Host $logEntry -ForegroundColor Green }
    }

    $dateStr = $now.ToString("yyyy-MM-dd")
    $logDir = Join-Path $PSScriptRoot "..\logs\daily_runs"
    if (-not (Test-Path $logDir)) {
        New-Item -ItemType Directory -Force -Path $logDir | Out-Null
    }
    $logFile = Join-Path $logDir "$dateStr.log"
    Add-Content -Path $logFile -Value $logEntry -Encoding utf8

    if ($Level -eq "ERROR") {
        $errDir = Join-Path $PSScriptRoot "..\logs\errors"
        if (-not (Test-Path $errDir)) {
            New-Item -ItemType Directory -Force -Path $errDir | Out-Null
        }
        $errFile = Join-Path $errDir "$dateStr-errors.log"
        Add-Content -Path $errFile -Value $logEntry -Encoding utf8
    }
}
