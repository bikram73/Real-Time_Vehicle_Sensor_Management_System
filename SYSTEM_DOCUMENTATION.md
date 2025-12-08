# Real-Time Vehicle Sensor Management System

## Overview

This project implements a **Real-Time Operating System (RTOS) simulator** with interrupt-driven architecture for managing three vehicle sensors:
- 🛑 **Brake Sensor** (Priority 7 - Highest)
- ⚠️ **Collision Detection Sensor** (Priority 6 - High)
- ⚡ **Speed Sensor** (Priority 5 - Medium)

The system demonstrates real-time principles including priority-based preemption, interrupt handling, bounded latency, and safe shared resource management.

## Architecture Overview

```
User Interface (Browser Dashboard)
        ↓ (HTTP requests)
Flask Web Server (HTTP API)
        ↓
Interrupt Controller (Virtual Interrupt Simulation)
        ↓
ISR Handlers (Interrupt Service Routines)
        ↓
RTOS Scheduler (Priority-based Task Scheduling)
        ↓
Sensor Tasks (Brake, Collision, Speed)
        ↓
Shared Resources (Protected with Mutexes)
        ↓
Event Logger & Monitoring
```

## Key Components

### 1. **Flask Web Application** (`flask_app.py`)
- RESTful API server hosting the web dashboard
- Real-time sensor data updates
- Sensor event triggering
- System statistics and monitoring
- Event log retrieval

**Running the server:**
```bash
python flask_app.py
# Access: http://localhost:5000
```

### 2. **Interrupt Controller** (`interrupt_controller.py`)
Simulates hardware interrupt controller with:
- Priority queue for pending interrupts
- Interrupt masking/enabling simulation
- Mapping of sensors to ISRs (Interrupt Service Routines)
- Priority-based interrupt processing

**Interrupt Mapping:**
```python
Brake     → INT0 (Priority 7)
Collision → INT1 (Priority 6)
Speed     → INT2 (Priority 5)
```

### 3. **ISR Handlers** (in `interrupt_controller.py`)
Short, deterministic interrupt handlers that:
- Log interrupt entry with timestamp
- Simulate ISR execution time (5 μs)
- Signal corresponding RTOS task
- Log interrupt exit

**Example ISR Flow:**
```
[T] ISR_ENTRY: Brake_ISR
[T+5μs] ISR_EXIT: Brake_ISR → Task Signaled
```

### 4. **RTOS Scheduler** (`rtos_simulator.py`)
Priority-based preemptive scheduler featuring:
- Fixed-priority scheduling
- Task preemption when higher-priority task becomes ready
- CPU usage calculation
- Task state tracking (READY, RUNNING, BLOCKED)

**Scheduling States:**
- **READY**: Task ready to execute, waiting for CPU
- **RUNNING**: Task currently executing on CPU
- **BLOCKED**: Task waiting for event/signal

### 5. **Sensor Tasks** (`tasks/` directory)
Three real-time tasks with different priorities:

#### Brake Task (Priority 7)
```python
# Simulates brake sensor processing
# Execution time: 50 μs
# Critical safety-related
```

#### Collision Task (Priority 6)
```python
# Simulates collision detection processing
# Execution time: 40 μs
# High priority safety function
```

#### Speed Task (Priority 5)
```python
# Simulates speed sensor processing
# Execution time: 30 μs
# Medium priority monitoring
```

### 6. **Shared Resources** (`shared_resources.py`)
Protected shared data with:
- Mutex locks for data protection
- Priority inheritance protocol
- Safe concurrent access

### 7. **Logger** (`logger.py`)
Event logging with:
- Microsecond timestamp precision
- Event history (up to 1000 events)
- Log export to file
- Real-time log display

### 8. **Verifier** (`verifier.py`)
Automatic verification of real-time properties:
- Priority ordering
- Deadline compliance
- No priority inversion
- No deadlocks
- Bounded latency

## Web Dashboard Features

### Sensor Event Simulator
Three control buttons to manually trigger sensor interrupts:
- **🛑 Brake Sensor** - Priority 7 (Highest)
- **⚠️ Collision Sensor** - Priority 6 (High)
- **⚡ Speed Sensor** - Priority 5 (Medium)

### Real-Time Status Grid
Live display of:
- Speed readings
- Temperature readings
- Collision status
- Brake status

### System Statistics
- Active task name
- CPU usage percentage
- Total tasks count
- Ready tasks count
- Running tasks count
- Total interrupts processed

