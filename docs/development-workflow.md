# Development Workflow

## Branch strategy

- **`main` is protected** — never commit directly. All changes go through a dedicated branch and are merged via a GitHub PR reviewed and approved by the project owner.
- Branch names follow the pattern `<type>/<short-description>`:
  - `feat/` — new features
  - `fix/` — bug fixes
  - `chore/` — maintenance, deps, config
- Always create branches from an up-to-date `main`:

```bash
git checkout main && git pull
git checkout -b feat/my-feature
```

## Pre-commit checklist

Before committing, verify:

1. **Lint** — `yarn lint` must pass with no errors.
2. **Build** — `yarn build` must succeed (also catches TypeScript errors).

There are no automated tests currently; linting and the TypeScript compiler are the safety net.

## Live verification

Changes can be verified visually against a running Home Assistant instance at `http://localhost:8123` using the Playwright MCP browser tools.

If the dev server is not running, start it with:

```bash
../crop-planner-integration/script/develop.sh
```

Then run `yarn start` in this repo to rebuild on file changes and serve on port 5000.

## Pushing and PRs

After pushing a branch, ensure the GitHub PR description accurately reflects the actual changes. Update it if the branch diverges from the original description during development.

## Releases

Releases are always created via the release script — never manually:

```
script/release.sh [--bump major|minor|patch|snapshot] [--pre <suffix>] [--yes]
```

| Flag | Description |
|------|-------------|
| `--bump` | Version component to increment: `major`, `minor`, `patch`, or `snapshot` (keeps current `MAJOR.MINOR.PATCH`, only appends pre-release suffix) |
| `--pre` | Pre-release suffix to append, e.g. `beta-1`, `RC1`. **Required when not on `main`**. |
| `--yes` | Skip the confirmation prompt (useful in CI or scripted flows). |

The script always runs `yarn build` (which includes lint) before tagging. It will refuse to run with uncommitted changes.

**Examples:**

```bash
# Stable patch release from main (prompts for optional pre-release suffix)
script/release.sh --bump patch --yes

# Beta release from a feature/fix branch
script/release.sh --bump patch --pre beta-1 --yes

# Next beta iteration on same version
script/release.sh --bump snapshot --pre beta-2 --yes

# Minor release candidate from main
script/release.sh --bump minor --pre RC1 --yes

# Interactive — prompts for bump type and pre-release suffix
script/release.sh
```

- When releasing from any branch other than `main`, `--pre` is mandatory — the script will not proceed without it.
- Use `snapshot` as the bump type when the base version should stay the same and only the pre-release suffix changes (e.g. going from `0.6.0-beta-1` to `0.6.0-beta-2`).
