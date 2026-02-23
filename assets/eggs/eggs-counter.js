// Viz 3: Cumulative Egg Counter + Total Spend — scroll-triggered animated count-up, click to replay
(function () {
  var container = document.getElementById("egg-counter");
  if (!container || !window.EGG_DATA) return;

  var totalEggs = 0;
  var totalSpend = 0;
  for (var i = 0; i < window.EGG_DATA.length; i++) {
    totalEggs += window.EGG_DATA[i].qty;
    totalSpend += window.EGG_DATA[i].price;
  }

  container.classList.add("egg-viz");
  container.style.cursor = "pointer";

  var row = document.createElement("div");
  row.className = "egg-counter-row";

  // Eggs column
  var eggsCol = document.createElement("div");
  eggsCol.className = "egg-counter-col";
  var eggsNum = document.createElement("div");
  eggsNum.className = "egg-counter-number";
  eggsNum.textContent = "0";
  var eggsSub = document.createElement("div");
  eggsSub.className = "egg-counter-sub";
  eggsSub.textContent = "eggs purchased since 2001";
  eggsCol.appendChild(eggsNum);
  eggsCol.appendChild(eggsSub);

  // Spend column
  var spendCol = document.createElement("div");
  spendCol.className = "egg-counter-col";
  var spendNum = document.createElement("div");
  spendNum.className = "egg-counter-number";
  spendNum.textContent = "$0";
  var spendSub = document.createElement("div");
  spendSub.className = "egg-counter-sub";
  spendSub.textContent = "total spent on eggs";
  spendCol.appendChild(spendNum);
  spendCol.appendChild(spendSub);

  row.appendChild(eggsCol);
  row.appendChild(spendCol);
  container.appendChild(row);

  function formatNumber(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  var running = false;

  function animateCount() {
    running = true;
    eggsNum.textContent = "0";
    spendNum.textContent = "$0";

    var duration = 2500;
    var start = performance.now();

    function tick(now) {
      var elapsed = now - start;
      var progress = Math.min(elapsed / duration, 1);
      var eased = easeOutQuart(progress);
      eggsNum.textContent = formatNumber(Math.round(eased * totalEggs));
      spendNum.textContent = "$" + formatNumber(Math.round(eased * totalSpend));

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        running = false;
      }
    }

    requestAnimationFrame(tick);
  }

  // Click to replay
  container.addEventListener("click", function () {
    if (!running) animateCount();
  });

  // Scroll trigger for first run
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        if (entries[0].isIntersecting) {
          animateCount();
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(container);
  } else {
    animateCount();
  }
})();
