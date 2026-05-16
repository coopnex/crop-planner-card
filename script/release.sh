#!/usr/bin/env bash
set -euo pipefail

# ── Usage ─────────────────────────────────────────────────────────────────────
usage() {
  echo "Usage: script/release.sh [--bump major|minor|patch|snapshot] [--pre RC1] [--yes]"
  echo ""
  echo "  --bump   Version bump type (major, minor, patch, snapshot)"
  echo "  --pre    Pre-release suffix (e.g. RC1, beta-1); required on non-main branches"
  echo "  --yes    Skip confirmation prompt"
  exit 1
}

# ── Parse flags ───────────────────────────────────────────────────────────────
BUMP_TYPE=""
PRE_SUFFIX=""
YES=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --bump) BUMP_TYPE="$2"; shift 2 ;;
    --pre)  PRE_SUFFIX="$2"; shift 2 ;;
    --yes)  YES=true; shift ;;
    -h|--help) usage ;;
    *) echo "Unknown option: $1" >&2; usage ;;
  esac
done

# ── 1. Uncommitted changes check ─────────────────────────────────────────────
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Error: You have uncommitted changes. Please commit or stash them first." >&2
  exit 1
fi

# ── 2. Branch check ───────────────────────────────────────────────────────────
BRANCH=$(git rev-parse --abbrev-ref HEAD)
IS_MAIN=false
[[ "$BRANCH" == "main" ]] && IS_MAIN=true

if ! $IS_MAIN; then
  echo "You are on branch '$BRANCH' (not main)."
  echo "Only pre-release tags are allowed (e.g. RC1, beta-1)."
fi

# ── 3. Build (includes lint) ──────────────────────────────────────────────────
echo "Running build..."
yarn build

# ── 4. Version bump type ─────────────────────────────────────────────────────
CURRENT_VERSION=$(node -p "require('./package.json').version")
# Strip any pre-release suffix (e.g. 0.2.0-beta-1 → 0.2.0)
BASE_VERSION="${CURRENT_VERSION%%-*}"
IFS='.' read -r MAJOR MINOR PATCH <<< "$BASE_VERSION"

echo ""
echo "Current version: $CURRENT_VERSION"

if [[ -z "$BUMP_TYPE" ]]; then
  echo "Select version bump type:"
  select BUMP_TYPE in major minor patch snapshot; do
    [[ -n "$BUMP_TYPE" ]] && break
    echo "Invalid selection."
  done
else
  echo "Bump type: $BUMP_TYPE"
fi

# Validate bump type
case "$BUMP_TYPE" in
  major|minor|patch|snapshot) ;;
  *) echo "Invalid bump type: $BUMP_TYPE" >&2; usage ;;
esac

# ── 5. Calculate new version ──────────────────────────────────────────────────
case "$BUMP_TYPE" in
  major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
  minor) MINOR=$((MINOR + 1)); PATCH=0 ;;
  patch) PATCH=$((PATCH + 1)) ;;
  snapshot) ;; # keep MAJOR.MINOR.PATCH as-is
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"

echo ""
if [[ -n "$PRE_SUFFIX" ]]; then
  NEW_VERSION="$NEW_VERSION-$PRE_SUFFIX"
elif $IS_MAIN; then
  read -rp "Enter pre-release suffix (e.g. RC1, beta-1) or leave empty for a stable release: " PRE_SUFFIX
  [[ -n "$PRE_SUFFIX" ]] && NEW_VERSION="$NEW_VERSION-$PRE_SUFFIX"
else
  while true; do
    read -rp "Enter pre-release suffix (e.g. RC1, beta-1): " PRE_SUFFIX
    [[ -n "$PRE_SUFFIX" ]] && break
    echo "Pre-release suffix is required on non-main branches."
  done
  NEW_VERSION="$NEW_VERSION-$PRE_SUFFIX"
fi

echo ""
echo "Version bump: $CURRENT_VERSION → $NEW_VERSION"

if ! $YES; then
  read -rp "Proceed with this release? [y/N] " CONFIRM
  if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
  fi
fi

# Use node to update package.json to preserve formatting
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
pkg.version = '$NEW_VERSION';
fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2) + '\n');
"

# ── 6. Commit the version bump ────────────────────────────────────────────────
TAG="v$NEW_VERSION"
git add package.json
git commit -m "Prepare release version: $TAG"

# ── 7. Create tag ─────────────────────────────────────────────────────────────
git tag "$TAG"
echo "Created tag: $TAG"

# ── 8. Push commits + tags ────────────────────────────────────────────────────
git push origin "$BRANCH"
git push origin "$TAG"

echo ""
echo "Released $TAG successfully."
