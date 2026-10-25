# NextGen Climate website

A free, self-updating website for NextGen Climate. It runs on GitHub Pages and GitHub Actions, so it costs $0.

**What updates on its own**
- **News:** every morning, climate-tech headlines are collected from 10 newsrooms and tagged by topic.
- **Solutions Wall, map, and impact counter:** every morning, approved entries from your Google Sheet are added.
- **Featured Innovator:** every Monday, a new approved entry is picked at random (or you choose one).
- **Instagram:** every morning, your 6 newest @nextgen_climate posts appear on the homepage (after the optional Instagram setup below).
- **Newsletter draft:** every Monday, a Substack-ready draft with the week's top 5 stories appears in `newsletter/`.

**Your only weekly job:** tick "Approved" next to good submissions in the Google Sheet (about 10 minutes).

---

## Setup (about 1 to 2 hours, one time)

### 1. Put the site on GitHub

1. Sign in at github.com (your account is `jiacode2030`).
2. Click **New repository**. Name it `nextgen-climate`. Choose **Public** (required for free Pages and Actions). Click **Create repository**.
3. On the new repo page, click **uploading an existing file**. Unzip `nextgen-climate.zip` on your computer and drag **everything inside the folder** into the upload box, including the hidden `.github` folder and the `.nojekyll` file.
   - Mac: in Finder press `Cmd + Shift + .` to show hidden files.
   - If drag-and-drop skips `.github`, create the two workflow files by hand: **Add file > Create new file**, type `.github/workflows/daily-update.yml` as the name, and paste the contents. Repeat for `weekly-newsletter.yml`.
4. Click **Commit changes**.

### 2. Turn on the website

1. In the repo, go to **Settings > Pages**.
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**, **Branch** to `main`, folder `/ (root)`. Click **Save**.
3. Wait 1 to 2 minutes. Your site is live at `https://jiacode2030.github.io/nextgen-climate/`.

### 3. Let the robot save updates

1. Go to **Settings > Actions > General**.
2. Under **Workflow permissions**, choose **Read and write permissions**. Click **Save**.

### 4. Build the Google Form

**Quick way (recommended):** sign in to Google as `nextgenclimate.usa@gmail.com`, go to script.google.com > **New project**, paste in all of `scripts/create_google_form.gs`, choose `createNextGenForm` and click **Run**. It builds the form, the Sheet, the Approved/Featured checkboxes, and the Public tab (steps 4 and 5 below, except "Publish to web"). Then publish only the Public tab as CSV (step 5.6) and continue with step 6.

**By hand:**


Create a new form at forms.google.com called "NextGen Climate: Submit your solution". Add these questions **in this order**:

| # | Question | Type | Required |
|---|----------|------|----------|
| 1 | First name only | Short answer | Yes |
| 2 | School or organization | Short answer | Yes |
| 3 | Country | Dropdown (paste the list from `data/countries.txt`) | Yes |
| 4 | Age range | Multiple choice: 13–17 · 18 or older · Under 13 (a parent or guardian is submitting) | Yes |
| 5 | Category | Dropdown: Energy, Transport, Food & Ag, Water, Materials, Buildings, Carbon Removal, Data & AI, Education & Community, Other | Yes |
| 6 | Project title | Short answer | Yes |
| 7 | Describe your solution (up to 80 words) | Paragraph | Yes |
| 8 | Photo link (optional, no faces) | Short answer | No |
| 9 | Email (private, only used to contact you) | Short answer, with response validation "Email" | Yes |
| 10 | Consent | Checkboxes: "I agree to NextGen Climate showing my first name, school, country, project, and photo on its website and Instagram." | Yes |

Tip for the dropdown: in Google Forms, click the first option box and paste the whole country list. Each line becomes an option.

Photo links: Google Drive works if the file is shared as **Anyone with the link**. The site converts Drive links into images automatically.

### 5. Set up the Google Sheet

