
let isPaused = false;

type SensorName = 'Brake' | 'Collision' | 'Speed';

// Sensor priority mapping
const sensorPriority: Record<SensorName, number> = {
	Brake: 7,      // Highest
	Collision: 6,  // High
	Speed: 5,      // Medium
};

// Statistics tracking
const stats = {
	startTime: Date.now(),
	brakeCounts: 0,
	collisionCounts: 0,
	speedCounts: 0,
	totalEvents: 0,
	totalInterrupts: 0,
	eventTimestamps: [] as number[],
	responseTimes: [] as number[],
};

// Utility to get button selector by sensor
const sensorButtonSelector: Record<SensorName, string> = {
	Brake: '.btn-brake',
	Collision: '.btn-collision',
	Speed: '.btn-speed',
};

// Trigger a sensor interrupt
async function triggerSensor(sensorName: SensorName): Promise<void> {
	try {
		const eventStartTime = Date.now();
		
		// Visual feedback
		const btnElement = document.querySelector<HTMLButtonElement>(sensorButtonSelector[sensorName]);
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
		if (sensorName === 'Brake') stats.brakeCounts++;
		else if (sensorName === 'Collision') stats.collisionCounts++;
		else if (sensorName === 'Speed') stats.speedCounts++;
		
		addSystemEventLog(`[P${priority}] Triggered ${sensorName} sensor`, 'info');

		const response = await fetch(`/api/trigger-sensor/${sensorName}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
		});
		const data = await response.json();
		
		// Calculate response time
		const responseTime = Date.now() - eventStartTime;
		stats.responseTimes.push(responseTime);
		
		if (data.status === 'success') {
			addSystemEventLog(`✓ [P${priority}] ${sensorName} executed successfully`, 'success');
		} else {
			addSystemEventLog(`✗ Failed to trigger ${sensorName}`, 'error');
		}
		
		// Update statistics display
		updateStatistics();
	} catch (error: any) {
		addSystemEventLog(`✗ Error: ${error.message}`, 'error');
	}
}

// Animate car based on sensor type
function animateCarForSensor(sensorName: SensorName): void {
	const brakeLight = document.querySelector<SVGRectElement>('.brake-light');
	const warningLight = document.querySelector<SVGRectElement>('.warning-light');
	const speedIndicator = document.querySelector<SVGGElement>('.speed-indicator');

	if (sensorName === 'Brake') {
		if (brakeLight) {
			brakeLight.setAttribute('opacity', '1');
			setTimeout(() => brakeLight.setAttribute('opacity', '0'), 1000);
		}
		updateCarStatus('brake', 'On', 'brake-on');
		setTimeout(() => updateCarStatus('brake', 'Off', 'brake-off'), 1000);
	} else if (sensorName === 'Collision') {
		if (warningLight) {
			warningLight.setAttribute('opacity', '1');
			setTimeout(() => warningLight.setAttribute('opacity', '0'), 1500);
		}
		updateCarStatus('collision', 'Warning!', 'warning');
		setTimeout(() => updateCarStatus('collision', 'Safe', 'safe'), 1500);
	} else if (sensorName === 'Speed') {
		if (speedIndicator) {
			speedIndicator.setAttribute('opacity', '1');
			setTimeout(() => speedIndicator.setAttribute('opacity', '0'), 600);
		}
		updateCarStatus('speed', '60 km/h', 'speed');
		setTimeout(() => updateCarStatus('speed', '0 km/h', ''), 1000);
	}
}

// Update car status display
function updateCarStatus(property: string, value: string, className: string): void {
	const element = document.getElementById(property);
	if (element) {
		element.textContent = value;
		element.className = `status-value ${className}`;
	}
}

// Add event log entry to system logs panel
function addSystemEventLog(message: string, type: 'success' | 'error' | 'info' | 'warning'): void {
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
			if (priority === '7') priorityLabel = 'HIGHEST';
			else if (priority === '6') priorityLabel = 'HIGH';
			else if (priority === '5') priorityLabel = 'MEDIUM';
			
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
		if (priority) entry.appendChild(priorityBadge);
		entry.appendChild(msg);
		systemLog.insertBefore(entry, systemLog.firstChild);
		
		// Limit log size to 50 entries
		while (systemLog.children.length > 50) {
			systemLog.removeChild(systemLog.lastChild!);
		}
	}
}

// Setup clear button
function setupClearLogButton(): void {
	const clearBtn = document.querySelector<HTMLButtonElement>('.logs-clear-btn');
	if (clearBtn) {
		clearBtn.addEventListener('click', () => {
			const systemLog = document.getElementById('system-events-log');
			if (systemLog) {
				systemLog.innerHTML = '';
				addSystemEventLog('Log cleared', 'info');
			}
		});
	}
}

// Download logs as text file
function downloadLogs(): void {
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
async function fetchSensorData(): Promise<void> {
	if (isPaused) return;
	try {
		const response = await fetch('/api/sensor-data');
		const data = await response.json();
		// Optionally update UI with new data
	} catch (error) {
		// Optionally handle error
	}
}

// Update statistics display
function updateStatistics(): void {
	// Event statistics
	const brakeEventsEl = document.getElementById('brake-events');
	const collisionEventsEl = document.getElementById('collision-events');
	const speedEventsEl = document.getElementById('speed-events');
	const totalEventsEl = document.getElementById('total-events');
	
	if (brakeEventsEl) brakeEventsEl.textContent = stats.brakeCounts.toString();
	if (collisionEventsEl) collisionEventsEl.textContent = stats.collisionCounts.toString();
	if (speedEventsEl) speedEventsEl.textContent = stats.speedCounts.toString();
	if (totalEventsEl) totalEventsEl.textContent = stats.totalEvents.toString();
	
	// Interrupt statistics
	const totalInterruptsEl = document.getElementById('total-interrupts');
	const interruptsPerSecEl = document.getElementById('interrupts-per-sec');
	const avgResponseTimeEl = document.getElementById('avg-response-time');
	
	if (totalInterruptsEl) totalInterruptsEl.textContent = stats.totalInterrupts.toString();
	
	// Calculate interrupts per second
	const elapsedSeconds = (Date.now() - stats.startTime) / 1000;
	const interruptsPerSec = (stats.totalInterrupts / elapsedSeconds).toFixed(2);
	if (interruptsPerSecEl) interruptsPerSecEl.textContent = interruptsPerSec;
	
	// Calculate average response time
	if (stats.responseTimes.length > 0) {
		const avgTime = stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length;
		if (avgResponseTimeEl) avgResponseTimeEl.textContent = avgTime.toFixed(2) + ' ms';
	}
}

// Update system uptime
function updateUptime(): void {
	const uptimeEl = document.getElementById('system-uptime');
	if (uptimeEl) {
		const elapsedMs = Date.now() - stats.startTime;
		const hours = Math.floor(elapsedMs / 3600000);
		const minutes = Math.floor((elapsedMs % 3600000) / 60000);
		const seconds = Math.floor((elapsedMs % 60000) / 1000);
		
		const pad = (n: number) => n < 10 ? '0' + n : n.toString();
		uptimeEl.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
	}
}

// Calculate CPU load (based on events processed)
function updateCPULoad(): void {
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
function manualRefresh(): void {
	fetchSensorData();
	addSystemEventLog('✓ Dashboard refreshed manually', 'success');
}

// Pause/Resume System button handler
function togglePauseSystem(): void {
	const pauseBtn = document.getElementById('pauseBtn') as HTMLButtonElement;
	if (pauseBtn) {
		isPaused = !isPaused;
		if (isPaused) {
			pauseBtn.textContent = 'Resume System';
			pauseBtn.style.background = '#ef4444';
			addSystemEventLog('⏸ System paused', 'warning');
		} else {
			pauseBtn.textContent = 'Pause System';
			pauseBtn.style.background = '';
			addSystemEventLog('▶ System resumed', 'success');
		}
	}
}

// Reset Dashboard button handler
function resetDashboard(): void {
	// Confirm before reset
	if (confirm('Are you sure you want to reset the dashboard? All statistics will be cleared.')) {
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
			addSystemEventLog('System reset - Dashboard cleared', 'info');
		}
		
		// Update statistics display
		updateStatistics();
		addSystemEventLog('✓ Dashboard reset successfully', 'success');
	}
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
	
	addSystemEventLog('System initialized', 'info');
});

// Export to PowerPoint function
function exportToPPT(): void {
	addSystemEventLog('📊 Generating PowerPoint presentation...', 'info');
	
	// Collect all data for presentation
	const presentationData = {
		title: 'Real-Time Vehicle Sensor Management System',
		subtitle: 'Interrupt-Driven RTOS Simulation Report',
		timestamp: new Date().toLocaleString(),
		statistics: {
			brakeEvents: stats.brakeCounts,
			collisionEvents: stats.collisionCounts,
			speedEvents: stats.speedCounts,
			totalEvents: stats.totalEvents,
			totalInterrupts: stats.totalInterrupts,
			avgResponseTime: stats.responseTimes.length > 0 
				? (stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length).toFixed(2) + ' ms'
				: '0 ms',
			systemUptime: formatUptime(Date.now() - stats.startTime),
			cpuLoad: calculateCPULoad() + '%'
		},
		events: getRecentEvents(50)
	};
	
	// Create PowerPoint content (simplified - creates a text file that can be imported)
	let pptContent = `Real-Time Vehicle Sensor Management System\n`;
	pptContent += `Interrupt-Driven RTOS Simulation Report\n`;
	pptContent += `==========================================\n\n`;
	pptContent += `Generated: ${presentationData.timestamp}\n\n`;
	pptContent += `SYSTEM STATISTICS\n`;
	pptContent += `-----------------\n`;
	pptContent += `Brake Events (Priority 7): ${presentationData.statistics.brakeEvents}\n`;
	pptContent += `Collision Events (Priority 6): ${presentationData.statistics.collisionEvents}\n`;
	pptContent += `Speed Events (Priority 5): ${presentationData.statistics.speedEvents}\n`;
	pptContent += `Total Events: ${presentationData.statistics.totalEvents}\n`;
	pptContent += `Total Interrupts: ${presentationData.statistics.totalInterrupts}\n`;
	pptContent += `Average Response Time: ${presentationData.statistics.avgResponseTime}\n`;
	pptContent += `System Uptime: ${presentationData.statistics.systemUptime}\n`;
	pptContent += `CPU Load: ${presentationData.statistics.cpuLoad}\n\n`;
	pptContent += `RECENT EVENTS\n`;
	pptContent += `-------------\n`;
	
	const systemLog = document.getElementById('system-events-log');
	if (systemLog) {
		const logItems = systemLog.querySelectorAll('.log-item');
		logItems.forEach((item, index) => {
			const timeSpan = item.querySelector('.log-time');
			const msgSpan = item.querySelector('.log-msg');
			if (timeSpan && msgSpan) {
				pptContent += `${index + 1}. [${timeSpan.textContent}] ${msgSpan.textContent}\n`;
			}
		});
	}
	
	pptContent += `\n\n==========================================\n`;
	pptContent += `End of Report\n`;
	
	// Create and download file
	const blob = new Blob([pptContent], { type: 'text/plain' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = `RTOS_Report_${new Date().toISOString().split('T')[0]}.txt`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
	
	addSystemEventLog('✓ PowerPoint report exported successfully', 'success');
}

function formatUptime(ms: number): string {
	const hours = Math.floor(ms / 3600000);
	const minutes = Math.floor((ms % 3600000) / 60000);
	const seconds = Math.floor((ms % 60000) / 1000);
	const pad = (n: number) => n < 10 ? '0' + n : n.toString();
	return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function getRecentEvents(count: number): string[] {
	const systemLog = document.getElementById('system-events-log');
	if (!systemLog) return [];
	const logItems = systemLog.querySelectorAll('.log-item');
	return Array.from(logItems).slice(0, count).map(item => {
		const timeSpan = item.querySelector('.log-time');
		const msgSpan = item.querySelector('.log-msg');
		return timeSpan && msgSpan ? `[${timeSpan.textContent}] ${msgSpan.textContent}` : '';
	}).filter(Boolean);
}

function calculateCPULoad(): number {
	const elapsedSeconds = (Date.now() - stats.startTime) / 1000;
	const eventRate = stats.totalEvents / Math.max(elapsedSeconds, 1);
	return Math.min(100, Math.round((eventRate / 100) * 100));
}

// Expose triggerSensor, downloadLogs, and exportToPPT globally for HTML onclick
(window as any).triggerSensor = triggerSensor;
(window as any).downloadLogs = downloadLogs;
(window as any).exportToPPT = exportToPPT;
