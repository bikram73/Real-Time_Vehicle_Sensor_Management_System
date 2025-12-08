"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
let isPaused = false;
// Sensor priority mapping
const sensorPriority = {
    Brake: 7, // Highest
    Collision: 6, // High
    Speed: 5, // Medium
};
// Statistics tracking
const stats = {
    startTime: Date.now(),
    brakeCounts: 0,
    collisionCounts: 0,
    speedCounts: 0,
    totalEvents: 0,
    totalInterrupts: 0,
    eventTimestamps: [],
    responseTimes: [],
};
// Utility to get button selector by sensor
const sensorButtonSelector = {
    Brake: '.btn-brake',
    Collision: '.btn-collision',
    Speed: '.btn-speed',
};
// Trigger a sensor interrupt
function triggerSensor(sensorName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const eventStartTime = Date.now();
            // Visual feedback
            const btnElement = document.querySelector(sensorButtonSelector[sensorName]);
            if (btnElement) {
                btnElement.classList.add('active');
                setTimeout(() => btnElement.classList.remove('active'), 300);
            }
            animateCarForSensor(sensorName);
            const priority = sensorPriority[sensorName];
            // Track event
            stats.totalInterrupts++;
            stats.totalEvents++;
            stats.eventTimestamps.push(eventStartTime);
            // Count by sensor
            if (sensorName === 'Brake')
                stats.brakeCounts++;
            else if (sensorName === 'Collision')
                stats.collisionCounts++;
            else if (sensorName === 'Speed')
                stats.speedCounts++;
            const response = yield fetch(`/api/trigger-sensor/${sensorName}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = yield response.json();
            // Calculate response time
            const responseTime = Date.now() - eventStartTime;
            stats.responseTimes.push(responseTime);
            if (data.status === 'success') {
                // Fetch and display the detailed event logs from backend
                setTimeout(() => fetchAndDisplayEventLogs(), 200);
            }
            else {
                addSystemEventLog(`✗ Failed to trigger ${sensorName}`, 'error');
            }
            // Update statistics display
            updateStatistics();
        }
        catch (error) {
            addSystemEventLog(`✗ Error: ${error.message}`, 'error');
        }
    });
}
// Animate car based on sensor type
function animateCarForSensor(sensorName) {
    const brakeLight = document.querySelector('.brake-light');
    const warningLight = document.querySelector('.warning-light');
    const speedIndicator = document.querySelector('.speed-indicator');
    if (sensorName === 'Brake') {
        if (brakeLight) {
            brakeLight.setAttribute('opacity', '1');
            setTimeout(() => brakeLight.setAttribute('opacity', '0'), 1000);
        }
        updateCarStatus('brake', 'On', 'brake-on');
        setTimeout(() => updateCarStatus('brake', 'Off', 'brake-off'), 1000);
    }
    else if (sensorName === 'Collision') {
        if (warningLight) {
            warningLight.setAttribute('opacity', '1');
            setTimeout(() => warningLight.setAttribute('opacity', '0'), 1500);
        }
        updateCarStatus('collision', 'Warning!', 'warning');
        setTimeout(() => updateCarStatus('collision', 'Safe', 'safe'), 1500);
    }
    else if (sensorName === 'Speed') {
        if (speedIndicator) {
            speedIndicator.setAttribute('opacity', '1');
            setTimeout(() => speedIndicator.setAttribute('opacity', '0'), 600);
        }
        updateCarStatus('speed', '60 km/h', 'speed');
        setTimeout(() => updateCarStatus('speed', '0 km/h', ''), 1000);
    }
}
// Update car status display
function updateCarStatus(property, value, className) {
    const element = document.getElementById(property);
    if (element) {
        element.textContent = value;
        element.className = `status-value ${className}`;
    }
}
// Add event log entry to system logs panel
function addSystemEventLog(message, type) {
    const systemLog = document.getElementById('system-events-log');
    if (systemLog) {
        const entry = document.createElement('div');
        entry.className = `log-item ${type}`;
        // Extract priority from message if present
        const priorityMatch = message.match(/\[P(\d+)\]/);
        let priority = '';
        let displayMessage = message;
        if (priorityMatch) {
            priority = priorityMatch[1];
            // Determine priority label
            let priorityLabel = '';
            if (priority === '7')
                priorityLabel = 'HIGHEST';
            else if (priority === '6')
                priorityLabel = 'HIGH';
            else if (priority === '5')
                priorityLabel = 'MEDIUM';
            // Remove [P#] from message for cleaner display
            displayMessage = message.replace(/\[P\d+\]\s*/, '').trim();
        }
        const time = document.createElement('span');
        time.className = 'log-time';
        time.textContent = new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        const priorityBadge = document.createElement('span');
        priorityBadge.className = 'log-priority';
        if (priority) {
            priorityBadge.textContent = `P${priority}`;
            priorityBadge.setAttribute('data-priority', priority);
        }
        const msg = document.createElement('span');
        msg.className = 'log-msg';
        msg.textContent = displayMessage;
        entry.appendChild(time);
        if (priority)
            entry.appendChild(priorityBadge);
        entry.appendChild(msg);
        systemLog.insertBefore(entry, systemLog.firstChild);
        // Limit log size to 50 entries
        while (systemLog.children.length > 50) {
            systemLog.removeChild(systemLog.lastChild);
        }
    }
}
// Setup clear button
function setupClearLogButton() {
    const clearBtn = document.querySelector('.logs-clear-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
            try {
                // Clear backend logs
                yield fetch('/api/clear-log', { method: 'POST' });
                
                // Clear frontend display
                const systemLog = document.getElementById('system-events-log');
                if (systemLog) {
                    systemLog.innerHTML = '';
                }
                
                // Refresh to show cleared logs
                setTimeout(() => fetchAndDisplayEventLogs(), 100);
            }
            catch (error) {
                console.error('Error clearing logs:', error);
            }
        }));
    }
}
// Download logs as text file
function downloadLogs() {
    const systemLog = document.getElementById('system-events-log');
    if (systemLog) {
        let logContent = 'Vehicle Sensor Management System - Event Logs\n';
        logContent += '='.repeat(50) + '\n';
        logContent += new Date().toLocaleString() + '\n';
        logContent += '='.repeat(50) + '\n\n';
        // Extract all log entries
        const logItems = systemLog.querySelectorAll('.log-item');
        logItems.forEach((item) => {
            const timeSpan = item.querySelector('.log-time');
            const msgSpan = item.querySelector('.log-msg');
            if (timeSpan && msgSpan) {
                const type = item.className.replace('log-item', '').trim().toUpperCase();
                logContent += `[${type}] ${timeSpan.textContent} - ${msgSpan.textContent}\n`;
            }
        });
        logContent += '\n' + '='.repeat(50) + '\n';
        logContent += `Total events: ${logItems.length}\n`;
        // Create blob and download
        const blob = new Blob([logContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `vehicle-logs-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        addSystemEventLog('✓ Logs downloaded successfully', 'success');
    }
}
// Fetch and update sensor data
function fetchSensorData() {
    return __awaiter(this, void 0, void 0, function* () {
        if (isPaused)
            return;
        try {
            const response = yield fetch('/api/sensor-data');
            const data = yield response.json();
            // Optionally update UI with new data
        }
        catch (error) {
            // Optionally handle error
        }
    });
}

