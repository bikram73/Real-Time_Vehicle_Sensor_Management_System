"""
Real-Time Vehicle Sensor Management System
Complete RTOS Simulator with All Fixes
"""

import threading
import time
from flask import Flask, render_template, jsonify, request
from interrupt_controller import InterruptController
from rtos_simulator import RTOSSimulator
from logger import Logger
from shared_resources import SharedResources
from verifier import Verifier
from deadline_monitor import DeadlineMonitor
from task_analyzer import TaskAnalyzer

# Global instances
app = Flask(__name__)
logger = Logger()
shared_resources = SharedResources(logger)
interrupt_controller = InterruptController(logger)
rtos_simulator = RTOSSimulator(logger, shared_resources, interrupt_controller)
deadline_monitor = DeadlineMonitor(logger, rtos_simulator)
task_analyzer = TaskAnalyzer(logger, rtos_simulator)
verifier = Verifier(logger, rtos_simulator, deadline_monitor)

# Background threads
scheduler_thread = None
monitor_thread = None

def start_scheduler():
    """Start RTOS scheduler in background thread"""
    global scheduler_thread
    scheduler_thread = threading.Thread(target=rtos_simulator.run_scheduler, daemon=True)
    scheduler_thread.start()
    logger.log("[SYSTEM] RTOS Scheduler started")

def start_monitor():
    """Start deadline monitor in background thread"""
    global monitor_thread
    monitor_thread = threading.Thread(target=deadline_monitor.monitor_deadlines, daemon=True)
    monitor_thread.start()
    logger.log("[SYSTEM] Deadline Monitor started")

@app.route('/')
def dashboard():
    """Serve dashboard HTML"""
    return render_template('dashboard.html')

@app.route('/ppt')
def ppt_presentation():
    """Serve PowerPoint presentation page"""
    return render_template('ppt.html')

@app.route('/api/trigger-sensor/<sensor_name>', methods=['POST'])
def trigger_sensor(sensor_name):
    """Trigger sensor interrupt"""
    try:
        valid_sensors = ['Brake', 'Collision', 'Speed']
        if sensor_name not in valid_sensors:
            return jsonify({'status': 'error', 'message': f'Unknown sensor: {sensor_name}'}), 400
        
        result = interrupt_controller.trigger_interrupt(sensor_name)
        
        return jsonify({
            'status': 'success',
            'message': f'{sensor_name} interrupt triggered',
            'result': result
        })
    except Exception as e:
        logger.log(f"[ERROR] Sensor trigger failed: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/sensor-data', methods=['GET'])
def get_sensor_data():
    """Get current sensor data and system status"""
    try:
        data = shared_resources.read_data()
        current_task = rtos_simulator.get_current_task()
        cpu_usage = rtos_simulator.get_cpu_usage()
        
        return jsonify({
            'speed': data.get('speed', 0),
            'temperature': data.get('temperature', 0),
            'collision_status': data.get('collision_status', 'Clear'),
            'brake_status': data.get('brake_status', 'Off'),
            'active_task': current_task,
            'cpu_usage': cpu_usage,
            'timestamp': int(time.time_ns() // 1000)
        })
    except Exception as e:
        logger.log(f"[ERROR] Get sensor data failed: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/event-log', methods=['GET'])
def get_event_log():
    """Get event log"""
    try:
        logs = logger.get_logs()
        return jsonify({'events': logs})
    except Exception as e:
        logger.log(f"[ERROR] Get event log failed: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/system-stats', methods=['GET'])
def get_system_stats():
    """Get system statistics for demo"""
    try:
        stats = rtos_simulator.get_statistics()
        deadline_stats = deadline_monitor.get_statistics()
        
        # Count events by type from logs
        logs = logger.get_logs()
        brake_events = sum(1 for log in logs if 'Brake' in log and 'INTERRUPT:' in log)
        collision_events = sum(1 for log in logs if 'Collision' in log and 'INTERRUPT:' in log)
        speed_events = sum(1 for log in logs if 'Speed' in log and 'INTERRUPT:' in log)
        total_events = brake_events + collision_events + speed_events
        
        # Calculate interrupts per second
        uptime = time.time() - rtos_simulator.start_time
        interrupts_per_sec = round(interrupt_controller.interrupt_count / max(uptime, 1), 2)
        
        # Calculate average response time (microseconds)
        avg_response_time = 5  # ISR duration is fixed at 5μs
        
        return jsonify({
            # Event statistics
            'brake_events': brake_events,
            'collision_events': collision_events,
            'speed_events': speed_events,
            'total_events': total_events,
            
            # Interrupt statistics
            'total_interrupts': interrupt_controller.interrupt_count,
            'interrupts_per_sec': interrupts_per_sec,
            'avg_response_time': avg_response_time,
            
            # System information
            'uptime': uptime,
            'cpu_usage': rtos_simulator.get_cpu_usage(),
            'status': '🟢 Running',
            
            # Legacy stats for compatibility
            'total_tasks': stats['total_tasks'],
            'running_tasks': stats['running_tasks'],
            'ready_tasks': stats['ready_tasks'],
            'blocked_tasks': stats['blocked_tasks'],
            'deadline_misses': deadline_stats['misses'],
            'verified': deadline_stats['verified']
        })
    except Exception as e:
        logger.log(f"[ERROR] Get system stats failed: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/task-analysis', methods=['GET'])
def get_task_analysis():
    """Get task analysis and timing data"""
    try:
        analysis = task_analyzer.analyze_tasks()
        return jsonify(analysis)
    except Exception as e:
        logger.log(f"[ERROR] Task analysis failed: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/verify-rtos', methods=['GET'])
def verify_rtos():
    """Verify RTOS properties"""
    try:
        results = verifier.verify_all()
        return jsonify(results)
    except Exception as e:
        logger.log(f"[ERROR] Verification failed: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/clear-log', methods=['POST'])
def clear_log():
    """Clear event log"""
    try:
        logger.clear()
        logger.log("[SYSTEM] Event log cleared")
        return jsonify({'status': 'success', 'message': 'Log cleared'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/export-log', methods=['GET'])
def export_log():
    """Export event log"""
    try:
        logs = logger.get_logs()
        log_text = '\n'.join(logs)
        
        return app.response_class(
            response=log_text,
            status=200,
            mimetype='text/plain',
            headers={'Content-Disposition': 'attachment;filename=event_log.txt'}
        )
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': int(time.time_ns() // 1000)
    })

if __name__ == '__main__':
    print("""
    ============================================================
    Real-Time Vehicle Sensor Management System
    RTOS Simulator - Complete Edition
    ============================================================
    """)
    
    # Initialize system
    start_scheduler()
    start_monitor()
    
    # Initial sensor data
    shared_resources.write_data({
        'speed': 0,
        'temperature': 25,
        'collision_status': 'Clear',
        'brake_status': 'Off'
    })
    
    logger.log("[SYSTEM] System initialized successfully")
    print("Flask Server: http://localhost:5000")
    print("============================================================\n")
    
    # Run Flask app
    app.run(debug=False, host='0.0.0.0', port=5000, use_reloader=False)
