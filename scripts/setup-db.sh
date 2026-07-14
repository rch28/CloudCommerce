#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }

# ---------- Prerequisites ----------
if ! command -v docker &>/dev/null; then
  error "Docker is not installed. Install it first: https://docs.docker.com/engine/install/"
  exit 1
fi

if ! docker info &>/dev/null; then
  error "Docker daemon is not running. Start Docker and try again."
  exit 1
fi

# ---------- Load DB vars ----------
DB_NAME="${DB_NAME:-cloudcommerce}"
DB_USER="${DB_USER:-postgres}"
DB_PASS="${DB_PASS:-postgres}"
DB_PORT="${DB_PORT:-5432}"
CONTAINER_NAME="${CONTAINER_NAME:-cloudcommerce-db}"

# ---------- Actions ----------
action="${1:-start}"

case "$action" in
  start)
    info "Starting PostgreSQL container '$CONTAINER_NAME'..."

    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
      info "Container '$CONTAINER_NAME' is already running."
    else
      docker run -d \
        --name "$CONTAINER_NAME" \
        -e POSTGRES_USER="$DB_USER" \
        -e POSTGRES_PASSWORD="$DB_PASS" \
        -e POSTGRES_DB="$DB_NAME" \
        -p "$DB_PORT:5432" \
        -v "${CONTAINER_NAME}_data:/var/lib/postgresql/data" \
        --restart unless-stopped \
        postgres:16-alpine

      info "Waiting for PostgreSQL to become healthy..."
      for i in $(seq 1 30); do
        if docker exec "$CONTAINER_NAME" pg_isready -U "$DB_USER" &>/dev/null; then
          info "PostgreSQL is ready on port $DB_PORT."
          break
        fi
        if [ "$i" -eq 30 ]; then
          error "PostgreSQL failed to start within 30 seconds."
          docker logs "$CONTAINER_NAME" --tail 20
          exit 1
        fi
        sleep 1
      done
    fi

    info "DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@localhost:${DB_PORT}/${DB_NAME}"
    info ""
    info "Run migrations:  bunx prisma migrate dev"
    info "Seed database:   bun run db:seed"
    info "Open Studio:     bun run db:studio"
    ;;

  stop)
    info "Stopping container '$CONTAINER_NAME'..."
    docker stop "$CONTAINER_NAME" 2>/dev/null || warn "Container not running."
    ;;

  restart)
    "$0" stop
    "$0" start
    ;;

  rm)
    "$0" stop
    info "Removing container '$CONTAINER_NAME' and its data volume..."
    docker rm -v "$CONTAINER_NAME" 2>/dev/null || true
    docker volume rm "${CONTAINER_NAME}_data" 2>/dev/null || true
    info "Container and volume removed."
    ;;

  status)
    if docker ps --format '{{.Names}} {{.Status}}' | grep "^${CONTAINER_NAME} "; then
      info "Container is running."
    else
      warn "Container '$CONTAINER_NAME' is NOT running."
      docker ps -a --filter "name=$CONTAINER_NAME" --format '{{.Names}} {{.Status}}' 2>/dev/null || true
    fi
    ;;

  logs)
    docker logs -f "$CONTAINER_NAME"
    ;;

  *)
    echo "Usage: $0 {start|stop|restart|rm|status|logs}"
    echo ""
    echo "Examples:"
    echo "  $0 start    # Start PostgreSQL container"
    echo "  $0 stop     # Stop the container"
    echo "  $0 restart  # Restart the container"
    echo "  $0 rm       # Remove container + data volume"
    echo "  $0 status   # Check if container is running"
    echo "  $0 logs     # Follow container logs"
    exit 1
    ;;
esac