// Fetch and display detailed event logs from backend
function fetchAndDisplayEventLogs() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch('/api/event-log');
            const data = yield response.json();
            
            if (data.events && data.events.length > 0) {
                const systemLog = document.getElementById('system-events-log');
                if (systemLog) {
                    // Clear existing logs to avoid duplicates
                    systemLog.innerHTML = '';
                    
                    // Display last 20 events, most recent first
                    const recentEvents = data.events.slice(-20).reverse();
                    
                    recentEvents.forEach(event => {
                        const entry = createDetailedLogEntry(event);
                        if (entry) {
                            systemLog.appendChild(entry);
                        }
                    });
                }
            }
        }
        catch (error) {
            console.error('Error fetching event logs:', error);
        }
    });
}

// Create detailed log entry with priority badges
function createDetailedLogEntry(eventText) {
    const entry = document.createElement('div');
    entry.className = 'log-item';
    
    // Extract timestamp and message
    const timestampMatch = eventText.match(/\[(\d+)\]/);
    const timestamp = timestampMatch ? timestampMatch[1] : Date.now().toString();
    
    // Format timestamp for display (microseconds to readable time)
    const displayTime = formatMicrosecondTimestamp(timestamp);
    
    // Determine log type and priority badge
    let logType = 'info';
    let priorityBadge = '';
    
    if (eventText.includes('Brake')) {
        logType = 'priority-7';
        priorityBadge = '<span class="priority-badge p7">[P7]</span>';
    } else if (eventText.includes('Collision')) {
        logType = 'priority-6';
        priorityBadge = '<span class="priority-badge p6">[P6]</span>';
    } else if (eventText.includes('Speed')) {
        logType = 'priority-5';
        priorityBadge = '<span class="priority-badge p5">[P5]</span>';
    } else if (eventText.includes('PREEMPT')) {
        logType = 'preemption';
        priorityBadge = '<span class="priority-badge preempt">[PREEMPT]</span>';
    } else if (eventText.includes('ISR_ENTRY') || eventText.includes('ISR_EXIT')) {
        logType = 'isr';
        priorityBadge = '<span class="priority-badge isr">[ISR]</span>';
    } else if (eventText.includes('TASK_START') || eventText.includes('TASK_END')) {
        logType = 'task';
        priorityBadge = '<span class="priority-badge task">[TASK]</span>';
    }
    
    entry.className = `log-item ${logType}`;
    entry.innerHTML = `
        <span class="log-time">${displayTime}</span>
        ${priorityBadge}
        <span class="log-msg">${eventText.replace(/\[\d+\]\s*/, '')}</span>
    `;
    
    return entry;
}

