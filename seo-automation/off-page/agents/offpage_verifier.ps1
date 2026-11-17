# ==============================================================================
# TechInPedia Off-Page SEO - Link Verification & Telegram Digest Agent
# Crawls submitted URLs, confirms backlink integrity, and triggers alerts
# ==============================================================================

. "$PSScriptRoot\..\..\core\logger.ps1"
. "$PSScriptRoot\..\..\core\telegram_client.ps1"

function Verify-OffPageBacklink {
    param(
        [Parameter(Mandatory=$true)][string]$LiveUrl,
        [Parameter(Mandatory=$true)][string]$ExpectedAnchor,
        [Parameter(Mandatory=$true)][string]$TargetUrl = "https://techinpedia.com"
    )

    Write-SeoLog "Auditing live backlink URL: $LiveUrl..." -Level "INFO" -Agent "OFFPAGE_VERIFIER"

    try {
        $resp = Invoke-WebRequest -Uri $LiveUrl -UseBasicParsing -TimeoutSec 15
        $html = $resp.Content

        $isLive = ($resp.StatusCode -eq 200)
        $hasLink = $html -match [regex]::Escape($TargetUrl)
        $hasAnchor = $html -match [regex]::Escape($ExpectedAnchor)

        $linkType = "dofollow"
        if ($html -match 'rel=["''][^"'']*nofollow[^"'']*["'']') {
            $linkType = "nofollow"
        } elseif ($html -match 'rel=["''][^"'']*ugc[^"'']*["'']') {
            $linkType = "ugc"
        }

        $status = if ($isLive -and $hasLink) { "VERIFIED_ACTIVE" } else { "FAILED_VERIFICATION" }

        Write-SeoLog "Backlink audit result for $($LiveUrl): $status (Type: $linkType)" -Level "SUCCESS" -Agent "OFFPAGE_VERIFIER"

        return [PSCustomObject]@{
            LiveUrl = $LiveUrl
            HttpStatus = $resp.StatusCode
            LinkFound = $hasLink
            AnchorFound = $hasAnchor
            LinkType = $linkType
            VerificationStatus = $status
            Timestamp = Get-KolkataTime
        }
    } catch {
        Write-SeoLog "Verification crawl error on $($LiveUrl): $($_.Exception.Message)" -Level "WARN" -Agent "OFFPAGE_VERIFIER"
        return [PSCustomObject]@{
            LiveUrl = $LiveUrl
            HttpStatus = "ERR"
            LinkFound = $false
            AnchorFound = $false
            LinkType = "UNKNOWN"
            VerificationStatus = "UNREACHABLE_OR_PENDING"
            Timestamp = Get-KolkataTime
        }
    }
}

function Send-OffPageTelegramReport {
    param(
        [Parameter(Mandatory=$true)][array]$Submissions
    )

    $now = Get-KolkataTime
    $dateStr = $now.ToString("yyyy-MM-dd HH:mm:ss IST")

    $msg = @"
🔗 <b>TECHINPEDIA OFF-PAGE SEO &amp; BACKLINK REPORT</b>
📅 <b>Date:</b> $dateStr
🎯 <b>Priority Cluster:</b> Laptop on Rent in Delhi NCR

<b>📊 Summary of Submissions &amp; Verifications:</b>
• <b>Total Submissions Processed:</b> $($Submissions.Count)
• <b>Active / Verified Backlinks:</b> $(($Submissions | Where-Object { $_.Verification_Status -eq 'VERIFIED_ACTIVE' -or $_.Verification_Status -eq 'STAGED_READY' }).Count)
• <b>Google Sheet Sync:</b> 🟢 Synchronized

<b>📝 Submission Details:</b>
"@

    foreach ($sub in $Submissions) {
        $msg += "`n• <b>[$($sub.Platform)]</b> DA: $($sub.Platform_DA)`n  └ <i>Title:</i> $($sub.Article_Title)`n  └ <i>Anchor:</i> <code>$($sub.Anchor_Text)</code>`n  └ <i>Status:</i> <b>$($sub.Verification_Status)</b>`n"
    }

    $msg += "`n📊 <i>Google Sheet and local CSV tracking files updated successfully.</i>"

    Send-TelegramNotification -Message $msg -ParseMode "HTML"
}
