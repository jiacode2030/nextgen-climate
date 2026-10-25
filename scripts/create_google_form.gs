// NextGen Climate: Google side of the website.
//   Part 1 builds the submission Google Form, its response Sheet, the Approved/Featured
//          checkbox columns, and the privacy-safe "Public" tab.
//   Part 2 is the team dashboard: sign in with Google, then approve, feature, and edit entries.
//
// SETUP (one time, about 5 minutes)
//   1. Sign in to Google with the account that should own the form.
//   2. Go to script.google.com > New project. Delete the starter code and paste this whole file.
//   3. Pick "createNextGenForm" in the function menu at the top and click Run.
//      Approve the permissions Google asks for. Run it ONCE (each run makes a new form).
//   4. Open the Execution log and copy the links it prints.
//   5. Publish ONLY the Public tab: in the Sheet, File > Share > Publish to web >
//      choose "Public" + "Comma-separated values (.csv)" > Publish. That CSV link is SHEET_CSV_URL.
//   6. Turn on the dashboard: Deploy > New deployment > gear icon > Web app.
//        Execute as: "User accessing the web app"
//        Who has access: "Anyone with Google account"
//      Click Deploy and copy the Web app URL. Paste it into ADMIN_URL in js/config.js
//      so the website shows a "Team login" link.
//
// WHO CAN SIGN IN: anyone you share the Sheet with as Editor (Share button in the Sheet).
// Everyone else gets "no access", because the dashboard uses each person's own Google permissions.
//
// Already made your form by hand or with an older copy of this script? Paste the Sheet's ID
// (the long code between /d/ and /edit in its address) into SHEET_ID below and skip step 3.

var SHEET_ID = "";

