#!/usr/bin/env bash
set -euo pipefail

# AWS ECS Deployment Script
# Requires: AWS CLI, jq

echo "=== CloudCommerce AWS Deployment ==="

CLUSTER="${CLUSTER:-cloudcommerce-cluster}"
SERVICE="${SERVICE:-cloudcommerce-service}"
REGION="${REGION:-us-east-1}"
ECR_REPO="${ECR_REPO:-public.ecr.aws/cloudcommerce/app}"

# Build image
docker build -t cloudcommerce:latest .

# Tag and push to ECR
docker tag cloudcommerce:latest "$ECR_REPO:latest"
aws ecr-public get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$ECR_REPO"
docker push "$ECR_REPO:latest"

# Force new deployment
aws ecs update-service \
  --cluster "$CLUSTER" \
  --service "$SERVICE" \
  --force-new-deployment \
  --region "$REGION"

echo "=== AWS Deployment triggered ==="
