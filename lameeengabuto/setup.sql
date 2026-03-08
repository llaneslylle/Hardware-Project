-- Run this in phpMyAdmin (http://localhost/phpmyadmin)

CREATE DATABASE IF NOT EXISTS weather_monitoring;

USE weather_monitoring;

CREATE TABLE IF NOT EXISTS sensor_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    temperature FLOAT NOT NULL,
    humidity FLOAT NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_recorded_at ON sensor_data(recorded_at);

-- Optional: Insert sample data for testing
INSERT INTO sensor_data (temperature, humidity, recorded_at) VALUES
(25.5, 60.2, NOW() - INTERVAL 6 HOUR),
(26.1, 58.7, NOW() - INTERVAL 5 HOUR),
(27.3, 55.4, NOW() - INTERVAL 4 HOUR),
(28.0, 52.1, NOW() - INTERVAL 3 HOUR),
(26.8, 57.3, NOW() - INTERVAL 2 HOUR),
(25.9, 61.0, NOW() - INTERVAL 1 HOUR),
(25.2, 63.5, NOW());