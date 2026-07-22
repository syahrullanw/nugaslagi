#!/usr/bin/env bash

set -euo pipefail

EXPECTED_ORIGIN="https://github.com/syahrullanw/nugaslagi.git"
RELEASE_VERSION="${1:-}"
MODE="${2:---check}"

usage() {
  echo "Usage: $0 <MAJOR.MINOR.PATCH> [--check|--push]"
}

if [[ ! "$RELEASE_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  usage
  exit 2
fi
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
  echo "Error: remote origin harus $EXPECTED_ORIGIN"
  exit 1
fi
if [[ "$(git branch --show-current)" != "main" ]]; then
  echo "Error: release hanya boleh dijalankan dari branch main."
  exit 1
fi
if [[ -n "$(git status --short)" ]]; then
  echo "Error: working tree belum bersih. Commit atau simpan perubahan terlebih dahulu."
  git status --short
  exit 1
fi

CURRENT_VERSION="$(tr -d '[:space:]' < VERSION)"
if [[ "$CURRENT_VERSION" != "$RELEASE_VERSION" ]]; then
  echo "Error: VERSION berisi $CURRENT_VERSION, bukan $RELEASE_VERSION."
  exit 1
fi
if ! grep -Fq "## [$RELEASE_VERSION]" CHANGELOG.md; then
  echo "Error: CHANGELOG.md belum memiliki bagian [$RELEASE_VERSION]."
  exit 1
fi

TAG="v$RELEASE_VERSION"
if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "Error: tag lokal $TAG sudah ada."
  exit 1
fi
if git ls-remote --exit-code --tags origin "refs/tags/$TAG" >/dev/null 2>&1; then
  echo "Error: tag $TAG sudah ada di GitHub."
  exit 1
fi

git diff --check
echo "Release $TAG siap dari commit $(git rev-parse --short HEAD)."

if [[ "$MODE" == "--check" ]]; then
  echo "Pemeriksaan selesai. Tidak ada commit atau tag yang dipush."
  exit 0
fi

git push origin main
git tag -a "$TAG" -m "release: $TAG"
git push origin "$TAG"
echo "Release tag $TAG berhasil dipush ke GitHub."
