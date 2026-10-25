// NextGen Climate: loads the data files, renders every view, and handles #hash navigation.
// All student text is inserted with textContent, never as HTML.
(function () {
  "use strict";

  var CFG = window.NGC_CONFIG || {};
  var VIEWS = ["home", "news", "wall", "map", "submit", "certificate", "inspire", "about"];
  var state = { news: [], subs: [], stats: null, featured: null, inspire: null, newsTag: "All", wallCat: "", certEntry: null, mapDrawn: false };

  // Category -> icon (from the sprite in index.html) and tint. The label is always shown too, so color is never the only cue.
  var CATS = {
    "energy": ["c-energy", "#c98a12"], "transport": ["c-transport", "#2f74b5"], "food & ag": ["c-food", "#3d8b3a"],
    "water": ["c-water", "#1f8fa3"], "materials": ["c-materials", "#a3623a"], "buildings": ["c-buildings", "#6a6fa8"],
    "carbon removal": ["c-carbon", "#5b7d6b"], "data & ai": ["c-data", "#8a4fb0"], "education & community": ["c-education", "#c0506b"],
    "policy": ["c-policy", "#55606e"]
  };
  function cat(name) { var c = CATS[String(name || "").toLowerCase()]; return { icon: c ? c[0] : "c-other", color: c ? c[1] : "#4c6352" }; }

  // ---------- helpers ----------
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function safeUrl(u) {
    try { var x = new URL(u, location.href); return /^https?:$/.test(x.protocol) ? x.href : null; } catch (e) { return null; }
  }
  function fmtDate(iso, withTime) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso || "")) iso += "T12:00:00";
    var d = new Date(iso);
    if (!iso || isNaN(d)) return "";
    var o = { month: "short", day: "numeric", year: "numeric" };
    if (withTime) { o.hour = "numeric"; o.minute = "2-digit"; }
    return d.toLocaleString("en-US", o);
  }
  function relDate(iso) {
    var d = new Date(iso); if (!iso || isNaN(d)) return "";
    var h = (Date.now() - d) / 36e5;
    if (h < 1) return "Just now";
    if (h < 24) return Math.round(h) + "h ago";
    if (h < 48) return "Yesterday";
    return fmtDate(iso);
  }
  function icon(id, cls) {
    var ns = "http://www.w3.org/2000/svg";
    var s = document.createElementNS(ns, "svg"); s.setAttribute("class", "i" + (cls ? " " + cls : "")); s.setAttribute("aria-hidden", "true");
    var u = document.createElementNS(ns, "use"); u.setAttribute("href", "#" + id); s.appendChild(u);
    return s;
  }
  function catBadge(name) {
    var b = el("span", "badge badge-cat"); b.style.setProperty("--cat", cat(name).color);
    b.appendChild(icon(cat(name).icon)); b.appendChild(document.createTextNode(name));
    return b;
  }
  function toast(msg) {
    var t = $("toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.hidden = true; }, 2400);
  }
  function loadJSON(name, fallback) {
    var pre = window.NGC_PRELOAD && window.NGC_PRELOAD[name];
    if (pre) return Promise.resolve(pre);
    return fetch("data/" + name + ".json", { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .catch(function (e) { console.warn("Could not load " + name + ".json", e); return fallback; });
  }

  // ---------- navigation ----------
  function currentView() {
    var h = (location.hash || "").replace("#", "");
    if (/^p-[\w-]+$/.test(h)) return "wall";
    return VIEWS.indexOf(h) >= 0 ? h : "home";
  }
  function showView() {
    var v = currentView();
    document.querySelectorAll(".view").forEach(function (s) { s.hidden = s.getAttribute("data-view") !== v; });
    document.querySelectorAll(".nav a").forEach(function (a) {
      if (a.getAttribute("href") === "#" + v) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    $("nav").classList.remove("open");
    $("menu-btn").setAttribute("aria-expanded", "false");
    if (v === "map" && !state.mapDrawn) drawMap();
    var titles = { home: "NextGen Climate", news: "News · NextGen Climate", wall: "Solutions Wall · NextGen Climate", map: "Map · NextGen Climate",
      submit: "Submit · NextGen Climate", certificate: "Certificate · NextGen Climate", inspire: "Get Inspired · NextGen Climate", about: "About · NextGen Climate" };
    document.title = titles[v];
    window.scrollTo(0, 0);
    openFromHash();
  }
  function openFromHash() {
    var m = /^#p-([\w-]+)$/.exec(location.hash || "");
    if (!m || !state.subs.length) return;
    var s = state.subs.filter(function (x) { return String(x.id) === m[1]; })[0];
    if (s) openSub(s);
  }

  // ---------- home ----------
  function animateNumber(node, to) {
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || to < 2) { node.textContent = to.toLocaleString(); return; }
    var start = performance.now(), dur = 900;
    (function step(t) {
      var p = Math.min(1, (t - start) / dur), e = 1 - Math.pow(1 - p, 3);
      node.textContent = Math.round(to * e).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    })(start);
  }
  function renderStats() {
    var s = state.stats || computeStats(state.subs);
    ["innovators", "schools", "countries", "submissions"].forEach(function (k) { animateNumber($("stat-" + k), s[k] || 0); });
    $("stats-updated").textContent = s.updated ? "UPDATED " + fmtDate(s.updated).toUpperCase() : "";
    $("stats-note").hidden = !s.example;
  }
  function computeStats(subs) {
    var inn = new Set(), sch = new Set(), cty = new Set();
    subs.forEach(function (x) {
      inn.add((x.first_name + "|" + x.school).toLowerCase());
      if (x.school) sch.add(x.school.toLowerCase());
      if (x.country) cty.add(x.country);
    });
    return { innovators: inn.size, schools: sch.size, countries: cty.size, submissions: subs.length,
      example: subs.some(function (x) { return x.example; }) };
  }

  function media(sub, cls) {
    var box = el("div", cls);
    box.style.setProperty("--cat", cat(sub.category).color);
    var url = sub.photo && safeUrl(sub.photo);
    var fallback = function () {
      box.textContent = "";
      box.classList.add("is-art");
      box.appendChild(icon(cat(sub.category).icon, "art-icon"));
      box.appendChild(el("span", "initial", (sub.first_name || "?").charAt(0).toUpperCase()));
    };
    if (url) {
      var img = new Image();
      img.alt = "Photo of " + (sub.title || "the project");
      img.loading = "lazy"; img.referrerPolicy = "no-referrer";
      img.onerror = fallback;
      img.src = url;
      box.appendChild(img);
    } else { fallback(); }
    return box;
  }

  function renderFeatured() {
    var box = $("featured"); box.textContent = "";
    var f = state.featured && state.featured.item;
    if (!f) {
      var m = el("div", "featured-media");
      m.innerHTML = '<svg class="placeholder-art" viewBox="0 0 120 80" aria-hidden="true"><circle cx="60" cy="40" r="30" fill="none" stroke="currentColor" stroke-width="4"/><path d="M36 48 C46 48 48 28 60 28 S74 48 84 48" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><circle cx="60" cy="28" r="6" fill="var(--solar)"/></svg>';
      var b = el("div", "featured-body");
      b.appendChild(el("span", "badge badge-solar", "Spot open"));
      b.appendChild(el("h3", null, "This could be you"));
      b.appendChild(el("p", "muted", "Each week we feature one innovator from the Solutions Wall on this page and on Instagram. Submit your solution for a chance to be next."));
      var a = el("a", "btn btn-primary", "Submit your solution"); a.href = "#submit"; a.style.width = "fit-content";
      b.appendChild(a);
      box.appendChild(m); box.appendChild(b);
      return;
    }
    box.appendChild(media(f, "featured-media"));
    var body = el("div", "featured-body");
    var badges = el("div"); badges.style.display = "flex"; badges.style.gap = "8px"; badges.style.flexWrap = "wrap";
    badges.appendChild(el("span", "badge badge-solar", "Featured · week of " + fmtDate(state.featured.week_of)));
    if (f.category) badges.appendChild(catBadge(f.category));
    if (f.example) badges.appendChild(el("span", "badge badge-example", "Example"));
    body.appendChild(badges);
    body.appendChild(el("h3", null, f.title));
    body.appendChild(el("p", "featured-who", f.first_name + " · " + f.school + " · " + f.country));
    body.appendChild(el("p", "muted", f.description));
    var more = el("a", "link-arrow", "See more student solutions"); more.href = "#wall";
    body.appendChild(more);
    box.appendChild(body);
  }

  // ---------- news ----------
  var TAGS = ["Energy", "Transport", "Food & Ag", "Carbon Removal", "Water", "Materials", "Buildings", "Policy", "Other"];
  function newsItem(n) {
    var li = el("li", "news-item");
    var tag = el("span", "news-tag"); tag.style.setProperty("--cat", cat(n.tag).color);
    tag.appendChild(icon(cat(n.tag).icon)); tag.appendChild(document.createTextNode(n.tag || "Other"));
    li.appendChild(tag);
    var main = el("div"); main.style.minWidth = "0";
    var h = el("h3");
    var url = safeUrl(n.link);
    if (url) { var a = el("a", null, n.title); a.href = url; a.target = "_blank"; a.rel = "noopener"; a.appendChild(icon("i-external", "ext")); h.appendChild(a); }
    else h.textContent = n.title;
    main.appendChild(h);
    var meta = el("p", "news-meta", [n.source, relDate(n.date)].filter(Boolean).join(" · "));
    if (n.sample) { meta.appendChild(document.createTextNode(" ")); meta.appendChild(el("span", "badge badge-example", "Sample")); }
    main.appendChild(meta);
    li.appendChild(main);
    return li;
  }
  function renderHomeNews() {
    var ol = $("home-news"); ol.textContent = "";
    state.news.slice(0, CFG.HOME_NEWS_COUNT || 6).forEach(function (n) { ol.appendChild(newsItem(n)); });
    if (!state.news.length) ol.appendChild(el("li", "empty", "Today's headlines are on their way."));
  }
  function renderNewsFilters() {
    var bar = $("news-filters"); bar.textContent = "";
    var counts = {}; state.news.forEach(function (n) { counts[n.tag || "Other"] = (counts[n.tag || "Other"] || 0) + 1; });
    ["All"].concat(TAGS.filter(function (t) { return counts[t]; })).forEach(function (t) {
      var b = el("button", "chip", t); b.type = "button";
      var c = el("span", "count", t === "All" ? state.news.length : counts[t]); b.appendChild(c);
      b.setAttribute("aria-pressed", String(state.newsTag === t));
      b.addEventListener("click", function () { state.newsTag = t; renderNewsFilters(); renderNewsList(); });
      bar.appendChild(b);
    });
  }
  function renderNewsList() {
    var ol = $("news-list"); ol.textContent = "";
    var items = state.news.filter(function (n) { return state.newsTag === "All" || (n.tag || "Other") === state.newsTag; });
    items.forEach(function (n) { ol.appendChild(newsItem(n)); });
    $("news-empty").hidden = items.length > 0;
  }

  // ---------- wall ----------
  function fillSelect(sel, values) {
    var keep = sel.value;
    while (sel.options.length > 1) sel.remove(1);
    values.forEach(function (v) { var o = document.createElement("option"); o.value = v; o.textContent = v; sel.appendChild(o); });
    if (values.indexOf(keep) >= 0) sel.value = keep;
  }
  function uniqSorted(arr) { return Array.from(new Set(arr.filter(Boolean))).sort(function (a, b) { return a.localeCompare(b); }); }
  function renderWall() {
    var country = $("wall-country").value, wcat = state.wallCat, q = $("wall-search").value.trim().toLowerCase();
    $("wall-clear").hidden = !(country || wcat || q);
    var items = state.subs.filter(function (s) {
      if (country && s.country !== country) return false;
      if (wcat && s.category !== wcat) return false;
      if (q && [s.title, s.school, s.first_name, s.description].join(" ").toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    var wrap = $("wall-cards"); wrap.textContent = "";
    items.forEach(function (s) {
      var card = el("article", "card");
      card.appendChild(media(s, "card-media"));
      var body = el("div", "card-body");
      var top = el("div"); top.style.display = "flex"; top.style.gap = "6px"; top.style.flexWrap = "wrap";
      if (s.category) top.appendChild(catBadge(s.category));
      if (s.example) top.appendChild(el("span", "badge badge-example", "Example"));
      body.appendChild(top);
      var h = el("h3"), open = el("button", "card-open", s.title); open.type = "button";
      open.addEventListener("click", function () { openSub(s); });
      h.appendChild(open); body.appendChild(h);
      body.appendChild(el("p", null, s.description));
      var foot = el("div", "card-foot");
      foot.appendChild(el("b", null, s.first_name + " · " + s.school));
      var where = el("span", "muted where"); where.appendChild(icon("i-pin")); where.appendChild(document.createTextNode(s.country));
      foot.appendChild(where);
      body.appendChild(foot);
      card.appendChild(body);
      wrap.appendChild(card);
    });
    $("wall-count").textContent = items.length + (items.length === 1 ? " solution" : " solutions");
    $("wall-empty").hidden = items.length > 0;
  }
  function openSub(s) {
    var d = $("sub-dialog");
    var m = $("sub-media"); m.textContent = ""; m.appendChild(media(s, "card-media"));
    var bd = $("sub-badges"); bd.textContent = "";
    if (s.category) bd.appendChild(catBadge(s.category));
    if (s.example) bd.appendChild(el("span", "badge badge-example", "Example"));
    $("sub-title").textContent = s.title;
    $("sub-who").textContent = s.first_name + " · " + s.school + " · " + s.country;
    $("sub-desc").textContent = s.description;
    var n = state.subs.filter(function (x) { return x.country === s.country; }).length;
    $("sub-country").querySelector("span").textContent = n > 1 ? "All " + n + " from " + s.country : "More from " + s.country;
    $("sub-country").onclick = function () { d.close(); selectCountry(s.country); };
    $("sub-share").onclick = function () {
      var url = location.href.split("#")[0] + "#p-" + s.id;
      var ok = function () { toast("Link copied. Share it with friends!"); };
      try { navigator.clipboard.writeText(url).then(ok, function () { toast(url); }); } catch (e) { toast(url); }
    };
    $("sub-cert").onclick = function () { d.close(); $("cert-search").value = s.first_name; setTimeout(renderCertResults); };
    if (d.open) return;
    if (d.showModal) d.showModal(); else d.setAttribute("open", "");
  }
  function renderWallCats() {
    var bar = $("wall-cats"); bar.textContent = "";
    var counts = {}; state.subs.forEach(function (s) { if (s.category) counts[s.category] = (counts[s.category] || 0) + 1; });
    [""].concat(uniqSorted(Object.keys(counts))).forEach(function (c) {
      var b = el("button", "chip"); b.type = "button";
      if (c) { b.style.setProperty("--cat", cat(c).color); b.appendChild(icon(cat(c).icon)); }
      b.appendChild(document.createTextNode(c || "All categories"));
      b.appendChild(el("span", "count", c ? counts[c] : state.subs.length));
      b.setAttribute("aria-pressed", String(state.wallCat === c));
      b.addEventListener("click", function () { state.wallCat = c; renderWallCats(); renderWall(); });
      bar.appendChild(b);
    });
  }
  function clearWall() {
    $("wall-country").value = ""; $("wall-search").value = ""; state.wallCat = "";
    renderWallCats(); renderWall();
  }
  function surprise() {
    var links = document.querySelectorAll(".inspire-link");
    if (!links.length) return;
    var i = Math.floor(Math.random() * links.length);
    if (links.length > 1 && i === surprise._last) i = (i + 1) % links.length;
    surprise._last = i;
    links.forEach(function (a) { a.classList.remove("picked"); });
    var pick = links[i]; pick.classList.add("picked");
    pick.scrollIntoView({ behavior: "smooth", block: "center" });
    $("surprise-out").textContent = "Try this one: " + pick.querySelector("h3").textContent + ". Press again for another.";
  }
  // Theme: follows the device until the visitor picks one; the choice is remembered on this device only.
  function setTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    $("theme-btn").setAttribute("aria-label", t === "dark" ? "Switch to light theme" : "Switch to dark theme");
  }
  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem("ngc-theme"); } catch (e) {}
    var dark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var cur = document.documentElement.getAttribute("data-theme");
    setTheme(saved || cur || (dark ? "dark" : "light"));
    $("theme-btn").addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      setTheme(next);
      try { localStorage.setItem("ngc-theme", next); } catch (e) {}
    });
  }
  // Soft light that follows the pointer across .glow surfaces.
  function bindGlow() {
    document.addEventListener("pointermove", function (e) {
      var g = e.target.closest && e.target.closest(".glow");
      if (!g) return;
      var r = g.getBoundingClientRect();
      g.style.setProperty("--mx", (e.clientX - r.left) + "px");
      g.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  }
  function showCategory(c) {
    clearWall(); state.wallCat = c; renderWallCats(); renderWall();
    location.hash = "wall";
  }

  // ---------- category bars (home) ----------
  // One series (count per category), so one color; the value is printed beside each bar.
  function renderCatBars() {
    var ul = $("cat-bars"); ul.textContent = "";
    var counts = {}; state.subs.forEach(function (s) { if (s.category) counts[s.category] = (counts[s.category] || 0) + 1; });
    var cats = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a] || a.localeCompare(b); });
    var max = Math.max.apply(null, cats.map(function (c) { return counts[c]; }).concat([1]));
    cats.forEach(function (c) {
      var li = el("li"), b = el("button", "bar-row"); b.type = "button";
      b.style.setProperty("--cat", cat(c).color);
      b.setAttribute("aria-label", c + ": " + counts[c] + (counts[c] === 1 ? " solution" : " solutions") + ". Show them on the wall");
      var name = el("span", "bar-name"); name.appendChild(icon(cat(c).icon)); name.appendChild(document.createTextNode(c));
      var track = el("span", "bar-track"), fill = el("span", "bar-fill");
      fill.style.width = (counts[c] / max * 100) + "%";
      track.appendChild(fill);
      b.appendChild(name); b.appendChild(track); b.appendChild(el("span", "bar-num", counts[c]));
      b.addEventListener("click", function () { showCategory(c); });
      li.appendChild(b); ul.appendChild(li);
    });
    if (!cats.length) ul.appendChild(el("li", "empty", "Categories appear here as soon as the first solutions are approved."));
  }

  // ---------- idea spinner ----------
  var SPARK = [
    [["School cafeteria", "In your school cafeteria"], ["Community garden", "In your community garden"], ["Bus stop", "At the bus stop near you"],
     ["Kitchen at home", "In your kitchen at home"], ["School roof", "On your school roof"], ["Local park", "In a local park"],
     ["Sports field", "On your sports field"], ["Classroom", "In your classroom"]],
    [["Lights left on", "lights and screens stay on when nobody is there", "Energy"],
     ["Unused sunshine", "the sun shines all day but powers nothing", "Energy"],
     ["Wasted water", "a lot of water gets wasted", "Water"],
     ["Rain runoff", "rainwater runs straight into the drain", "Water"],
     ["Food waste", "too much food gets thrown away", "Food & Ag"],
     ["No fresh food", "there's nowhere to grow fresh food", "Food & Ag"],
     ["Plastic piles", "plastic waste piles up every day", "Materials"],
     ["Throwaway stuff", "broken things get thrown out instead of fixed", "Materials"],
     ["Car trips", "most people arrive by car", "Transport"],
     ["Too hot", "it gets too hot in summer", "Buildings"],
     ["Invisible usage", "nobody can see how much energy or water is used", "Data & AI"],
     ["Nobody knows", "people don't know what they can do to help", "Education & Community"]],
    [["Arduino sensor", "an Arduino sensor"], ["Raspberry Pi", "a Raspberry Pi dashboard"], ["Phone app", "a phone app built with MIT App Inventor"],
     ["Survey + posters", "a survey and a poster campaign"], ["Cardboard prototype", "a cardboard prototype"],
     ["Spreadsheet", "a spreadsheet that tracks it for a month"], ["Solar kit", "a small solar panel kit"], ["Recycled parts", "parts rescued from the recycling bin"]]
  ];
  var spark = [0, 4, 0];
  function sparkText() {
    var pl = SPARK[0][spark[0]], pr = SPARK[1][spark[1]], tl = SPARK[2][spark[2]];
    $("spark-idea").textContent = pl[1] + ", " + pr[1] + ". Tackle it with " + tl[1] + ".";
    var c = pr[2], has = state.subs.some(function (s) { return s.category === c; });
    var a = $("spark-similar"); a.textContent = "";
    a.appendChild(icon(cat(c).icon));
    a.appendChild(document.createTextNode(has ? "See " + c + " projects" : "Be the first in " + c));
    a.onclick = function (e) { if (has) { e.preventDefault(); showCategory(c); } };
    a.href = has ? "#wall" : "#submit";
  }
  function spinReel(i, onlyIn) {
    var reel = document.querySelector('.reel[data-reel="' + i + '"]'), val = reel.querySelector(".reel-val");
    var list = SPARK[i], pool = [];
    list.forEach(function (x, k) { if (k !== spark[i] && (!onlyIn || x[2] === onlyIn)) pool.push(k); });
    if (!pool.length) return;
    var target = pool[Math.floor(Math.random() * pool.length)];
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var ticks = reduce ? 0 : 8 + i * 4, n = 0;
    reel.classList.add("spinning");
    (function tick() {
      if (n++ < ticks) { val.textContent = list[Math.floor(Math.random() * list.length)][0]; setTimeout(tick, 55 + n * 6); return; }
      spark[i] = target; val.textContent = list[target][0];
      reel.classList.remove("spinning"); reel.classList.add("landed");
      setTimeout(function () { reel.classList.remove("landed"); }, 400);
      sparkText();
    })();
  }

  // ---------- innovator quiz ----------
  var QUIZ = [
    ["What do you enjoy most?", [["Building things with my hands", ["Materials", "Buildings"]], ["Coding and gadgets", ["Data & AI", "Energy"]],
      ["Growing and caring for things", ["Food & Ag", "Water"]], ["Getting people together", ["Education & Community", "Transport"]]]],
    ["Pick a place you'd love to improve", [["My school building", ["Buildings", "Energy"]], ["A garden or park", ["Food & Ag", "Water"]],
      ["The streets around me", ["Transport", "Materials"]], ["My online community", ["Education & Community", "Data & AI"]]]],
    ["Which problem bugs you most?", [["Wasted electricity", ["Energy", "Data & AI"]], ["Plastic and trash", ["Materials", "Food & Ag"]],
      ["Heat waves and droughts", ["Water", "Buildings"]], ["Traffic and dirty air", ["Transport", "Education & Community"]]]],
    ["Choose your dream tool", [["Sensors and a soldering iron", ["Energy", "Data & AI"]], ["Seeds and soil", ["Food & Ag", "Water"]],
      ["Cardboard, glue, and a 3D printer", ["Materials", "Buildings"]], ["A microphone and posters", ["Education & Community", "Transport"]]]]
  ];
  var TYPES = {
    "Energy": ["The Power Hacker", "You like finding where energy leaks away and plugging the gap. Start with a meter, a sensor, or a solar kit."],
    "Data & AI": ["The Data Detective", "You make the invisible visible. Measure something people ignore and turn it into a chart they can't ignore."],
    "Materials": ["The Maker", "You'd rather build it than buy it. Turn waste into something useful and test how well it holds up."],
    "Buildings": ["The Cool Builder", "You see rooms, roofs, and walls as things to redesign. Test shade, insulation, or roof colors with small models."],
    "Food & Ag": ["The Grower", "You like living systems. Grow food where there was none, or rescue food before it gets wasted."],
    "Water": ["The Water Guardian", "You notice drips and droughts. Measure water use, catch rain, or water plants only when they need it."],
    "Transport": ["The Route Planner", "You think about how people get around. Map safer, greener routes and get more people walking or biking."],
    "Education & Community": ["The Organizer", "You bring people with you. Run a campaign, workshop, or challenge that gets your school acting together."]
  };
  var quiz = { step: 0, score: {} };
  function renderQuiz() {
    var body = $("quiz-body"); body.textContent = "";
    var done = quiz.step >= QUIZ.length;
    $("quiz-fill").style.width = (quiz.step / QUIZ.length * 100) + "%";
    $("quiz-step").textContent = done ? "Result" : "Question " + (quiz.step + 1) + " of " + QUIZ.length;
    if (!done) {
      var q = QUIZ[quiz.step];
      body.appendChild(el("p", "quiz-q", q[0]));
      var grid = el("div", "quiz-opts");
      q[1].forEach(function (o) {
        var b = el("button", "quiz-opt", o[0]); b.type = "button";
        b.addEventListener("click", function () {
          o[1].forEach(function (c) { quiz.score[c] = (quiz.score[c] || 0) + 1; });
          quiz.last = o[1][0]; quiz.step++; renderQuiz();
        });
        grid.appendChild(b);
      });
      body.appendChild(grid);
      return;
    }
    var best = Object.keys(quiz.score).sort(function (a, b) { return quiz.score[b] - quiz.score[a] || (b === quiz.last) - (a === quiz.last); })[0];
    var t = TYPES[best];
    var res = el("div", "quiz-result"); res.style.setProperty("--cat", cat(best).color);
    var art = el("span", "quiz-art"); art.appendChild(icon(cat(best).icon)); res.appendChild(art);
    var txt = el("div");
    txt.appendChild(el("p", "mono quiz-kicker", "You are"));
    txt.appendChild(el("h3", null, t[0]));
    txt.appendChild(el("p", "muted", t[1]));
    var acts = el("div", "quiz-acts");
    var idea = el("button", "btn btn-primary"); idea.type = "button";
    idea.appendChild(icon("i-shuffle")); idea.appendChild(document.createTextNode("Spin a " + best + " idea"));
    idea.addEventListener("click", function () {
      location.hash = "home";
      setTimeout(function () { $("spark-sec").scrollIntoView({ behavior: "smooth" }); spinReel(0); spinReel(1, best); spinReel(2); }, 60);
    });
    acts.appendChild(idea);
    if (state.subs.some(function (s) { return s.category === best; })) {
      var see = el("button", "btn btn-ghost", "See " + best + " projects"); see.type = "button";
      see.addEventListener("click", function () { showCategory(best); });
      acts.appendChild(see);
    }
    var again = el("button", "btn-text"); again.type = "button";
    again.appendChild(icon("i-refresh")); again.appendChild(document.createTextNode("Retake"));
    again.addEventListener("click", function () { quiz = { step: 0, score: {} }; renderQuiz(); });
    acts.appendChild(again);
    txt.appendChild(acts); res.appendChild(txt); body.appendChild(res);
  }

  // ---------- confetti (certificate download) ----------
  function confetti() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var c = document.createElement("canvas"), x = c.getContext("2d"), dpr = window.devicePixelRatio || 1;
    c.className = "confetti"; c.width = innerWidth * dpr; c.height = innerHeight * dpr; document.body.appendChild(c);
    x.scale(dpr, dpr);
    var cs = getComputedStyle(document.documentElement);
    var colors = ["--solar", "--accent", "--sage"].map(function (v) { return cs.getPropertyValue(v).trim(); }).concat(["#c98a12", "#1f8fa3"]);
    var bits = [];
    for (var i = 0; i < 140; i++) bits.push({ x: innerWidth / 2, y: innerHeight * 0.6, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 15 - 5,
      r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.4, w: 6 + Math.random() * 6, h: 4 + Math.random() * 4, c: colors[i % colors.length] });
    var start = performance.now();
    (function frame(t) {
      x.clearRect(0, 0, innerWidth, innerHeight);
      bits.forEach(function (b) {
        b.vy += 0.35; b.vx *= 0.99; b.x += b.vx; b.y += b.vy; b.r += b.vr;
        x.save(); x.translate(b.x, b.y); x.rotate(b.r); x.fillStyle = b.c; x.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); x.restore();
      });
      if (t - start < 2200) requestAnimationFrame(frame); else c.remove();
    })(start);
  }

  function selectCountry(c) {
    clearWall();
    $("wall-country").value = c;
    renderWall();
    location.hash = "wall";
  }

  // ---------- map ----------
  function drawMap() {
    state.mapDrawn = true;
    try { window.NGCMap.render(state.subs, selectCountry); }
    catch (e) { console.error(e); state.mapDrawn = false; }
  }

  // ---------- certificate ----------
  function renderCertResults() {
    var q = $("cert-search").value.trim().toLowerCase();
    var ul = $("cert-results"); ul.textContent = "";
    if (q.length < 2) { ul.appendChild(el("li", "small muted", "Type at least 2 letters to search.")); return; }
    var hits = state.subs.filter(function (s) {
      return (s.first_name + " " + s.school).toLowerCase().indexOf(q) >= 0;
    }).slice(0, 25);
    if (!hits.length) { ul.appendChild(el("li", "small muted", "No approved entries match “" + q + "” yet.")); return; }
    hits.forEach(function (s) {
      var li = el("li"), b = el("button"); b.type = "button";
      b.setAttribute("aria-pressed", String(state.certEntry === s));
      b.appendChild(el("b", null, s.first_name + " · " + s.title));
      b.appendChild(el("span", "sub", s.school + " · " + s.country + (s.example ? " · example entry" : "")));
      b.addEventListener("click", function () {
        state.certEntry = s;
        $("cert-name").value = s.first_name;
        $("cert-name-field").hidden = false;
        redrawCert();
        $("cert-download").disabled = false;
        $("cert-status").textContent = "Add your last name in step 2 if you want it on the certificate. It is not saved anywhere.";
        renderCertResults();
      });
      li.appendChild(b); ul.appendChild(li);
    });
  }
  function redrawCert() {
    if (state.certEntry) window.NGCCertificate.draw($("cert-canvas"), state.certEntry, $("cert-name").value);
  }

  // ---------- inspire / about ----------
  function renderInspire() {
    var box = $("inspire-list"); box.textContent = "";
    var groups = (state.inspire && state.inspire.groups) || [];
    groups.forEach(function (g) {
      var sec = el("section", "inspire-group");
      sec.appendChild(el("h2", null, g.name));
      (g.links || []).forEach(function (l) {
        var url = safeUrl(l.url); if (!url) return;
        var a = el("a", "inspire-link"); a.href = url; a.target = "_blank"; a.rel = "noopener";
        var h = el("h3", null, l.title); h.appendChild(icon("i-external", "ext")); a.appendChild(h);
        if (l.desc) a.appendChild(el("p", null, l.desc));
        sec.appendChild(a);
      });
      box.appendChild(sec);
    });
  }
  function renderAbout() {
    var ul = $("team-list"); ul.textContent = "";
    (CFG.TEAM || []).forEach(function (m) {
      var li = el("li"); li.appendChild(el("b", null, m.name)); li.appendChild(el("span", "role", m.role)); ul.appendChild(li);
    });
    var email = (CFG.CONTACT_EMAIL || "").trim();
    var line = $("contact-email").parentElement;
    if (email) { $("contact-email").textContent = email; } else { line.textContent = "Message us on Instagram."; }
    if (CFG.INSTAGRAM_URL) $("insta-link").href = CFG.INSTAGRAM_URL;
    var admin = safeUrl(CFG.ADMIN_URL || "");
    if (admin && CFG.ADMIN_URL) { $("admin-link").href = admin; $("admin-link").hidden = false; }
    var form = safeUrl(CFG.FORM_URL || "");
    if (form && CFG.FORM_URL) { $("form-link").href = form; } else { $("form-link").hidden = true; $("form-missing").hidden = false; }
  }

  // ---------- instagram + logo ----------
  function renderInstagram(data) {
    var grid = $("ig-grid"); grid.textContent = "";
    var handle = CFG.INSTAGRAM_HANDLE || "nextgen_climate";
    var profile = safeUrl(CFG.INSTAGRAM_URL || "") || "https://www.instagram.com/" + handle + "/";
    $("ig-follow").href = profile; $("ig-follow").textContent = "@" + handle;
    var posts = (data && data.posts) || [];
    if (!posts.length) {
      var box = el("div", "ig-empty");
      var txt = el("div");
      txt.appendChild(el("h3", null, "Follow the movement"));
      txt.appendChild(el("p", "muted", "Featured innovators, climate-tech news, and events, posted on Instagram."));
      var badge = el("span", "ig-badge"); badge.appendChild(icon("i-instagram")); box.appendChild(badge);
      var a = el("a", "btn btn-primary", "Follow @" + handle); a.href = profile; a.target = "_blank"; a.rel = "noopener";
      box.appendChild(txt); box.appendChild(a); grid.appendChild(box);
      return;
    }
    posts.forEach(function (p) {
      var url = safeUrl(p.link) || profile;
      var a = el("a", "ig-post"); a.href = url; a.target = "_blank"; a.rel = "noopener";
      a.setAttribute("aria-label", p.caption ? "Instagram post: " + p.caption : "Instagram post");
      var img = new Image(); img.src = p.image; img.alt = ""; img.loading = "lazy";
      img.onerror = function () { img.remove(); };
      a.appendChild(img);
      if (p.video) a.appendChild(el("span", "ig-video", "VIDEO"));
      if (p.caption) a.appendChild(el("span", "ig-cap", p.caption));
      grid.appendChild(a);
    });
  }
  function loadLogo() {
    var src = CFG.LOGO_URL && safeUrl(CFG.LOGO_URL);
    if (!src) return;
    var img = $("brand-logo");
    img.onerror = function () { img.hidden = true; };
    if (img.getAttribute("src") !== CFG.LOGO_URL) img.src = src;
  }

  // ---------- wire up ----------
  function bind() {
    initTheme(); bindGlow();
    $("surprise-btn").addEventListener("click", surprise);
    $("spark-spin").addEventListener("click", function () { spinReel(0); spinReel(1); spinReel(2); });
    document.querySelectorAll(".reel").forEach(function (r) { r.addEventListener("click", function () { spinReel(+r.getAttribute("data-reel")); }); });
    $("sub-close").addEventListener("click", function () { $("sub-dialog").close(); });
    $("sub-dialog").addEventListener("click", function (e) { if (e.target === this) this.close(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "/" && currentView() === "wall" && document.activeElement.tagName !== "INPUT") { e.preventDefault(); $("wall-search").focus(); }
    });
    window.addEventListener("hashchange", showView);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && $("nav").classList.contains("open")) { $("nav").classList.remove("open"); $("menu-btn").setAttribute("aria-expanded", "false"); $("menu-btn").focus(); }
    });
    $("menu-btn").addEventListener("click", function () {
      var open = $("nav").classList.toggle("open");
      this.setAttribute("aria-expanded", String(open));
    });
    $("wall-country").addEventListener("change", renderWall);
    $("wall-clear").addEventListener("click", clearWall);
    $("wall-search").addEventListener("input", renderWall);
    $("cert-search").addEventListener("input", renderCertResults);
    $("cert-name").addEventListener("input", redrawCert);
    $("cert-download").addEventListener("click", function () {
      try {
        window.NGCCertificate.download($("cert-canvas"), $("cert-name").value || (state.certEntry && state.certEntry.first_name));
        toast("Certificate downloaded. Congratulations!");
        confetti();
      } catch (e) { $("cert-status").textContent = "The PDF tool didn't load. Refresh the page and try again."; }
    });
    var copy = $("copy-email");
    if (copy) copy.addEventListener("click", function () {
      var txt = $("contact-email").textContent;
      var done = function () { toast("Email copied"); };
      var fallback = function () {
        var r = document.createRange(); r.selectNodeContents($("contact-email"));
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); toast("Email selected. Press copy.");
      };
      try { navigator.clipboard.writeText(txt).then(done, fallback); } catch (e) { fallback(); }
    });
  }

  function init() {
    bind();
    renderAbout();
    loadLogo();
    window.NGCCertificate.blank($("cert-canvas"));
    renderCertResults();
    renderQuiz();
    showView();

    Promise.all([
      loadJSON("news", { items: [] }),
      loadJSON("submissions", { items: [] }),
      loadJSON("stats", null),
      loadJSON("featured", null),
      loadJSON("inspire", { groups: [] }),
      loadJSON("instagram", { posts: [] })
    ]).then(function (r) {
      state.news = (r[0] && r[0].items) || [];
      state.subs = (r[1] && r[1].items) || [];
      state.stats = r[2];
      state.featured = r[3];
      state.inspire = r[4];
      $("news-updated").textContent = r[0] && r[0].updated ? "Last updated " + fmtDate(r[0].updated, true) : "";

      renderStats(); renderFeatured(); renderHomeNews(); renderInstagram(r[5]);
      renderNewsFilters(); renderNewsList();
      fillSelect($("wall-country"), uniqSorted(state.subs.map(function (s) { return s.country; })));
      renderWallCats(); renderWall(); renderCatBars(); sparkText(); renderInspire(); renderCertResults();
      if (currentView() === "map") drawMap();
      openFromHash();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
