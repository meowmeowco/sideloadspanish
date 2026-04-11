#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
TMP_ROOT="${PLAYWRIGHT_TMPDIR:-${PROJECT_ROOT}/.tmp/playwright}"

mkdir -p "${TMP_ROOT}"
export TMPDIR="${TMP_ROOT}"

npx playwright test "$@"
