"""
Deadline Monitor - NEW FILE
Tracks and monitors task deadlines
"""

import time
import threading

class DeadlineMonitor:
    def __init__(self, logger, rtos):
        self.logger = logger
        self.rtos = rtos
        self.deadlines = {
            'BrakeTask': 50,        # 50 microseconds
            'CollisionTask': 40,    # 40 microseconds
            'SpeedTask': 30         # 30 microseconds
        }
        self.deadline_misses = []
        self.verified_tasks = []
        self.monitor_lock = threading.Lock()
    
    def set_deadline(self, task_name, deadline_us):
        """Set deadline for a task"""
        if task_name in self.deadlines:
            self.deadlines[task_name] = deadline_us
            timestamp = int(time.time_ns() // 1000)
            self.logger.log(f"[{timestamp}] DEADLINE_SET: {task_name} deadline = {deadline_us}μs")
    
    def check_deadline(self, task_name, start_time_us, end_time_us):
        """Check if task met its deadline"""
        if task_name not in self.deadlines:
            return True
        
        execution_time = end_time_us - start_time_us
        deadline = self.deadlines[task_name]
        
        met_deadline = execution_time <= deadline
        
        with self.monitor_lock:
            if met_deadline:
                self.verified_tasks.append({
                    'task': task_name,
                    'execution': execution_time,
                    'deadline': deadline
                })
            else:
                self.deadline_misses.append({
                    'task': task_name,
                    'execution': execution_time,
                    'deadline': deadline,
                    'overage': execution_time - deadline
                })
                timestamp = int(time.time_ns() // 1000)
                self.logger.log(
                    f"[{timestamp}] DEADLINE_MISS: {task_name} - "
                    f"Execution: {execution_time}μs, Deadline: {deadline}μs, "
                    f"Overage: {execution_time - deadline}μs"
                )
        
        return met_deadline
    
    def monitor_deadlines(self):
        """Background monitoring of deadlines"""
        while True:
            try:
                time.sleep(0.1)
                # Periodic check can be added here
            except Exception as e:
                self.logger.log(f"[ERROR] Deadline monitor error: {str(e)}")
    
    def get_statistics(self):
        """Get deadline statistics"""
        with self.monitor_lock:
            return {
                'misses': len(self.deadline_misses),
                'verified': len(self.verified_tasks),
                'miss_details': self.deadline_misses[-5:] if self.deadline_misses else []
            }
