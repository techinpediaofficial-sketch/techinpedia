# ==============================================================================
# TechInPedia SEO Automation - Google PageSpeed Insights Client
# Timezone: Asia/Kolkata
# ==============================================================================

. "$PSScriptRoot\logger.ps1"

function Get-PageSpeedAudit {
    param(
        [string]$Url = "https://techinpedia.com",
        [ValidateSet("mobile", "desktop")][string]$Strategy = "mobile",
        [string]$ApiKey = ""
    )

    if (-not $ApiKey) {
        $ApiKey = $env:PAGESPEED_API_KEY
    }

    $apiUrl = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=$([System.Uri]::EscapeDataString($Url))&strategy=$Strategy"
    if ($ApiKey) {
        $apiUrl += "&key=$ApiKey"
    }

    Write-SeoLog "Requesting PageSpeed Insights ($Strategy) for $Url..." -Level "INFO" -Agent "PAGESPEED"

    try {
        $resp = Invoke-RestMethod -Uri $apiUrl -Method Get -TimeoutSec 45
        $lh = $resp.lighthouseResult
        
        $perfScore = [math]::Round($lh.categories.performance.score * 100, 0)
        $seoScore = if ($lh.categories.seo) { [math]::Round($lh.categories.seo.score * 100, 0) } else { $null }
        $bestPracticesScore = if ($lh.categories.'best-practices') { [math]::Round($lh.categories.'best-practices'.score * 100, 0) } else { $null }

        $fcp = $lh.audits['first-contentful-paint'].displayValue
        $lcp = $lh.audits['largest-contentful-paint'].displayValue
        $tbt = $lh.audits['total-blocking-time'].displayValue
        $cls = $lh.audits['cumulative-layout-shift'].displayValue
        $speedIndex = $lh.audits['speed-index'].displayValue

        $result = [PSCustomObject]@{
            Status = "SUCCESS"
            Url = $Url
            Strategy = $Strategy
            PerformanceScore = $perfScore
            SeoScore = $seoScore
            BestPracticesScore = $bestPracticesScore
            FCP = $fcp
            LCP = $lcp
            TBT = $tbt
            CLS = $cls
            SpeedIndex = $speedIndex
            Timestamp = Get-KolkataTime
        }

        Write-SeoLog "PageSpeed ($Strategy) score: $perfScore/100 (LCP: $lcp, CLS: $cls)" -Level "SUCCESS" -Agent "PAGESPEED"
        return $result
    } catch {
        $errMsg = $_.Exception.Message
        Write-SeoLog "PageSpeed API notice ($Strategy): $errMsg" -Level "WARN" -Agent "PAGESPEED"

        return [PSCustomObject]@{
            Status = "RATE_LIMITED_OR_KEY_REQUIRED"
            Url = $Url
            Strategy = $Strategy
            Notice = "Google PageSpeed Insights free tier rate-limited. Supply PAGESPEED_API_KEY for continuous telemetry."
            Timestamp = Get-KolkataTime
        }
    }
}
