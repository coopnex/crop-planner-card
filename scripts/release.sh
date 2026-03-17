#!/usr/bin/env bash
set -euo pipefail

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
if $IS_MAIN; then
  echo ""
  echo "Select version bump type:"
  select BUMP_TYPE in major minor patch; do
    [[ -n "$BUMP_TYPE" ]] && break
    echo "Invalid selection. Please choose 1, 2, or 3."
  done
else
  echo ""
  echo "Select pre-release version bump type:"
  select BUMP_TYPE in major minor patch; do
    [[ -n "$BUMP_TYPE" ]] && break
    echo "Invalid selection. Please choose 1, 2, or 3."
  done
fi

# ── 5. Bump version in package.json ──────────────────────────────────────────
CURRENT_VERSION=$(node -p "require('./package.json').version")
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

case "$BUMP_TYPE" in
  major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
  minor) MINOR=$((MINOR + 1)); PATCH=0 ;;
  patch) PATCH=$((PATCH + 1)) ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"

if ! $IS_MAIN; then
  echo ""
  read -rp "Enter pre-release suffix (e.g. RC1, beta-1): " PRE_SUFFIX
  if [[ -z "$PRE_SUFFIX" ]]; then
    echo "Error: Pre-release suffix cannot be empty." >&2
    exit 1
  fi
  NEW_VERSION="$NEW_VERSION-$PRE_SUFFIX"
fi

echo ""
echo "Bumping version: $CURRENT_VERSION → $NEW_VERSION"

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
