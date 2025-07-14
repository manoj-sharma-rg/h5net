# CI/CD Pipeline Documentation

This directory contains GitHub Actions workflows for automated testing, building, and deployment of the PMS Integration Platform.

## Workflows Overview

### 1. `ci-cd.yml` - Main CI/CD Pipeline
**Triggers:** Push to `main` or `develop` branches, Pull Requests

**Jobs:**
- **test-backend**: Builds and tests the .NET backend API
- **test-frontend**: Lints and tests the React frontend
- **security-scan**: Runs CodeQL and Trivy vulnerability scans
- **build**: Creates production builds for both backend and frontend
- **deploy-staging**: Deploys to staging environment (develop branch)
- **deploy-production**: Deploys to production environment (main branch)
- **notify**: Sends notifications on deployment success/failure

### 2. `pr-check.yml` - Pull Request Validation
**Triggers:** Pull Requests to `main` or `develop` branches

**Jobs:**
- **validate-pr**: Runs tests and validates code quality
- **code-quality**: Performs additional code quality checks

### 3. `dependency-check.yml` - Dependency Management
**Triggers:** Weekly schedule (Sundays 2 AM UTC), Manual trigger

**Jobs:**
- **check-dependencies**: Scans for outdated and vulnerable dependencies
- **security-scan**: Runs security vulnerability scans
- **auto-update-dependencies**: Automatically updates dependencies (manual only)

## Environment Setup

### Required Secrets
Configure these secrets in your GitHub repository settings:

```bash
# For deployment (if using cloud services)
AZURE_CREDENTIALS=           # Azure service principal credentials
AWS_ACCESS_KEY_ID=           # AWS access key
AWS_SECRET_ACCESS_KEY=       # AWS secret key

# For notifications
SLACK_WEBHOOK_URL=           # Slack webhook for notifications
TEAMS_WEBHOOK_URL=           # Microsoft Teams webhook

# For security scanning
SONAR_TOKEN=                 # SonarCloud token (if using)
```

### Environment Protection Rules
Set up environment protection rules for `staging` and `production`:

1. Go to Settings → Environments
2. Create environments: `staging` and `production`
3. Add protection rules:
   - Required reviewers
   - Wait timer
   - Deployment branches

## Customization

### Deployment Configuration
Update the deployment steps in `ci-cd.yml`:

```yaml
- name: Deploy to Staging
  run: |
    # Add your staging deployment logic
    # Example: Copy files to server, run deployment scripts
```

### Notification Setup
Configure notifications in the `notify` job:

```yaml
- name: Notify on Success
  run: |
    # Add Slack/Teams/Email notification logic
    curl -X POST ${{ secrets.SLACK_WEBHOOK_URL }} \
      -H "Content-type: application/json" \
      -d '{"text":"Deployment successful! 🎉"}'
```

### Branch Protection
Set up branch protection rules:

1. Go to Settings → Branches
2. Add rule for `main` and `develop` branches
3. Enable:
   - Require status checks to pass
   - Require branches to be up to date
   - Require pull request reviews
   - Restrict pushes that create files

## Monitoring and Troubleshooting

### Workflow Status
- View workflow runs: Actions tab in GitHub
- Check logs: Click on any job to see detailed logs
- Download artifacts: Available for 7-30 days

### Common Issues

**Build Failures:**
- Check dependency versions
- Verify Node.js/.NET versions match local development
- Review test failures in logs

**Deployment Failures:**
- Verify environment secrets are configured
- Check deployment permissions
- Review server connectivity

**Security Scan Failures:**
- Address vulnerability warnings
- Update dependencies with known issues
- Review false positives

### Performance Optimization

**Caching:**
- npm dependencies are cached automatically
- Consider adding .NET package caching
- Cache build artifacts between jobs

**Parallelization:**
- Backend and frontend tests run in parallel
- Security scans run after tests complete
- Builds only run on successful tests

## Local Development

### Running Workflows Locally
Use [act](https://github.com/nektos/act) to run workflows locally:

```bash
# Install act
brew install act  # macOS
# or download from GitHub releases

# Run a specific workflow
act pull_request

# Run with specific event
act push -W .github/workflows/ci-cd.yml
```

### Pre-commit Hooks
Consider adding pre-commit hooks for local validation:

```bash
# Install pre-commit
pip install pre-commit

# Create .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
```

## Best Practices

1. **Keep workflows fast**: Use caching and parallel jobs
2. **Fail fast**: Run critical tests first
3. **Security first**: Always run security scans
4. **Document changes**: Update this README when modifying workflows
5. **Test locally**: Use act to test workflow changes
6. **Monitor costs**: Be aware of GitHub Actions minutes usage

## Support

For issues with CI/CD workflows:
1. Check the Actions tab for detailed error logs
2. Review this documentation
3. Check GitHub Actions documentation
4. Contact the development team 