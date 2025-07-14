# AWS Lambda Deployment Guide

This guide covers deploying the PMS Integration Platform to AWS Lambda with API Gateway.

## 🚀 **Quick Start**

### Prerequisites
1. **AWS CLI** installed and configured
2. **AWS Account** with appropriate permissions
3. **.NET 8.0 SDK** installed

### Step 1: Configure AWS Credentials
```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter your default region (e.g., us-east-1)
# Enter your output format (json)
```

### Step 2: Deploy to Lambda
```powershell
# Deploy with IAM role and API Gateway
.\deploy\deploy-lambda.ps1 -CreateRole -CreateApiGateway

# Or deploy step by step
.\deploy\deploy-lambda.ps1 -CreateRole
.\deploy\deploy-lambda.ps1 -CreateApiGateway
```

## 📋 **Deployment Options**

### Option 1: Automated Deployment (Recommended)
```powershell
# Full deployment with role and API Gateway
.\deploy\deploy-lambda.ps1 -CreateRole -CreateApiGateway -Region us-east-1
```

### Option 2: Manual Deployment
```bash
# Build and package
dotnet publish api/api.csproj -c Release -o publish --self-contained true -r linux-x64
cd publish
zip -r ../pms-api-lambda.zip .

# Deploy via AWS CLI
aws lambda create-function \
  --function-name pms-api-lambda \
  --runtime dotnet8 \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-role \
  --handler api::api.LambdaEntryPoint::FunctionHandlerAsync \
  --zip-file fileb://pms-api-lambda.zip \
  --timeout 30 \
  --memory-size 512
```

### Option 3: Using AWS SAM
```yaml
# template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  PmsApiFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: api/bin/Release/net8.0/publish/
      Handler: api::api.LambdaEntryPoint::FunctionHandlerAsync
      Runtime: dotnet8
      Timeout: 30
      MemorySize: 512
      Environment:
        Variables:
          ASPNETCORE_ENVIRONMENT: Production
      Events:
        Api:
          Type: Api
          Properties:
            Path: /{proxy+}
            Method: ANY
```

## 🔧 **Configuration**

### Environment Variables
```json
{
  "ASPNETCORE_ENVIRONMENT": "Production",
  "JWT__KEY": "your-secure-jwt-key",
  "JWT__ISSUER": "h5net-pms",
  "JWT__AUDIENCE": "h5net-pms-api"
}
```

### Lambda Settings
- **Runtime**: .NET 8
- **Memory**: 512 MB (adjustable)
- **Timeout**: 30 seconds (adjustable)
- **Handler**: `api::api.LambdaEntryPoint::FunctionHandlerAsync`

## 🌐 **API Gateway Configuration**

### HTTP API (Recommended)
```bash
# Create HTTP API
aws apigatewayv2 create-api --name "pms-api-gateway" --protocol-type HTTP

# Create integration
aws apigatewayv2 create-integration \
  --api-id YOUR_API_ID \
  --integration-type AWS_PROXY \
  --integration-uri arn:aws:lambda:us-east-1:YOUR_ACCOUNT:function:pms-api-lambda

# Create route
aws apigatewayv2 create-route \
  --api-id YOUR_API_ID \
  --route-key "ANY /{proxy+}" \
  --target "integrations/YOUR_INTEGRATION_ID"
```

### Available Endpoints
- `POST /api/pms/{pmscode}` - Process PMS feeds
- `GET /health` - Health check
- `GET /health/ready` - Readiness check
- `POST /api/auth/login` - Authentication

## 📊 **Monitoring & Logging**

### CloudWatch Logs
```bash
# View function logs
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/pms-api-lambda

# Get recent logs
aws logs tail /aws/lambda/pms-api-lambda --follow
```

### CloudWatch Metrics
- **Invocations**: Number of function invocations
- **Duration**: Function execution time
- **Errors**: Number of errors
- **Throttles**: Number of throttled requests

