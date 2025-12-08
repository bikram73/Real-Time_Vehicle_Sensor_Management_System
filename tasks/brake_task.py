"""Brake Task Implementation - Fixed"""

import time

class BrakeTask:
    def __init__(self, logger, shared_resources):
        self.logger = logger
        self.shared_resources = shared_resources
        self.name = "BrakeTask"
        self.priority = 7
        self.state = "BLOCKED"
        self.wcet_us = 50  # 50 microseconds
        self.execution_count = 0
    
    def run(self):
        """Execute brake task with proper timing"""
        timestamp_start = int(time.time_ns() // 1000)
        self.execution_count += 1
        
        # Acquire semaphore
        self.shared_resources.acquire_semaphore('brake_sem')
        
        try:
            # Read sensor data
            data = self.shared_resources.read_data()
            
            # Process brake data
            processed_data = {
                'speed': max(0, data.get('speed', 0) - 10),
                'temperature': data.get('temperature', 25),
                'collision_status': 'Braking',
                'brake_status': 'Active'
            }
            
            # Accurate timing simulation
            execution_duration_us = self.wcet_us
            start_time = time.perf_counter()
            while time.perf_counter() - start_time < (execution_duration_us / 1_000_000):
                pass
            
            # Write updated data
            self.shared_resources.write_data(processed_data)
            
        finally:
            # Release semaphore
            self.shared_resources.release_semaphore('brake_sem')
            
            timestamp_end = int(time.time_ns() // 1000)
            actual_duration = timestamp_end - timestamp_start
