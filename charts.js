function initAllCharts() {
  console.log("Charts initialized");
}

function refreshAllCharts() {
  console.log("Charts updated");
}


/**
 * charts.js
 * ─────────────────────────────────────────────
 * All Chart.js chart creation and update logic.
 * Charts: Temperature, Humidity, Combo, Sparklines
 * ─────────────────────────────────────────────
 */

// ── Shared chart defaults ─────────────────────────────────────────────────────
Chart.defaults.color          = "#8892a4";
Chart.defaults.borderColor    = "rgba(255,255,255,0.05)";
Chart.defaults.font.family    = "'DM Mono', monospace";
Chart.defaults.font.size      = 11;
Chart.defaults.animation.duration = 300;

const COLORS = {
  temp:      "#ff6b35",
  tempFill:  "rgba(255,107,53,0.12)",
  hum:       "#00d4aa",
  humFill:   "rgba(0,212,170,0.10)",
  accent:    "#7b61ff",
  grid:      "rgba(255,255,255,0.05)",
  tick:      "#4a5568",
};

// Shared options for line charts
function lineOptions(yLabel, color, min = null, max = null) {
  return {
    responsive:          true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#181c24",
        borderColor:     "rgba(255,255,255,0.08)",
        borderWidth:     1,
        padding:         10,
        titleFont:       { family: "'Syne', sans-serif", size: 12, weight: "700" },
        bodyFont:        { family: "'DM Mono', monospace", size: 11 },
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)} ${yLabel}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { maxTicksLimit: 6, color: COLORS.tick, maxRotation: 0 },
        grid:  { color: COLORS.grid },
      },
      y: {
        ticks: { color: COLORS.tick },
        grid:  { color: COLORS.grid },
        min:   min !== null ? min : undefined,
        max:   max !== null ? max : undefined,
        title: { display: true, text: yLabel, color: COLORS.tick, font: { size: 10 } },
      },
    },
  };
}

// ── Chart instances ───────────────────────────────────────────────────────────
let tempChart, humChart, comboChart, tempSparkline, humSparkline;
let tempRange = CONFIG.DEFAULT_RANGE;
let humRange  = CONFIG.DEFAULT_RANGE;

// ── Format timestamp label ────────────────────────────────────────────────────
function fmtLabel(isoString) {
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// ── Build chart data arrays from DB.readings ──────────────────────────────────
function getSlice(range) {
  return DB.readings.slice(-range);
}

// ── Init Temperature Chart ────────────────────────────────────────────────────
function initTempChart() {
  const ctx = document.getElementById("tempChart").getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, 0, 220);
  gradient.addColorStop(0, "rgba(255,107,53,0.25)");
  gradient.addColorStop(1, "rgba(255,107,53,0)");

  const slice = getSlice(tempRange);
  tempChart = new Chart(ctx, {
    type: "line",
    data: {
      labels:   slice.map((r) => fmtLabel(r.created_at)),
      datasets: [{
        label:           "Temperature",
        data:            slice.map((r) => r.temperature),
        borderColor:     COLORS.temp,
        backgroundColor: gradient,
        borderWidth:     2,
        pointRadius:     3,
        pointHoverRadius: 6,
        pointBackgroundColor: COLORS.temp,
        tension:         0.4,
        fill:            true,
      }],
    },
    options: lineOptions("°C", COLORS.temp),
  });
}

// ── Init Humidity Chart ───────────────────────────────────────────────────────
function initHumChart() {
  const ctx = document.getElementById("humChart").getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, 0, 220);
  gradient.addColorStop(0, "rgba(0,212,170,0.22)");
  gradient.addColorStop(1, "rgba(0,212,170,0)");

  const slice = getSlice(humRange);
  humChart = new Chart(ctx, {
    type: "line",
    data: {
      labels:   slice.map((r) => fmtLabel(r.created_at)),
      datasets: [{
        label:           "Humidity",
        data:            slice.map((r) => r.humidity),
        borderColor:     COLORS.hum,
        backgroundColor: gradient,
        borderWidth:     2,
        pointRadius:     3,
        pointHoverRadius: 6,
        pointBackgroundColor: COLORS.hum,
        tension:         0.4,
        fill:            true,
      }],
    },
    options: lineOptions("%", COLORS.hum, 0, 100),
  });
}

