# GitHub CI/CD Environment Setup Script (PowerShell)
# This script helps set up the required environments and branch protection rules

param(
    [string]$RepoOwner,
    [string]$RepoName
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

Write-Host "🚀 Setting up GitHub CI/CD environments..." -ForegroundColor $Blue

# Check if gh CLI is installed
try {
    $null = Get-Command gh -ErrorAction Stop
} catch {
    Write-Error "GitHub CLI (gh) is not installed. Please install it first:"
    Write-Host "  Windows: winget install GitHub.cli" -ForegroundColor $Yellow
    Write-Host "  Or download from: https://cli.github.com/" -ForegroundColor $Yellow
    exit 1
}

# Check if user is authenticated
try {
    $null = gh auth status 2>$null
} catch {
    Write-Error "Not authenticated with GitHub. Please run: gh auth login"
    exit 1
}

# Get repository name if not provided
if (-not $RepoOwner -or -not $RepoName) {
    try {
        $repoInfo = gh repo view --json nameWithOwner -q .nameWithOwner
        $parts = $repoInfo.Split('/')
        $RepoOwner = $parts[0]
        $RepoName = $parts[1]
    } catch {
        Write-Error "Could not determine repository name. Please provide RepoOwner and RepoName parameters."
        exit 1
    }
}

$Repo = "$RepoOwner/$RepoName"

Write-Status "Setting up environments for repository: $Repo"

# Create staging environment
Write-Status "Creating staging environment..."
try {
    gh api repos/$Repo/environments/staging `
        --method PUT `
        --field protection_rules='[{"id":1,"node_id":"MDQ6RW52aXJvbm1lbnRQcm90ZWN0aW9uUnVsZTE=","type":"required_reviewers","wait_timer":0,"reviewers":[{"type":"User","reviewer":{"login":"your-username"}}]}]' `
        --field deployment_branch_policy='{"protected_branches":true,"custom_branch_policies":false}' `
        --silent
    Write-Success "Staging environment created"
} catch {
    Write-Warning "Failed to create staging environment (may already exist)"
}

# Create production environment
Write-Status "Creating production environment..."
try {
    gh api repos/$Repo/environments/production `
        --method PUT `
        --field protection_rules='[{"id":1,"node_id":"MDQ6RW52aXJvbm1lbnRQcm90ZWN0aW9uUnVsZTE=","type":"required_reviewers","wait_timer":300,"reviewers":[{"type":"User","reviewer":{"login":"your-username"}}]}]' `
        --field deployment_branch_policy='{"protected_branches":true,"custom_branch_policies":false}' `
        --silent
    Write-Success "Production environment created"
} catch {
    Write-Warning "Failed to create production environment (may already exist)"
}

# Set up branch protection for main branch
Write-Status "Setting up branch protection for main branch..."
try {
    gh api repos/$Repo/branches/main/protection `
        --method PUT `
        --field required_status_checks='{"strict":true,"contexts":["test-backend","test-frontend","security-scan"]}' `
        --field enforce_admins=true `
        --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true,"require_code_owner_reviews":false}' `
        --field restrictions=null `
        --silent
    Write-Success "Main branch protection configured"
} catch {
    Write-Warning "Failed to set up main branch protection"
}

# Set up branch protection for develop branch
Write-Status "Setting up branch protection for develop branch..."
try {
    gh api repos/$Repo/branches/develop/protection `
        --method PUT `
        --field required_status_checks='{"strict":true,"contexts":["test-backend","test-frontend","security-scan"]}' `
        --field enforce_admins=false `
        --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true,"require_code_owner_reviews":false}' `
        --field restrictions=null `
        --silent
    Write-Success "Develop branch protection configured"
} catch {
    Write-Warning "Failed to set up develop branch protection"
}

Write-Success "Environment setup completed!"

Write-Host ""
Write-Status "Next steps:"
Write-Host "1. Update the reviewer usernames in the environment protection rules" -ForegroundColor $Yellow
Write-Host "2. Configure required secrets in repository settings:" -ForegroundColor $Yellow
Write-Host "   - Go to Settings → Secrets and variables → Actions" -ForegroundColor $Yellow
Write-Host "   - Add secrets for deployment (if needed):" -ForegroundColor $Yellow
Write-Host "     - AZURE_CREDENTIALS" -ForegroundColor $Yellow
Write-Host "     - AWS_ACCESS_KEY_ID" -ForegroundColor $Yellow
Write-Host "     - AWS_SECRET_ACCESS_KEY" -ForegroundColor $Yellow
Write-Host "   - Add secrets for notifications (optional):" -ForegroundColor $Yellow
Write-Host "     - SLACK_WEBHOOK_URL" -ForegroundColor $Yellow
Write-Host "     - TEAMS_WEBHOOK_URL" -ForegroundColor $Yellow
Write-Host "3. Test the CI/CD pipeline by creating a pull request" -ForegroundColor $Yellow
Write-Host ""
Write-Warning "Note: You may need to manually configure some settings in the GitHub web interface"
Write-Warning "Visit: https://github.com/$Repo/settings/environments" 