1. In the form, open **Responses > Link to Sheets > Create a new spreadsheet**.
2. In the new sheet's response tab (usually "Form Responses 1"), the questions fill columns **A–K** (A is Timestamp).
3. Type `Approved` in cell **L1** and `Featured` in cell **M1**. Select column L from row 2 down, then **Insert > Checkbox**. Do the same for column M.
4. Add a new tab (the **+** at the bottom) and name it `Public`.
5. In cell **A1** of the Public tab, paste:

   ```
   =QUERY('Form Responses 1'!A:M, "select A, B, C, D, F, G, H, I, M where L = TRUE", 1)
   ```

   This shows only approved rows and leaves out email (J), age (E), and consent (K). If your response tab has a different name, change `Form Responses 1` to match.
6. Publish **only** the Public tab: **File > Share > Publish to web**. In the first dropdown choose **Public** (not "Entire document"). In the second choose **Comma-separated values (.csv)**. Click **Publish** and copy the link.

> Never publish the response tab or "Entire document". That would make emails public. If it ever happens, the daily update stops with a warning so you notice.

### 6. Connect the Sheet to the site

1. In the repo, go to **Settings > Secrets and variables > Actions > New repository secret**.
2. Name: `SHEET_CSV_URL`. Value: the CSV link from step 5. Click **Add secret**.

### 7. Add your form link and contact email

Open `js/config.js` in the repo (click the file, then the pencil icon):
- `FORM_URL`: in your Google Form click **Send**, choose the link icon, copy it, and paste it here.
- `CONTACT_EMAIL`: the email you want shown on the About page.
- `ADMIN_URL`: the team dashboard link (see "Team dashboard" below). Leave it empty to hide the footer link.
- `TEAM`: add team members as `{ name: "Name", role: "Role" }`.

Click **Commit changes**.

### 8. Run the robot once to test

1. Go to the **Actions** tab. If asked, click **I understand my workflows, go ahead and enable them**.
2. Click **Daily update (news + submissions)** > **Run workflow** > **Run workflow**.
3. After about a minute it shows a green check. Open the run to see which news feeds worked (`OK`) and which were skipped (`SKIP`).
4. Refresh your site. Real headlines replace the sample ones. Once your Sheet has an approved entry, the example students disappear and real ones show up. Until then (or if you ever untick every entry) the site shows the example students, each marked "Example", so it never looks empty.

### 9. Your logo and colors

Your logo is already included: `assets/logo.png` (full logo with wordmark), `assets/logo-mark.png` (the bulb, used in the header and on certificates), and `assets/favicon.png` (browser tab icon). To change the logo, upload new files with the same names.

The site colors come from the logo: forest green (`--accent`), sage (`--sage`), and leaf green (`--solar`). They're at the top of `css/style.css`.

### 10. Connect Instagram (optional, about 30 minutes)

This uses Instagram's official API. It's free, and posts update automatically every morning. Until you finish this, the homepage shows a "Follow @nextgen_climate" button instead.

1. **Make the account professional.** In the Instagram app: **Settings > Account type and tools > Switch to professional account**. Creator or Business both work, and it's free.
2. **Create a Meta app.** Go to developers.facebook.com, sign in, and click **Create app**. Choose the **Business** type when asked.
3. **Add Instagram.** In the app dashboard, add the **Instagram** product, then open **Instagram > API setup with Instagram business login**. Add your @nextgen_climate account if asked.
4. **Get a token.** Click **Generate token** next to your account, log in to Instagram, and copy the token. It lasts 60 days.
5. **Save it in GitHub.** **Settings > Secrets and variables > Actions > New repository secret**. Name: `IG_ACCESS_TOKEN`. Value: the token.
6. **Let GitHub renew it automatically.** Tokens expire after 60 days, so a weekly job renews it. That job needs permission to update the secret:
   - On GitHub, click your profile picture > **Settings > Developer settings > Personal access tokens > Fine-grained tokens > Generate new token**.
   - Repository access: **Only select repositories** > `nextgen-climate`.
   - Permissions: **Secrets: Read and write**.
   - Set the longest expiration offered and put a reminder in your calendar to make a new one before it expires.
   - Copy it, then add it as a repository secret named `SECRETS_PAT`.
