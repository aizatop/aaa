# AliveAgain - Virtual travel for kids

[![pages-build-deployment](https://github.com/aizatop/Reboot/workflows/Deploy%20to%20GitHub%20Pages/badge.svg)](https://github.com/aizatop/Reboot/actions)

Project scaffolded with Vite and React.

## Demo
Will be published to GitHub Pages from `main` branch (workflow added). After merge the site will be available at: `https://aizatop.github.io/Reboot/` (or repo Pages URL).

## How to run locally

1. npm install
2. npm run dev

## Create a PR (one-liner)
If you pushed a branch named `reboot-from-local-YYYYMMDD-HHMM` (automation included), run:

```bash
# create a PR (requires GitHub CLI):
gh pr create --base main --head <your-branch> --title "chore: publish current workspace" --body "Prepare demo and CI"
```

## Deploy
- CI: GitHub Actions workflow `deploy-gh-pages.yml` builds `dist` and publishes to GitHub Pages.
- A helper workflow `auto-create-pr.yml` will auto-open PRs for branches `reboot-from-local-*`.