var COUNTRIES = ["Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo (DRC)", "Congo (Republic)", "Costa Rica", "Côte d'Ivoire", "Croatia", "Cuba", "Cyprus", "Czechia", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hong Kong", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Macau", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Puerto Rico", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "São Tomé and Príncipe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"];

var CATEGORIES = ["Energy", "Transport", "Food & Ag", "Water", "Materials", "Buildings",
  "Carbon Removal", "Data & AI", "Education & Community", "Other"];

function createNextGenForm() {
  var form = FormApp.create("NextGen Climate: Submit your solution");
  form.setDescription(
    "Share a climate project, invention, or idea. Ideas count too, no building required!\n" +
    "Approved entries appear on our Solutions Wall and world map, and you can download a certificate.\n\n" +
    "We only show your first name, school, and country. Your email stays private. Please don't include faces in photos.");
  form.setCollectEmail(false);
  form.setLimitOneResponsePerUser(false);  // true would force people to sign in with Google
  try { form.setRequireLogin(false); } catch (e) { /* only exists on school/work accounts */ }
  form.setConfirmationMessage(
    "Thanks for sharing your solution! Our team reviews every entry. Once it's approved, it appears on the " +
    "Solutions Wall and map, and you can download your NextGen Climate Innovator certificate.");

  // Keep these titles: the website finds each column by words in its title.
  form.addTextItem().setTitle("First name only").setRequired(true);
  form.addTextItem().setTitle("School or organization").setRequired(true);
  form.addListItem().setTitle("Country").setChoiceValues(COUNTRIES).setRequired(true);
  form.addMultipleChoiceItem().setTitle("Age range")
    .setChoiceValues(["13–17", "18 or older", "Under 13 (a parent or guardian is submitting)"]).setRequired(true);
  form.addListItem().setTitle("Category").setChoiceValues(CATEGORIES).setRequired(true);
  form.addTextItem().setTitle("Project title").setRequired(true);
  form.addParagraphTextItem().setTitle("Describe your solution (up to 80 words)")
    .setHelpText("What problem does it solve, and how? Ideas and designs on paper are welcome.").setRequired(true);
  form.addTextItem().setTitle("Photo link (optional, no faces)")
    .setHelpText("Google Drive works if the file is shared as 'Anyone with the link'.");
  form.addTextItem().setTitle("Email (private, only used to contact you)")
    .setValidation(FormApp.createTextValidation().setHelpText("Please enter a valid email address.").requireTextIsEmail().build())
    .setRequired(true);
  form.addCheckboxItem().setTitle("Consent")
    .setChoiceValues(["I agree to NextGen Climate showing my first name, school, country, project, and photo on its website and Instagram."])
    .setRequired(true);

  // Response sheet
  var ss = SpreadsheetApp.create("NextGen Climate submissions");
  PropertiesService.getScriptProperties().setProperty("SHEET_ID", ss.getId());
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  SpreadsheetApp.flush();
  Utilities.sleep(3000);
  ss = SpreadsheetApp.openById(ss.getId());
  var responses = ss.getSheets().filter(function (s) { return s.getFormUrl(); })[0];
  if (!responses) throw new Error("The response tab wasn't created yet. Run the script again in a minute.");

  // A Timestamp, B-K the 10 questions, L Approved, M Featured
  responses.getRange("L1:M1").setValues([["Approved", "Featured"]]).setFontWeight("bold");
  var checkbox = SpreadsheetApp.newDataValidation().requireCheckbox().build();
  responses.getRange("L2:M2000").setDataValidation(checkbox);
  responses.setFrozenRows(1);

  // Public tab: approved rows only, without age (E), email (J) or consent (K)
  var pub = ss.getSheets().filter(function (s) { return !s.getFormUrl(); })[0] || ss.insertSheet();
  pub.setName("Public");
  pub.getRange("A1").setFormula(
    "=QUERY('" + responses.getName() + "'!A:M, \"select A, B, C, D, F, G, H, I, M where L = TRUE\", 1)");
  ss.setActiveSheet(responses);

  Logger.log("Done!");
  Logger.log("Share this link with students (FORM_URL in js/config.js): " + form.getPublishedUrl());
  Logger.log("Edit the form here: " + form.getEditUrl());
  Logger.log("Your Sheet (tick Approved here): " + ss.getUrl());
  Logger.log("Next: in the Sheet, File > Share > Publish to web > choose the Public tab + CSV > Publish. " +
             "Never publish the whole document.");
  Logger.log("Then turn on the team dashboard: Deploy > New deployment > Web app (see step 6 at the top).");
}


// =====================================================================================
//  Part 2: team dashboard (web app)
// =====================================================================================

function doGet() {
  return HtmlService.createHtmlOutput(ADMIN_HTML)
    .setTitle("NextGen Climate · Review")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

function sheetId_() {
  return SHEET_ID || PropertiesService.getScriptProperties().getProperty("SHEET_ID") || "";
}

// Finds the response tab and its columns by header words, so it keeps working if columns move.
function responses_() {
  var id = sheetId_();
  if (!id) throw new Error("NO_SHEET");
  var ss;
  try { ss = SpreadsheetApp.openById(id); } catch (e) { throw new Error("NO_ACCESS"); }
  var sh = ss.getSheets().filter(function (s) { return s.getFormUrl(); })[0] || ss.getSheetByName("Form Responses 1");
  if (!sh) throw new Error("NO_TAB");
  var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(function (h) { return String(h).toLowerCase(); });
  var want = [["ts", /timestamp/], ["first", /first name/], ["school", /school/], ["country", /country/], ["age", /\bage\b/],
    ["category", /category/], ["title", /title/], ["desc", /describe|description/], ["photo", /photo/],
    ["email", /e-?mail/], ["consent", /consent/], ["approved", /^approved$/], ["featured", /^featured$/]];
  var col = {}, used = {};
  want.forEach(function (w) {
    for (var i = 0; i < head.length; i++) if (!used[i] && w[1].test(head[i])) { col[w[0]] = i + 1; used[i] = 1; return; }
  });
  if (!col.approved) {  // add the checkbox columns if someone removed them
    var n = sh.getLastColumn();
    sh.getRange(1, n + 1, 1, 2).setValues([["Approved", "Featured"]]).setFontWeight("bold");
    sh.getRange(2, n + 1, Math.max(sh.getMaxRows() - 1, 1), 2).setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build());
    col.approved = n + 1; col.featured = n + 2;
  }
  return { ss: ss, sh: sh, col: col };
}

function getSubmissions() {
  var me = Session.getActiveUser().getEmail();
  var r;
  try { r = responses_(); } catch (e) { return { error: e.message, me: me }; }
  var last = r.sh.getLastRow(), rows = [];
  if (last >= 2) {
    var width = r.sh.getLastColumn();
    var vals = r.sh.getRange(2, 1, last - 1, width).getValues();
    var disp = r.sh.getRange(2, 1, last - 1, width).getDisplayValues();
    vals.forEach(function (v, i) {
      var g = function (k) { return r.col[k] ? v[r.col[k] - 1] : ""; };
      var d = function (k) { return r.col[k] ? String(disp[i][r.col[k] - 1]) : ""; };
      if (!d("ts") && !d("first") && !d("title")) return;
      rows.push({ row: i + 2, ts: d("ts"), first: d("first"), school: d("school"), country: d("country"), age: d("age"),
        category: d("category"), title: d("title"), desc: d("desc"), photo: d("photo"), email: d("email"),
        consent: d("consent"), approved: g("approved") === true, featured: g("featured") === true });
    });
  }
  rows.reverse();  // newest first
  return { me: me, rows: rows, sheetUrl: r.ss.getUrl(), name: r.ss.getName() };
}

// Every change checks that the row still holds the same timestamp, so a moved row is never changed by mistake.
function checkRow_(r, row, ts) {
  if (r.col.ts && String(r.sh.getRange(row, r.col.ts).getDisplayValue()) !== String(ts)) {
    throw new Error("This entry moved in the Sheet. Refresh the page and try again.");
  }
}

function setFlag(row, ts, field, value) {
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    var r = responses_(); checkRow_(r, row, ts);
    if (field === "approved") {
      r.sh.getRange(row, r.col.approved).setValue(!!value);
      if (!value && r.col.featured) r.sh.getRange(row, r.col.featured).setValue(false);
    } else if (field === "featured" && r.col.featured) {
      if (value) {  // only one Featured Innovator at a time
        var n = r.sh.getLastRow() - 1;
        if (n > 0) r.sh.getRange(2, r.col.featured, n, 1).setValues(Array(n).fill([false]));
        r.sh.getRange(row, r.col.approved).setValue(true);
      }
      r.sh.getRange(row, r.col.featured).setValue(!!value);
    }
    return getSubmissions();
  } finally { lock.releaseLock(); }
}