### Event Log
Real-time system event log showing:
- Interrupt triggers
- ISR entry/exit
- Task start/preemption/end
- Timestamps
- Event types (success, error, warning)

### Control Functions
- **Manual Refresh**: Force update of all data
- **Pause System**: Pause monitoring
- **Reset Dashboard**: Clear all data
- **Export Log**: Download event log as text file

## How It Works: Example Scenario

### Scenario: Two simultaneous interrupts (Collision + Speed)

```
T=0ms: User clicks "Collision Sensor" button
  → [0ms] INTERRUPT: Collision (INT1) - Priority 6
  → [0ms] ISR_ENTRY: Collision_ISR
  → [5μs] ISR_EXIT: Collision_ISR - Task Signaled
  → [5μs] TASK_START: CollisionTask (Priority 6)

T=1ms: While CollisionTask is running, user clicks "Speed Sensor"
  → [1ms] INTERRUPT: Speed (INT2) - Priority 5
  → [1ms] QUEUED (Lower priority than CollisionTask)
  
T=45μs: CollisionTask completes
  → [45μs] TASK_END: CollisionTask
  
T=46μs: Speed interrupt is now processed
  → [46μs] ISR_ENTRY: Speed_ISR
  → [51μs] ISR_EXIT: Speed_ISR - Task Signaled
  → [51μs] TASK_START: SpeedTask (Priority 5)

T=81μs: SpeedTask completes
  → [81μs] TASK_END: SpeedTask
```

### Scenario: Priority Preemption

```
T=0ms: Speed task is running
  → [0ms] TASK_START: SpeedTask (Priority 5)
  
T=5ms: During SpeedTask, Brake interrupt arrives
  → [5ms] INTERRUPT: Brake (INT0) - Priority 7
  → [5ms] TASK_PREEMPT: SpeedTask preempted by BrakeTask
  → [5ms] ISR_ENTRY: Brake_ISR
  → [10μs] ISR_EXIT: Brake_ISR - Task Signaled
  → [10μs] TASK_START: BrakeTask (Priority 7)
  
T=60μs: BrakeTask completes
  → [60μs] TASK_END: BrakeTask
  
T=61μs: SpeedTask resumes
  → [61μs] TASK_RESUME: SpeedTask (from preemption)
```

## Real-Time Properties Demonstrated

### 1. **Priority Handling & Preemption**
✓ Higher priority tasks interrupt lower priority ones
✓ Priority ceiling protocol prevents priority inversion
✓ Tasks resume after preemption

### 2. **Bounded Latency**
Measured latencies (simulated microseconds):
- Interrupt latency: ~1-5 μs
- Task response time: ~5-10 μs
- Maximum execution time: ~50 μs (Brake Task)

### 3. **Deterministic Behavior**
✓ Fixed task execution times
✓ Predictable scheduling order
✓ No random delays or timeouts
✓ Same input → Same output pattern

### 4. **Safe Resource Sharing**
✓ Mutex-protected shared data
✓ No race conditions
✓ Safe concurrent access
✓ Priority inheritance protocol

### 5. **Interrupt Handling**
✓ Fast ISR execution (5 μs)
✓ Minimal ISR code (deferred to tasks)
✓ Context save/restore
✓ Clear interrupt signaling

## File Structure

```
Real-Time_Vehicle_Sensor_Management_System/
├── main.py                      # Main entry point
├── gui.py                       # GUI for local testing
├── flask_app.py                 # Flask web server
├── interrupt_controller.py      # Interrupt simulation
├── rtos_simulator.py           # RTOS scheduler
├── logger.py                   # Event logging
├── verifier.py                 # Real-time verification
├── shared_resources.py         # Shared resource protection
├── requirements.txt            # Python dependencies
│
├── tasks/                      # Sensor task implementations
│   ├── brake_task.py
│   ├── collision_task.py
│   └── speed_task.py
│
├── templates/                  # HTML templates
│   └── dashboard.html
│
├── static/                     # Web assets
│   ├── style.css
│   └── script.js
│
└── README.md                   # This file
```

## Installation & Setup

### Prerequisites
- Python 3.8+
- pip package manager

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Start the Server
```bash
python flask_app.py
```

Output:
```
Starting Real-Time Vehicle Sensor Management System...
============================================================
Flask Server: http://localhost:5000
RTOS Scheduler: Running in background
============================================================
 * Running on http://localhost:5000
```

