// Viz 3: Cumulative Egg Counter — scroll-triggered animated count-up, click to replay
(function () {
  var container = document.getElementById("egg-counter");
  if (!container || !window.EGG_DATA) return;

  var total = 0;
  for (var i = 0; i < window.EGG_DATA.length; i++) {
    total += window.EGG_DATA[i].qty;
  }

  container.classList.add("egg-viz");
  container.style.cursor = "pointer";

  var numEl = document.createElement("div");
  numEl.className = "egg-counter-number";
  numEl.textContent = "0";

  var subEl = document.createElement("div");
  subEl.className = "egg-counter-sub";
  subEl.textContent = "eggs purchased since 2001";

  container.appendChild(numEl);
  container.appendChild(subEl);

  function formatNumber(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  var running = false;

  function animateCount() {
    running = true;
    numEl.textContent = "0";

    var duration = 2500;
    var start = performance.now();

    function tick(now) {
      var elapsed = now - start;
      var progress = Math.min(elapsed / duration, 1);
      var eased = easeOutQuart(progress);
      var current = Math.round(eased * total);
      numEl.textContent = formatNumber(current);

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
