"""Speed Task Implementation - Fixed"""

import time

class SpeedTask:
    def __init__(self, logger, shared_resources):
        self.logger = logger
        self.shared_resources = shared_resources
        self.name = "SpeedTask"
        self.priority = 5
        self.state = "BLOCKED"
        self.wcet_us = 30  # 30 microseconds
        self.execution_count = 0
    
    def run(self):
        """Execute speed monitoring task"""
        timestamp_start = int(time.time_ns() // 1000)
        self.execution_count += 1
        
        # Acquire semaphore
        self.shared_resources.acquire_semaphore('speed_sem')
        
        try:
            # Read sensor data
            data = self.shared_resources.read_data()
            
            # Speed monitoring logic
            processed_data = {
                'speed': data.get('speed', 0),
                'temperature': data.get('temperature', 25) + 0.5,
                'collision_status': data.get('collision_status', 'Clear'),
                'brake_status': data.get('brake_status', 'Off')
            }
            
            # Accurate timing
            execution_duration_us = self.wcet_us
            start_time = time.perf_counter()
            while time.perf_counter() - start_time < (execution_duration_us / 1_000_000):
                pass
            
            # Write updated data
            self.shared_resources.write_data(processed_data)
            
        finally:
            self.shared_resources.release_semaphore('speed_sem')
            
            timestamp_end = int(time.time_ns() // 1000)
            actual_duration = timestamp_end - timestamp_start