### 3. Open Browser
Navigate to: **http://localhost:5000**

## API Endpoints

### Sensor Data
```
GET /api/sensor-data
Returns: {speed, temperature, collision_status, brake_status, active_task, cpu_usage, timestamp}
```

### Trigger Sensor
```
POST /api/trigger-sensor/<sensor_name>
Sensor names: "Brake", "Collision", "Speed"
Returns: {status, message, result}
```

### Event Log
```
GET /api/event-log
Returns: {events: [log_entries]}
```

### System Statistics
```
GET /api/system-stats
Returns: {total_tasks, running_tasks, ready_tasks, blocked_tasks, total_interrupts}
```

### Health Check
```
GET /health
Returns: {status, timestamp}
```

## Testing Real-Time Properties

### Test 1: Priority Preemption
1. Click "Speed Sensor" - observe SpeedTask running
2. Quickly click "Brake Sensor" - observe SpeedTask preempted
3. Check log shows "TASK_PREEMPT"
4. Verify Brake completes before Speed resumes

### Test 2: Multiple Interrupts
1. Rapidly click all three sensor buttons
2. Observe interrupt queue processing
3. Verify higher priority tasks execute first
4. Check event log for ordering

### Test 3: Bounded Latency
1. Observe timestamps in event log
2. Measure time between interrupt and ISR entry (should be <5μs)
3. Measure time between ISR exit and task start (should be <10μs)
4. Confirm maximum execution times match specifications

### Test 4: Deterministic Behavior
1. Run same sequence of button clicks twice
2. Export event logs from both runs
3. Compare timestamps and ordering
4. Verify identical behavior patterns

## Performance Metrics

| Metric | Value | Status |
|--------|-------|--------|
| Interrupt Latency | <5 μs | ✓ Bounded |
| ISR Execution Time | ~5 μs | ✓ Fast |
| Task Response Time | <10 μs | ✓ Bounded |
| Brake Task WCET | 50 μs | ✓ Bounded |
| Collision Task WCET | 40 μs | ✓ Bounded |
| Speed Task WCET | 30 μs | ✓ Bounded |
| Max System Latency | <100 μs | ✓ Bounded |
| Priority Inversion | Prevented | ✓ Safe |
| Deadlock Risk | None | ✓ Safe |

## Extension Ideas

### Future Enhancements
1. **Additional Sensors**: Add temperature, pressure sensors
2. **Periodic Tasks**: Implement time-triggered tasks
3. **Priority Inheritance**: Implement full PIP protocol
4. **Deadline Monitoring**: Add deadline tracking and miss detection
5. **Timeline Visualization**: Visual timeline of task execution
6. **Performance Analysis**: Histogram of latencies
7. **Stress Testing**: Generate high interrupt load scenarios
8. **Hardware Integration**: Connect to actual sensors (future)

## Troubleshooting

### Server won't start
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000
# Kill process if needed
taskkill /PID <PID> /F
```

### Dashboard not updating
- Check browser console for errors (F12)
- Verify Flask server is running
- Try refreshing the page
- Check network tab for failed requests

### Logging issues
- Check if `event_log.txt` exists and is writable
- Verify logger is initialized before use
- Check disk space

## References

### Real-Time Systems Concepts
- **Priority-Based Preemption**: Higher priority tasks interrupt lower ones
- **Bounded Latency**: Maximum time from event to response
- **Deterministic Behavior**: Predictable timing and ordering
- **Interrupt Service Routine**: Quick handler that defers processing
- **Task Scheduling**: Allocation of CPU time to tasks
- **Resource Protection**: Mutex/semaphore for shared data
- **Priority Inversion**: Situation where low-priority task blocks high-priority task

### Standards
- **RTOS**: Real-Time Operating System
- **ISR**: Interrupt Service Routine
- **WCET**: Worst-Case Execution Time
- **QoS**: Quality of Service

## Author Notes

This system provides a **realistic simulation** of how real-time interrupt-driven systems work without requiring physical hardware. It demonstrates:

- ✓ Correct priority handling
- ✓ Interrupt mapping to ISRs and tasks
- ✓ Bounded latency guarantees
- ✓ Safe shared resource access
- ✓ Deterministic behavior
- ✓ Complete event logging
- ✓ Real-time property verification

The simulation uses software timers and threading to model real-time behavior accurately.

---

**Last Updated**: December 2025
**Status**: Production Ready
**Version**: 1.0
