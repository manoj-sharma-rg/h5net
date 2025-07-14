# AWS Lambda Deployment Script for PMS API
param(
    [string]$FunctionName = "pms-api-lambda",
    [string]$Region = "us-east-1",
    [string]$Profile = "default",
    [switch]$CreateRole,
    [switch]$CreateApiGateway
)

Write-Host "Deploying PMS API to AWS Lambda..." -ForegroundColor Green

# Check if AWS CLI is installed
try {
    aws --version | Out-Null
} catch {
    Write-Error "AWS CLI is not installed. Please install it first: https://aws.amazon.com/cli/"
    exit 1
}

# Check if AWS credentials are configured
try {
    aws sts get-caller-identity --profile $Profile | Out-Null
} catch {
    Write-Error "AWS credentials not configured for profile '$Profile'. Please run 'aws configure' first."
    exit 1
}

# Build the project
Write-Host "Building project for Lambda..." -ForegroundColor Yellow
dotnet build api/api.csproj -c Release

if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed!"
    exit 1
}

# Create Lambda deployment package
Write-Host "Creating Lambda deployment package..." -ForegroundColor Yellow
$packagePath = "pms-api-lambda.zip"

# Publish for Lambda
dotnet publish api/api.csproj -c Release -o api/bin/Release/net8.0/publish --self-contained true -r linux-x64

# Create deployment package
if (Test-Path $packagePath) {
    Remove-Item $packagePath -Force
}

# Zip the published files
Compress-Archive -Path "api/bin/Release/net8.0/publish/*" -DestinationPath $packagePath -Force

Write-Host "Deployment package created: $packagePath" -ForegroundColor Green

# Create IAM role if requested
if ($CreateRole) {
    Write-Host "Creating IAM role..." -ForegroundColor Yellow
    
    $trustPolicy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
"@

    $trustPolicy | Out-File -FilePath "trust-policy.json" -Encoding UTF8

    # Create role
    aws iam create-role --role-name lambda-role --assume-role-policy-document file://trust-policy.json --profile $Profile

    # Attach basic execution role
    aws iam attach-role-policy --role-name lambda-role --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole --profile $Profile

    # Wait for role to be available
    Write-Host "Waiting for IAM role to be available..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10

    Remove-Item "trust-policy.json" -Force
}

# Deploy to Lambda
Write-Host "Deploying to AWS Lambda..." -ForegroundColor Yellow

# Check if function exists
$functionExists = aws lambda get-function --function-name $FunctionName --region $Region --profile $Profile 2>$null

if ($functionExists) {
    Write-Host "Updating existing Lambda function..." -ForegroundColor Yellow
    aws lambda update-function-code --function-name $FunctionName --zip-file fileb://$packagePath --region $Region --profile $Profile
} else {
    Write-Host "Creating new Lambda function..." -ForegroundColor Yellow
    
    # Get account ID for role ARN
    $accountId = (aws sts get-caller-identity --profile $Profile --query Account --output text)
    $roleArn = "arn:aws:iam::$accountId`:role/lambda-role"
    
    aws lambda create-function `
        --function-name $FunctionName `
        --runtime dotnet8 `
        --role $roleArn `
        --handler api::api.LambdaEntryPoint::FunctionHandlerAsync `
        --zip-file fileb://$packagePath `
        --timeout 30 `
        --memory-size 512 `
        --environment Variables="{ASPNETCORE_ENVIRONMENT=Production}" `
        --region $Region `
        --profile $Profile
}

# Create API Gateway if requested
if ($CreateApiGateway) {
    Write-Host "Creating API Gateway..." -ForegroundColor Yellow
    
    # Create HTTP API
    $apiResponse = aws apigatewayv2 create-api --name "pms-api-gateway" --protocol-type HTTP --region $Region --profile $Profile
    
    if ($apiResponse) {
        $apiId = ($apiResponse | ConvertFrom-Json).ApiId
        Write-Host "API Gateway created with ID: $apiId" -ForegroundColor Green
        
        # Create integration
        $integrationResponse = aws apigatewayv2 create-integration `
            --api-id $apiId `
            --integration-type AWS_PROXY `
            --integration-uri "arn:aws:lambda:$Region`:$accountId`:function:$FunctionName" `
            --payload-format-version "2.0" `
            --region $Region `
            --profile $Profile
        
        if ($integrationResponse) {
            $integrationId = ($integrationResponse | ConvertFrom-Json).IntegrationId
            
            # Create route
            aws apigatewayv2 create-route `
                --api-id $apiId `
                --route-key "ANY /{proxy+}" `
                --target "integrations/$integrationId" `
                --region $Region `
                --profile $Profile
            
            # Add Lambda permission
            aws lambda add-permission `
                --function-name $FunctionName `
                --statement-id apigateway-access `
                --action lambda:InvokeFunction `
                --principal apigateway.amazonaws.com `
                --source-arn "arn:aws:execute-api:$Region`:$accountId`:$apiId/*/*/{proxy+}" `
                --region $Region `
                --profile $Profile
            
            Write-Host "API Gateway integration completed!" -ForegroundColor Green
            Write-Host "API Gateway URL: https://$apiId.execute-api.$Region.amazonaws.com/" -ForegroundColor Cyan
        }
    }
}

# Clean up
Remove-Item $packagePath -Force

Write-Host "Lambda deployment completed!" -ForegroundColor Green
Write-Host "Function ARN: arn:aws:lambda:$Region`:$accountId`:function:$FunctionName" -ForegroundColor Cyan

if ($CreateApiGateway) {
    Write-Host "Test your API at: https://$apiId.execute-api.$Region.amazonaws.com/api/pms/testhotel" -ForegroundColor Cyan
} else {
    Write-Host "To create API Gateway, run: .\deploy-lambda.ps1 -CreateApiGateway" -ForegroundColor Yellow
} 