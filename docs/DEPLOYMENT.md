# CloudCommerce Deployment Guide

## Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
bunx vercel

# Deploy
bunx vercel --prod

# Or use the CI pipeline (GitHub Actions)
# Push to main → auto-deploy
```

### Vercel Environment Variables
Set all variables from `.env.example` in the Vercel dashboard or CLI.

## Option 2: VPS (Docker)

### Prerequisites
- Docker 24+
- docker-compose 2+
- Git

### Setup

```bash
# Clone on the server
git clone <repo> /opt/cloudcommerce
cd /opt/cloudcommerce

# Create production env
cp .env.example .env.production
# Edit .env.production with production values

# Deploy
chmod +x deploy-vps.sh
./deploy-vps.sh
```

### Architecture
- `docker-compose.yml` defines `app` + `db` services
- PostgreSQL data persisted via Docker volume
- App runs as non-root `nextjs` user
- Health checks on database before app starts

## Option 3: AWS ECS

### Prerequisites
- AWS CLI configured
- ECR repository
- ECS cluster + service

### Deploy

```bash
chmod +x deploy-aws.sh
./deploy-aws.sh
```

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Generate strong `CSRF_SECRET` (64+ random chars)
- [ ] Set `LOG_LEVEL=warn` in production
- [ ] Configure Stripe webhook endpoints
- [ ] Enable database backups
- [ ] Set up monitoring (Sentry)
- [ ] Configure CDN for image delivery
- [ ] Set `ALLOWED_ORIGINS` to your domain
