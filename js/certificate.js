// Draws the NextGen Climate Innovator certificate on a canvas and saves it as a PDF
// in the student's browser with jsPDF. Nothing is uploaded anywhere.
(function () {
  "use strict";

  var C = {
    paper: "#ffffff", ink: "#11291a", muted: "#4c6352", teal: "#1a5a1f", tealSoft: "#dceadb", solar: "#41b93c", sage: "#80af81"
  };
  var DISPLAY = '"Montserrat", "Arial Black", Arial, sans-serif';
  var logo = null;
  function logoImage() {
    if (logo) return logo;
    var src = (window.NGC_CONFIG && window.NGC_CONFIG.CERT_LOGO_URL) || "assets/logo-mark.png";
    logo = new Image();
    logo.src = src;
    return logo;
  }
  var BODY = '"Atkinson Hyperlegible", "Segoe UI", system-ui, sans-serif';
  var MONO = '"JetBrains Mono", Menlo, Consolas, monospace';

  function fitText(ctx, text, maxWidth, size, weight, family) {
    var s = size;
    do { ctx.font = weight + " " + s + "px " + family; s -= 2; } while (ctx.measureText(text).width > maxWidth && s > 20);
  }

  function wrapLines(ctx, text, maxWidth, maxLines) {
    var words = String(text).split(/\s+/), lines = [], line = "";
    words.forEach(function (w) {
      var test = line ? line + " " + w : w;
      if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; } else { line = test; }
    });
    if (line) lines.push(line);
    if (lines.length > maxLines) { lines = lines.slice(0, maxLines); lines[maxLines - 1] = lines[maxLines - 1].replace(/\s+\S*$/, "") + "…"; }
    return lines;
  }

  function formatDate(iso) {
    var d = iso ? new Date(iso) : new Date();
    if (isNaN(d)) d = new Date();
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  }

  function draw(canvas, entry, nameOnCert) {
    var ctx = canvas.getContext("2d");
    var W = canvas.width, H = canvas.height, cx = W / 2;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);

    // Grid-paper field and frame
    ctx.strokeStyle = "rgba(26,90,31,0.06)"; ctx.lineWidth = 1;
    for (var x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (var y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.strokeRect(48, 48, W - 96, H - 96);
    ctx.strokeStyle = C.teal; ctx.lineWidth = 2; ctx.strokeRect(68, 68, W - 136, H - 136);
    ctx.fillStyle = C.solar; ctx.fillRect(48, 48, 220, 14);

    // Logo
    var img = logoImage();
    if (img.complete && img.naturalWidth) {
      ctx.drawImage(img, cx - 70, 92, 140, 140);
    } else {
      ctx.fillStyle = C.sage; ctx.beginPath(); ctx.arc(cx, 165, 56, 0, Math.PI * 2); ctx.fill();
    }

    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillStyle = C.teal; ctx.font = "500 24px " + MONO;
    ctx.fillText("N E X T G E N   C L I M A T E", cx, 272);

    ctx.fillStyle = C.ink; fitText(ctx, "CLIMATE INNOVATOR", W - 300, 104, "900", DISPLAY);
    ctx.fillText("CLIMATE INNOVATOR", cx, 395);

    ctx.fillStyle = C.muted; ctx.font = "400 30px " + BODY;
    ctx.fillText("This certificate recognizes", cx, 470);

    var name = (nameOnCert || entry.first_name || "Innovator").trim();
    ctx.fillStyle = C.teal; fitText(ctx, name.toUpperCase(), W - 360, 88, "800", DISPLAY);
    ctx.fillText(name.toUpperCase(), cx, 585);
    ctx.fillStyle = C.solar; ctx.fillRect(cx - 260, 612, 520, 5);

    ctx.fillStyle = C.ink; ctx.font = "400 30px " + BODY;
    ctx.fillText("for contributing a climate solution to the NextGen Climate Solutions Wall:", cx, 682);

    ctx.font = "700 38px " + BODY;
    var lines = wrapLines(ctx, "“" + (entry.title || "Climate solution") + "”", W - 420, 2);
    lines.forEach(function (l, i) { ctx.fillText(l, cx, 746 + i * 50); });

    var place = [entry.school, entry.country].filter(Boolean).join(" · ");
    ctx.fillStyle = C.muted; ctx.font = "400 28px " + BODY;
    ctx.fillText(place, cx, 746 + lines.length * 50 + 14);

    // Footer: date, signature, ID
    var fy = H - 170;
    ctx.strokeStyle = C.ink; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(220, fy); ctx.lineTo(620, fy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W - 620, fy); ctx.lineTo(W - 220, fy); ctx.stroke();
    ctx.fillStyle = C.ink; ctx.font = "700 28px " + BODY;
    ctx.fillText(formatDate(entry.date), 420, fy - 18);
    ctx.font = "italic 400 34px " + BODY;
    ctx.fillText("Jiarui Li", W - 420, fy - 18);
    ctx.fillStyle = C.muted; ctx.font = "500 20px " + MONO;
    ctx.fillText("DATE", 420, fy + 36);
    ctx.fillText("CO-FOUNDER, NEXTGEN CLIMATE", W - 420, fy + 36);
    ctx.font = "400 18px " + MONO;
    ctx.fillText("CERTIFICATE ID " + String(entry.id || "").toUpperCase(), cx, H - 92);
  }

  window.NGCCertificate = {
    draw: function (canvas, entry, nameOnCert) {
      var go = function () { draw(canvas, entry, nameOnCert); };
      var img = logoImage();
      var logoReady = img.complete ? Promise.resolve() : new Promise(function (res) { img.onload = res; img.onerror = res; });
      if (document.fonts && document.fonts.load) {
        Promise.all([
          logoReady,
          document.fonts.load('900 100px "Montserrat"'),
          document.fonts.load('800 100px "Montserrat"'),
          document.fonts.load('400 30px "Atkinson Hyperlegible"'),
          document.fonts.load('700 30px "Atkinson Hyperlegible"'),
          document.fonts.load('italic 400 30px "Atkinson Hyperlegible"'),
          document.fonts.load('500 20px "JetBrains Mono"')
        ]).then(go, go);
      } else { go(); }
    },
    blank: function (canvas) {
      var self = this;
      return self.draw(canvas, { title: "Your project title", school: "Your school", country: "Your country", id: "preview" }, "Your name");
    },
    download: function (canvas, name) {
      if (!window.jspdf || !window.jspdf.jsPDF) throw new Error("PDF tool did not load");
      var pdf = new window.jspdf.jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      var pw = pdf.internal.pageSize.getWidth(), ph = pdf.internal.pageSize.getHeight();
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, pw, ph);
      var safe = String(name || "Innovator").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "Innovator";
      pdf.save("NextGen-Climate-Certificate-" + safe + ".pdf");
    }
  };
})();
