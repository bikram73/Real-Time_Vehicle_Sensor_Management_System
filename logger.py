"""
Logger - Enhanced Version for Demo
Comprehensive event logging with microsecond precision
"""

import threading
import time
from collections import deque

class Logger:
    def __init__(self, max_logs=10000):
        self.logs = deque(maxlen=max_logs)
        self.log_lock = threading.Lock()
        self.log_levels = {'DEBUG': 0, 'INFO': 1, 'WARNING': 2, 'ERROR': 3}
        self.current_level = 'DEBUG'
        self.start_time = time.time()
    
    def log(self, message, level='INFO'):
        """Log message with microsecond timestamp"""
        # Use current time in microseconds for demo consistency
        timestamp = int(time.time() * 1_000_000)  # Convert to microseconds
        
        with self.log_lock:
            # If message already has timestamp, use it; otherwise add one
            if message.startswith('[') and ']' in message:
                formatted_msg = message
            else:
                formatted_msg = f"[{timestamp}] {message}"
            
            self.logs.append(formatted_msg)
    
    def get_logs(self):
        """Get all logs"""
        with self.log_lock:
            return list(self.logs)
    
    def clear(self):
        """Clear all logs"""
        with self.log_lock:
            self.logs.clear()
    
    def export_logs(self, filename='event_log.txt'):
        """Export logs to file"""
        with self.log_lock:
            with open(filename, 'w') as f:
                for log in self.logs:
                    f.write(log + '\n')
        return filename
