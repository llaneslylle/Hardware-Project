# SensorOS — ESP32 Sensor Dashboard

A live web dashboard that visualises **temperature** and **humidity** data streamed from an **ESP32 + DHT11** sensor to **Supabase** in real time.

---

## Project Structure

```
esp32-dashboard/
├── index.html          ← Main dashboard page
├── css/
│   └── style.css       ← All styling
├── js/
│   ├── config.js       ← ⚙️  Edit this first — your credentials go here
│   ├── supabase.js     ← Supabase client, fetch, and realtime subscription
│   ├── charts.js       ← All Chart.js logic (temperature, humidity, combo, sparklines)
│   └── dashboard.js    ← UI orchestration, stats, table, export, clock
└── README.md           ← You are here
```

---

## Prerequisites

| Requirement | Details |
|---|---|
| ESP32 board | Any variant (DevKit recommended) |
| DHT11 sensor | Wired to GPIO pin 4 (editable in `.ino`) |
| Supabase account | Free tier is sufficient |
| Modern browser | Chrome, Firefox, Edge, Safari |
| Web server | **Required** (see Step 5) — opening `index.html` directly will not work due to CORS |

---

## Step-by-Step Setup

### Step 1 — Set up your Supabase table

1. Log in to [supabase.com](https://supabase.com) and open your project.
2. Go to **SQL Editor** and run the following:

```sql
-- Create the sensor_readings table
CREATE TABLE IF NOT EXISTS sensor_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    temperature FLOAT NOT NULL,
    humidity FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;

-- Allow anonymous SELECT (for dashboard)
CREATE POLICY "Allow anon select" ON sensor_readings
FOR SELECT TO anon USING (true);

-- Allow anonymous INSERT (for ESP32)
CREATE POLICY "Allow anon insert" ON sensor_readings
FOR INSERT TO anon WITH CHECK (true);

-- Enable Realtime
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE sensor_readings;
```

3. Confirm the table appears in **Table Editor → sensor_readings**.

---

### Step 2 — Flash the ESP32

1. Open **Arduino IDE** (or PlatformIO).
2. Install the required libraries via Library Manager:
   - `DHT sensor library` by Adafruit
   - `Adafruit Unified Sensor`
   - `WiFi` (built-in for ESP32)
   - `HTTPClient` (built-in for ESP32)
3. Open the provided `.ino` sketch.
4. Update these lines with your own values:

```cpp
#define WIFI_SSID      "YOUR_WIFI_NAME"
#define WIFI_PASSWORD  "YOUR_WIFI_PASSWORD"
```

5. Select your board: **Tools → Board → ESP32 Dev Module** (or your variant).
6. Select the correct COM port under **Tools → Port**.
7. Click **Upload**.
8. Open **Serial Monitor** at `115200` baud. You should see:
   ```
   Connecting to WiFi....
   WiFi Connected
   Temperature: 28.00
   Humidity: 65.00
   HTTP Response: 201
   ```
   > ✅ HTTP `201` means the data was inserted into Supabase successfully.

---

### Step 3 — Get your Supabase credentials

1. In your Supabase project, go to **Settings → API**.
2. Copy:
   - **Project URL** (looks like `https://xxxxxxxxxxxx.supabase.co`)
   - **anon / public** key (a long JWT string)

---

### Step 4 — Configure the dashboard

1. Open `js/config.js` in a text editor.
2. Replace the placeholder values:

```javascript
const CONFIG = {
  SUPABASE_URL:      "https://YOUR_PROJECT_ID.supabase.co",
  SUPABASE_ANON_KEY: "YOUR_ANON_KEY_HERE",
  TABLE_NAME:        "sensor_readings",
  ...
};
```

3. Save the file. **Do not modify any other JS files** unless you know what you're doing.

---

### Step 5 — Serve the dashboard

> ⚠️ **You cannot open `index.html` by double-clicking it.** Browsers block the Supabase Realtime WebSocket when loaded as a `file://` URL. Use a local server instead.

#### Option A — VS Code Live Server (easiest)
1. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension.
2. Right-click `index.html` → **Open with Live Server**.
3. Your browser will open at `http://127.0.0.1:5500`.

#### Option B — Python (no install needed)
```bash
# Navigate to the esp32-dashboard folder
cd path/to/esp32-dashboard

# Python 3
python -m http.server 8080

# Then open: http://localhost:8080
```

#### Option C — Node.js `serve`
```bash
npm install -g serve
serve .
# Then open: http://localhost:3000
```

#### Option D — Deploy to the web (Netlify / GitHub Pages)
- Drag-and-drop the `esp32-dashboard` folder to [netlify.com/drop](https://app.netlify.com/drop).
- Your dashboard becomes publicly accessible instantly — no backend needed.

---

## Dashboard Features

| Feature | Description |
|---|---|
| 🟢 Live status indicator | Green dot pulses when Supabase Realtime is connected |
| 🌡️ Temperature card | Current, max, min, avg + sparkline |
| 💧 Humidity card | Current, max, min, avg + sparkline |
| 🔢 Readings card | Count, last reading time, heat index |
| 📈 Temperature chart | Line chart with selectable range (30 / 60 / 100 pts) |
| 📉 Humidity chart | Line chart with selectable range |
| 🔀 Combo chart | Dual-axis overlay of both sensors (last 50 pts) |
| 📋 Readings log | Scrollable table of last 50 readings with status badges |
| ⬇️ CSV export | Download all loaded readings as a `.csv` file |
| ⏱️ Live clock | Real-time clock in the header |
| 🔄 Fallback polling | Polls every 5s if WebSocket is unavailable |

---

## Customising Thresholds

In `js/config.js`, adjust these values to change the status badge behaviour:

```javascript
TEMP: {
  COOL:   20,   // Below 20°C → "Cool"
  NORMAL: 28,   // 20–28°C   → "Normal"
  WARM:   33,   // 28–33°C   → "Warm"
                // Above 33°C → "Hot"
},
HUM: {
  DRY:    30,   // Below 30% → "Dry"
  NORMAL: 60,   // 30–60%   → "Normal"
                // Above 60% → "Humid"
},
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Status shows "Connecting…" forever | Check your `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `config.js` |
| No data appears | Make sure the ESP32 is running and sending `201` responses |
| "DB Error" in status | Open browser DevTools (F12) → Console for the exact error |
| Charts are blank | Ensure at least one row exists in `sensor_readings` table |
| HTTP 401 from ESP32 | Re-check the `SUPABASE_API_KEY` in your `.ino` file |
| HTTP 404 from ESP32 | Verify the table name is exactly `sensor_readings` |
| CORS / WebSocket error | You opened `index.html` directly — use a local server (Step 5) |
| Realtime not updating | Check Supabase Dashboard → Database → Replication to confirm the table is listed under the `supabase_realtime` publication |

---

## Security Note

The `anon` API key in this project has **read + insert only** access (enforced by RLS policies). It is safe to use in a browser-facing dashboard. Never use the `service_role` key in frontend code.

---

## License

MIT — free to use and modify.
