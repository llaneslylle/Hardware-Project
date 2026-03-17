/**
 * supabase.js
 * ─────────────────────────────────────────────
 * Handles all Supabase operations:
 *  - Client initialisation
 *  - Initial data fetch
 *  - Realtime subscription for live updates
 * ─────────────────────────────────────────────
 */

// ── Init client ───────────────────────────────────────────────────────────────
const supabaseClient = supabase.createClient(
  CONFIG.SUPABASE_URL,
  CONFIG.SUPABASE_ANON_KEY
);

// ── State ─────────────────────────────────────────────────────────────────────
const DB = {
  readings:    [],      // All fetched + realtime readings (capped at MAX_CHART_POINTS)
  isConnected: false,
  subscription: null,
};

// ── Fetch initial data ────────────────────────────────────────────────────────
async function fetchInitialReadings() {
  try {
    const { data, error } = await supabaseClient
      .from(CONFIG.TABLE_NAME)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(CONFIG.MAX_CHART_POINTS);

    if (error) throw error;

    // Reverse so oldest is first (left of chart)
    DB.readings = (data || []).reverse();
    return { ok: true, count: DB.readings.length };
  } catch (err) {
    console.error("[Supabase] fetchInitialReadings error:", err.message);
    return { ok: false, error: err.message };
  }
}

// ── Realtime subscription ─────────────────────────────────────────────────────
function subscribeToRealtime(onInsert) {
  DB.subscription = supabaseClient
    .channel("sensor-realtime")
    .on(
      "postgres_changes",
      {
        event:  "INSERT",
        schema: "public",
        table:  CONFIG.TABLE_NAME,
      },
      (payload) => {
        const row = payload.new;

        // Append, cap array
        DB.readings.push(row);
        if (DB.readings.length > CONFIG.MAX_CHART_POINTS) {
          DB.readings.shift();
        }

        onInsert(row);
      }
    )
    .subscribe((status) => {
      DB.isConnected = status === "SUBSCRIBED";
      updateConnectionStatus(status);
    });
}

// ── Fetch single latest row (fallback polling) ────────────────────────────────
async function fetchLatestReading() {
  try {
    const { data, error } = await supabaseClient
      .from(CONFIG.TABLE_NAME)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("[Supabase] fetchLatest error:", err.message);
    return null;
  }
}

// ── Update connection status UI ───────────────────────────────────────────────
function updateConnectionStatus(status) {
  const dot   = document.getElementById("statusDot");
  const label = document.getElementById("statusLabel");

  const MAP = {
    SUBSCRIBED:    ["online",  "Live"],
    TIMED_OUT:     ["error",   "Timed out"],
    CLOSED:        ["error",   "Disconnected"],
    CHANNEL_ERROR: ["error",   "Error"],
  };

  const [cls, text] = MAP[status] || ["", "Connecting…"];
  dot.className   = `status-dot ${cls}`;
  label.textContent = text;
}
