// ============================================
// CONFIGURATION
// ============================================
const API_BASE = 'api';
const REFRESH_INTERVAL = 10000; // 10 seconds
let currentHours = 24;
let currentPage = 1;
let combinedChart, temperatureChart, humidityChart;

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initCharts();
    fetchAllData();
    startAutoRefresh();
    setupEventListeners();
});

function setupEventListeners() {
    // Time range buttons
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentHours = parseInt(btn.dataset.hours);
            fetchHistoryData();
            fetchStats();
        });
    });

    // Refresh table button
    document.getElementById('refreshTable').addEventListener('click', () => {
        const icon = document.querySelector('#refreshTable i');
        icon.style.animation = 'spin 1s linear';
        fetchTableData();
        setTimeout(() => icon.style.animation = '', 1000);
    });
}

// ============================================
// DATA FETCHING
// ============================================
function fetchAllData() {
    fetchLatestData();
    fetchHistoryData();
    fetchStats();
    fetchTableData();
}

async function fetchLatestData() {
    try {
        const response = await fetch(`${API_BASE}/get_data.php?action=latest`);
        const result = await response.json();

        if (result.status === 'success' && result.data) {
            updateCurrentReadings(result.data);
            updateConnectionStatus('online');
        } else {
            updateConnectionStatus('offline');
        }
    } catch (error) {
        console.error('Error fetching latest data:', error);
        updateConnectionStatus('offline');
    }
}

async function fetchHistoryData() {
    try {
        const response = await fetch(
            `${API_BASE}/get_data.php?action=history&hours=${currentHours}&limit=500`
        );
        const result = await response.json();

        if (result.status === 'success') {
            updateCharts(result.data);
        }
    } catch (error) {
        console.error('Error fetching history:', error);
    }
}

async function fetchStats() {
    try {
        const response = await fetch(
            `${API_BASE}/get_data.php?action=stats&hours=${currentHours}`
        );
        const result = await response.json();

        if (result.status === 'success') {
            updateStats(result.data);
        }
    } catch (error) {
        console.error('Error fetching stats:', error);
    }
}

async function fetchTableData() {
    try {
        const response = await fetch(
            `${API_BASE}/get_data.php?action=all&page=${currentPage}&per_page=15`
        );
        const result = await response.json();

        if (result.status === 'success') {
            updateTable(result.data);
            updatePagination(result);
            document.getElementById('totalReadings').textContent = result.total;
        }
    } catch (error) {
        console.error('Error fetching table data:', error);
    }
}

// ============================================
// UI UPDATES
// ============================================
function updateCurrentReadings(data) {
    const temp = parseFloat(data.temperature);
    const humidity = parseFloat(data.humidity);

    // Update values with animation
    animateValue('currentTemp', temp, 1);
    animateValue('currentHumidity', humidity, 1);

    // Update gauges (temperature: 0-50 range, humidity: 0-100 range)
    const tempPercent = Math.min((temp / 50) * 100, 100);
    const humidityPercent = Math.min(humidity, 100);

    document.getElementById('tempGauge').style.width = `${tempPercent}%`;
    document.getElementById('humidityGauge').style.width = `${humidityPercent}%`;

    // Update comfort level
    updateComfortLevel(temp, humidity);

    // Update last update time
    const time = new Date(data.recorded_at).toLocaleString();
    document.getElementById('lastUpdate').textContent = `Last update: ${time}`;
}

