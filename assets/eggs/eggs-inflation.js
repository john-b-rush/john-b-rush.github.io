// Viz: Personal Egg-flation — your egg prices indexed over time
(function () {
  var container = document.getElementById("egg-inflation");
  if (!container || !window.EGG_DATA) return;

  container.classList.add("egg-viz");

  var data = window.EGG_DATA;

  // --- Compute yearly average price per dozen ---
  var yearMap = {};
  for (var i = 0; i < data.length; i++) {
    var yr = parseInt(data[i].date.slice(0, 4));
    if (!yearMap[yr]) yearMap[yr] = { spend: 0, eggs: 0 };
    yearMap[yr].spend += data[i].price;
    yearMap[yr].eggs += data[i].qty;
  }

  var years = Object.keys(yearMap).map(Number).sort(function (a, b) { return a - b; });
  var perDozen = [];
  for (var i = 0; i < years.length; i++) {
    var y = yearMap[years[i]];
    perDozen.push((y.spend / y.eggs) * 12);
  }

  // Cumulative % change from first year
  var basePrice = perDozen[0];
  var cumPct = [];
  for (var i = 0; i < perDozen.length; i++) {
    cumPct.push(((perDozen[i] - basePrice) / basePrice) * 100);
  }

  // Year-over-year % change
  var yoyChange = [0];
  for (var i = 1; i < perDozen.length; i++) {
    yoyChange.push(((perDozen[i] - perDozen[i - 1]) / perDozen[i - 1]) * 100);
  }

  // --- Build UI ---
  var title = document.createElement("div");
  title.className = "egg-viz-title";
  title.textContent = "Personal Egg-flation";

  var toggles = document.createElement("div");
  toggles.className = "egg-toggles";

  var modes = [
    { id: "cumulative", label: "% Change" },
    { id: "yoy", label: "Year-over-Year %" },
  ];
  var currentMode = "cumulative";

  modes.forEach(function (m) {
    var btn = document.createElement("button");
    btn.className = "egg-toggle" + (m.id === currentMode ? " active" : "");
    btn.textContent = m.label;
    btn.setAttribute("data-mode", m.id);
    btn.addEventListener("click", function () {
      currentMode = m.id;
      toggles.querySelectorAll(".egg-toggle").forEach(function (b) {
        b.classList.toggle("active", b.getAttribute("data-mode") === currentMode);
      });
      draw();
    });
    toggles.appendChild(btn);
  });

  var canvasWrap = document.createElement("div");
  canvasWrap.className = "egg-canvas-wrap";

  var canvas = document.createElement("canvas");
  canvasWrap.appendChild(canvas);

  var tooltip = document.createElement("div");
  tooltip.className = "egg-tooltip";
  canvasWrap.appendChild(tooltip);

  var padLeft = 55;
  var padRight = 20;
  var padTop = 15;
  var padBottom = 40;

  var toggleWrap = document.createElement("div");
  toggleWrap.style.paddingLeft = padLeft + "px";
  toggleWrap.appendChild(toggles);

  container.appendChild(title);
  container.appendChild(toggleWrap);
  container.appendChild(canvasWrap);

  var ctx = canvas.getContext("2d");
  var dpr = window.devicePixelRatio || 1;
  var W, H, plotW, plotH;

  function resize() {
    var rect = canvasWrap.getBoundingClientRect();
    W = rect.width;
    H = Math.min(Math.max(W * 0.45, 220), 400);
    canvas.style.height = H + "px";
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    plotW = W - padLeft - padRight;
    plotH = H - padTop - padBottom;
  }

  function draw() {
    resize();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    var values = currentMode === "cumulative" ? cumPct : yoyChange;
    var isBar = currentMode === "yoy";

    var minVal = Infinity, maxVal = -Infinity;
    for (var i = 0; i < values.length; i++) {
      if (values[i] < minVal) minVal = values[i];
      if (values[i] > maxVal) maxVal = values[i];
    }

    // Padding
    var range = maxVal - minVal || 1;
    if (isBar) {
      // Ensure zero line is visible
      minVal = Math.min(minVal - range * 0.1, -5);
      maxVal = maxVal + range * 0.1;
    } else {
      minVal = 0;
      maxVal += range * 0.1;
    }

    var minYr = years[0], maxYr = years[years.length - 1];
    var yrRange = maxYr - minYr || 1;

    function xPos(yr) {
      return padLeft + ((yr - minYr) / yrRange) * plotW;
    }
    function yPos(v) {
      return padTop + plotH - ((v - minVal) / (maxVal - minVal)) * plotH;
    }

    // Grid
    ctx.strokeStyle = "#30363d";
    ctx.lineWidth = 0.5;
    ctx.font = "11px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = "#8b949e";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    var nGridY = 5;
    for (var g = 0; g <= nGridY; g++) {
      var gv = minVal + (g / nGridY) * (maxVal - minVal);
      var gy = yPos(gv);
      ctx.beginPath();
      ctx.moveTo(padLeft, gy);
      ctx.lineTo(padLeft + plotW, gy);
      ctx.stroke();

      var label;
      if (isBar) {
        label = (gv >= 0 ? "+" : "") + Math.round(gv) + "%";
      } else {
        label = (gv >= 0 ? "+" : "") + Math.round(gv) + "%";
      }
      ctx.fillText(label, padLeft - 8, gy);
    }

    // Zero line for YoY
    if (isBar) {
      ctx.strokeStyle = "#8b949e";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padLeft, yPos(0));
      ctx.lineTo(padLeft + plotW, yPos(0));
      ctx.stroke();
      ctx.strokeStyle = "#30363d";
      ctx.lineWidth = 0.5;
    }

    // X-axis year labels
    var yearStep = W < 400 ? 6 : W < 550 ? 5 : 3;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (var yr = minYr; yr <= maxYr; yr += yearStep) {
      var xx = xPos(yr);
      ctx.beginPath();
      ctx.moveTo(xx, padTop);
      ctx.lineTo(xx, padTop + plotH);
      ctx.stroke();
      var yrLabel = W < 400 ? "'" + yr.toString().slice(-2) : yr.toString();
      ctx.fillText(yrLabel, xx, padTop + plotH + 8);
    }

    // Baseline at 0% for cumulative view
    if (!isBar) {
      ctx.strokeStyle = "#8b949e";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padLeft, yPos(0));
      ctx.lineTo(padLeft + plotW, yPos(0));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = "#30363d";
      ctx.lineWidth = 0.5;
    }

    if (isBar) {
      // Bar chart
      var barW = Math.max(4, (plotW / years.length) * 0.6);
      for (var i = 0; i < years.length; i++) {
        var x = xPos(years[i]) - barW / 2;
        var y0 = yPos(0);
        var y1 = yPos(values[i]);
        var color = values[i] >= 0 ? "#f47067" : "#3fb950";
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(x, Math.min(y0, y1), barW, Math.abs(y1 - y0));
        ctx.globalAlpha = 1;
      }
    } else {
      // Area fill
      ctx.beginPath();
      ctx.moveTo(xPos(years[0]), yPos(values[0]));
      for (var i = 1; i < years.length; i++) {
        ctx.lineTo(xPos(years[i]), yPos(values[i]));
      }
      ctx.lineTo(xPos(years[years.length - 1]), padTop + plotH);
      ctx.lineTo(xPos(years[0]), padTop + plotH);
      ctx.closePath();
      var grad = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
      grad.addColorStop(0, "rgba(244, 112, 103, 0.15)");
      grad.addColorStop(1, "rgba(244, 112, 103, 0)");
      ctx.fillStyle = grad;
      ctx.fill();

      // Line
      ctx.beginPath();
      ctx.moveTo(xPos(years[0]), yPos(values[0]));
      for (var i = 1; i < years.length; i++) {
        ctx.lineTo(xPos(years[i]), yPos(values[i]));
      }
      ctx.strokeStyle = "#f47067";
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.stroke();

      // Dots
      for (var i = 0; i < years.length; i++) {
        ctx.beginPath();
        ctx.arc(xPos(years[i]), yPos(values[i]), 3, 0, Math.PI * 2);
        ctx.fillStyle = "#f47067";
        ctx.fill();
      }
    }

    // Store for hover
    canvas._chart = { years: years, values: values, perDozen: perDozen, xPos: xPos, yPos: yPos, isBar: isBar };
  }

  // --- Hover ---
  canvas.addEventListener("mousemove", function (e) {
    var rect = canvas.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var chart = canvas._chart;
    if (!chart) return;

    var bestDist = Infinity, bestIdx = -1;
    for (var i = 0; i < chart.years.length; i++) {
      var dist = Math.abs(mx - chart.xPos(chart.years[i]));
      if (dist < bestDist) { bestDist = dist; bestIdx = i; }
    }

    if (bestDist > 40) {
      tooltip.classList.remove("visible");
      return;
    }

    var yr = chart.years[bestIdx];
    var val = chart.values[bestIdx];
    var avgDoz = chart.perDozen[bestIdx];
    var n = yearMap[yr].eggs;

    var valStr;
    if (chart.isBar) {
      valStr = (val >= 0 ? "+" : "") + val.toFixed(1) + "% vs " + (yr - 1);
    } else {
      valStr = (val >= 0 ? "+" : "") + Math.round(val) + "% vs " + years[0];
    }

    tooltip.innerHTML =
      '<span class="egg-tooltip-label">' + yr + '</span><br>' +
      '<span class="egg-tooltip-value">' + valStr + '</span><br>' +
      '<span class="egg-tooltip-label">$' + avgDoz.toFixed(2) + '/doz &middot; ' + n + ' eggs</span>';

    var px = chart.xPos(yr);
    var py = chart.isBar ? chart.yPos(val) : chart.yPos(val);
    var tx = px + 12;
    if (tx + tooltip.offsetWidth > W - 10) tx = px - tooltip.offsetWidth - 12;
    var ty = py - 30;
    if (ty < 5) ty = py + 15;

    tooltip.style.left = tx + "px";
    tooltip.style.top = ty + "px";
    tooltip.classList.add("visible");

    // Crosshair
    draw();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.strokeStyle = "rgba(244, 112, 103, 0.3)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(px, padTop);
    ctx.lineTo(px, padTop + plotH);
    ctx.stroke();
    ctx.setLineDash([]);

    if (!chart.isBar) {
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#f47067";
      ctx.fill();
      ctx.strokeStyle = "#151b23";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });

  canvas.addEventListener("mouseleave", function () {
    tooltip.classList.remove("visible");
    draw();
  });

  // --- Responsive ---
  var resizeTimer;
  var ro = new ResizeObserver(function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(draw, 60);
  });
  ro.observe(canvasWrap);

  draw();
})();
