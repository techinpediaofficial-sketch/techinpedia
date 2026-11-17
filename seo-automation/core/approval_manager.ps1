# ==============================================================================
# TechInPedia SEO Automation - Approval Manager Module
# Enforces human-in-the-loop safety before production changes or publishing
# ==============================================================================

. "$PSScriptRoot\logger.ps1"

$global:ApprovalsDir = Join-Path $PSScriptRoot "..\approvals"

function Register-ApprovalItem {
    param(
        [Parameter(Mandatory=$true)][ValidateSet("CODE_FIX", "BLOG_POST", "SOCIAL_POST", "CAMPAIGN", "METADATA_UPDATE")][string]$Type,
        [Parameter(Mandatory=$true)][string]$Title,
        [Parameter(Mandatory=$true)][string]$Summary,
        [Parameter(Mandatory=$true)][hashtable]$Payload,
        [string]$Agent = "SYSTEM"
    )

    $now = Get-KolkataTime
    $datePrefix = $now.ToString("yyyyMMdd")
    $typePrefix = switch ($Type) {
        "CODE_FIX" { "FIX" }
        "BLOG_POST" { "BLOG" }
        "SOCIAL_POST" { "SOC" }
        "CAMPAIGN" { "CAMP" }
        "METADATA_UPDATE" { "META" }
    }

    $pendingDir = Join-Path $global:ApprovalsDir "pending"
    if (-not (Test-Path $pendingDir)) { New-Item -ItemType Directory -Force -Path $pendingDir | Out-Null }

    $existing = Get-ChildItem -Path $pendingDir -Filter "$typePrefix-$datePrefix-*.json"
    $seq = ($existing.Count + 1).ToString("00")
    $approvalId = "$typePrefix-$datePrefix-$seq"

    $item = [PSCustomObject]@{
        id = $approvalId
        type = $Type
        title = $Title
        summary = $Summary
        agent = $Agent
        status = "PENDING"
        createdAt = $now.ToString("yyyy-MM-dd HH:mm:ss IST")
        payload = $Payload
        rollbackPlan = if ($Payload.rollbackPlan) { $Payload.rollbackPlan } else { "Revert branch or delete staged draft." }
    }

    $filePath = Join-Path $pendingDir "$approvalId.json"
    $item | ConvertTo-Json -Depth 10 | Set-Content -Path $filePath -Encoding utf8

    Write-SeoLog "Registered pending approval [$approvalId]: $Title" -Level "INFO" -Agent "APPROVAL_MANAGER"
    return $item
}

function Get-PendingApprovals {
    $pendingDir = Join-Path $global:ApprovalsDir "pending"
    if (-not (Test-Path $pendingDir)) { return @() }

    $items = @()
    Get-ChildItem -Path $pendingDir -Filter "*.json" | ForEach-Object {
        try {
            $content = Get-Content $_.FullName -Raw -Encoding utf8 | ConvertFrom-Json
            $items += $content
        } catch {}
    }
    return $items
}

function Approve-ApprovalItem {
    param(
        [Parameter(Mandatory=$true)][string]$Id,
        [string]$ApprovedBy = "USER_APPROVAL"
    )

    $pendingFile = Join-Path $global:ApprovalsDir "pending\$Id.json"
    if (-not (Test-Path $pendingFile)) {
        Write-SeoLog "Approval item [$Id] not found in pending queue." -Level "ERROR" -Agent "APPROVAL_MANAGER"
        return $null
    }

    $raw = Get-Content $pendingFile -Raw -Encoding utf8 | ConvertFrom-Json
    $raw.status = "APPROVED"
    $raw | Add-Member -MemberType NoteProperty -Name "approvedBy" -Value $ApprovedBy -Force
    $raw | Add-Member -MemberType NoteProperty -Name "approvedAt" -Value (Get-KolkataTime).ToString("yyyy-MM-dd HH:mm:ss IST") -Force

    $approvedDir = Join-Path $global:ApprovalsDir "approved"
    if (-not (Test-Path $approvedDir)) { New-Item -ItemType Directory -Force -Path $approvedDir | Out-Null }

    $targetFile = Join-Path $approvedDir "$Id.json"
    $raw | ConvertTo-Json -Depth 10 | Set-Content -Path $targetFile -Encoding utf8
    Remove-Item -Path $pendingFile -Force

    Write-SeoLog "Approval item [$Id] marked APPROVED by $ApprovedBy." -Level "SUCCESS" -Agent "APPROVAL_MANAGER"
    return $raw
}

function Reject-ApprovalItem {
    param(
        [Parameter(Mandatory=$true)][string]$Id,
        [string]$Reason = "Rejected by user"
    )

    $pendingFile = Join-Path $global:ApprovalsDir "pending\$Id.json"
    if (-not (Test-Path $pendingFile)) {
        Write-SeoLog "Approval item [$Id] not found in pending queue." -Level "ERROR" -Agent "APPROVAL_MANAGER"
        return $null
    }

    $raw = Get-Content $pendingFile -Raw -Encoding utf8 | ConvertFrom-Json
    $raw.status = "REJECTED"
    $raw | Add-Member -MemberType NoteProperty -Name "rejectionReason" -Value $Reason -Force
    $raw | Add-Member -MemberType NoteProperty -Name "rejectedAt" -Value (Get-KolkataTime).ToString("yyyy-MM-dd HH:mm:ss IST") -Force

    $rejectedDir = Join-Path $global:ApprovalsDir "rejected"
    if (-not (Test-Path $rejectedDir)) { New-Item -ItemType Directory -Force -Path $rejectedDir | Out-Null }

    $targetFile = Join-Path $rejectedDir "$Id.json"
    $raw | ConvertTo-Json -Depth 10 | Set-Content -Path $targetFile -Encoding utf8
    Remove-Item -Path $pendingFile -Force

    Write-SeoLog "Approval item [$Id] marked REJECTED ($Reason)." -Level "WARN" -Agent "APPROVAL_MANAGER"
    return $raw
}
