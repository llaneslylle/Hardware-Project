/**
 * charts.js
 * ─────────────────────────────────────────────
 * All Chart.js chart creation and update logic.
 * Charts: Temperature, Humidity, Combo, Sparklines
 *
 * Theme: Deep Space Glassmorphism
 * ─────────────────────────────────────────────
 */

// ── Shared chart defaults ─────────────────────────────────────────────────────
Chart.defaults.color          = "#a0aec8";
Chart.defaults.borderColor    = "rgba(255,255,255,0.04)";
Chart.defaults.font.family    = "'DM Mono', monospace";
Chart.defaults.font.size      = 11;
Chart.defaults.animation.duration = 400;

const COLORS = {
  // Temperature: vivid violet-magenta
  temp:      "#c084fc",
  tempGlow:  "rgba(192,132,252,0.35)",
  tempFill0: "rgba(192,132,252,0.28)",
  tempFill1: "rgba(192,132,252,0.00)",

  // Humidity: electric cyan
  hum:       "#22d3ee",
  humGlow:   "rgba(34,211,238,0.30)",
  humFill0:  "rgba(34,211,238,0.22)",
  humFill1:  "rgba(34,211,238,0.00)",

  // Accent / combo
  accent:    "#818cf8",

  // Grid & ticks
  grid:      "rgba(148,163,184,0.07)",
  tick:      "#475569",

  // Tooltip bg
  tooltipBg: "rgba(10,12,28,0.92)",
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
        backgroundColor: COLORS.tooltipBg,
        borderColor:     "rgba(255,255,255,0.10)",
        borderWidth:     1,
        padding:         12,
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
        border: { color: "transparent" },
      },
      y: {
        ticks: { color: COLORS.tick },
        grid:  { color: COLORS.grid },
        border: { color: "transparent" },
        min:   min !== null ? min : undefined,
        max:   max !== null ? max : undefined,
        title: { display: true, text: yLabel, color: COLORS.tick, font: { size: 10 } },
      },
    },
  };
}

// ── Chart instances ───────────────────────────────────────────────────────────
let tempChart, humChart, comboChart, tempSparkline, humSparkline;
let chartRange = CONFIG.DEFAULT_RANGE;

// ── Format timestamp label ────────────────────────────────────────────────────
function fmtLabel(isoString) {
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// ── Build chart data arrays from DB.readings ──────────────────────────────────
function getSlice(range) {
  return DB.readings.slice(-range);
}

// ── Helper: make gradient ─────────────────────────────────────────────────────
function makeGradient(ctx, stop0, stop1, height = 220) {
  const g = ctx.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, stop0);
  g.addColorStop(1, stop1);
  return g;
}

// ── Init Temperature Chart ────────────────────────────────────────────────────
function initTempChart() {
  const ctx = document.getElementById("tempChart").getContext("2d");
  const gradient = makeGradient(ctx, COLORS.tempFill0, COLORS.tempFill1);

  const slice = getSlice(chartRange);
  tempChart = new Chart(ctx, {
    type: "line",
    data: {
      labels:   slice.map((r) => fmtLabel(r.created_at)),
      datasets: [{
        label:                "Temperature",
        data:                 slice.map((r) => r.temperature),
        borderColor:          COLORS.temp,
        backgroundColor:      gradient,
        borderWidth:          2.5,
        pointRadius:          3,
        pointHoverRadius:     7,
        pointBackgroundColor: COLORS.temp,
        pointBorderColor:     "rgba(192,132,252,0.3)",
        pointBorderWidth:     3,
        tension:              0.45,
        fill:                 true,
        shadowColor:          COLORS.tempGlow,
      }],
    },
    options: lineOptions("°C", COLORS.temp),
  });
}

// ── Init Humidity Chart ───────────────────────────────────────────────────────
function initHumChart() {
  const ctx = document.getElementById("humChart").getContext("2d");
  const gradient = makeGradient(ctx, COLORS.humFill0, COLORS.humFill1);

  const slice = getSlice(chartRange);
  humChart = new Chart(ctx, {
    type: "line",
    data: {
      labels:   slice.map((r) => fmtLabel(r.created_at)),
      datasets: [{
        label:                "Humidity",
        data:                 slice.map((r) => r.humidity),
        borderColor:          COLORS.hum,
        backgroundColor:      gradient,
        borderWidth:          2.5,
        pointRadius:          3,
        pointHoverRadius:     7,
        pointBackgroundColor: COLORS.hum,
        pointBorderColor:     "rgba(34,211,238,0.3)",
        pointBorderWidth:     3,
        tension:              0.45,
        fill:                 true,
      }],
    },
    options: lineOptions("%", COLORS.hum),
  });
}

