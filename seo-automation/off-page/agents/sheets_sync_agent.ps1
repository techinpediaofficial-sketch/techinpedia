# ==============================================================================
# TechInPedia Off-Page SEO - Google Sheets & CSV Tracking Agent
# Automatically records and syncs guest blog submissions and verified backlinks
# ==============================================================================

. "$PSScriptRoot\..\..\core\logger.ps1"
. "$PSScriptRoot\..\..\core\gsc_client.ps1"

$global:OffPageCsvPath = Join-Path $PSScriptRoot "..\reports\Off_Page_SEO_Submissions.csv"

function Initialize-SubmissionsTracker {
    if (-not (Test-Path $global:OffPageCsvPath)) {
        $headers = "Submission_ID,Date,Platform,Platform_DA,Article_Title,Live_URL,Anchor_Text,Target_URL,Verification_Status,Link_Type,HTTP_Status,Audited_By"
        Set-Content -Path $global:OffPageCsvPath -Value $headers -Encoding utf8
        Write-SeoLog "Initialized local Off-Page SEO submission tracking CSV." -Level "SUCCESS" -Agent "SHEETS_SYNC"
    }
}

function Log-OffPageSubmission {
    param(
        [Parameter(Mandatory=$true)][string]$SubmissionId,
        [Parameter(Mandatory=$true)][string]$Platform,
        [int]$PlatformDA = 0,
        [Parameter(Mandatory=$true)][string]$ArticleTitle,
        [string]$LiveUrl = "PENDING_PUBLISH",
        [Parameter(Mandatory=$true)][string]$AnchorText,
        [Parameter(Mandatory=$true)][string]$TargetUrl,
        [string]$VerificationStatus = "PENDING_VERIFICATION",
        [string]$LinkType = "UNKNOWN",
        [string]$HttpStatus = "PENDING",
        [string]$Auditor = "OffPage_Verifier_Agent",
        [string]$SpreadsheetId = ""
    )

    Initialize-SubmissionsTracker

    $nowStr = (Get-KolkataTime).ToString("yyyy-MM-dd HH:mm:ss")

    # 1. Append to local CSV (Excel compatible)
    $cleanTitle = $ArticleTitle -replace '"', '""'
    $cleanAnchor = $AnchorText -replace '"', '""'
    $csvRow = "`"$SubmissionId`",`"$nowStr`",`"$Platform`",`"$PlatformDA`",`"$cleanTitle`",`"$LiveUrl`",`"$cleanAnchor`",`"$TargetUrl`",`"$VerificationStatus`",`"$LinkType`",`"$HttpStatus`",`"$Auditor`""
    Add-Content -Path $global:OffPageCsvPath -Value $csvRow -Encoding utf8
    Write-SeoLog "Logged submission [$SubmissionId] to Off_Page_SEO_Submissions.csv" -Level "SUCCESS" -Agent "SHEETS_SYNC"

    # 2. Sync to Google Sheets if SPREADSHEET_ID is supplied
    if (-not $SpreadsheetId) {
        $SpreadsheetId = $env:OFFPAGE_GOOGLE_SHEET_ID
    }

    if ($SpreadsheetId) {
        try {
            Write-SeoLog "Syncing submission [$SubmissionId] to Google Sheet ($SpreadsheetId)..." -Level "INFO" -Agent "SHEETS_SYNC"
            $token = Get-GscAuthToken
            if ($token) {
                $endpoint = "https://sheets.googleapis.com/v4/spreadsheets/$SpreadsheetId/values/Sheet1!A:L:append?valueInputOption=USER_ENTERED"
                $body = @{
                    range = "Sheet1!A:L"
                    majorDimension = "ROWS"
                    values = @(
                        @($SubmissionId, $nowStr, $Platform, $PlatformDA, $ArticleTitle, $LiveUrl, $AnchorText, $TargetUrl, $VerificationStatus, $LinkType, $HttpStatus, $Auditor)
                    )
                } | ConvertTo-Json -Depth 5

                $headers = @{ Authorization = "Bearer $token" }
                $resp = Invoke-RestMethod -Uri $endpoint -Method Post -Headers $headers -Body $body -ContentType "application/json" -TimeoutSec 15
                Write-SeoLog "Successfully synced row to Google Sheets!" -Level "SUCCESS" -Agent "SHEETS_SYNC"
            }
        } catch {
            Write-SeoLog "Google Sheets sync note: $($_.Exception.Message). Local CSV remains up-to-date." -Level "WARN" -Agent "SHEETS_SYNC"
        }
    } else {
        Write-SeoLog "Google Sheet ID not specified. Logged to local Excel-compatible CSV report." -Level "INFO" -Agent "SHEETS_SYNC"
    }
}
