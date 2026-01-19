# Ralph Wiggum - Long-running AI agent loop
# Usage: .\ralph.ps1 -MaxIterations 10

param(
    [int]$MaxIterations = 10
)

$ErrorActionPreference = "Stop"

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$PRD_FILE = Join-Path $SCRIPT_DIR "prd.json"
$PROGRESS_FILE = Join-Path $SCRIPT_DIR "progress.txt"
$ARCHIVE_DIR = Join-Path $SCRIPT_DIR "archive"
$LAST_BRANCH_FILE = Join-Path $SCRIPT_DIR ".last-branch"

# Archive previous run if branch changed
if ((Test-Path $PRD_FILE) -and (Test-Path $LAST_BRANCH_FILE)) {
    try {
        $prdContent = Get-Content $PRD_FILE | ConvertFrom-Json
        $CURRENT_BRANCH = $prdContent.branchName
    } catch {
        $CURRENT_BRANCH = ""
    }
    
    if (Test-Path $LAST_BRANCH_FILE) {
        $LAST_BRANCH = Get-Content $LAST_BRANCH_FILE
    } else {
        $LAST_BRANCH = ""
    }
    
    if ($CURRENT_BRANCH -and $LAST_BRANCH -and $CURRENT_BRANCH -ne $LAST_BRANCH) {
        $DATE = Get-Date -Format "yyyy-MM-dd"
        $FOLDER_NAME = $LAST_BRANCH -replace '^ralph/', ''
        $ARCHIVE_FOLDER = Join-Path $ARCHIVE_DIR "$DATE-$FOLDER_NAME"
        
        Write-Host "Archiving previous run: $LAST_BRANCH"
        New-Item -ItemType Directory -Path $ARCHIVE_FOLDER -Force | Out-Null
        
        if (Test-Path $PRD_FILE) {
            Copy-Item $PRD_FILE -Destination $ARCHIVE_FOLDER
        }
        if (Test-Path $PROGRESS_FILE) {
            Copy-Item $PROGRESS_FILE -Destination $ARCHIVE_FOLDER
        }
        
        Write-Host "   Archived to: $ARCHIVE_FOLDER"
        
        # Reset progress file for new run
        @"
# Ralph Progress Log
Started: $(Get-Date)
---
"@ | Set-Content $PROGRESS_FILE
    }
}

# Track current branch
if (Test-Path $PRD_FILE) {
    try {
        $prdContent = Get-Content $PRD_FILE | ConvertFrom-Json
        $CURRENT_BRANCH = $prdContent.branchName
    } catch {
        $CURRENT_BRANCH = ""
    }
    
    if ($CURRENT_BRANCH) {
        Set-Content $LAST_BRANCH_FILE $CURRENT_BRANCH
    }
}

# Initialize progress file if it doesn't exist
if (-not (Test-Path $PROGRESS_FILE)) {
    @"
# Ralph Progress Log
Started: $(Get-Date)
---
"@ | Set-Content $PROGRESS_FILE
}

Write-Host "Starting Ralph - Max iterations: $MaxIterations"

for ($i = 1; $i -le $MaxIterations; $i++) {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════"
    Write-Host "  Ralph Iteration $i of $MaxIterations"
    Write-Host "═══════════════════════════════════════════════════════"
    
    # Run Claude with the ralph prompt
    $PROMPT_FILE = Join-Path $SCRIPT_DIR "prompt.md"
    $PROMPT_TEXT = Get-Content $PROMPT_FILE -Raw
    
    try {
        $result = & claude --dangerously-skip-permissions --output-format text -p $PROMPT_TEXT 2>&1
    } catch {
        $result = $_.Exception.Message
    }
    
    # Check for completion signal
    if ($result -match "<promise>COMPLETE</promise>") {
        Write-Host ""
        Write-Host "Ralph completed all tasks!"
        Write-Host "Completed at iteration $i of $MaxIterations"
        exit 0
    }
    
    Write-Host "Iteration $i complete. Continuing..."
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "Ralph reached max iterations ($MaxIterations) without completing all tasks."
Write-Host "Check $PROGRESS_FILE for status."
exit 1
