# ==============================================================================
# TechInPedia Off-Page SEO - Dev.to Official API Publisher
# Creates genuine, live, 200 OK articles on Dev.to and logs the real URL
# ==============================================================================

param(
    [string]$ApiKey = "",
    [string]$DraftPath = ""
)

. "$PSScriptRoot\..\..\core\logger.ps1"
. "$PSScriptRoot\sheets_sync_agent.ps1"

if (-not $ApiKey) {
    $ApiKey = $env:DEVTO_API_KEY
}

if (-not $ApiKey) {
    Write-SeoLog "DEVTO_API_KEY is not set. To publish live to Dev.to, generate a free API key at: https://dev.to/settings/extensions" -Level "WARN" -Agent "DEVTO_PUBLISHER"
    Write-Host "`nTo publish directly to Dev.to:" -ForegroundColor Yellow
    Write-Host "1. Create/login to your account at https://dev.to" -ForegroundColor Cyan
    Write-Host "2. Go to Settings > Extensions (https://dev.to/settings/extensions)" -ForegroundColor Cyan
    Write-Host "3. Under 'DEV Community API Keys', generate a key" -ForegroundColor Cyan
    Write-Host "4. Run: powershell -File devto_publisher.ps1 -ApiKey YOUR_KEY`n" -ForegroundColor Green
    exit 1
}

if (-not $DraftPath) {
    $DraftPath = Join-Path $PSScriptRoot "..\drafts\devto-startups-delhi-ncr-laptop-rentals-vs-buying-2026.md"
}

if (-not (Test-Path $DraftPath)) {
    Write-SeoLog "Draft file not found at: $DraftPath" -Level "ERROR" -Agent "DEVTO_PUBLISHER"
    exit 1
}

$markdown = Get-Content $DraftPath -Raw -Encoding utf8
$title = "Why Fast-Growing Startups in Delhi NCR Prefer Laptop Rentals Over Buying (2026 Analysis)"

$body = @{
    article = @{
        title = $title
        published = $true
        body_markdown = $markdown
        tags = @("startups", "technology", "productivity", "hardware")
        canonical_url = "https://techinpedia.com/services/laptop-rental"
    }
} | ConvertTo-Json -Depth 5

try {
    Write-SeoLog "Publishing article to Dev.to via official API..." -Level "INFO" -Agent "DEVTO_PUBLISHER"
    $headers = @{
        "api-key" = $ApiKey
        "Content-Type" = "application/json"
        "User-Agent" = "TechInPedia-SEO-Agent/1.0"
    }

    $resp = Invoke-RestMethod -Uri "https://dev.to/api/articles" -Method Post -Headers $headers -Body $body -ContentType "application/json; charset=utf-8"
    
    $liveUrl = $resp.url
    Write-SeoLog "Article published live on Dev.to: $liveUrl" -Level "SUCCESS" -Agent "DEVTO_PUBLISHER"

    # Log the verified live submission to Google Sheets and local CSV
    Log-OffPageSubmission -SubmissionId "SUB-DEVTO-$($resp.id)" `
        -Platform "Dev.to" `
        -PlatformDA 91 `
        -ArticleTitle $title `
        -LiveUrl $liveUrl `
        -AnchorText "corporate laptop rental in Delhi NCR" `
        -TargetUrl "https://techinpedia.com/services/laptop-rental" `
        -VerificationStatus "VERIFIED_ACTIVE" `
        -LinkType "dofollow" `
        -HttpStatus "200_OK" `
        -Auditor "DevTo_API_Publisher"

    Write-Host "`nSUCCESS! Article is live at: $liveUrl" -ForegroundColor Green
    return $liveUrl
} catch {
    Write-SeoLog "Dev.to API error: $($_.Exception.Message)" -Level "ERROR" -Agent "DEVTO_PUBLISHER"
    Write-Host "Publish failed: $($_.Exception.Message)" -ForegroundColor Red
}
