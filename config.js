/**
 * config.js
 * ─────────────────────────────────────────────
 * Edit ONLY this file to configure your project.
 * Replace the values below with your own.
 * ─────────────────────────────────────────────
 */

const CONFIG = {
  // ── Supabase ──────────────────────────────
  SUPABASE_URL:     "https://ckyapytevhbhmssspkrc.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNreWFweXRldmhiaG1zc3Nwa3JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MDAxODEsImV4cCI6MjA4OTI3NjE4MX0.2EmbSc59aNDNX2prn_Pj6NJ6NxhNnXqxCcvVz3A0Bac",

  // ── Table ─────────────────────────────────
  TABLE_NAME:       "sensor_readings",

  // ── Dashboard Behaviour ───────────────────
  MAX_CHART_POINTS: 100,        // Max points shown on charts
  POLL_INTERVAL_MS: 5000,       // Fallback polling interval (ms)
  DEFAULT_RANGE:    30,         // Default chart window (number of points)

  // ── Sensor thresholds (for status labels) ─
  TEMP: {
    COOL:   20,   // Below this → "Cool"
    NORMAL: 28,   // Below this → "Normal"
    WARM:   33,   // Below this → "Warm"
                  // Above WARM → "Hot"
  },
  HUM: {
    DRY:    30,   // Below this → "Dry"
    NORMAL: 60,   // Below this → "Normal"
                  // Above NORMAL → "Humid"
  },
};
