// World map of approved submissions. Uses d3 + the world outline bundled in the
// Datamaps script (both from cdnjs), so no map tiles, accounts, or API keys are needed.
(function () {
  "use strict";

  function norm(s) {
    return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
  }

  function loadWorld() {
    try {
      var topo = window.Datamap && window.Datamap.prototype && window.Datamap.prototype.worldTopo;
      if (!topo || !window.topojson) return null;
      var key = topo.objects.world ? "world" : Object.keys(topo.objects)[0];
      return window.topojson.feature(topo, topo.objects[key]).features;
    } catch (e) {
      console.warn("World outline unavailable:", e);
      return null;
    }
  }

  // Centroid of a country's largest polygon, so overseas territories don't pull the pin into the sea.
  function mainCentroid(feature) {
    var g = feature.geometry;
    if (!g) return null;
    if (g.type === "MultiPolygon") {
      var best = null, bestArea = -1;
      g.coordinates.forEach(function (poly) {
        var f = { type: "Feature", geometry: { type: "Polygon", coordinates: poly } };
        var a = d3.geoArea(f);
        if (a > bestArea) { bestArea = a; best = f; }
      });
      return d3.geoCentroid(best);
    }
    return d3.geoCentroid(feature);
  }

  function resolvePoint(country, byName) {
    var key = norm(country);
    var alias = window.NGC_COUNTRY_ALIASES[key];
    var f = byName[norm(alias || country)];
    if (f) return { point: mainCentroid(f), feature: f };
    var pts = window.NGC_COUNTRY_POINTS;
    for (var name in pts) { if (norm(name) === key) return { point: pts[name], feature: null }; }
    return null;
  }

  window.NGCMap = {
    render: function (submissions, onSelect) {
      var svgEl = document.getElementById("world-map");
      var tip = document.getElementById("map-tip");
      var listEl = document.getElementById("country-list");

      // Count innovators per country.
      var counts = {};
      submissions.forEach(function (s) { if (s.country) counts[s.country] = (counts[s.country] || 0) + 1; });
      var countries = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a] || a.localeCompare(b); });

      listEl.textContent = "";
      countries.forEach(function (c) {
        var li = document.createElement("li");
        var b = document.createElement("button");
        b.type = "button";
        b.textContent = c;
        var n = document.createElement("b"); n.textContent = counts[c];
        b.appendChild(n);
        b.addEventListener("click", function () { onSelect(c); });
        li.appendChild(b); listEl.appendChild(li);
      });

      if (!window.d3) {
        svgEl.setAttribute("viewBox", "0 0 960 120");
        svgEl.innerHTML = '<text x="480" y="60" text-anchor="middle" fill="currentColor">The map could not load. Countries are listed below.</text>';
        return;
      }

      var W = 960, H = 500;
      var svg = d3.select(svgEl).attr("viewBox", "0 0 " + W + " " + H);
      svg.selectAll("*").remove();
      var projection = d3.geoEqualEarth().fitExtent([[12, 12], [W - 12, H - 12]], { type: "Sphere" });
      var path = d3.geoPath(projection);

      svg.append("path").attr("class", "sphere").attr("d", path({ type: "Sphere" }));
      svg.append("path").attr("class", "graticule").attr("d", path(d3.geoGraticule10()));

      var features = loadWorld() || [];
      var byName = {};
      features.forEach(function (f) { byName[norm(f.properties && f.properties.name)] = f; });

      var placed = [];
      countries.forEach(function (c) {
        var r = resolvePoint(c, byName);
        if (r && r.point) placed.push({ country: c, count: counts[c], point: r.point, feature: r.feature });
      });
      var active = new Set(placed.filter(function (p) { return p.feature; }).map(function (p) { return p.feature; }));

      svg.append("g").selectAll("path").data(features).join("path")
        .attr("class", function (d) { return active.has(d) ? "land has" : "land"; })
        .attr("d", path);

      var max = d3.max(placed, function (p) { return p.count; }) || 1;
      var radius = d3.scaleSqrt().domain([1, Math.max(max, 2)]).range([7, 26]);

      var g = svg.append("g").selectAll("g").data(placed.sort(function (a, b) { return b.count - a.count; })).join("g")
        .attr("transform", function (d) { var xy = projection(d.point); return "translate(" + xy[0] + "," + xy[1] + ")"; });

      g.append("circle")
        .attr("class", "bubble")
        .attr("r", function (d) { return radius(d.count); })
        .attr("tabindex", 0)
        .attr("role", "button")
        .attr("aria-label", function (d) { return d.country + ": " + d.count + (d.count === 1 ? " innovator" : " innovators"); })
        .on("mousemove focus", function (event, d) {
          var box = svgEl.getBoundingClientRect();
          var xy = projection(d.point);
          tip.textContent = d.country + " · " + d.count + (d.count === 1 ? " innovator" : " innovators");
          tip.style.left = (xy[0] / W) * box.width + "px";
          tip.style.top = (xy[1] / H) * box.height - radius(d.count) * (box.width / W) + "px";
          tip.hidden = false;
        })
        .on("mouseleave blur", function () { tip.hidden = true; })
        .on("click", function (event, d) { onSelect(d.country); })
        .on("keydown", function (event, d) { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(d.country); } });

      g.filter(function (d) { return radius(d.count) >= 11; })
        .append("text").attr("class", "bubble-label").text(function (d) { return d.count; });
    }
  };
})();