function saveEdits(row, ts, edits) {
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    var r = responses_(); checkRow_(r, row, ts);
    ["first", "school", "country", "title", "desc", "photo"].forEach(function (k) {
      if (r.col[k] && edits[k] != null) r.sh.getRange(row, r.col[k]).setValue(String(edits[k]).slice(0, 1000));
    });
    return getSubmissions();
  } finally { lock.releaseLock(); }
}

var ADMIN_HTML = String.raw`<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Montserrat:wght@800;900&family=JetBrains+Mono:wght@500&display=swap">
<style>
:root { --paper:#f3f6f1; --surface:#fff; --ink:#11291a; --muted:#4c6352; --line:#d3dfd1; --accent:#1a5a1f; --accent-soft:#dceadb; --solar:#41b93c; --solar-soft:#e2f4df; --warn:#9a5b00; --warn-soft:#fdf0d8;
  --f-display:"Montserrat","Arial Black",Arial,sans-serif; --f-body:"Atkinson Hyperlegible","Segoe UI",system-ui,sans-serif; --f-mono:"JetBrains Mono",ui-monospace,Menlo,monospace; }
* { box-sizing:border-box; }
body { margin:0; background:var(--paper); color:var(--ink); font:16px/1.55 var(--f-body); }
.wrap { max-width:960px; margin:0 auto; padding:0 16px; }
header { background:var(--ink); color:#e9f1e8; }
header .wrap { display:flex; flex-wrap:wrap; gap:8px 16px; align-items:center; justify-content:space-between; padding-block:14px; }
.brand { font-family:var(--f-display); font-weight:900; letter-spacing:.01em; }
.brand small { font-family:var(--f-mono); font-weight:500; color:var(--solar); margin-left:8px; letter-spacing:.1em; font-size:.75rem; }
.me { font-size:.875rem; opacity:.85; display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
.me a { color:#bfe8bb; }
h1 { font-family:var(--f-display); font-weight:900; text-transform:uppercase; font-size:clamp(1.6rem,4vw,2.2rem); margin:28px 0 4px; line-height:1; }
.lede { color:var(--muted); margin:0 0 18px; }
.bar { display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin-bottom:16px; }
.tab { font:inherit; font-size:.9375rem; border:1px solid var(--line); background:var(--surface); color:var(--ink); padding:7px 14px; border-radius:999px; cursor:pointer; min-height:40px; }
.tab[aria-pressed="true"] { background:var(--ink); color:var(--paper); border-color:var(--ink); }
.tab b { font-family:var(--f-mono); font-weight:500; opacity:.7; margin-left:4px; }
.search { flex:1 1 200px; font:inherit; padding:9px 14px; border:1px solid var(--line); border-radius:12px; background:var(--surface); min-height:44px; }
.list { display:flex; flex-direction:column; gap:12px; padding-bottom:48px; }
.card { background:var(--surface); border:1px solid var(--line); border-radius:18px; padding:18px 20px; display:grid; grid-template-columns:minmax(0,1fr) auto; gap:14px 20px; }
.card.is-approved { border-left:5px solid var(--solar); }
.meta { display:flex; flex-wrap:wrap; gap:6px; align-items:center; margin-bottom:6px; }
.pill { font-family:var(--f-mono); font-size:.6875rem; letter-spacing:.06em; text-transform:uppercase; padding:3px 9px; border-radius:999px; background:var(--accent-soft); color:var(--accent); }
.pill.pending { background:#eee; color:#555; }
.pill.ok { background:var(--solar-soft); color:var(--accent); }
.pill.star { background:var(--warn-soft); color:var(--warn); }
.pill.warn { background:var(--warn-soft); color:var(--warn); }
.ts { font-size:.8125rem; color:var(--muted); }
.card h2 { margin:2px 0; font-size:1.2rem; line-height:1.25; }
.who { font-weight:700; font-size:.9375rem; }
.desc { color:var(--muted); margin:6px 0 0; white-space:pre-wrap; overflow-wrap:anywhere; }
.private { margin-top:10px; padding:10px 12px; border-radius:12px; background:var(--paper); font-size:.875rem; display:flex; flex-wrap:wrap; gap:6px 16px; overflow-wrap:anywhere; }
.private span:first-child { font-family:var(--f-mono); font-size:.6875rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); align-self:center; }
.photo { display:block; margin-top:10px; width:180px; max-width:100%; aspect-ratio:4/3; object-fit:cover; border-radius:12px; border:1px solid var(--line); background:var(--accent-soft); }
.actions { display:flex; flex-direction:column; gap:8px; min-width:170px; }
.btn { font:inherit; font-weight:700; font-size:.9375rem; border-radius:999px; padding:9px 16px; min-height:42px; border:2px solid transparent; cursor:pointer; }
.btn:disabled { opacity:.5; cursor:wait; }
.btn-primary { background:var(--accent); color:#fff; }
.btn-ghost { background:transparent; border-color:var(--line); color:var(--ink); }
.btn-ghost:hover { border-color:var(--accent); }
.btn-star { background:var(--warn-soft); color:var(--warn); }
.edit { grid-column:1/-1; display:grid; gap:10px; }
.edit label { display:flex; flex-direction:column; gap:4px; font-size:.8125rem; font-weight:700; }
.edit input, .edit textarea { font:inherit; font-weight:400; padding:8px 10px; border:1px solid var(--line); border-radius:10px; width:100%; }
.edit textarea { min-height:110px; }
.edit .row { display:flex; gap:8px; flex-wrap:wrap; }
.check { font-size:.8125rem; color:var(--muted); margin:0 0 16px; padding:10px 14px; border-radius:12px; background:var(--solar-soft); }
.empty, .msg { text-align:center; color:var(--muted); padding:40px 16px; border:1.5px dashed var(--line); border-radius:18px; background:var(--surface); }
.msg h2 { color:var(--ink); }
.toast { position:fixed; left:50%; bottom:24px; transform:translateX(-50%); background:var(--ink); color:var(--paper); padding:10px 20px; border-radius:999px; font-weight:700; z-index:9; max-width:calc(100% - 32px); }
:focus-visible { outline:3px solid var(--solar); outline-offset:2px; }
@media (max-width:640px) { .card { grid-template-columns:minmax(0,1fr); } .actions { flex-direction:row; flex-wrap:wrap; min-width:0; } .actions .btn { flex:1 1 140px; } }
</style></head>
<body>
<header><div class="wrap"><div class="brand">NEXTGEN CLIMATE <small>TEAM REVIEW</small></div><div class="me" id="me"></div></div></header>
<main class="wrap">
  <h1>Review submissions</h1>
  <p class="lede">Approve entries to put them on the Solutions Wall and map. They appear on the website the next morning.</p>
  <p class="check">Before approving, check for: last names, faces in photos, phone numbers or addresses, and anything inappropriate. Use Edit to fix small problems.</p>
  <div class="bar" id="bar" hidden>
    <button class="tab" data-f="pending" aria-pressed="true">Pending <b id="n-pending">0</b></button>
    <button class="tab" data-f="approved" aria-pressed="false">Approved <b id="n-approved">0</b></button>
    <button class="tab" data-f="all" aria-pressed="false">All <b id="n-all">0</b></button>
    <input class="search" id="q" type="search" placeholder="Search name, school, project">
  </div>
  <div class="list" id="list"><p class="empty">Loading submissions…</p></div>
</main>
<div class="toast" id="toast" hidden></div>
<script>
var S = { rows: [], filter: "pending", editing: null };
function $(id) { return document.getElementById(id); }
function el(t, c, txt) { var n = document.createElement(t); if (c) n.className = c; if (txt != null) n.textContent = txt; return n; }
function toast(m) { var t = $("toast"); t.textContent = m; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { t.hidden = true; }, 2600); }
function photoUrl(raw) {
  raw = (raw || "").trim(); if (!/^https:\/\//i.test(raw)) return "";
  var m = raw.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{10,})/);
  return m ? "https://drive.google.com/thumbnail?id=" + m[1] + "&sz=w600" : raw;
}
var ERRORS = {
  NO_SHEET: ["Sheet not connected yet", "Run createNextGenForm once, or paste your Sheet's ID into SHEET_ID at the top of the script."],
  NO_ACCESS: ["Your account can't open the submissions Sheet", "Ask the owner to share the Sheet with this Google account as Editor, then refresh."],
  NO_TAB: ["No form responses tab found", "Link the form to this Sheet: in the form, Responses > Link to Sheets."]
};
function load(data) {
  var me = $("me"); me.textContent = "";
  if (data.me) me.appendChild(el("span", null, "Signed in as " + data.me));
  if (data.error) {
    var e = ERRORS[data.error] || ["Something went wrong", data.error];
    var box = el("div", "msg"); box.appendChild(el("h2", null, e[0])); box.appendChild(el("p", null, e[1]));
    $("list").textContent = ""; $("list").appendChild(box); return;
  }
  if (data.sheetUrl) { var a = el("a", null, "Open the Sheet"); a.href = data.sheetUrl; a.target = "_blank"; a.rel = "noopener"; me.appendChild(a); }
  S.rows = data.rows; $("bar").hidden = false; render();
}
function fail(err) { toast((err && err.message) || "That didn't save. Check your connection and try again."); render(); }
function call(fn, args, btn) {
  if (btn) { btn.disabled = true; btn.textContent = "Saving…"; }
  var r = google.script.run.withSuccessHandler(function (d) { load(d); toast("Saved"); }).withFailureHandler(fail);
  r[fn].apply(r, args);
}
function render() {
  var q = $("q").value.trim().toLowerCase();
  var counts = { pending: 0, approved: 0, all: S.rows.length };
  S.rows.forEach(function (r) { if (r.approved) counts.approved++; else counts.pending++; });
  Object.keys(counts).forEach(function (k) { $("n-" + k).textContent = counts[k]; });
  var rows = S.rows.filter(function (r) {
    if (S.filter === "pending" && r.approved) return false;
    if (S.filter === "approved" && !r.approved) return false;
    return !q || [r.first, r.school, r.title, r.country, r.desc].join(" ").toLowerCase().indexOf(q) >= 0;
  });
  var list = $("list"); list.textContent = "";
  if (!rows.length) {
    list.appendChild(el("p", "empty", S.filter === "pending" && !q ? "All caught up. No submissions are waiting for review." : "Nothing matches here."));
    return;
  }
  rows.forEach(function (r) { list.appendChild(card(r)); });
}
function card(r) {
  var c = el("article", "card" + (r.approved ? " is-approved" : ""));
  var main = el("div"); main.style.minWidth = "0";
  var meta = el("div", "meta");
  meta.appendChild(el("span", "pill " + (r.approved ? "ok" : "pending"), r.approved ? "Approved" : "Pending"));
  if (r.featured) meta.appendChild(el("span", "pill star", "★ Featured"));
  if (r.category) meta.appendChild(el("span", "pill", r.category));
  if (/under 13/i.test(r.age)) meta.appendChild(el("span", "pill warn", "Under 13 · parent submitted"));
  if (!r.consent) meta.appendChild(el("span", "pill warn", "No consent ticked"));
  meta.appendChild(el("span", "ts", r.ts));
  main.appendChild(meta);
  main.appendChild(el("h2", null, r.title || "(no title)"));
  main.appendChild(el("div", "who", [r.first, r.school, r.country].filter(Boolean).join(" · ")));
  if (r.desc) main.appendChild(el("p", "desc", r.desc));
  var p = photoUrl(r.photo);
  if (p) { var img = el("img", "photo"); img.src = p; img.alt = "Submitted photo"; img.referrerPolicy = "no-referrer"; img.loading = "lazy";
    img.onerror = function () { var a = el("a", null, "Open submitted photo"); a.href = r.photo; a.target = "_blank"; a.rel = "noopener"; img.replaceWith(a); };
    main.appendChild(img); }
  var priv = el("div", "private"); priv.appendChild(el("span", null, "Private"));
  priv.appendChild(el("span", null, "Email: " + (r.email || "none"))); priv.appendChild(el("span", null, "Age: " + (r.age || "not given")));
  main.appendChild(priv);
  c.appendChild(main);

  var act = el("div", "actions");
  var ap = el("button", "btn " + (r.approved ? "btn-ghost" : "btn-primary"), r.approved ? "Unapprove" : "Approve");
  ap.onclick = function () { call("setFlag", [r.row, r.ts, "approved", !r.approved], ap); };
  var fe = el("button", "btn " + (r.featured ? "btn-ghost" : "btn-star"), r.featured ? "Remove featured" : "★ Make featured");
  fe.title = "Only one Featured Innovator at a time. Featuring also approves the entry.";
  fe.onclick = function () { call("setFlag", [r.row, r.ts, "featured", !r.featured], fe); };
  var ed = el("button", "btn btn-ghost", "Edit");
  ed.onclick = function () { S.editing = S.editing === r.row ? null : r.row; render(); };
  act.appendChild(ap); act.appendChild(fe); act.appendChild(ed);
  c.appendChild(act);
  if (S.editing === r.row) c.appendChild(editor(r));
  return c;
}
function editor(r) {
  var f = el("form", "edit"), inputs = {};
  [["first", "First name only"], ["school", "School or organization"], ["country", "Country"], ["title", "Project title"], ["desc", "Description"], ["photo", "Photo link"]].forEach(function (x) {
    var l = el("label", null, x[1]), i = el(x[0] === "desc" ? "textarea" : "input");
    i.value = r[x[0]] || ""; i.id = "edit-" + x[0]; l.appendChild(i); f.appendChild(l); inputs[x[0]] = i;
  });
  var row = el("div", "row"), save = el("button", "btn btn-primary", "Save changes"), cancel = el("button", "btn btn-ghost", "Cancel");
  cancel.type = "button"; cancel.onclick = function () { S.editing = null; render(); };
  f.onsubmit = function (e) {
    e.preventDefault(); var out = {}; Object.keys(inputs).forEach(function (k) { out[k] = inputs[k].value; });
    S.editing = null; call("saveEdits", [r.row, r.ts, out], save);
  };
  row.appendChild(save); row.appendChild(cancel); f.appendChild(row);
  return f;
}
document.querySelectorAll(".tab").forEach(function (b) {
  b.onclick = function () { S.filter = b.getAttribute("data-f"); document.querySelectorAll(".tab").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); render(); };
});
$("q").oninput = render;
google.script.run.withSuccessHandler(load).withFailureHandler(function (e) { load({ error: (e && e.message) || "Could not load." }); }).getSubmissions();
</script>
</body></html>`;