function animateValue(elementId, target, decimals) {
    const element = document.getElementById(elementId);
    const current = parseFloat(element.textContent) || 0;
    const duration = 800;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        const value = current + (target - current) * eased;

        element.textContent = value.toFixed(decimals);

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

function updateComfortLevel(temp, humidity) {
    const comfortEl = document.getElementById('comfortLevel');
    const emojiEl = document.getElementById('comfortEmoji');
    let level, emoji;

    if (temp >= 20 && temp <= 26 && humidity >= 30 && humidity <= 60) {
        level = 'Comfortable';
        emoji = '😊';
    } else if (temp > 35 || humidity > 80) {
        level = 'Very Hot';
        emoji = '🥵';
    } else if (temp > 26 || humidity > 60) {
        level = 'Warm';
        emoji = '😓';
    } else if (temp < 15) {
        level = 'Cold';
        emoji = '🥶';
    } else if (temp < 20) {
        level = 'Cool';
        emoji = '🌬️';
    } else {
        level = 'Moderate';
        emoji = '🌤️';
    }

    comfortEl.textContent = level;
    emojiEl.textContent = emoji;
}

function updateConnectionStatus(status) {
    const dot = document.querySelector('.status-dot');
    const text = document.querySelector('.status-text');

    dot.className = 'status-dot ' + status;
    text.textContent = status === 'online' ? 'Connected' : 'Disconnected';
}

function updateStats(data) {
    document.getElementById('minTemp').textContent = `${data.min_temp ?? '--'}°C`;
    document.getElementById('maxTemp').textContent = `${data.max_temp ?? '--'}°C`;
    document.getElementById('avgTemp').textContent = `${data.avg_temp ?? '--'}°C`;
    document.getElementById('minHumidity').textContent = `${data.min_humidity ?? '--'}%`;
    document.getElementById('maxHumidity').textContent = `${data.max_humidity ?? '--'}%`;
    document.getElementById('avgHumidity').textContent = `${data.avg_humidity ?? '--'}%`;
}

function updateTable(data) {
    const tbody = document.getElementById('tableBody');

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="no-data">No data available</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(row => `
        <tr>
            <td>${row.id}</td>
            <td>
                <span style="color: ${getTempColor(row.temperature)}; font-weight: 600;">
                    ${parseFloat(row.temperature).toFixed(1)}°C
                </span>
            </td>
            <td>
                <span style="color: ${getHumidityColor(row.humidity)}; font-weight: 600;">
                    ${parseFloat(row.humidity).toFixed(1)}%
                </span>
            </td>
            <td>${new Date(row.recorded_at).toLocaleString()}</td>
        </tr>
    `).join('');
}

function updatePagination(result) {
    const pagination = document.getElementById('pagination');
    const totalPages = result.total_pages;

    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = '';

    // Previous button
    if (currentPage > 1) {
        html += `<button class="page-btn" onclick="goToPage(${currentPage - 1})">«</button>`;
    }

    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" 
                 onclick="goToPage(${i})">${i}</button>`;
    }

    // Next button
    if (currentPage < totalPages) {
        html += `<button class="page-btn" onclick="goToPage(${currentPage + 1})">»</button>`;
    }

    pagination.innerHTML = html;
}

function goToPage(page) {
    currentPage = page;
    fetchTableData();
}

// ============================================
// CHART SETUP & UPDATE
// ============================================
function initCharts() {
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 800, easing: 'easeInOutQuart' },
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: {
                labels: { color: '#94a3b8', font: { size: 12 } }
            },
            tooltip: {
                backgroundColor: '#1e293b',
                titleColor: '#f1f5f9',
                bodyColor: '#94a3b8',
                borderColor: '#334155',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 8
            }
        },
        scales: {
            x: {
                ticks: { color: '#64748b', maxTicksLimit: 10, maxRotation: 45 },
                grid: { color: 'rgba(255,255,255,0.05)' }
            },
            y: {
                ticks: { color: '#64748b' },
                grid: { color: 'rgba(255,255,255,0.05)' }
            }
        }
    };

    // Combined Chart
    const ctxCombined = document.getElementById('combinedChart').getContext('2d');
    combinedChart = new Chart(ctxCombined, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Temperature (°C)',
                    data: [],
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 2,
                    pointHoverRadius: 6,
                    yAxisID: 'y'
                },
                {
                    label: 'Humidity (%)',
                    data: [],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 2,
                    pointHoverRadius: 6,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            ...chartOptions,
            plugins: {
                ...chartOptions.plugins,
                title: {
                    display: true,
                    text: 'Temperature & Humidity Combined',
                    color: '#f1f5f9',
                    font: { size: 14, weight: '600' }
                }
            },
            scales: {
                ...chartOptions.scales,
                y: {
                    ...chartOptions.scales.y,
                    position: 'left',
                    title: { display: true, text: 'Temperature (°C)', color: '#ef4444' }
                },
                y1: {
                    position: 'right',
                    ticks: { color: '#64748b' },
                    grid: { drawOnChartArea: false },
                    title: { display: true, text: 'Humidity (%)', color: '#3b82f6' }
                }
            }
        }
    });

    // Temperature Chart
    const ctxTemp = document.getElementById('temperatureChart').getContext('2d');
    temperatureChart = new Chart(ctxTemp, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Temperature (°C)',
                data: [],
                borderColor: '#ef4444',
                backgroundColor: createGradient(ctxTemp, 'rgba(239,68,68,0.3)', 'rgba(239,68,68,0)'),
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 2,
                pointBackgroundColor: '#ef4444',
                pointHoverRadius: 6
            }]
        },
        options: {
            ...chartOptions,
            plugins: {
                ...chartOptions.plugins,
                title: {
                    display: true,
                    text: 'Temperature Over Time',
                    color: '#f1f5f9',
                    font: { size: 14, weight: '600' }
                }
            }
        }
    });

    // Humidity Chart
    const ctxHumidity = document.getElementById('humidityChart').getContext('2d');
    humidityChart = new Chart(ctxHumidity, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Humidity (%)',
                data: [],
                borderColor: '#3b82f6',
                backgroundColor: createGradient(ctxHumidity, 'rgba(59,130,246,0.3)', 'rgba(59,130,246,0)'),
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 2,
                pointBackgroundColor: '#3b82f6',
                pointHoverRadius: 6
            }]
        },
        options: {
            ...chartOptions,
            plugins: {
                ...chartOptions.plugins,
                title: {
                    display: true,
                    text: 'Humidity Over Time',
                    color: '#f1f5f9',
                    font: { size: 14, weight: '600' }
                }
            }
        }
    });
}

function createGradient(ctx, color1, color2) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    return gradient;
}

function updateCharts(data) {
    if (!data || data.length === 0) return;

    const labels = data.map(d => {
        const date = new Date(d.recorded_at);
        if (currentHours <= 24) {
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' });
    });

    const temps = data.map(d => parseFloat(d.temperature));
    const humidities = data.map(d => parseFloat(d.humidity));

    // Update Combined Chart
    combinedChart.data.labels = labels;
    combinedChart.data.datasets[0].data = temps;
    combinedChart.data.datasets[1].data = humidities;
    combinedChart.update('active');

    // Update Temperature Chart
    temperatureChart.data.labels = labels;
    temperatureChart.data.datasets[0].data = temps;
    temperatureChart.update('active');

    // Update Humidity Chart
    humidityChart.data.labels = labels;
    humidityChart.data.datasets[0].data = humidities;
    humidityChart.update('active');
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function getTempColor(temp) {
    temp = parseFloat(temp);
    if (temp >= 35) return '#ef4444';
    if (temp >= 28) return '#f97316';
    if (temp >= 20) return '#22c55e';
    if (temp >= 15) return '#3b82f6';
    return '#8b5cf6';
}

function getHumidityColor(humidity) {
    humidity = parseFloat(humidity);
    if (humidity >= 80) return '#ef4444';
    if (humidity >= 60) return '#f97316';
    if (humidity >= 30) return '#22c55e';
    return '#3b82f6';
}

// ============================================
// AUTO REFRESH
// ============================================
function startAutoRefresh() {
    setInterval(() => {
        fetchLatestData();
        fetchHistoryData();
        fetchStats();
    }, REFRESH_INTERVAL);
}

// Make goToPage global
window.goToPage = goToPage;
