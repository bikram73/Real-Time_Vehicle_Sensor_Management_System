"""Collision Task Implementation - Fixed"""

import time

class CollisionTask:
    def __init__(self, logger, shared_resources):
        self.logger = logger
        self.shared_resources = shared_resources
        self.name = "CollisionTask"
        self.priority = 6
        self.state = "BLOCKED"
        self.wcet_us = 40  # 40 microseconds
        self.execution_count = 0
    
    def run(self):
        """Execute collision detection task"""
        timestamp_start = int(time.time_ns() // 1000)
        self.execution_count += 1
        
        # Acquire semaphore
        self.shared_resources.acquire_semaphore('collision_sem')
        
        try:
            # Read sensor data
            data = self.shared_resources.read_data()
            
            # Collision detection logic
            processed_data = {
                'speed': data.get('speed', 0),
                'temperature': data.get('temperature', 25),
                'collision_status': 'Monitoring',
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
            self.shared_resources.release_semaphore('collision_sem')
            
            timestamp_end = int(time.time_ns() // 1000)
            actual_duration = timestamp_end - timestamp_start
