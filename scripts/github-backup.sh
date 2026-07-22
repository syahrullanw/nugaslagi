#!/usr/bin/env bash

set -euo pipefail

EXPECTED_ORIGIN="https://github.com/syahrullanw/nugaslagi.git"
MODE="${1:---check}"

usage() {
  echo "Usage: $0 [--check|--push]"
}

if [[ "$MODE" != "--check" && "$MODE" != "--push" ]]; then
  usage
  exit 2
fi

REPOSITORY_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "Error: jalankan script dari dalam repository Git."
  exit 1
}
cd "$REPOSITORY_ROOT"

ACTUAL_ORIGIN="$(git remote get-url origin 2>/dev/null || true)"
if [[ "$ACTUAL_ORIGIN" != "$EXPECTED_ORIGIN" ]]; then
  echo "Error: remote origin tidak sesuai."
  echo "Expected: $EXPECTED_ORIGIN"
  echo "Actual:   ${ACTUAL_ORIGIN:-<belum dikonfigurasi>}"
  exit 1
fi

BRANCH="$(git branch --show-current)"
if [[ -z "$BRANCH" ]]; then
  echo "Error: repository sedang dalam detached HEAD. Pindah ke branch sebelum backup."
  exit 1
fi

git diff --check

STATUS="$(git status --short)"
if [[ -n "$STATUS" ]]; then
  echo "Working tree belum bersih. Perubahan berikut belum menjadi backup GitHub:"
  echo "$STATUS"
  if [[ "$MODE" == "--push" ]]; then
    echo "Push dibatalkan. Tinjau, stage, lalu commit perubahan terlebih dahulu."
    exit 1
  fi
else
  echo "Working tree bersih."
fi

echo "Repository: $ACTUAL_ORIGIN"
echo "Branch:     $BRANCH"
echo "Commit:     $(git rev-parse --short HEAD)"

if [[ "$MODE" == "--check" ]]; then
  git ls-remote --exit-code origin HEAD >/dev/null
  echo "Remote GitHub dapat diakses. Tidak ada data yang dipush."
  exit 0
fi

git push --set-upstream origin "$BRANCH"
echo "Backup commit branch '$BRANCH' berhasil dipush ke GitHub."
