#!/usr/bin/env bash
set -euo pipefail

echo "=== CloudCommerce VPS Deployment ==="

APP_DIR="${APP_DIR:-/opt/cloudcommerce}"
BRANCH="${BRANCH:-main}"

# Prerequisites
command -v docker >/dev/null 2>&1 || { echo "Docker required"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "Docker Compose required"; exit 1; }

# Pull latest
cd "$APP_DIR"
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

# Build and restart
docker-compose build --no-cache
docker-compose up -d

# Run migrations
docker-compose exec -T app bunx prisma migrate deploy

# Cleanup old images
docker image prune -f

echo "=== Deployment complete ==="