// Format microsecond timestamp to readable time
function formatMicrosecondTimestamp(microsecondStr) {
    // Convert microseconds to milliseconds
    const ms = parseInt(microsecondStr) / 1000;
    const date = new Date(ms);
    
    // Format as HH:MM:SS.microseconds
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const microseconds = (parseInt(microsecondStr) % 1000000).toString().padStart(6, '0');
    
    return `${hours}:${minutes}:${seconds}.${microseconds}`;
}
// Update statistics display
function updateStatistics() {
    // Event statistics
    const brakeEventsEl = document.getElementById('brake-events');
    const collisionEventsEl = document.getElementById('collision-events');
    const speedEventsEl = document.getElementById('speed-events');
    const totalEventsEl = document.getElementById('total-events');
    if (brakeEventsEl)
        brakeEventsEl.textContent = stats.brakeCounts.toString();
    if (collisionEventsEl)
        collisionEventsEl.textContent = stats.collisionCounts.toString();
    if (speedEventsEl)
        speedEventsEl.textContent = stats.speedCounts.toString();
    if (totalEventsEl)
        totalEventsEl.textContent = stats.totalEvents.toString();
    // Interrupt statistics
    const totalInterruptsEl = document.getElementById('total-interrupts');
    const interruptsPerSecEl = document.getElementById('interrupts-per-sec');
    const avgResponseTimeEl = document.getElementById('avg-response-time');
    if (totalInterruptsEl)
        totalInterruptsEl.textContent = stats.totalInterrupts.toString();
    // Calculate interrupts per second
    const elapsedSeconds = (Date.now() - stats.startTime) / 1000;
    const interruptsPerSec = (stats.totalInterrupts / elapsedSeconds).toFixed(2);
    if (interruptsPerSecEl)
        interruptsPerSecEl.textContent = interruptsPerSec;
    // Calculate average response time
    if (stats.responseTimes.length > 0) {
        const avgTime = stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length;
        if (avgResponseTimeEl)
            avgResponseTimeEl.textContent = avgTime.toFixed(2) + ' ms';
    }
}
// Update system uptime
function updateUptime() {
    const uptimeEl = document.getElementById('system-uptime');
    if (uptimeEl) {
        const elapsedMs = Date.now() - stats.startTime;
        const hours = Math.floor(elapsedMs / 3600000);
        const minutes = Math.floor((elapsedMs % 3600000) / 60000);
        const seconds = Math.floor((elapsedMs % 60000) / 1000);
        const pad = (n) => n < 10 ? '0' + n : n.toString();
        uptimeEl.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
}
// Calculate CPU load (based on events processed)
function updateCPULoad() {
    const cpuLoadEl = document.getElementById('cpu-load');
    if (cpuLoadEl) {
        // Estimate CPU load: higher event frequency = higher load
        const elapsedSeconds = (Date.now() - stats.startTime) / 1000;
        const eventRate = stats.totalEvents / Math.max(elapsedSeconds, 1);
        // Assume max 100 events/sec = 100% load
        const cpuLoad = Math.min(100, Math.round((eventRate / 100) * 100));
        cpuLoadEl.textContent = cpuLoad + '%';
    }
}
// Auto-update statistics every 500ms
setInterval(() => {
    updateUptime();
    updateCPULoad();
}, 500);
// Manual Refresh button handler
function manualRefresh() {
    fetchSensorData();
    fetchAndDisplayEventLogs();
}
// Pause/Resume System button handler
function togglePauseSystem() {
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) {
        isPaused = !isPaused;
        if (isPaused) {
            pauseBtn.textContent = 'Resume System';
            pauseBtn.style.background = '#ef4444';
        }
        else {
            pauseBtn.textContent = 'Pause System';
            pauseBtn.style.background = '';
        }
    }
}
// Reset Dashboard button handler
function resetDashboard() {
    return __awaiter(this, void 0, void 0, function* () {
        // Confirm before reset
        if (confirm('Are you sure you want to reset the dashboard? All statistics will be cleared.')) {
            try {
                // Clear backend logs
                yield fetch('/api/clear-log', { method: 'POST' });
                
                // Clear statistics
                stats.brakeCounts = 0;
                stats.collisionCounts = 0;
                stats.speedCounts = 0;
                stats.totalEvents = 0;
                stats.totalInterrupts = 0;
                stats.eventTimestamps = [];
                stats.responseTimes = [];
                stats.startTime = Date.now();
                
                // Clear logs
                const systemLog = document.getElementById('system-events-log');
                if (systemLog) {
                    systemLog.innerHTML = '';
                }
                
                // Update statistics display
                updateStatistics();
            }
            catch (error) {
                console.error('Error resetting dashboard:', error);
            }
        }
    });
}
// Setup button event listeners
document.addEventListener('DOMContentLoaded', () => {
    setupClearLogButton();
    // Setup control buttons
    const refreshBtn = document.getElementById('refreshBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const clearBtn = document.getElementById('clearBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', manualRefresh);
    }
    if (pauseBtn) {
        pauseBtn.addEventListener('click', togglePauseSystem);
    }
    if (clearBtn) {
        clearBtn.addEventListener('click', resetDashboard);
    }
    
    // Initial load of event logs
    fetchAndDisplayEventLogs();
    
    // Set up auto-refresh for event logs every 1 second
    setInterval(() => {
        if (!isPaused) {
            fetchAndDisplayEventLogs();
        }
    }, 1000);
    
    // Don't add simple log messages - only show detailed backend logs
});
// Expose triggerSensor and downloadLogs globally for HTML onclick
window.triggerSensor = triggerSensor;
window.downloadLogs = downloadLogs;
