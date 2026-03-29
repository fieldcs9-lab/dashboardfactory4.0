# Contributing

## Branch Workflow

1. Start from the latest `main`.
2. Create a feature branch using the `codex/` prefix.
3. Keep each branch focused on one change set.
4. Open a pull request back to `main`.

Example:

```powershell
git checkout main
git pull
git checkout -b codex/improve-trend-tooltip
```

## Commit Guidance

- Use short, action-first commit messages.
- Prefer one logical change per commit.
- Re-run any checks that apply before pushing.

Example:

```powershell
git add .
git commit -m "Add selectable trend machine control"
git push -u origin codex/improve-trend-tooltip
```

## Pull Request Checklist

- Summary explains what changed and why.
- Screenshots included for UI changes.
- Risk areas or follow-up items are called out.
- Branch is up to date with `main`.
