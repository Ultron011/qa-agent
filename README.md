# qa-agent

Autonomous QA testing agent. Crawls a deployed site, runs Playwright-driven tests (visual, functional, console errors, accessibility, performance), generates a markdown bug report, optionally fixes issues using Claude Code CLI, and opens a GitHub PR.

## Prerequisites

- Node 20+
- Playwright Chromium: `npx playwright install chromium`
- `claude` CLI authenticated (uses Claude Code subscription, no API billing)
- `gh` CLI authenticated (for PR creation)
- A local clone of the repository whose deployed site you want to test

## Install

```bash
git clone <this-repo>
cd qa-agent
npm install
npm run build
npm link
```

## Usage

**Exploratory mode** — agent auto-discovers flows:
```bash
qa-agent test https://myapp.com --repo ./my-app
```

**Expectation-driven mode** — agent validates against your spec:
```bash
qa-agent test https://myapp.com --repo ./my-app --expect expectations.md
```

**`expectations.md` example:**
```markdown
## Login Flow
- User can log in with valid credentials
- Invalid password shows error message

## Dashboard
- Chart loads within 3 seconds
- User name visible in header
```

## Output

- `qa-report-YYYY-MM-DD-HH-mm.md` — bug report in current directory
- `qa-screenshots/` — failure screenshots
- If fixes applied: branch `qa-fix/YYYY-MM-DD` + GitHub PR

## Development

```bash
npm test          # run all tests
npm run dev -- test https://x.com --repo ./x  # run without building
```
