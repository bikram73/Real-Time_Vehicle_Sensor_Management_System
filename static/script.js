let isPaused = false;

// Trigger a sensor interrupt
async function triggerSensor(sensorName) {
    try {
        // Add visual feedback to button
        const buttons = {
            'Brake': '.btn-brake',
            'Collision': '.btn-collision',
            'Speed': '.btn-speed'
        };
        
        const btnElement = document.querySelector(buttons[sensorName]);
        if (btnElement) {
            btnElement.classList.add('active');
            setTimeout(() => btnElement.classList.remove('active'), 300);
        }
        
        // Animate car based on sensor
        animateCarForSensor(sensorName);
        
        const response = await fetch(`/api/trigger-sensor/${sensorName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            addEventLog(`✓ ${sensorName} sensor triggered`, 'success');
            console.log(`${sensorName} sensor triggered successfully`);
        } else {
            addEventLog(`✗ Failed to trigger ${sensorName}`, 'error');
        }
    } catch (error) {
        console.error('Error triggering sensor:', error);
        addEventLog(`✗ Error: ${error.message}`, 'error');
    }
}

// Animate car based on sensor type
function animateCarForSensor(sensorName) {
    const brakeLight = document.querySelector('.brake-light');
    const warningLight = document.querySelector('.warning-light');
    const speedIndicator = document.querySelector('.speed-indicator');
    
    if (sensorName === 'Brake') {
        // Activate brake light
        if (brakeLight) {
            brakeLight.classList.add('active');
            setTimeout(() => brakeLight.classList.remove('active'), 1000);
        }
        
        // Update status
        updateCarStatus('brake', 'On', 'brake-on');
        setTimeout(() => updateCarStatus('brake', 'Off', 'brake-off'), 1000);
        
    } else if (sensorName === 'Collision') {
        // Activate warning light
        if (warningLight) {
            warningLight.classList.add('active');
            setTimeout(() => warningLight.classList.remove('active'), 1500);
        }
        
        // Add collision warning
        updateCarStatus('collision', 'Warning!', 'warning');
        setTimeout(() => updateCarStatus('collision', 'Safe', 'safe'), 1500);
        
    } else if (sensorName === 'Speed') {
        // Show speed indicator
        if (speedIndicator) {
            speedIndicator.classList.add('active');
            setTimeout(() => speedIndicator.classList.remove('active'), 600);
        }
        
        // Update speed
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

// Fetch and update sensor data
async function fetchSensorData() {
    if (isPaused) return;
    
    try {
        const response = await fetch('/api/sensor-data');
        const data = await response.json();
        
        // Update sensor values (car visualization and detail cards)
        document.getElementById('speed').textContent = data.speed + ' km/h';
        document.getElementById('temperature').textContent = data.temperature + ' °C';
        document.getElementById('collision').textContent = data.collision_status;
        document.getElementById('brake').textContent = data.brake_status;
        
        document.getElementById('speed-detail').textContent = data.speed + ' km/h';
        document.getElementById('temperature-detail').textContent = data.temperature + ' °C';
        document.getElementById('collision-detail').textContent = data.collision_status;
        document.getElementById('brake-detail').textContent = data.brake_status;
        
        // Update system info
        document.getElementById('active-task').textContent = data.active_task || 'Idle';
        document.getElementById('cpu-usage').textContent = data.cpu_usage + '%';
        
        // Update timestamp
        const date = new Date(data.timestamp);
        document.getElementById('timestamp').textContent = date.toLocaleTimeString();
        
    } catch (error) {
        console.error('Error fetching sensor data:', error);
        document.getElementById('health').textContent = '🔴 Connection Error';
    }
}

// Fetch and update system statistics for demo
async function fetchSystemStats() {
    if (isPaused) return;
    
    try {
        const response = await fetch('/api/system-stats');
        const stats = await response.json();
        
        // Update event statistics
        document.getElementById('brake-events').textContent = stats.brake_events || 0;
        document.getElementById('collision-events').textContent = stats.collision_events || 0;
        document.getElementById('speed-events').textContent = stats.speed_events || 0;
        document.getElementById('total-events').textContent = stats.total_events || 0;
        
        // Update interrupt statistics
        document.getElementById('total-interrupts').textContent = stats.total_interrupts || 0;
        document.getElementById('interrupts-per-sec').textContent = stats.interrupts_per_sec || 0;
        document.getElementById('avg-response-time').textContent = `${stats.avg_response_time || 0} μs`;
        
        // Update system information
        document.getElementById('system-uptime').textContent = formatUptime(stats.uptime || 0);
        document.getElementById('cpu-load').textContent = `${stats.cpu_usage || 0}%`;
        document.getElementById('system-status').textContent = stats.status || '🟢 Running';
        
    } catch (error) {
        console.error('Error fetching system stats:', error);
    }
}

// Format uptime in HH:MM:SS format
function formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${secs}`;
}

// Fetch event log with enhanced formatting
async function fetchEventLog() {
    if (isPaused) return;
    
    try {
        const response = await fetch('/api/event-log');
        const data = await response.json();
        
        if (data.events && data.events.length > 0) {
            const logDiv = document.getElementById('system-events-log');
            
            // Show last 20 events, most recent first
            data.events.slice(-20).reverse().forEach(event => {
                if (!logDiv.querySelector(`[data-event="${event}"]`)) {
                    const entry = createLogEntry(event);
                    if (entry) {
                        logDiv.appendChild(entry);
                    }
                }
            });
            
            // Keep only last 50 entries
            while (logDiv.children.length > 50) {
                logDiv.removeChild(logDiv.lastChild);
            }
        }
    } catch (error) {
        console.error('Error fetching event log:', error);
    }
}

// Create formatted log entry with priority badges
function createLogEntry(eventText) {
    const entry = document.createElement('div');
    entry.className = 'log-item';
    entry.setAttribute('data-event', eventText);
    
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

// Add event to system log with enhanced formatting
function addEventLog(message, type = 'info') {
    const logDiv = document.getElementById('system-events-log');
    
    if (!logDiv) return;
    
    const entry = createLogEntry(`[${Date.now()}] ${message}`);
    if (entry) {
        logDiv.insertBefore(entry, logDiv.firstChild);
        
        // Keep only last 50 entries
        while (logDiv.children.length > 50) {
            logDiv.removeChild(logDiv.lastChild);
        }
    }
}

// Download logs functionality
function downloadLogs() {
    const logDiv = document.getElementById('system-events-log');
    if (!logDiv) return;
    
    const logEntries = Array.from(logDiv.querySelectorAll('.log-item')).map(item => {
        const time = item.querySelector('.log-time')?.textContent || '';
        const msg = item.querySelector('.log-msg')?.textContent || '';
        return `${time} ${msg}`;
    });
    
    const logContent = logEntries.reverse().join('\n');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RTOS_Event_Log_${timestamp}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addEventLog('Event log downloaded successfully', 'success');
}

// Check system health
async function checkHealth() {
    if (isPaused) return;
    
    try {
        const response = await fetch('/health');
        const data = await response.json();
        if (data.status === 'healthy') {
            document.getElementById('health').textContent = '🟢 Healthy';
        }
    } catch (error) {
        console.error('Error checking health:', error);
        document.getElementById('health').textContent = '🔴 Unhealthy';
    }
}

// Clear event log
function clearEventLog() {
    const logDiv = document.getElementById('event-log');
    logDiv.innerHTML = '<div class="log-entry placeholder">Log cleared - waiting for events...</div>';
    addEventLog('Event log cleared', 'warning');
}

// Export event log
function exportEventLog() {
    const logDiv = document.getElementById('event-log');
    const entries = Array.from(logDiv.querySelectorAll('.log-entry'))
        .map(e => e.textContent)
        .join('\n');
    
    const blob = new Blob([entries], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `event-log-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    addEventLog('Event log exported', 'success');
}

// Clear all data and reset dashboard
async function clearData() {
    try {
        // Clear backend logs
        await fetch('/api/clear-log', { method: 'POST' });
        
        // Reset car status
        updateCarStatus('speed', '0 km/h', '');
        updateCarStatus('brake', 'Off', 'brake-off');
        updateCarStatus('collision', 'Safe', 'safe');
        
        // Clear frontend log display
        const logDiv = document.getElementById('system-events-log');
        if (logDiv) {
            logDiv.innerHTML = '<div class="log-item info"><span class="log-time">00:00:00</span><span class="log-msg">System initialized</span></div>';
        }
        
        // Reset statistics
        document.getElementById('brake-events').textContent = '0';
        document.getElementById('collision-events').textContent = '0';
        document.getElementById('speed-events').textContent = '0';
        document.getElementById('total-events').textContent = '0';
        document.getElementById('total-interrupts').textContent = '0';
        document.getElementById('interrupts-per-sec').textContent = '0';
        document.getElementById('avg-response-time').textContent = '0 μs';
        
        addEventLog('Dashboard reset successfully', 'success');
        
    } catch (error) {
        console.error('Error clearing data:', error);
        addEventLog('Error resetting dashboard', 'error');
    }
}

// Toggle pause
function togglePause() {
    isPaused = !isPaused;
    const btn = document.getElementById('pauseBtn');
    if (isPaused) {
        btn.textContent = 'Resume System';
        btn.style.background = '#27ae60';
        addEventLog('System paused', 'warning');
    } else {
        btn.textContent = 'Pause System';
        btn.style.background = '#e0e0e0';
        btn.style.color = '#333';
        addEventLog('System resumed', 'success');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard loaded');
    
    // Initial load
    fetchSensorData();
    fetchSystemStats();
    fetchEventLog();
    checkHealth();
    
    // Set up auto-refresh
    setInterval(fetchSensorData, 1000);      // Update every 1 second
    setInterval(fetchSystemStats, 2000);    // Update every 2 seconds
    setInterval(fetchEventLog, 1000);       // Update event log every 1 second
    setInterval(checkHealth, 5000);         // Check health every 5 seconds
    
    // Button event listeners
    document.getElementById('refreshBtn').addEventListener('click', function() {
        fetchSensorData();
        fetchSystemStats();
        fetchEventLog();
        checkHealth();
        addEventLog('Manual refresh executed', 'info');
    });
    
    document.getElementById('pauseBtn').addEventListener('click', togglePause);
    document.getElementById('clearBtn').addEventListener('click', clearData);
    
    addEventLog('System initialized and monitoring started', 'success');
});
