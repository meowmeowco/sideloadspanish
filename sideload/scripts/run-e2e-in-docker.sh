#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
IMAGE="${PLAYWRIGHT_DOCKER_IMAGE:-mcr.microsoft.com/playwright:v1.52.0-noble}"

docker run --rm \
  --ipc=host \
  -e CI=1 \
  -e PW_HEADLESS=1 \
  -v "${PROJECT_ROOT}:/work" \
  -w /work \
  "${IMAGE}" \
  /bin/bash -lc "npm ci && npm run test:e2e"
