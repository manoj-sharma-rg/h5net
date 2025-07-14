#!/bin/bash

# GitHub CI/CD Environment Setup Script
# This script helps set up the required environments and branch protection rules

set -e

echo "🚀 Setting up GitHub CI/CD environments..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    print_error "GitHub CLI (gh) is not installed. Please install it first:"
    echo "  macOS: brew install gh"
    echo "  Windows: winget install GitHub.cli"
    echo "  Linux: https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    print_error "Not authenticated with GitHub. Please run: gh auth login"
    exit 1
fi

# Get repository name
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)

print_status "Setting up environments for repository: $REPO"

# Create staging environment
print_status "Creating staging environment..."
gh api repos/$REPO/environments/staging \
  --method PUT \
  --field protection_rules='[{"id":1,"node_id":"MDQ6RW52aXJvbm1lbnRQcm90ZWN0aW9uUnVsZTE=","type":"required_reviewers","wait_timer":0,"reviewers":[{"type":"User","reviewer":{"login":"your-username"}}]}]' \
  --field deployment_branch_policy='{"protected_branches":true,"custom_branch_policies":false}' \
  --silent || print_warning "Failed to create staging environment (may already exist)"

# Create production environment
print_status "Creating production environment..."
gh api repos/$REPO/environments/production \
  --method PUT \
  --field protection_rules='[{"id":1,"node_id":"MDQ6RW52aXJvbm1lbnRQcm90ZWN0aW9uUnVsZTE=","type":"required_reviewers","wait_timer":300,"reviewers":[{"type":"User","reviewer":{"login":"your-username"}}]}]' \
  --field deployment_branch_policy='{"protected_branches":true,"custom_branch_policies":false}' \
  --silent || print_warning "Failed to create production environment (may already exist)"

# Set up branch protection for main branch
print_status "Setting up branch protection for main branch..."
gh api repos/$REPO/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["test-backend","test-frontend","security-scan"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true,"require_code_owner_reviews":false}' \
  --field restrictions=null \
  --silent || print_warning "Failed to set up main branch protection"

# Set up branch protection for develop branch
print_status "Setting up branch protection for develop branch..."
gh api repos/$REPO/branches/develop/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["test-backend","test-frontend","security-scan"]}' \
  --field enforce_admins=false \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true,"require_code_owner_reviews":false}' \
  --field restrictions=null \
  --silent || print_warning "Failed to set up develop branch protection"

print_success "Environment setup completed!"

echo ""
print_status "Next steps:"
echo "1. Update the reviewer usernames in the environment protection rules"
echo "2. Configure required secrets in repository settings:"
echo "   - Go to Settings → Secrets and variables → Actions"
echo "   - Add secrets for deployment (if needed):"
echo "     - AZURE_CREDENTIALS"
echo "     - AWS_ACCESS_KEY_ID"
echo "     - AWS_SECRET_ACCESS_KEY"
echo "   - Add secrets for notifications (optional):"
echo "     - SLACK_WEBHOOK_URL"
echo "     - TEAMS_WEBHOOK_URL"
echo "3. Test the CI/CD pipeline by creating a pull request"
echo ""
print_warning "Note: You may need to manually configure some settings in the GitHub web interface"
print_warning "Visit: https://github.com/$REPO/settings/environments" 