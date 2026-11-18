# ==============================================================================
# Script: sync_ranking_to_sheet.ps1
# Sync Google SERP Rankings to 'SEO Ranking' tab in master Google Sheet
# ==============================================================================

. "$PSScriptRoot\..\core\logger.ps1"
. "$PSScriptRoot\..\core\gsc_client.ps1"

$spreadsheetId = "1uG4MtYHS5MQvzhUQlly4a11rAaeVU5e00OkJcZjSjSM"
$csvPath = "$PSScriptRoot\TechInPedia_Google_Keyword_Rankings_Report.csv"

if (-not (Test-Path $csvPath)) {
    Write-Error "CSV report not found at $csvPath"
    exit 1
}

$token = Get-GscAuthToken
if (-not $token) {
    Write-Error "Failed to get Google OAuth token"
    exit 1
}

$authHeaders = @{
    "Authorization" = "Bearer " + $token
    "Content-Type" = "application/json"
}

# 1. Fetch metadata to check available tabs
Write-Host "Fetching spreadsheet metadata..."
try {
    $meta = Invoke-RestMethod -Uri "https://sheets.googleapis.com/v4/spreadsheets/$spreadsheetId" -Headers $authHeaders -Method Get
    Write-Host "Spreadsheet Title: $($meta.properties.title)"
    $existingSheets = @($meta.sheets | ForEach-Object { $_.properties.title })
    Write-Host "Existing Sheets: $($existingSheets -join ', ')"
} catch {
    Write-Error "Failed to fetch spreadsheet metadata: $($_.Exception.Message)"
    exit 1
}

$targetTab = "SEO Ranking"
$hasTargetTab = $existingSheets -contains $targetTab

if (-not $hasTargetTab) {
    # If the user named it slightly differently (e.g., case-insensitive or with space)
    $matched = $existingSheets | Where-Object { $_ -like "*SEO*Rank*" -or $_ -like "*Ranking*" }
    if ($matched) {
        $targetTab = $matched[0]
        Write-Host "Matched existing ranking tab: '$targetTab'"
    } else {
        Write-Host "Tab '$targetTab' not found. Creating tab '$targetTab'..."
        $addSheetBody = @{
            requests = @(
                @{
                    addSheet = @{
                        properties = @{
                            title = $targetTab
                            gridProperties = @{
                                rowCount = 100
                                columnCount = 15
                            }
                        }
                    }
                }
            )
        } | ConvertTo-Json -Depth 5

        try {
            $addResp = Invoke-RestMethod -Uri "https://sheets.googleapis.com/v4/spreadsheets/$spreadsheetId`:batchUpdate" -Headers $authHeaders -Method Post -Body $addSheetBody
            Write-Host "Successfully created sheet tab '$targetTab'!"
        } catch {
            Write-Host "Could not create tab ($($_.Exception.Message)), defaulting to Sheet1"
            $targetTab = $existingSheets[0]
        }
    }
}

# 2. Read CSV and prepare row values
$csvData = Import-Csv -Path $csvPath
$headers = @(
    "Rank_Check_ID",
    "Date",
    "Target_Keyword",
    "Google_Page",
    "Organic_Rank",
    "TechInPedia_URL",
    "Top_Competitor",
    "SERP_Status_And_Features"
)

$allRows = @()
$allRows += ,$headers

foreach ($row in $csvData) {
    $rowArr = @(
        $row.Rank_Check_ID,
        $row.Date,
        $row.Target_Keyword,
        $row.Google_Page,
        $row.Organic_Rank,
        $row.TechInPedia_URL,
        $row.Top_Competitor,
        $row.SERP_Status_And_Features
    )
    $allRows += ,$rowArr
}

# 3. Update the sheet range
$range = "'$targetTab'!A1:H$($allRows.Count)"
$putEndpoint = "https://sheets.googleapis.com/v4/spreadsheets/$spreadsheetId/values/$range`?valueInputOption=USER_ENTERED"

$body = @{
    range = $range
    majorDimension = "ROWS"
    values = $allRows
} | ConvertTo-Json -Depth 5

Write-Host "Writing $($allRows.Count) rows to range $range..."
try {
    $putResp = Invoke-RestMethod -Uri $putEndpoint -Headers $authHeaders -Method Put -Body $body
    Write-Host "SUCCESS: Updated $($putResp.updatedRows) rows and $($putResp.updatedColumns) columns in tab '$targetTab'!"
} catch {
    Write-Error "Failed to update values: $($_.Exception.Message)"
}