7. **Test.** In **Actions**, run **Daily update** by hand. Your posts appear on the homepage. Then run **Keep Instagram connected** once to check the renewal works.

If the Instagram token ever expires, the site keeps showing the last saved posts. Generate a new token (step 4) and replace the `IG_ACCESS_TOKEN` secret.

Instagram's developer screens change often. If a button has moved, Meta's guide is here: https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/get-started

---

## Team dashboard (approve entries without opening the Sheet)

The Google script also includes a review dashboard. In the script project: **Deploy > New deployment >** gear icon **> Web app**. Set **Execute as: User accessing the web app** and **Who has access: Anyone with Google account**, then **Deploy**. Copy the Web app URL into `ADMIN_URL` in `js/config.js`.

The website footer then shows **Team login**. Anyone the Sheet is shared with (as Editor) can sign in with Google and Approve, Feature, or Edit entries. Everyone else sees "no access". Emails and ages are visible only inside the dashboard, never on the website.

## Every week

1. Open the Google Sheet and read new rows.
2. Tick **Approved** for good entries (or use **Team login** on the website). Before approving, check for last names, faces in photos, contact details, or anything inappropriate. Edit the cell if needed.
3. Optional: tick **Featured** on one row to choose the Featured Innovator yourself. Untick it next week, otherwise it stays featured. With no Featured box ticked, the site picks a new innovator automatically every Monday.
4. On Mondays, open `newsletter/` in the repo, copy the newest draft into Substack, add your intro and one-line takes, and send.
5. Post the Featured Innovator on Instagram.

Approved entries appear on the site the next morning. To update right away, run the Daily update by hand (step 8).

## Changing things

| To change | Edit |
|-----------|------|
| News sources | `scripts/feeds.json` |
| Topic keywords for news | `scripts/tags.json` |
| Get Inspired links | `data/inspire.json` |
| Form link, email, team, Instagram handle, logo | `js/config.js` |
| Colors and fonts | top of `css/style.css` |
| Page text | `index.html` |

## How it stays free

- GitHub Pages hosting and GitHub Actions are free for public repositories.
- Google Forms and Sheets are free.
- The Instagram API is free for your own account.
- The map, certificate PDFs, and fonts load from free public CDNs. No accounts or API keys.
- GitHub pauses scheduled workflows after 60 days with no commits. The daily update commits news every day, so this won't happen unless every feed stops working.

## Privacy built in

- The site shows only first name, school, country, category, project, and photo.
- The update script stops if the published sheet contains an email, age, phone, or last-name column.
- It also removes email addresses, phone numbers, and links from titles and descriptions, and keeps only the first word of the name.
- Certificates are made in the student's browser. A last name typed on the certificate page is never saved.

## Files

```
index.html                 the whole site (pages switch with #news, #wall, #map …)
css/style.css              design
js/app.js                  loads data and renders the pages
js/map.js                  world map
js/certificate.js          certificate image + PDF
js/config.js               your settings
js/countries.js            country names for the map
data/*.json                site data (written by the robot)
data/countries.txt         country list to paste into the Google Form
data/examples.json         example students shown while the Sheet has no approved entries
scripts/update_news.py     daily news
scripts/update_submissions.py  daily submissions, stats, featured
scripts/make_newsletter.py weekly newsletter draft
scripts/update_instagram.py daily Instagram posts + token renewal
assets/instagram/          saved copies of your newest Instagram images
.github/workflows/         the schedules
newsletter/                weekly drafts appear here
```

To preview on your own computer, run `python3 -m http.server` in this folder and open http://localhost:8000.
