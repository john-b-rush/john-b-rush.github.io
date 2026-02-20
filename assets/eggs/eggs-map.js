// Viz 2: Interactive PNW Map — SVG with time scrubber, animated markers, dynamic camera
(function () {
  var container = document.getElementById("egg-map");
  if (!container || !window.EGG_DATA) return;

  container.classList.add("egg-viz");

  var data = window.EGG_DATA;

  // --- Projection: lat/lng → SVG coordinates ---
  var latMin = 41.5,
    latMax = 49.5;
  var lngMin = -125,
    lngMax = -111;
  var mapW = 700,
    mapH = 400;

  function projX(lng) {
    return ((lng - lngMin) / (lngMax - lngMin)) * mapW;
  }
  function projY(lat) {
    return ((latMax - lat) / (latMax - latMin)) * mapH;
  }

  // --- City centers ---
  var cities = {
    moscow: {
      lat: 46.7324, lng: -117.0002, label: "Moscow",
      color: "#f0883e", colorDim: "#7a4520",
    },
    portland: {
      lat: 45.5152, lng: -122.6784, label: "Portland",
      color: "#58a6ff", colorDim: "#1f4a7a",
    },
    seattle: {
      lat: 47.6062, lng: -122.3321, label: "Seattle",
      color: "#bc8cff", colorDim: "#4a2d6e",
    },
  };

  // --- Hardcoded camera viewBoxes (all keep Moscow in frame) ---
  var moscowPx = { x: projX(-117.0), y: projY(46.73) };
  var portlandPx = { x: projX(-122.68), y: projY(45.52) };
  var seattlePx = { x: projX(-122.33), y: projY(47.61) };

  var cameras = {
    moscow: (function () {
      var cx = moscowPx.x, cy = moscowPx.y;
      var vw = 200, vh = vw * (mapH / mapW);
      return { x: cx - vw / 2, y: cy - vh / 2, w: vw, h: vh };
    })(),
    moscowPortland: (function () {
      var minX = Math.min(moscowPx.x, portlandPx.x) - 40;
      var maxX = Math.max(moscowPx.x, portlandPx.x) + 40;
      var minY = Math.min(moscowPx.y, portlandPx.y) - 30;
      var maxY = Math.max(moscowPx.y, portlandPx.y) + 30;
      var vw = maxX - minX;
      var vh = maxY - minY;
      var aspect = mapW / mapH;
      if (vw / vh > aspect) { vh = vw / aspect; }
      else { vw = vh * aspect; }
      var cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
      return { x: cx - vw / 2, y: cy - vh / 2, w: vw, h: vh };
    })(),
    all: (function () {
      var minX = Math.min(moscowPx.x, portlandPx.x, seattlePx.x) - 50;
      var maxX = Math.max(moscowPx.x, portlandPx.x, seattlePx.x) + 50;
      var minY = Math.min(moscowPx.y, portlandPx.y, seattlePx.y) - 35;
      var maxY = Math.max(moscowPx.y, portlandPx.y, seattlePx.y) + 35;
      var vw = maxX - minX;
      var vh = maxY - minY;
      var aspect = mapW / mapH;
      if (vw / vh > aspect) { vh = vw / aspect; }
      else { vw = vh * aspect; }
      var cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
      return { x: cx - vw / 2, y: cy - vh / 2, w: vw, h: vh };
    })(),
  };

  // --- Real state outlines (from PublicaMundi simplified GeoJSON) ---
  var states = {
    washington: [
      [-117.033,49.000],[-117.044,47.762],[-117.039,46.426],[-117.055,46.344],
      [-116.924,46.169],[-116.918,45.993],[-118.989,45.999],[-119.126,45.933],
      [-119.525,45.911],[-119.964,45.824],[-120.210,45.725],[-120.506,45.698],
      [-120.637,45.747],[-121.185,45.605],[-121.218,45.670],[-121.535,45.725],
      [-121.809,45.709],[-122.247,45.550],[-122.762,45.659],[-122.812,45.961],
      [-122.905,46.081],[-123.118,46.185],[-123.211,46.174],[-123.370,46.147],
      [-123.545,46.262],[-123.726,46.300],[-123.874,46.240],[-124.066,46.327],
      [-124.027,46.464],[-123.896,46.536],[-124.099,46.744],[-124.236,47.286],
      [-124.318,47.357],[-124.427,47.741],[-124.624,47.888],[-124.707,48.184],
      [-124.597,48.381],[-124.394,48.288],[-123.984,48.162],[-123.704,48.168],
      [-123.425,48.118],[-123.162,48.168],[-123.036,48.080],[-122.801,48.086],
      [-122.636,47.867],[-122.516,47.883],[-122.494,47.587],[-122.423,47.319],
      [-122.324,47.346],[-122.423,47.576],[-122.395,47.801],[-122.231,48.031],
      [-122.362,48.124],[-122.373,48.288],[-122.472,48.469],[-122.423,48.600],
      [-122.488,48.754],[-122.647,48.776],[-122.795,48.891],[-122.757,49.000],
      [-117.033,49.000],
    ],
    oregon: [
      [-123.211,46.174],[-123.118,46.185],[-122.905,46.081],[-122.812,45.961],
      [-122.762,45.659],[-122.247,45.550],[-121.809,45.709],[-121.535,45.725],
      [-121.218,45.670],[-121.185,45.605],[-120.637,45.747],[-120.506,45.698],
      [-120.210,45.725],[-119.964,45.824],[-119.525,45.911],[-119.126,45.933],
      [-118.989,45.999],[-116.918,45.993],[-116.781,45.824],[-116.546,45.752],
      [-116.464,45.615],[-116.672,45.320],[-116.732,45.144],[-116.847,45.024],
      [-116.831,44.931],[-116.935,44.783],[-117.039,44.750],[-117.241,44.394],
      [-117.170,44.257],[-116.979,44.241],[-116.896,44.159],[-117.028,43.830],
      [-117.028,42.001],[-118.698,41.990],[-120.002,41.995],[-121.037,41.995],
      [-122.379,42.012],[-123.233,42.006],[-124.214,42.001],[-124.356,42.116],
      [-124.433,42.439],[-124.416,42.663],[-124.553,42.839],[-124.455,43.003],
      [-124.383,43.271],[-124.236,43.556],[-124.170,43.808],[-124.060,44.657],
      [-124.077,44.772],[-123.978,45.144],[-123.940,45.659],[-123.995,45.944],
      [-123.945,46.114],[-123.545,46.262],[-123.370,46.147],[-123.211,46.174],
    ],
    idaho: [
      [-116.048,49.000],[-116.048,47.976],[-115.724,47.697],[-115.719,47.423],
      [-115.527,47.302],[-115.325,47.259],[-115.303,47.187],[-114.930,46.919],
      [-114.886,46.809],[-114.624,46.705],[-114.613,46.640],[-114.322,46.645],
      [-114.465,46.273],[-114.492,46.037],[-114.388,45.884],[-114.569,45.774],
      [-114.498,45.670],[-114.547,45.561],[-114.333,45.457],[-114.087,45.594],
      [-113.988,45.703],[-113.807,45.605],[-113.835,45.522],[-113.736,45.331],
      [-113.572,45.128],[-113.451,45.057],[-113.457,44.865],[-113.342,44.783],
      [-113.134,44.772],[-113.002,44.449],[-112.887,44.394],[-112.783,44.487],
      [-112.471,44.482],[-112.241,44.569],[-112.104,44.520],[-111.869,44.564],
      [-111.819,44.509],[-111.617,44.547],[-111.387,44.756],[-111.228,44.580],
      [-111.047,44.476],[-111.047,42.001],[-112.164,41.995],[-114.043,41.995],
      [-117.028,42.001],[-117.028,43.830],[-116.896,44.159],[-116.979,44.241],
      [-117.170,44.257],[-117.241,44.394],[-117.039,44.750],[-116.935,44.783],
      [-116.831,44.931],[-116.847,45.024],[-116.732,45.144],[-116.672,45.320],
      [-116.464,45.615],[-116.546,45.752],[-116.781,45.824],[-116.918,45.993],
      [-117.055,46.344],[-117.039,46.426],[-117.044,47.762],[-117.033,49.000],
      [-116.048,49.000],
    ],
    montana: [
      [-116.048,49.000],[-111.500,48.995],[-111.050,49.000],
      [-111.050,45.002],[-111.047,44.476],
      [-111.228,44.580],[-111.387,44.756],[-111.617,44.547],[-111.819,44.509],
      [-111.869,44.564],[-112.104,44.520],[-112.241,44.569],[-112.471,44.482],
      [-112.783,44.487],[-112.887,44.394],[-113.002,44.449],[-113.134,44.772],
      [-113.342,44.783],[-113.457,44.865],[-113.451,45.057],[-113.572,45.128],
      [-113.736,45.331],[-113.835,45.522],[-113.807,45.605],[-113.988,45.703],
      [-114.087,45.594],[-114.333,45.457],[-114.547,45.561],[-114.498,45.670],
      [-114.569,45.774],[-114.388,45.884],[-114.492,46.037],[-114.465,46.273],
      [-114.322,46.645],[-114.613,46.640],[-114.624,46.705],[-114.886,46.809],
      [-114.930,46.919],[-115.303,47.187],[-115.325,47.259],[-115.527,47.302],
      [-115.719,47.423],[-115.724,47.697],[-116.048,47.976],[-116.048,49.000],
    ],
  };

  function statePath(pts) {
    var d = "M";
    for (var i = 0; i < pts.length; i++) {
      d += (i > 0 ? "L" : "") + projX(pts[i][0]).toFixed(1) + "," + projY(pts[i][1]).toFixed(1);
    }
    return d + "Z";
  }

  // --- Waterways ---
  var columbiaRiver = [
    [-123.2, 46.18], [-122.75, 45.65], [-121.9, 45.68], [-121.2, 45.7],
    [-120.8, 45.73], [-119.8, 45.93], [-119.2, 45.95], [-118.5, 46.0],
  ];
  var pugetSound = [
    [-122.5, 47.1], [-122.42, 47.32], [-122.35, 47.5], [-122.40, 47.7],
    [-122.50, 47.9], [-122.60, 48.1],
  ];

  function linePath(pts) {
    var d = "M";
    for (var i = 0; i < pts.length; i++) {
      d += (i > 0 ? "L" : "") + projX(pts[i][0]).toFixed(1) + "," + projY(pts[i][1]).toFixed(1);
    }
    return d;
  }

  // --- Color interpolation for time gradient ---
  function hexToRgb(hex) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  }
  function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  function lerpColor(hexA, hexB, t) {
    var a = hexToRgb(hexA), b = hexToRgb(hexB);
    return rgbToHex(
      Math.round(a[0] + (b[0] - a[0]) * t),
      Math.round(a[1] + (b[1] - a[1]) * t),
      Math.round(a[2] + (b[2] - a[2]) * t)
    );
  }

  // --- Build SVG ---
  var ns = "http://www.w3.org/2000/svg";

  var svgEl = document.createElementNS(ns, "svg");
  svgEl.setAttribute("class", "egg-map-svg");
  svgEl.setAttribute("viewBox", "0 0 " + mapW + " " + mapH);
  svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");

  // Background (oversized)
  var bg = document.createElementNS(ns, "rect");
  bg.setAttribute("x", -200);
  bg.setAttribute("y", -200);
  bg.setAttribute("width", mapW + 400);
  bg.setAttribute("height", mapH + 400);
  bg.setAttribute("fill", "#0a0e14");
  svgEl.appendChild(bg);

  // Context state
  if (states.montana) {
    var p = document.createElementNS(ns, "path");
    p.setAttribute("d", statePath(states.montana));
    p.setAttribute("fill", "#0f1318");
    p.setAttribute("stroke", "#1c2128");
    p.setAttribute("stroke-width", "0.8");
    svgEl.appendChild(p);
  }

  // Main states
  var mainStateKeys = ["idaho", "oregon", "washington"];
  for (var s = 0; s < mainStateKeys.length; s++) {
    var p = document.createElementNS(ns, "path");
    p.setAttribute("d", statePath(states[mainStateKeys[s]]));
    p.setAttribute("fill", "#151b23");
    p.setAttribute("stroke", "#30363d");
    p.setAttribute("stroke-width", "1");
    svgEl.appendChild(p);
  }

  // Waterways
  var river = document.createElementNS(ns, "path");
  river.setAttribute("d", linePath(columbiaRiver));
  river.setAttribute("fill", "none");
  river.setAttribute("stroke", "#1a2332");
  river.setAttribute("stroke-width", "2");
  river.setAttribute("stroke-linecap", "round");
  river.setAttribute("stroke-linejoin", "round");
  river.setAttribute("opacity", "0.6");
  svgEl.appendChild(river);

  var sound = document.createElementNS(ns, "path");
  sound.setAttribute("d", linePath(pugetSound));
  sound.setAttribute("fill", "none");
  sound.setAttribute("stroke", "#1a2332");
  sound.setAttribute("stroke-width", "2.5");
  sound.setAttribute("stroke-linecap", "round");
  sound.setAttribute("stroke-linejoin", "round");
  sound.setAttribute("opacity", "0.5");
  svgEl.appendChild(sound);

  // City labels — hidden until first purchase
  var cityLabelEls = {};
  var cityKeys = ["moscow", "portland", "seattle"];
  for (var c = 0; c < cityKeys.length; c++) {
    var city = cities[cityKeys[c]];
    var cx = projX(city.lng);
    var cy = projY(city.lat);

    var lbl = document.createElementNS(ns, "text");
    lbl.setAttribute("x", cx + 5);
    lbl.setAttribute("y", cy - 6);
    lbl.setAttribute("font-size", "10");
    lbl.setAttribute("fill", "#8b949e");
    lbl.setAttribute("font-family", "-apple-system, BlinkMacSystemFont, sans-serif");
    lbl.setAttribute("opacity", "0");
    lbl.textContent = city.label;
    svgEl.appendChild(lbl);
    cityLabelEls[cityKeys[c]] = lbl;
  }

  // Year overlay — top-right corner, out of the way
  var yearOverlay = document.createElementNS(ns, "text");
  yearOverlay.setAttribute("text-anchor", "end");
  yearOverlay.setAttribute("font-size", "28");
  yearOverlay.setAttribute("font-weight", "700");
  yearOverlay.setAttribute("fill", "#e6edf3");
  yearOverlay.setAttribute("opacity", "0.12");
  yearOverlay.setAttribute("font-family", "SF Mono, Fira Code, Cascadia Code, monospace");
  yearOverlay.textContent = data[0].date.slice(0, 4);
  svgEl.appendChild(yearOverlay);

  // Store name flash — appears near the latest purchase then fades
  var storeFlash = document.createElementNS(ns, "text");
  storeFlash.setAttribute("font-size", "8");
  storeFlash.setAttribute("fill", "#e6edf3");
  storeFlash.setAttribute("opacity", "0");
  storeFlash.setAttribute("font-family", "-apple-system, BlinkMacSystemFont, sans-serif");
  storeFlash.setAttribute("pointer-events", "none");
  svgEl.appendChild(storeFlash);

  var storeFlashTimer = null;

  function flashStore(storeName, cx, cy, color) {
    storeFlash.textContent = storeName;
    storeFlash.setAttribute("x", (cx + 6).toFixed(1));
    storeFlash.setAttribute("y", (cy + 12).toFixed(1));
    storeFlash.setAttribute("fill", color);
    storeFlash.setAttribute("opacity", "0.9");

    clearTimeout(storeFlashTimer);
    storeFlashTimer = setTimeout(function () {
      storeFlash.setAttribute("opacity", "0");
    }, 600);
  }

  // Markers group
  var markersGroup = document.createElementNS(ns, "g");
  svgEl.appendChild(markersGroup);

  var mapTooltip = document.createElement("div");
  mapTooltip.className = "egg-tooltip";

  container.appendChild(svgEl);
  container.appendChild(mapTooltip);

  // --- Controls ---
  var controls = document.createElement("div");
  controls.className = "egg-map-controls";

  var playBtn = document.createElement("button");
  playBtn.className = "egg-map-btn";
  playBtn.innerHTML = "&#9654;";
  playBtn.title = "Play / Pause";

  var slider = document.createElement("input");
  slider.type = "range";
  slider.className = "egg-map-slider";
  slider.min = "0";
  slider.max = String(data.length - 1);
  slider.value = "0";

  var dateLabel = document.createElement("span");
  dateLabel.className = "egg-map-date";
  dateLabel.textContent = data[0].date;

  var speedBtn = document.createElement("button");
  speedBtn.className = "egg-map-speed";
  speedBtn.textContent = "2x";

  controls.appendChild(playBtn);
  controls.appendChild(slider);
  controls.appendChild(dateLabel);
  controls.appendChild(speedBtn);
  container.appendChild(controls);

  // --- Playback state ---
  var currentIdx = 0;
  var playing = false;
  var speed = 2;
  var speeds = [0.5, 1, 2, 5, 10];
  var speedIndex = 2; // start at 2x
  var lastFrameTime = 0;
  var frameInterval = 120;
  var markers = [];
  var revealedCities = {};

  // --- Camera ---
  var cameraStage = "moscow";

  function getCameraKey(upToIdx) {
    var hasPortland = false, hasSeattle = false;
    for (var i = 0; i <= upToIdx; i++) {
      var lat = data[i].lat;
      if (lat > 47) hasSeattle = true;
      else if (lat < 46) hasPortland = true;
    }
    if (hasSeattle) return "all";
    if (hasPortland) return "moscowPortland";
    return "moscow";
  }

  var currentVB = { x: cameras.moscow.x, y: cameras.moscow.y, w: cameras.moscow.w, h: cameras.moscow.h };
  var targetVB = { x: currentVB.x, y: currentVB.y, w: currentVB.w, h: currentVB.h };
  var cameraAnimating = false;
  var cameraStartTime = null;
  var cameraFrom = null;
  var cameraDuration = 1500;

  function setViewBox(vb) {
    svgEl.setAttribute(
      "viewBox",
      vb.x.toFixed(1) + " " + vb.y.toFixed(1) + " " + vb.w.toFixed(1) + " " + vb.h.toFixed(1)
    );
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function lerpVB(a, b, t) {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      w: a.w + (b.w - a.w) * t,
      h: a.h + (b.h - a.h) * t,
    };
  }

  function animateCamera(now) {
    if (!cameraAnimating) return;
    if (!cameraStartTime) cameraStartTime = now;
    var elapsed = now - cameraStartTime;
    var t = Math.min(elapsed / cameraDuration, 1);
    currentVB = lerpVB(cameraFrom, targetVB, easeInOutCubic(t));
    setViewBox(currentVB);
    updateYearPosition();
    if (t < 1) {
      requestAnimationFrame(animateCamera);
    } else {
      cameraAnimating = false;
    }
  }

  function updateCamera(upToIdx) {
    var newStage = getCameraKey(upToIdx);
    if (newStage === cameraStage) return;
    cameraStage = newStage;
    cameraFrom = { x: currentVB.x, y: currentVB.y, w: currentVB.w, h: currentVB.h };
    targetVB = cameras[newStage];
    cameraStartTime = null;
    cameraAnimating = true;
    requestAnimationFrame(animateCamera);
  }

  function jumpCamera(stage) {
    cameraStage = stage;
    cameraAnimating = false;
    currentVB = { x: cameras[stage].x, y: cameras[stage].y, w: cameras[stage].w, h: cameras[stage].h };
    targetVB = { x: currentVB.x, y: currentVB.y, w: currentVB.w, h: currentVB.h };
    setViewBox(currentVB);
    updateYearPosition();
  }

  function updateYearPosition() {
    // Pin year to top-right of current viewBox
    yearOverlay.setAttribute("x", (currentVB.x + currentVB.w - currentVB.w * 0.03).toFixed(1));
    yearOverlay.setAttribute("y", (currentVB.y + currentVB.w * 0.08).toFixed(1));
    yearOverlay.setAttribute("font-size", Math.round(currentVB.w * 0.07));
  }

  setViewBox(currentVB);
  updateYearPosition();

  // --- Marker management ---
  function cityForPoint(d) {
    if (d.lat > 47) return "seattle";
    if (d.lat < 46) return "portland";
    return "moscow";
  }

  function addMarker(idx) {
    var d = data[idx];
    var cx = projX(d.lng);
    var cy = projY(d.lat);
    var city = cityForPoint(d);
    var color = cities[city].color;

    // Reveal city label on first purchase
    if (!revealedCities[city]) {
      revealedCities[city] = true;
      cityLabelEls[city].setAttribute("opacity", "1");
    }

    var circle = document.createElementNS(ns, "circle");
    circle.setAttribute("cx", cx.toFixed(1));
    circle.setAttribute("cy", cy.toFixed(1));
    circle.setAttribute("r", "3.5");
    circle.setAttribute("fill", color);
    circle.setAttribute("opacity", "0");
    circle.setAttribute("data-idx", idx);
    circle.setAttribute("data-city", city);
    markersGroup.appendChild(circle);
    markers.push({ el: circle, idx: idx, city: city, cx: cx, cy: cy });

    // Fade in
    requestAnimationFrame(function () {
      circle.setAttribute("opacity", "1");
    });

    // Flash store name
    flashStore(d.store, cx, cy, color);
  }

  function updateMarkerAppearance(currentIdx) {
    // Stronger fade: recent markers bright, old ones dim but never invisible
    var fadeWindow = 50;
    for (var i = 0; i < markers.length; i++) {
      var m = markers[i];
      var age = currentIdx - m.idx;
      var t = Math.min(age / fadeWindow, 1); // 0 = newest, 1 = oldest

      // Color: lerp from bright to dim
      var city = cities[m.city];
      var color = lerpColor(city.color, city.colorDim, t);
      m.el.setAttribute("fill", color);

      // Opacity: 1.0 for newest, 0.15 for oldest — never zero
      var opacity;
      if (age === 0) {
        opacity = 1.0;
      } else if (age <= 3) {
        opacity = 0.85;
      } else {
        opacity = Math.max(0.15, 0.85 - t * 0.7);
      }
      m.el.setAttribute("opacity", opacity.toFixed(2));

      // Newest marker gets larger radius
      m.el.setAttribute("r", age === 0 ? "4.5" : "3");
    }

    // Update year
    if (currentIdx >= 0 && currentIdx < data.length) {
      yearOverlay.textContent = data[currentIdx].date.slice(0, 4);
      updateYearPosition();
    }
  }

  function showUpTo(idx) {
    // Remove markers beyond current idx
    while (markers.length > 0 && markers[markers.length - 1].idx > idx) {
      var m = markers.pop();
      m.el.remove();
    }

    // Re-check revealed cities when scrubbing backward
    if (markers.length === 0) {
      revealedCities = {};
      cityKeys.forEach(function (k) { cityLabelEls[k].setAttribute("opacity", "0"); });
    }

    // Add markers up to idx
    var lastShown = markers.length > 0 ? markers[markers.length - 1].idx : -1;
    for (var i = lastShown + 1; i <= idx; i++) {
      addMarker(i);
    }

    updateMarkerAppearance(idx);
    updateCamera(idx);
  }

  // --- Tooltip ---
  svgEl.addEventListener("mousemove", function (e) {
    var target = e.target;
    if (target.tagName !== "circle" || !target.hasAttribute("data-idx")) {
      mapTooltip.classList.remove("visible");
      return;
    }

    var idx = parseInt(target.getAttribute("data-idx"));
    var d = data[idx];
    mapTooltip.innerHTML =
      '<span class="egg-tooltip-label">' + d.date + " &middot; " + d.store + "</span><br>" +
      '<span class="egg-tooltip-value">' + d.qty + " eggs &middot; $" + d.price.toFixed(2) + "</span>";

    var rect = container.getBoundingClientRect();
    var tx = e.clientX - rect.left + 14;
    var ty = e.clientY - rect.top - 30;
    if (tx + mapTooltip.offsetWidth > rect.width - 10) tx = e.clientX - rect.left - mapTooltip.offsetWidth - 14;
    if (ty < 5) ty = e.clientY - rect.top + 15;

    mapTooltip.style.left = tx + "px";
    mapTooltip.style.top = ty + "px";
    mapTooltip.classList.add("visible");
  });

  svgEl.addEventListener("mouseleave", function () {
    mapTooltip.classList.remove("visible");
  });

  // --- Playback loop ---
  function playLoop(now) {
    if (!playing) return;

    if (!lastFrameTime) lastFrameTime = now;
    var delta = now - lastFrameTime;
    var interval = frameInterval / speed;

    if (delta >= interval) {
      lastFrameTime = now;
      if (currentIdx < data.length - 1) {
        currentIdx++;
        slider.value = currentIdx;
        dateLabel.textContent = data[currentIdx].date;
        showUpTo(currentIdx);
      } else {
        playing = false;
        playBtn.innerHTML = "&#9654;";
        playBtn.classList.remove("active");
        return;
      }
    }
    requestAnimationFrame(playLoop);
  }

  // --- Controls ---
  playBtn.addEventListener("click", function () {
    playing = !playing;
    if (playing) {
      playBtn.innerHTML = "&#9646;&#9646;";
      playBtn.classList.add("active");
      if (currentIdx >= data.length - 1) {
        currentIdx = 0;
        markers.forEach(function (m) { m.el.remove(); });
        markers = [];
        revealedCities = {};
        cityKeys.forEach(function (k) { cityLabelEls[k].setAttribute("opacity", "0"); });
        slider.value = "0";
        jumpCamera("moscow");
      }
      lastFrameTime = 0;
      requestAnimationFrame(playLoop);
    } else {
      playBtn.innerHTML = "&#9654;";
      playBtn.classList.remove("active");
    }
  });

  slider.addEventListener("input", function () {
    currentIdx = parseInt(slider.value);
    dateLabel.textContent = data[currentIdx].date;
    var newStage = getCameraKey(currentIdx);
    if (newStage !== cameraStage) {
      jumpCamera(newStage);
    }
    showUpTo(currentIdx);
  });

  speedBtn.addEventListener("click", function () {
    speedIndex = (speedIndex + 1) % speeds.length;
    speed = speeds[speedIndex];
    speedBtn.textContent = speed + "x";
  });

  // Initialize
  showUpTo(0);
})();
