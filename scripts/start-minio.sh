#!/usr/bin/env bash
# Start a local MinIO instance for development.
# Data is stored in .minio-data/ (gitignored).
# Console: http://localhost:9001  (minioadmin / minioadmin)
# API:     http://localhost:9000

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DATA_DIR="$PROJECT_DIR/.minio-data"
MINIO="${MINIO_BIN:-$HOME/.local/bin/minio}"
MC="${MC_BIN:-$HOME/.local/bin/mc}"

MINIO_USER="minioadmin"
MINIO_PASS="minioadmin"
BUCKET="plant-tracker"

mkdir -p "$DATA_DIR"

echo "Starting MinIO..."
MINIO_ROOT_USER="$MINIO_USER" MINIO_ROOT_PASSWORD="$MINIO_PASS" \
  "$MINIO" server "$DATA_DIR" --address ":9000" --console-address ":9001" &
MINIO_PID=$!

# Wait for MinIO to be ready
for i in $(seq 1 30); do
  if curl -sf http://localhost:9000/minio/health/ready >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

# Configure mc alias and create bucket if needed
"$MC" alias set local http://localhost:9000 "$MINIO_USER" "$MINIO_PASS" --quiet 2>/dev/null || true
if ! "$MC" ls local/"$BUCKET" >/dev/null 2>&1; then
  "$MC" mb local/"$BUCKET" --quiet
  echo "Created bucket: $BUCKET"
fi

echo ""
echo "MinIO is running"
echo "  API:     http://localhost:9000"
echo "  Console: http://localhost:9001  ($MINIO_USER / $MINIO_PASS)"
echo "  Bucket:  $BUCKET"
echo ""
echo "Press Ctrl+C to stop."

wait $MINIO_PID
