// Viz 4: GitHub-style purchase heatmap — SVG grid, years as rows, weeks as columns
(function () {
  var container = document.getElementById("egg-heatmap");
  if (!container || !window.EGG_DATA) return;

  container.classList.add("egg-viz");

  var title = document.createElement("div");
  title.className = "egg-viz-title";
  title.textContent = "Every Purchase, Every Week";
  container.appendChild(title);

  var wrap = document.createElement("div");
  wrap.className = "egg-heatmap-wrap";
  container.appendChild(wrap);

  var tooltip = document.createElement("div");
  tooltip.className = "egg-tooltip";
  container.appendChild(tooltip);

  // --- Aggregate data by year-week ---
  var data = window.EGG_DATA;
  var startYear = 2001;
  var endYear = 2026;
  var numYears = endYear - startYear + 1;

  // Map: "YYYY-WW" → { count, totalQty, totalPrice }
  var weekMap = {};

  function getWeekKey(dateStr) {
    var parts = dateStr.split("-");
    var d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    var year = d.getFullYear();
    var jan1 = new Date(year, 0, 1);
    var dayOfYear = Math.floor((d - jan1) / 86400000) + 1;
    var week = Math.min(Math.floor((dayOfYear - 1) / 7), 51);
    return year + "-" + week;
  }

  for (var i = 0; i < data.length; i++) {
    var key = getWeekKey(data[i].date);
    if (!weekMap[key]) weekMap[key] = { count: 0, totalQty: 0, totalPrice: 0 };
    weekMap[key].count++;
    weekMap[key].totalQty += data[i].qty;
    weekMap[key].totalPrice += data[i].price;
  }

  // --- Color scale ---
  var colors = ["#151b23", "#0e4429", "#006d32", "#26a641", "#3fb950"];

  function getColor(count) {
    if (count === 0) return colors[0];
    if (count === 1) return colors[1];
    if (count === 2) return colors[2];
    if (count === 3) return colors[3];
    return colors[4];
  }

  // --- Layout ---
  var cellSize = 12;
  var cellGap = 2;
  var cellStep = cellSize + cellGap;
  var labelW = 48;
  var monthLabelH = 16;
  var weeks = 52;

  var svgW = labelW + weeks * cellStep + 4;
  var svgH = monthLabelH + numYears * cellStep + 4;

  var ns = "http://www.w3.org/2000/svg";
  var svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 " + svgW + " " + svgH);
  svg.setAttribute("width", svgW);
  svg.style.maxWidth = "100%";
  svg.style.height = "auto";

  // Month labels
  var months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  for (var m = 0; m < 12; m++) {
    var weekStart = Math.floor((m * 365.25) / 12 / 7);
    var tx = labelW + weekStart * cellStep + cellStep * 0.5;
    var txt = document.createElementNS(ns, "text");
    txt.setAttribute("x", tx);
    txt.setAttribute("y", monthLabelH - 4);
    txt.setAttribute("font-size", "9");
    txt.setAttribute("fill", "#8b949e");
    txt.setAttribute("font-family", "-apple-system, BlinkMacSystemFont, sans-serif");
    txt.textContent = months[m];
    svg.appendChild(txt);
  }

  // Year rows
  for (var yr = startYear; yr <= endYear; yr++) {
    var row = yr - startYear;
    var ry = monthLabelH + row * cellStep;

    // Year label
    var ylbl = document.createElementNS(ns, "text");
    ylbl.setAttribute("x", labelW - 6);
    ylbl.setAttribute("y", ry + cellSize - 1);
    ylbl.setAttribute("text-anchor", "end");
    ylbl.setAttribute("font-size", "9");
    ylbl.setAttribute("fill", "#8b949e");
    ylbl.setAttribute("font-family", "-apple-system, BlinkMacSystemFont, sans-serif");
    ylbl.textContent = yr.toString();
    svg.appendChild(ylbl);

    // Week cells
    var maxWeek = yr === endYear ? 7 : 51; // only show ~Feb for 2026
    for (var w = 0; w <= maxWeek; w++) {
      var key = yr + "-" + w;
      var info = weekMap[key] || { count: 0, totalQty: 0, totalPrice: 0 };
      var rx = labelW + w * cellStep;

      var rect = document.createElementNS(ns, "rect");
      rect.setAttribute("x", rx);
      rect.setAttribute("y", ry);
      rect.setAttribute("width", cellSize);
      rect.setAttribute("height", cellSize);
      rect.setAttribute("rx", 2);
      rect.setAttribute("fill", getColor(info.count));
      rect.setAttribute("data-year", yr);
      rect.setAttribute("data-week", w);
      rect.setAttribute("data-count", info.count);
      rect.setAttribute("data-qty", info.totalQty);
      rect.setAttribute("data-price", info.totalPrice.toFixed(2));
      rect.style.cursor = "pointer";
      svg.appendChild(rect);
    }
  }

  wrap.appendChild(svg);

  // --- Legend ---
  var legend = document.createElement("div");
  legend.style.cssText =
    "display:flex;align-items:center;gap:4px;margin-top:0.75em;font-size:0.72em;color:#8b949e;";
  legend.innerHTML = "Less ";
  for (var c = 0; c < colors.length; c++) {
    var swatch = document.createElement("span");
    swatch.style.cssText =
      "display:inline-block;width:12px;height:12px;border-radius:2px;background:" +
      colors[c] +
      ";";
    legend.appendChild(swatch);
  }
  var moreSpan = document.createElement("span");
  moreSpan.textContent = " More";
  legend.appendChild(moreSpan);
  container.appendChild(legend);

  // --- Tooltip on hover ---
  svg.addEventListener("mousemove", function (e) {
    var target = e.target;
    if (target.tagName !== "rect") {
      tooltip.classList.remove("visible");
      return;
    }

    var yr = target.getAttribute("data-year");
    var wk = parseInt(target.getAttribute("data-week"));
    var count = target.getAttribute("data-count");
    var qty = target.getAttribute("data-qty");
    var price = target.getAttribute("data-price");

    // Compute week date range
    var weekStart = new Date(+yr, 0, 1 + wk * 7);
    var weekEnd = new Date(weekStart.getTime() + 6 * 86400000);
    var fmt = function (d) {
      var months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      return months[d.getMonth()] + " " + d.getDate();
    };

    var rangeStr = fmt(weekStart) + " – " + fmt(weekEnd) + ", " + yr;
    var purchStr =
      count === "0"
        ? "No purchases"
        : count + " purchase" + (count === "1" ? "" : "s") + " · " + qty + " eggs · $" + price;

    tooltip.innerHTML =
      '<span class="egg-tooltip-label">' +
      rangeStr +
      "</span><br>" +
      '<span class="egg-tooltip-value">' +
      purchStr +
      "</span>";

    var rect = container.getBoundingClientRect();
    var tx = e.clientX - rect.left + 12;
    var ty = e.clientY - rect.top - 30;
    if (tx + tooltip.offsetWidth > rect.width - 10) tx = e.clientX - rect.left - tooltip.offsetWidth - 12;
    if (ty < 5) ty = e.clientY - rect.top + 15;

    tooltip.style.left = tx + "px";
    tooltip.style.top = ty + "px";
    tooltip.classList.add("visible");
  });

  svg.addEventListener("mouseleave", function () {
    tooltip.classList.remove("visible");
  });
})();
