# Handoff: put NextGen Climate on GitHub

Instructions for the Claude Code session (or person) that publishes this folder to GitHub.
The site is finished and tested. Your job is to publish it, not to redesign it.

## What this is

A static website for **NextGen Climate**, a youth climate-tech nonprofit. It is plain HTML, CSS and JavaScript
(no build step, no npm). GitHub Pages hosts it, and GitHub Actions keep it updated every day:

- `index.html`, `css/style.css`, `js/*.js`: the whole site. Pages switch by `#hash` (`#wall`, `#map`, `#submit`, ...).
- `data/*.json`: content the site loads. The robots in `scripts/` rewrite these files every day.
- `scripts/*.py`: Python standard library only. They fetch news, read the Google Sheet, and write `data/`.
- `scripts/create_google_form.gs`: a Google Apps Script, NOT run on GitHub. The owner pastes it into
  script.google.com to build the Google Form, the Sheet, and the team review dashboard.
- `.github/workflows/`: daily update, weekly newsletter draft, weekly Instagram token renewal.
- `.nojekyll`: required so GitHub Pages serves files as-is. Keep it.

Full owner-facing setup guide: `README.md`.

## Accounts

- GitHub account: `jiacode2030`
- Repository: `nextgen-climate` (must be **Public**: free Pages and Actions need that)
- Live address after setup: `https://jiacode2030.github.io/nextgen-climate/`
- Team Google account (owns the form, Sheet and dashboard): `nextgenclimate.usa@gmail.com`

## Steps for you

1. Create the public repo `jiacode2030/nextgen-climate` (or use it if it exists; check its contents first
   and ask before overwriting anything).
2. Commit **every** file in this folder, including the hidden `.github/` folder and `.nojekyll`, to `main`.
   Do not commit secrets, tokens, or the Google Sheet link: those go in GitHub secrets (step 5).
3. Turn on GitHub Pages: Settings > Pages > Deploy from a branch > `main` / `(root)`.
   With the `gh` CLI: `gh api -X POST repos/jiacode2030/nextgen-climate/pages -f "source[branch]=main" -f "source[path]=/"`
4. Let workflows push: Settings > Actions > General > Workflow permissions > **Read and write**.
   With `gh`: `gh api -X PUT repos/jiacode2030/nextgen-climate/actions/permissions/workflow -f default_workflow_permissions=write`
5. Secrets (Settings > Secrets and variables > Actions). The **owner** adds these; ask them for the
   values or let them paste the values in themselves. Never write them into files:
   - `SHEET_CSV_URL`: the "Publish to web" CSV link of the Sheet's **Public** tab only. Required for submissions.
   - `IG_ACCESS_TOKEN`: optional, Instagram posts on the homepage (README step 10).
   - `SECRETS_PAT`: optional, lets the weekly job renew the Instagram token (README step 10).
6. Run the workflow once: Actions > "Daily update" > Run workflow
   (`gh workflow run daily-update.yml`), then check that it passes.
7. Open the live address and check: the home page loads, the Map draws, and the Solutions Wall shows cards.

## Values the owner fills in later, in `js/config.js`

| Key | Status | Where it comes from |
|---|---|---|
| `CONTACT_EMAIL` | Set to `nextgenclimate.usa@gmail.com` | Done |
| `FORM_URL` | Empty, so the submit button shows "opens soon" | Google Form > Send > link |
| `ADMIN_URL` | Empty, so the footer "Team login" link is hidden | Apps Script > Deploy > Web app URL |
| `TEAM` | Jiarui Li, Isabella Pstross, Mahi Hariya (co-founders) | Edit if needed |

Commit changes to `config.js` directly on `main`; Pages redeploys in about a minute.

## Expected behavior (not bugs)

- **News shows "Sample" stories** until the first daily run fetches real headlines.
- **8 example students** (badged "Example") show on the wall, map and counters until the first entry is
  approved in the Sheet. If every entry is later unapproved, the examples come back
  (`scripts/update_submissions.py` -> `write_examples`, data in `data/examples.json`).
- The daily job **stops on purpose** if the published Sheet contains an email, age, phone or last-name
  column. That protects student privacy. The fix is to publish only the Public tab.
- Instagram shows a "Follow" card until `IG_ACCESS_TOKEN` is set.

## Do not change

- The privacy rules: only first name, school, country, category, project and photo are ever public.
  The `PRIVATE_HEADER_WORDS` check in `update_submissions.py` must stay.
- The Google Form question titles in `create_google_form.gs`: the site finds Sheet columns by words in them.
- All student text is inserted with `textContent`, never `innerHTML`. Keep it that way.
- External scripts load from cdnjs (d3, topojson, datamaps, jsPDF) and fonts from Google Fonts. No API keys.

## What was tested

- Every view at 375px and 1366px wide, light and dark theme: no horizontal scroll, no console errors.
- Idea spinner, quiz, category bars, project pop-up, `#p-<id>` share links, theme toggle, wall filters.
- `update_submissions.py` with an empty sheet (examples shown), one approved row (examples replaced),
  and empty again (examples restored).
- **Not tested on a real Google account:** `create_google_form.gs` (form builder and dashboard). It passes a
  JavaScript syntax check. If the owner reports an Apps Script error, fix it there.
