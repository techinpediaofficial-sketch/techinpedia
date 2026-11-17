# ==============================================================================
# TechInPedia Autonomous SEO & Marketing Master Orchestrator
# Coordinates Agent 1, 2, 3, 4, 5 in recurring unattended workflows
# Timezone: Asia/Kolkata
# ==============================================================================

param(
    [ValidateSet("Full", "Morning", "Evening", "TechnicalSeo", "KeywordResearch", "ContentMarketing", "DigitalMarketing", "Reporting")][string]$Mode = "Full",
    [switch]$PrepareFixes = $true,
    [switch]$GenerateDrafts = $true,
    [switch]$SendTelegramAlert = $true,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

# Load Core and Agent Modules
. "$PSScriptRoot\core\logger.ps1"
. "$PSScriptRoot\core\telegram_client.ps1"
. "$PSScriptRoot\core\approval_manager.ps1"
. "$PSScriptRoot\agents\technical_seo.ps1"
. "$PSScriptRoot\agents\keyword_research.ps1"
. "$PSScriptRoot\agents\content_marketing.ps1"
. "$PSScriptRoot\agents\digital_marketing.ps1"
. "$PSScriptRoot\agents\performance_reporting.ps1"

# 1. Concurrency Lock Prevention
$lockFile = Join-Path $PSScriptRoot "seo_automation.lock"
if ((Test-Path $lockFile) -and -not $Force) {
    $lockTime = (Get-Item $lockFile).LastWriteTime
    $elapsedMinutes = ((Get-Date) - $lockTime).TotalMinutes
    if ($elapsedMinutes -lt 30) {
        Write-SeoLog "Another SEO automation process is already active (Lock acquired $lockTime). Exiting to prevent duplication." -Level "WARN" -Agent "ORCHESTRATOR"
        exit 0
    } else {
        Write-SeoLog "Found stale lockfile (> 30 mins). Overriding stale lock..." -Level "WARN" -Agent "ORCHESTRATOR"
    }
}

try {
    # Acquire lock
    Set-Content -Path $lockFile -Value "$([System.DateTime]::UtcNow.ToString('o'))" -Encoding utf8

    Write-SeoLog "======================================================================" -Level "INFO" -Agent "ORCHESTRATOR"
    Write-SeoLog "TECHINPEDIA AUTONOMOUS SEO & MARKETING WORKFLOW RUNNING [Mode: $Mode]" -Level "INFO" -Agent "ORCHESTRATOR"
    Write-SeoLog "======================================================================" -Level "INFO" -Agent "ORCHESTRATOR"

    $techSeoRes = $null
    $keywordRes = $null
    $contentRes = $null
    $marketingRes = $null
    $reportingRes = $null

    # Execution Flow Based on Mode
    if ($Mode -in @("Full", "Morning", "TechnicalSeo")) {
        Write-SeoLog "Executing Agent 1: Technical SEO Audit..." -Level "INFO" -Agent "ORCHESTRATOR"
        $techSeoRes = Invoke-TechnicalSeoAudit -BaseUrl "https://techinpedia.com" -PrepareFixes:$PrepareFixes
    }

    if ($Mode -in @("Full", "Morning", "KeywordResearch")) {
        Write-SeoLog "Executing Agent 2: Keyword Research Analysis..." -Level "INFO" -Agent "ORCHESTRATOR"
        $keywordRes = Invoke-KeywordResearch -SiteUrl "https://techinpedia.com/" -LookbackDays 28
    }

    if ($Mode -in @("Full", "Morning", "ContentMarketing")) {
        Write-SeoLog "Executing Agent 3: SEO Content Marketing Review & Drafting..." -Level "INFO" -Agent "ORCHESTRATOR"
        $contentRes = Invoke-ContentMarketing -GenerateDraft:$GenerateDrafts
    }

    if ($Mode -in @("Full", "Evening", "DigitalMarketing")) {
        Write-SeoLog "Executing Agent 4: Digital Marketing & B2B Campaigns..." -Level "INFO" -Agent "ORCHESTRATOR"
        $marketingRes = Invoke-DigitalMarketing -GenerateSocialDraft:$GenerateDrafts
    }

    if ($Mode -in @("Full", "Morning", "Evening")) {
        Write-SeoLog "Executing Off-Page SEO Engine (Backlink Verification & Google Sheet Sync)..." -Level "INFO" -Agent "ORCHESTRATOR"
        $offPageScript = Join-Path $PSScriptRoot "off-page\orchestrator_offpage.ps1"
        if (Test-Path $offPageScript) {
            & $offPageScript -SendTelegramAlert:$false
        }
    }

    if ($Mode -in @("Full", "Evening", "Reporting")) {
        Write-SeoLog "Executing Agent 5: Performance & Executive Reporting..." -Level "INFO" -Agent "ORCHESTRATOR"
        $reportingRes = Invoke-PerformanceReporting -TechSeoResult $techSeoRes `
            -KeywordResult $keywordRes `
            -ContentResult $contentRes `
            -MarketingResult $marketingRes `
            -SendTelegramAlert:$SendTelegramAlert
    }

    Write-SeoLog "======================================================================" -Level "SUCCESS" -Agent "ORCHESTRATOR"
    Write-SeoLog "ALL ORCHESTRATED SEO AGENT TASKS COMPLETED SUCCESSFULLY" -Level "SUCCESS" -Agent "ORCHESTRATOR"
    Write-SeoLog "======================================================================" -Level "SUCCESS" -Agent "ORCHESTRATOR"
} catch {
    $errText = $_.Exception.ToString()
    Write-SeoLog "CRITICAL ERROR during orchestrator run: $errText" -Level "ERROR" -Agent "ORCHESTRATOR"

    # Emergency Telegram alert on critical failure
    try {
        $alertMsg = "🚨 <b>TECHINPEDIA SEO AUTOMATION FAILURE</b>`n`n<b>Error:</b> $($_.Exception.Message)`n<b>Time:</b> $((Get-KolkataTime).ToString('yyyy-MM-dd HH:mm:ss IST'))"
        Send-TelegramNotification -Message $alertMsg -ParseMode "HTML" | Out-Null
    } catch {}

    throw $_
} finally {
    if (Test-Path $lockFile) {
        Remove-Item -Path $lockFile -Force -ErrorAction SilentlyContinue
    }
}
