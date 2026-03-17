/**
 * dashboard.js
 * ─────────────────────────────────────────────
 * Orchestrates: data → UI stats → charts → table
 * Entry point: DOMContentLoaded
 * ─────────────────────────────────────────────
 */

// ── Helper: calculate heat index (Steadman formula simplified) ────────────────
function calcHeatIndex(T, H) {
  if (T < 27) return T.toFixed(1) + " °C";
  const hi = -8.78469475556
    + 1.61139411   * T
    + 2.33854883889 * H
    - 0.14611605   * T * H
    - 0.012308094  * T * T
    - 0.016424828  * H * H
    + 0.002211732  * T * T * H
    + 0.00072546   * T * H * H
    - 0.000003582  * T * T * H * H;
  return hi.toFixed(1) + " °C";
}

// ── Helper: temperature status label ──────────────────────────────────────────
function tempStatus(t) {
  if (t < CONFIG.TEMP.COOL)   return { text: "Cool",   cls: "badge--cool" };
  if (t < CONFIG.TEMP.NORMAL) return { text: "Normal", cls: "badge--ok" };
  if (t < CONFIG.TEMP.WARM)   return { text: "Warm",   cls: "badge--warm" };
  return                             { text: "Hot",    cls: "badge--hot" };
}

// ── Helper: humidity status label ─────────────────────────────────────────────
function humStatus(h) {
  if (h < CONFIG.HUM.DRY)    return { text: "Dry",    cls: "badge--dry" };
  if (h < CONFIG.HUM.NORMAL) return { text: "Normal", cls: "badge--ok" };
  return                            { text: "Humid",  cls: "badge--humid" };
}

// ── Update stat cards ─────────────────────────────────────────────────────────
function updateStatCards() {
  if (!DB.readings.length) return;

  const temps = DB.readings.map((r) => r.temperature);
  const hums  = DB.readings.map((r) => r.humidity);
  const latest = DB.readings[DB.readings.length - 1];

  // Temperature
  document.getElementById("tempValue").textContent = latest.temperature.toFixed(1);
  document.getElementById("tempMax").textContent   = Math.max(...temps).toFixed(1);
  document.getElementById("tempMin").textContent   = Math.min(...temps).toFixed(1);
  document.getElementById("tempAvg").textContent   = (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1);
  const ts = tempStatus(latest.temperature);
  document.getElementById("tempStatus").textContent  = ts.text;

  // Humidity
  document.getElementById("humValue").textContent  = latest.humidity.toFixed(1);
  document.getElementById("humMax").textContent    = Math.max(...hums).toFixed(1);
  document.getElementById("humMin").textContent    = Math.min(...hums).toFixed(1);
  document.getElementById("humAvg").textContent    = (hums.reduce((a, b) => a + b, 0) / hums.length).toFixed(1);
  const hs = humStatus(latest.humidity);
  document.getElementById("humStatus").textContent  = hs.text;

  // Info card
  document.getElementById("readingCount").textContent = DB.readings.length;
  document.getElementById("lastReadingTime").textContent =
    new Date(latest.created_at).toLocaleTimeString();
  document.getElementById("deviceStatus").textContent = "Device online";
  document.getElementById("heatIndex").textContent =
    calcHeatIndex(latest.temperature, latest.humidity);
}

// ── Render log table ──────────────────────────────────────────────────────────
function renderTable(highlightLatest = false) {
  const tbody = document.getElementById("logTableBody");
  const slice = [...DB.readings].reverse().slice(0, 50);

  if (!slice.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="log-empty">No data yet…</td></tr>`;
    return;
  }

  tbody.innerHTML = slice
    .map((r, i) => {
      const ts   = tempStatus(r.temperature);
      const hs   = humStatus(r.humidity);
      const hi   = calcHeatIndex(r.temperature, r.humidity);
      const time = new Date(r.created_at).toLocaleString();
      const isNew = highlightLatest && i === 0;
      return `
        <tr class="${isNew ? "new-row" : ""}">
          <td>${DB.readings.length - i}</td>
          <td>${time}</td>
          <td style="color:#ff6b35;font-weight:500">${r.temperature.toFixed(1)} °C</td>
          <td style="color:#00d4aa;font-weight:500">${r.humidity.toFixed(1)} %</td>
          <td>${hi}</td>
          <td>
            <span class="badge ${ts.cls}">${ts.text}</span>
            <span class="badge ${hs.cls}">${hs.text}</span>
          </td>
        </tr>`;
    })
    .join("");
}

// ── Export to CSV ─────────────────────────────────────────────────────────────
document.getElementById("exportBtn").addEventListener("click", () => {
  if (!DB.readings.length) return alert("No data to export.");

  const header = "ID,Timestamp,Temperature (°C),Humidity (%),Heat Index\n";
  const rows = DB.readings
    .map((r, i) =>
      `${i + 1},"${new Date(r.created_at).toLocaleString()}",${r.temperature.toFixed(2)},${r.humidity.toFixed(2)},"${calcHeatIndex(r.temperature, r.humidity)}"`
    )
    .join("\n");

  const blob = new Blob([header + rows], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `sensor_readings_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
});

// ── Clock ─────────────────────────────────────────────────────────────────────
function startClock() {
  function tick() {
    document.getElementById("headerTime").textContent =
      new Date().toLocaleTimeString();
  }
  tick();
  setInterval(tick, 1000);
}

// ── Fallback polling (if realtime fails) ──────────────────────────────────────
let lastSeenId = null;
function startPolling() {
  setInterval(async () => {
    if (DB.isConnected) return;  // realtime is working, skip

    const row = await fetchLatestReading();
    if (!row || row.id === lastSeenId) return;

    lastSeenId = row.id;
    const exists = DB.readings.find((r) => r.id === row.id);
    if (!exists) {
      DB.readings.push(row);
      if (DB.readings.length > CONFIG.MAX_CHART_POINTS) DB.readings.shift();
      onNewReading(row);
    }
  }, CONFIG.POLL_INTERVAL_MS);
}

// ── New reading handler (shared by realtime + polling) ────────────────────────
function onNewReading(row) {
  updateStatCards();
  refreshAllCharts();
  renderTable(true);
  document.getElementById("footerReadings").textContent =
    `${DB.readings.length} readings loaded`;
}

// ── Main boot ─────────────────────────────────────────────────────────────────
async function init() {
  startClock();

  // Fetch seed data
  const result = await fetchInitialReadings();
  if (!result.ok) {
    document.getElementById("statusLabel").textContent = "DB Error";
    document.getElementById("statusDot").className = "status-dot error";
    console.error("[Dashboard] Could not fetch data:", result.error);
  }

  // Render with initial data
  if (DB.readings.length) {
    initAllCharts();
    updateStatCards();
    renderTable();
    document.getElementById("footerReadings").textContent =
      `${DB.readings.length} readings loaded`;
  } else {
    // No data yet — still init empty charts
    initAllCharts();
  }

  // Subscribe to live updates
  subscribeToRealtime(onNewReading);

  // Fallback polling
  startPolling();

  // Reveal background glows after load
  document.body.classList.add("loaded");
}

document.addEventListener("DOMContentLoaded", init);