// ── Init Combo Chart ──────────────────────────────────────────────────────────
function initComboChart() {
  const ctx = document.getElementById("comboChart").getContext("2d");
  const slice = getSlice(50);

  comboChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: slice.map((r) => fmtLabel(r.created_at)),
      datasets: [
        {
          label:           "Temperature",
          data:            slice.map((r) => r.temperature),
          borderColor:     COLORS.temp,
          backgroundColor: "transparent",
          borderWidth:     2,
          pointRadius:     2,
          tension:         0.4,
          yAxisID:         "yTemp",
        },
        {
          label:           "Humidity",
          data:            slice.map((r) => r.humidity),
          borderColor:     COLORS.hum,
          backgroundColor: "transparent",
          borderWidth:     2,
          pointRadius:     2,
          tension:         0.4,
          yAxisID:         "yHum",
          borderDash:      [4, 4],
        },
      ],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#181c24",
          borderColor:     "rgba(255,255,255,0.08)",
          borderWidth:     1,
          padding:         10,
        },
      },
      scales: {
        x: {
          ticks: { maxTicksLimit: 8, color: COLORS.tick, maxRotation: 0 },
          grid:  { color: COLORS.grid },
        },
        yTemp: {
          type:     "linear",
          position: "left",
          ticks:    { color: COLORS.temp },
          grid:     { color: COLORS.grid },
          title:    { display: true, text: "°C", color: COLORS.temp, font: { size: 10 } },
        },
        yHum: {
          type:     "linear",
          position: "right",
          ticks:    { color: COLORS.hum },
          grid:     { drawOnChartArea: false },
          title:    { display: true, text: "%", color: COLORS.hum, font: { size: 10 } },
          min: 0, max: 100,
        },
      },
    },
  });
}

// ── Init Sparklines ───────────────────────────────────────────────────────────
function initSparklines() {
  const sparkOpts = (color) => ({
    responsive: false,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: {
      x: { display: false },
      y: { display: false },
    },
    elements: { point: { radius: 0 } },
    animation: { duration: 200 },
  });

  const tSlice = getSlice(20);
  tempSparkline = new Chart(
    document.getElementById("tempSparkline").getContext("2d"),
    {
      type: "line",
      data: {
        labels:   tSlice.map(() => ""),
        datasets: [{
          data:            tSlice.map((r) => r.temperature),
          borderColor:     COLORS.temp,
          backgroundColor: "rgba(255,107,53,0.15)",
          borderWidth:     1.5,
          tension:         0.4,
          fill:            true,
        }],
      },
      options: sparkOpts(COLORS.temp),
    }
  );

  const hSlice = getSlice(20);
  humSparkline = new Chart(
    document.getElementById("humSparkline").getContext("2d"),
    {
      type: "line",
      data: {
        labels:   hSlice.map(() => ""),
        datasets: [{
          data:            hSlice.map((r) => r.humidity),
          borderColor:     COLORS.hum,
          backgroundColor: "rgba(0,212,170,0.12)",
          borderWidth:     1.5,
          tension:         0.4,
          fill:            true,
        }],
      },
      options: sparkOpts(COLORS.hum),
    }
  );
}

// ── Init all charts ───────────────────────────────────────────────────────────
function initAllCharts() {
  initTempChart();
  initHumChart();
  initComboChart();
  initSparklines();
}

// ── Refresh all charts from DB.readings ──────────────────────────────────────
function refreshAllCharts() {
  refreshTempChart();
  refreshHumChart();
  refreshComboChart();
  refreshSparklines();
}

function refreshTempChart() {
  if (!tempChart) return;
  const slice           = getSlice(tempRange);
  tempChart.data.labels = slice.map((r) => fmtLabel(r.created_at));
  tempChart.data.datasets[0].data = slice.map((r) => r.temperature);
  tempChart.update("none");
}
function refreshHumChart() {
  if (!humChart) return;
  const slice          = getSlice(humRange);
  humChart.data.labels = slice.map((r) => fmtLabel(r.created_at));
  humChart.data.datasets[0].data = slice.map((r) => r.humidity);
  humChart.update("none");
}
function refreshComboChart() {
  if (!comboChart) return;
  const slice             = getSlice(50);
  comboChart.data.labels  = slice.map((r) => fmtLabel(r.created_at));
  comboChart.data.datasets[0].data = slice.map((r) => r.temperature);
  comboChart.data.datasets[1].data = slice.map((r) => r.humidity);
  comboChart.update("none");
}
function refreshSparklines() {
  if (!tempSparkline || !humSparkline) return;
  const tSlice = getSlice(20);
  tempSparkline.data.labels = tSlice.map(() => "");
  tempSparkline.data.datasets[0].data = tSlice.map((r) => r.temperature);
  tempSparkline.update("none");

  const hSlice = getSlice(20);
  humSparkline.data.labels = hSlice.map(() => "");
  humSparkline.data.datasets[0].data = hSlice.map((r) => r.humidity);
  humSparkline.update("none");
}

// ── Range button handlers ─────────────────────────────────────────────────────
document.querySelectorAll(".range-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const range  = parseInt(btn.dataset.range, 10);
    const target = btn.dataset.target;

    document.querySelectorAll(`.range-btn[data-target="${target}"]`).forEach((b) =>
      b.classList.remove("active")
    );
    btn.classList.add("active");

    if (target === "temp") { tempRange = range; refreshTempChart(); }
    if (target === "hum")  { humRange  = range; refreshHumChart(); }
  });
});