// ── Init Combo Chart ──────────────────────────────────────────────────────────
function initComboChart() {
  const ctx = document.getElementById("comboChart").getContext("2d");
  const slice = getSlice(chartRange);

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
          pointHoverRadius: 5,
          tension:         0.45,
          yAxisID:         "yTemp",
        },
        {
          label:           "Humidity",
          data:            slice.map((r) => r.humidity),
          borderColor:     COLORS.hum,
          backgroundColor: "transparent",
          borderWidth:     2,
          pointRadius:     2,
          pointHoverRadius: 5,
          tension:         0.45,
          yAxisID:         "yHum",
          borderDash:      [5, 4],
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
          backgroundColor: COLORS.tooltipBg,
          borderColor:     "rgba(255,255,255,0.10)",
          borderWidth:     1,
          padding:         12,
          titleFont:       { family: "'Syne', sans-serif", size: 12, weight: "700" },
          bodyFont:        { family: "'DM Mono', monospace", size: 11 },
        },
      },
      scales: {
        x: {
          ticks: { maxTicksLimit: 8, color: COLORS.tick, maxRotation: 0 },
          grid:  { color: COLORS.grid },
          border: { color: "transparent" },
        },
        yTemp: {
          type:     "linear",
          position: "left",
          ticks:    { color: COLORS.temp },
          grid:     { color: COLORS.grid },
          border:   { color: "transparent" },
          title:    { display: true, text: "°C", color: COLORS.temp, font: { size: 10 } },
        },
        yHum: {
          type:     "linear",
          position: "right",
          ticks:    { color: COLORS.hum },
          grid:     { drawOnChartArea: false },
          border:   { color: "transparent" },
          title:    { display: true, text: "%", color: COLORS.hum, font: { size: 10 } },
          min: undefined,
          max: undefined,
        },
      },
    },
  });
}

// ── Init Sparklines ───────────────────────────────────────────────────────────
function initSparklines() {
  const sparkOpts = () => ({
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
  const tCtx   = document.getElementById("tempSparkline").getContext("2d");
  const tGrad  = makeGradient(tCtx, "rgba(192,132,252,0.30)", "rgba(192,132,252,0.00)", 60);

  tempSparkline = new Chart(tCtx, {
    type: "line",
    data: {
      labels:   tSlice.map(() => ""),
      datasets: [{
        data:            tSlice.map((r) => r.temperature),
        borderColor:     COLORS.temp,
        backgroundColor: tGrad,
        borderWidth:     1.5,
        tension:         0.45,
        fill:            true,
      }],
    },
    options: sparkOpts(),
  });

  const hSlice = getSlice(20);
  const hCtx   = document.getElementById("humSparkline").getContext("2d");
  const hGrad  = makeGradient(hCtx, "rgba(34,211,238,0.25)", "rgba(34,211,238,0.00)", 60);

  humSparkline = new Chart(hCtx, {
    type: "line",
    data: {
      labels:   hSlice.map(() => ""),
      datasets: [{
        data:            hSlice.map((r) => r.humidity),
        borderColor:     COLORS.hum,
        backgroundColor: hGrad,
        borderWidth:     1.5,
        tension:         0.45,
        fill:            true,
      }],
    },
    options: sparkOpts(),
  });
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
  const slice           = getSlice(chartRange);
  tempChart.data.labels = slice.map((r) => fmtLabel(r.created_at));
  tempChart.data.datasets[0].data = slice.map((r) => r.temperature);
  tempChart.update("none");
}
function refreshHumChart() {
  if (!humChart) return;
  const slice          = getSlice(chartRange);
  humChart.data.labels = slice.map((r) => fmtLabel(r.created_at));
  humChart.data.datasets[0].data = slice.map((r) => r.humidity);
  humChart.update("none");
}
function refreshComboChart() {
  if (!comboChart) return;
  const slice             = getSlice(chartRange);
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

    chartRange = range;
    refreshTempChart();
    refreshHumChart();
    refreshComboChart();
  });
});