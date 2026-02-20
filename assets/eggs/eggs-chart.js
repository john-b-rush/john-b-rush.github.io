// Viz 1: Price Line Chart — Canvas-based with toggle modes and hover tooltips
(function () {
  var container = document.getElementById("egg-price-chart");
  if (!container || !window.EGG_DATA) return;

  container.classList.add("egg-viz");

  var data = window.EGG_DATA;
  var cpi = window.EGG_CPI || {};

  // --- Build UI ---
  var title = document.createElement("div");
  title.className = "egg-viz-title";
  title.textContent = "Egg Prices Over Time";

  var toggles = document.createElement("div");
  toggles.className = "egg-toggles";

  var modes = [
    { id: "per-egg", label: "Price / Egg" },
    { id: "adjusted", label: "Inflation-Adjusted" },
    { id: "total", label: "Total Spent" },
  ];

  var currentMode = "per-egg";

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

  // Wrap toggles so they align with the plot area (offset by left padding)
  var toggleWrap = document.createElement("div");
  toggleWrap.style.paddingLeft = padLeft + "px";
  toggleWrap.appendChild(toggles);

  container.appendChild(title);
  container.appendChild(toggleWrap);
  container.appendChild(canvasWrap);

  var ctx = canvas.getContext("2d");

  // --- Precompute data series ---
  var dates = [];
  var timestamps = [];
  for (var i = 0; i < data.length; i++) {
    var d = data[i];
    var parts = d.date.split("-");
    var ts = new Date(+parts[0], +parts[1] - 1, +parts[2]).getTime();
    dates.push(d.date);
    timestamps.push(ts);
  }

  function getSeries() {
    var values = [];
    if (currentMode === "per-egg") {
      for (var i = 0; i < data.length; i++) {
        values.push(data[i].price / data[i].qty);
      }
    } else if (currentMode === "adjusted") {
      for (var i = 0; i < data.length; i++) {
        var year = parseInt(data[i].date.slice(0, 4));
        var mult = cpi[year] || 1;
        values.push(data[i].price / data[i].qty / mult);
      }
    } else {
      // cumulative total
      var sum = 0;
      for (var i = 0; i < data.length; i++) {
        sum += data[i].price;
        values.push(sum);
      }
    }
    return values;
  }

  // --- Chart dimensions ---
  var padLeft = 55;
  var padRight = 20;
  var padTop = 15;
  var padBottom = 40;
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

  // --- Drawing ---
  function draw() {
    resize();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    var values = getSeries();
    var minVal = Infinity,
      maxVal = -Infinity;
    for (var i = 0; i < values.length; i++) {
      if (values[i] < minVal) minVal = values[i];
      if (values[i] > maxVal) maxVal = values[i];
    }

    // Add 10% padding to range
    var range = maxVal - minVal || 1;
    minVal -= range * 0.05;
    maxVal += range * 0.1;
    if (minVal < 0 && currentMode !== "total") minVal = 0;

    var minTs = timestamps[0];
    var maxTs = timestamps[timestamps.length - 1];
    var tsRange = maxTs - minTs || 1;

    function xPos(ts) {
      return padLeft + ((ts - minTs) / tsRange) * plotW;
    }
    function yPos(v) {
      return padTop + plotH - ((v - minVal) / (maxVal - minVal)) * plotH;
    }

    // Grid lines
    ctx.strokeStyle = "#30363d";
    ctx.lineWidth = 0.5;
    var nGridY = 5;
    ctx.font = "11px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = "#8b949e";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    for (var g = 0; g <= nGridY; g++) {
      var gv = minVal + (g / nGridY) * (maxVal - minVal);
      var gy = yPos(gv);
      ctx.beginPath();
      ctx.moveTo(padLeft, gy);
      ctx.lineTo(padLeft + plotW, gy);
      ctx.stroke();

      var label;
      if (currentMode === "total") {
        label = "$" + Math.round(gv).toLocaleString();
      } else {
        label = "$" + gv.toFixed(2);
      }
      ctx.fillText(label, padLeft - 8, gy);
    }

    // Year labels on x-axis — adaptive step for small screens
    var yearStep = W < 400 ? 6 : W < 550 ? 5 : 3;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (var yr = 2001; yr <= 2026; yr += yearStep) {
      var yts = new Date(yr, 0, 1).getTime();
      if (yts >= minTs && yts <= maxTs) {
        var xx = xPos(yts);
        ctx.beginPath();
        ctx.moveTo(xx, padTop);
        ctx.lineTo(xx, padTop + plotH);
        ctx.stroke();
        // Use short labels on small screens
        var yrLabel = W < 400 ? "'" + yr.toString().slice(-2) : yr.toString();
        ctx.fillText(yrLabel, xx, padTop + plotH + 8);
      }
    }

    // Area fill under line
    ctx.beginPath();
    ctx.moveTo(xPos(timestamps[0]), yPos(values[0]));
    for (var i = 1; i < values.length; i++) {
      ctx.lineTo(xPos(timestamps[i]), yPos(values[i]));
    }
    ctx.lineTo(xPos(timestamps[values.length - 1]), padTop + plotH);
    ctx.lineTo(xPos(timestamps[0]), padTop + plotH);
    ctx.closePath();

    var grad = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
    grad.addColorStop(0, "rgba(88, 166, 255, 0.15)");
    grad.addColorStop(1, "rgba(88, 166, 255, 0)");
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(xPos(timestamps[0]), yPos(values[0]));
    for (var i = 1; i < values.length; i++) {
      ctx.lineTo(xPos(timestamps[i]), yPos(values[i]));
    }
    ctx.strokeStyle = "#58a6ff";
    ctx.lineWidth = 1.8;
    ctx.lineJoin = "round";
    ctx.stroke();

    // Store data for hover
    canvas._eggChart = {
      timestamps: timestamps,
      values: values,
      xPos: xPos,
      yPos: yPos,
      minTs: minTs,
      maxTs: maxTs,
    };
  }

  // --- Hover tooltip ---
  var hoveredIdx = -1;

  canvas.addEventListener("mousemove", function (e) {
    var rect = canvas.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;
    var chart = canvas._eggChart;
    if (!chart) return;

    // Find nearest point
    var bestDist = Infinity;
    var bestIdx = -1;
    for (var i = 0; i < chart.timestamps.length; i++) {
      var px = chart.xPos(chart.timestamps[i]);
      var dist = Math.abs(mx - px);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }

    if (bestDist > 30) {
      tooltip.classList.remove("visible");
      hoveredIdx = -1;
      return;
    }

    hoveredIdx = bestIdx;
    var d = data[bestIdx];
    var val = chart.values[bestIdx];
    var valStr;
    if (currentMode === "total") {
      valStr = "$" + val.toFixed(2);
    } else {
      valStr = "$" + val.toFixed(3) + "/egg";
    }

    tooltip.innerHTML =
      '<span class="egg-tooltip-label">' +
      d.date +
      " &middot; " +
      d.store +
      "</span><br>" +
      '<span class="egg-tooltip-value">' +
      valStr +
      "</span>" +
      '<span class="egg-tooltip-label"> (' +
      d.qty +
      " eggs @ $" +
      d.price.toFixed(2) +
      ")</span>";

    var px = chart.xPos(chart.timestamps[bestIdx]);
    var py = chart.yPos(val);
    var tw = tooltip.offsetWidth;

    var tx = px + 12;
    if (tx + tw > W - 10) tx = px - tw - 12;
    var ty = py - 10;
    if (ty < 5) ty = py + 15;

    tooltip.style.left = tx + "px";
    tooltip.style.top = ty + "px";
    tooltip.classList.add("visible");

    // Draw crosshair
    draw();
    var ctx2 = ctx;
    ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx2.strokeStyle = "rgba(88, 166, 255, 0.3)";
    ctx2.lineWidth = 1;
    ctx2.setLineDash([4, 4]);
    ctx2.beginPath();
    ctx2.moveTo(px, padTop);
    ctx2.lineTo(px, padTop + plotH);
    ctx2.stroke();
    ctx2.setLineDash([]);

    // Point dot
    ctx2.beginPath();
    ctx2.arc(px, py, 4, 0, Math.PI * 2);
    ctx2.fillStyle = "#58a6ff";
    ctx2.fill();
    ctx2.strokeStyle = "#151b23";
    ctx2.lineWidth = 2;
    ctx2.stroke();
  });

  canvas.addEventListener("mouseleave", function () {
    tooltip.classList.remove("visible");
    hoveredIdx = -1;
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
