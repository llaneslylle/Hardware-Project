// ===== Firebase Configuration =====
const firebaseConfig = {
  apiKey: "AIzaSyBqH95nsWmoZV7xGNHQdqE9JiLIvvzX1Zc",
  authDomain: "esp32timperature.firebaseapp.com",
  databaseURL: "https://esp32timperature-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "esp32timperature",
  storageBucket: "esp32timperature.firebasestorage.app",
  messagingSenderId: "220730705611",
  appId: "1:220730705611:web:8f74f1244c6fb511ce3d4e",
  measurementId: "G-BY0MTVMS34"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// DOM elements
const tempValue = document.getElementById("tempValue");
const humValue = document.getElementById("humValue");

// ===== Chart setup =====
const tempCtx = document.getElementById('tempChart').getContext('2d');
const humCtx = document.getElementById('humChart').getContext('2d');

const tempChart = new Chart(tempCtx, {
  type: 'line',
  data: { labels: [], datasets: [{ label: 'Temperature °C', data: [], borderColor: 'red', fill: false }] },
  options: { responsive: true, scales: { y: { min: 0, max: 50 } } }
});

const humChart = new Chart(humCtx, {
  type: 'line',
  data: { labels: [], datasets: [{ label: 'Humidity %', data: [], borderColor: 'blue', fill: false }] },
  options: { responsive: true, scales: { y: { min: 0, max: 100 } } }
});

// ===== Add data to chart =====
function addDataToChart(chart, label, value) {
  chart.data.labels.push(label);
  chart.data.datasets[0].data.push(value);
  if(chart.data.labels.length > 50) { // keep last 50 points
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
  }
  chart.update();
}

// ===== Load historical data =====
database.ref('/history').once('value').then(snapshot => {
  const history = snapshot.val();
  if(history){
    const sortedKeys = Object.keys(history).sort((a,b)=>parseInt(a)-parseInt(b));
    sortedKeys.forEach(ts => {
      const entry = history[ts];
      const timeLabel = new Date(parseInt(ts)).toLocaleTimeString();
      addDataToChart(tempChart, timeLabel, entry.temperature);
      addDataToChart(humChart, timeLabel, entry.humidity);
    });
  }
});

// ===== Live updates listener =====
database.ref('/sensor').on('value', snapshot => {
  const data = snapshot.val();
  if (data) {
    const temp = data.temperature;
    const hum = data.humidity;
    const now = new Date().toLocaleTimeString();

    // Update live DOM
    tempValue.innerText = temp.toFixed(1);
    humValue.innerText = hum.toFixed(1);

    // Add to charts
    addDataToChart(tempChart, now, temp);
    addDataToChart(humChart, now, hum);
  }
});