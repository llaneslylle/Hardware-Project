/**
 * config.js
 * ─────────────────────────────────────────────
 * Dashboard configuration.
 * Make sure this matches the same Supabase project
 * your ESP32 (Arduino) is sending to.
 * ─────────────────────────────────────────────
 */

const CONFIG = {
  // ── Supabase ──────────────────────────────
  // MUST match the project used in your Arduino sketch (tafjwpymoierzksojwni)
  SUPABASE_URL:     "https://ckyapytevhbhmssspkrc.supabase.co",

  // Use the ANON PUBLIC KEY from that same project (not the service key).
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNreWFweXRldmhiaG1zc3Nwa3JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MDAxODEsImV4cCI6MjA4OTI3NjE4MX0.2EmbSc59aNDNX2prn_Pj6NJ6NxhNnXqxCcvVz3A0Bac",

  // ── Table ─────────────────────────────────
  TABLE_NAME:       "sensor_readings",

  // ── Dashboard Behaviour ───────────────────
  MAX_CHART_POINTS: 1000,        // Max points shown on charts
  POLL_INTERVAL_MS: 5000,        // Fallback polling interval (ms)
  DEFAULT_RANGE:     20,         // Default chart window (number of points)

  // ── Sensor thresholds (for status labels) ─
  TEMP: {
    COOL:   20,   // Below this → "Cool"
    NORMAL: 28,   // Below this → "Normal"
    WARM:   50,   // Below this → "Warm"
                  // Above WARM → "Hot"
  },
  HUM: {
    DRY:    30,   // Below this → "Dry"
    NORMAL: 60,   // Below this → "Normal"
                  // Above NORMAL → "Humid"
  },
};