### X-Ray Tracing
```bash
# Enable X-Ray tracing
aws lambda update-function-configuration \
  --function-name pms-api-lambda \
  --tracing-config Mode=Active
```

## 🔐 **Security**

### IAM Roles
```json
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
```

### Required Permissions
- **CloudWatch Logs**: Write access for logging
- **X-Ray**: Write access for tracing (optional)
- **S3**: Read access for PMS data (if using S3)

### API Gateway Security
```bash
# Add API key requirement
aws apigatewayv2 create-api-key --name "pms-api-key"

# Create usage plan
aws apigatewayv2 create-usage-plan \
  --name "pms-api-usage-plan" \
  --api-id YOUR_API_ID \
  --throttle-burst-limit 100 \
  --throttle-rate-limit 50
```

## 🚀 **Testing**

### Local Testing
```bash
# Test Lambda function locally
dotnet lambda-test-tool-6.0

# Or use AWS SAM CLI
sam local start-api
```

### API Testing
```bash
# Test health endpoint
curl https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/health

# Test PMS endpoint
curl -X POST https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/api/pms/testhotel \
  -H "Content-Type: application/json" \
  -d '{"feedData": "test data"}'
```

## 💰 **Cost Optimization**

### Lambda Pricing
- **Requests**: $0.20 per 1M requests
- **Duration**: $0.0000166667 per GB-second
- **Memory**: 512 MB = $0.0000083333 per second

### Optimization Tips
1. **Memory**: Increase memory for better performance (faster execution = lower cost)
2. **Timeout**: Set appropriate timeout (30 seconds is usually sufficient)
3. **Cold Starts**: Use provisioned concurrency for consistent performance
4. **Caching**: Implement response caching to reduce invocations

### Cost Estimation
```
Monthly cost for 100K requests:
- Requests: $0.02
- Duration (avg 500ms): $0.02
- Total: ~$0.04/month
```

## 🔄 **CI/CD Integration**

### GitHub Actions
```yaml
name: Deploy to Lambda
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-dotnet@v3
      with:
        dotnet-version: '8.0.x'
    - run: dotnet publish api/api.csproj -c Release
    - uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1
    - run: |
        cd api/bin/Release/net8.0/publish
        zip -r ../../../../../pms-api-lambda.zip .
        aws lambda update-function-code \
          --function-name pms-api-lambda \
          --zip-file fileb://pms-api-lambda.zip
```

## 🛠 **Troubleshooting**

### Common Issues

#### 1. Cold Start Performance
```bash
# Enable provisioned concurrency
aws lambda put-provisioned-concurrency-config \
  --function-name pms-api-lambda \
  --qualifier $LATEST \
  --provisioned-concurrent-executions 5
```

#### 2. Memory Issues
```bash
# Increase memory allocation
aws lambda update-function-configuration \
  --function-name pms-api-lambda \
  --memory-size 1024
```

#### 3. Timeout Issues
```bash
# Increase timeout
aws lambda update-function-configuration \
  --function-name pms-api-lambda \
  --timeout 60
```

#### 4. Permission Issues
```bash
# Check IAM role permissions
aws iam get-role --role-name lambda-role
aws iam list-attached-role-policies --role-name lambda-role
```

### Debugging
```bash
# View function logs
aws logs tail /aws/lambda/pms-api-lambda --follow

# Test function directly
aws lambda invoke \
  --function-name pms-api-lambda \
  --payload '{"httpMethod": "GET", "path": "/health"}' \
  response.json
```

## 📚 **Additional Resources**

- [AWS Lambda .NET Documentation](https://docs.aws.amazon.com/lambda/latest/dg/dotnet-programming-model.html)
- [Amazon.Lambda.AspNetCoreServer](https://github.com/aws/aws-lambda-dotnet/tree/master/Libraries/src/Amazon.Lambda.AspNetCoreServer)
- [API Gateway HTTP APIs](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api.html)
- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/) 