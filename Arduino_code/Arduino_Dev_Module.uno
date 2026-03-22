#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>

// WiFi
#define WIFI_SSID "NICE TRY DIDDY"
#define WIFI_PASSWORD "12345678901"

// Supabase
#define SUPABASE_URL "https://ckyapytevhbhmssspkrc.supabase.co/rest/v1/sensor_readings"
#define SUPABASE_API_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNreWFweXRldmhiaG1zc3Nwa3JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MDAxODEsImV4cCI6MjA4OTI3NjE4MX0.2EmbSc59aNDNX2prn_Pj6NJ6NxhNnXqxCcvVz3A0Bac"

// DHT11
#define DHTPIN 4
#define DHTTYPE DHT11

DHT dht(DHTPIN, DHTTYPE);

void setup() {

  Serial.begin(115200);
  dht.begin();

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }

  Serial.println();
  Serial.println("WiFi Connected");
}

void loop() {

  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();

  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("Failed to read DHT sensor");
    delay(2000);
    return;
  }

  Serial.print("Temperature: ");
  Serial.println(temperature);

  Serial.print("Humidity: ");
  Serial.println(humidity);

  if (WiFi.status() == WL_CONNECTED) {

    HTTPClient http;

    http.begin(SUPABASE_URL);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", SUPABASE_API_KEY);
    http.addHeader("Authorization", "Bearer " SUPABASE_API_KEY);
    http.addHeader("Prefer", "return=minimal");

    String jsonData = "{";
    jsonData += "\"temperature\":" + String(temperature) + ",";
    jsonData += "\"humidity\":" + String(humidity);
    jsonData += "}";

    int httpResponseCode = http.POST(jsonData);

    Serial.print("HTTP Response: ");
    Serial.println(httpResponseCode);

    http.end();
  }

  delay(5000);
}