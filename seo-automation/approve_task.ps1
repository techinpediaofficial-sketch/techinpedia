# ==============================================================================
# TechInPedia SEO Automation - Approval Action CLI
# Usage:
#   powershell -File approve_task.ps1 -List
#   powershell -File approve_task.ps1 -Show <ID>
#   powershell -File approve_task.ps1 -Approve <ID>
#   powershell -File approve_task.ps1 -Reject <ID> -Reason "..."
# ==============================================================================

param(
    [string]$Approve,
    [string]$Reject,
    [string]$Show,
    [string]$Reason = "Rejected by user review",
    [switch]$List
)

. "$PSScriptRoot\core\logger.ps1"
. "$PSScriptRoot\core\approval_manager.ps1"

if ($List -or (-not $Approve -and -not $Reject -and -not $Show)) {
    Write-Host "`n=======================================================" -ForegroundColor Cyan
    Write-Host " TECHINPEDIA SEO & MARKETING PENDING APPROVALS QUEUE" -ForegroundColor Cyan
    Write-Host "=======================================================`n" -ForegroundColor Cyan

    $pending = Get-PendingApprovals
    if ($pending.Count -eq 0) {
        Write-Host "No items currently pending approval. All workflows are clear!`n" -ForegroundColor Green
        exit 0
    }

    foreach ($item in $pending) {
        Write-Host "[$($item.id)] $($item.type) - $($item.title)" -ForegroundColor Yellow
        Write-Host "  Staged By: $($item.agent) on $($item.createdAt)" -ForegroundColor Gray
        Write-Host "  Summary: $($item.summary)" -ForegroundColor White
        Write-Host "  Approve: powershell -File approve_task.ps1 -Approve $($item.id)" -ForegroundColor Green
        Write-Host "  Reject:  powershell -File approve_task.ps1 -Reject $($item.id)" -ForegroundColor Red
        Write-Host "-------------------------------------------------------" -ForegroundColor DarkGray
    }
    Write-Host ""
    exit 0
}

if ($Show) {
    $pendingFile = Join-Path $global:ApprovalsDir "pending\$Show.json"
    if (-not (Test-Path $pendingFile)) {
        Write-Host "Item '$Show' not found in pending approvals queue." -ForegroundColor Red
        exit 1
    }
    $item = Get-Content $pendingFile -Raw -Encoding utf8 | ConvertFrom-Json
    Write-Host "`n--- DETAILS FOR APPROVAL ITEM: $($item.id) ---" -ForegroundColor Cyan
    $item | ConvertTo-Json -Depth 5
    Write-Host ""
    exit 0
}

if ($Approve) {
    Write-Host "`nProcessing approval for [$Approve]..." -ForegroundColor Cyan
    $approvedItem = Approve-ApprovalItem -Id $Approve -ApprovedBy "Website Owner (Approved CLI)"
    if (-not $approvedItem) {
        Write-Host "Approval failed: Item not found." -ForegroundColor Red
        exit 1
    }

    Write-Host "Item [$Approve] is now APPROVED." -ForegroundColor Green

    # Execute specific action based on type
    switch ($approvedItem.type) {
        "CODE_FIX" {
            $branch = $approvedItem.payload.branch
            Write-Host "Code fix approved. Applying git branch: $branch" -ForegroundColor Cyan
            $repoDir = Join-Path $PSScriptRoot ".."
            Push-Location $repoDir
            try {
                Write-Host "Validating git status in repository..." -ForegroundColor Gray
                & git branch -a
                Write-Host "Branch $branch is ready for review and merge into main." -ForegroundColor Green
            } finally {
                Pop-Location
            }
        }
        "BLOG_POST" {
            Write-Host "Blog post draft approved for publication." -ForegroundColor Green
            Write-Host "Payload File: $($approvedItem.payload.filePath)" -ForegroundColor Gray
            Write-Host "Next step: Publication script will commit to Prisma DB / static catalog with status: PUBLISHED." -ForegroundColor Cyan
        }
        "SOCIAL_POST" {
            Write-Host "Social media marketing campaign approved." -ForegroundColor Green
            Write-Host "Campaign ready for publishing across LinkedIn and Instagram." -ForegroundColor Cyan
        }
    }
    Write-Host ""
    exit 0
}

if ($Reject) {
    Write-Host "`nProcessing rejection for [$Reject]..." -ForegroundColor Yellow
    $rejectedItem = Reject-ApprovalItem -Id $Reject -Reason $Reason
    if (-not $rejectedItem) {
        Write-Host "Rejection failed: Item not found." -ForegroundColor Red
        exit 1
    }
    Write-Host "Item [$Reject] is now REJECTED. (Reason: $Reason)" -ForegroundColor Yellow
    Write-Host ""
    exit 0
}
