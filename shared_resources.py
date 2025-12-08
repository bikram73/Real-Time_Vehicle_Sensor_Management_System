"""
Shared Resources - Fixed Version
Enhanced with semaphores and message queues
"""

import threading
import queue

class SharedResources:
    def __init__(self, logger):
        self.logger = logger
        self.data_lock = threading.Lock()
        self.data = {}
        
        # NEW: Semaphores
        self.semaphores = {
            'brake_sem': threading.Semaphore(1),
            'collision_sem': threading.Semaphore(1),
            'speed_sem': threading.Semaphore(1)
        }
        
        # NEW: Message queues
        self.msg_queues = {
            'brake_queue': queue.Queue(maxsize=10),
            'collision_queue': queue.Queue(maxsize=10),
            'speed_queue': queue.Queue(maxsize=10)
        }
    
    def write_data(self, data):
        """Thread-safe data write"""
        with self.data_lock:
            self.data = data
    
    def read_data(self):
        """Thread-safe data read"""
        with self.data_lock:
            return self.data.copy()
    
    def acquire_semaphore(self, sem_name, timeout=1.0):
        """Acquire semaphore"""
        if sem_name in self.semaphores:
            return self.semaphores[sem_name].acquire(timeout=timeout)
        return False
    
    def release_semaphore(self, sem_name):
        """Release semaphore"""
        if sem_name in self.semaphores:
            self.semaphores[sem_name].release()
    
    def send_message(self, queue_name, message):
        """Send message to queue"""
        if queue_name in self.msg_queues:
            try:
                self.msg_queues[queue_name].put_nowait(message)
                return True
            except queue.Full:
                return False
        return False
    
    def receive_message(self, queue_name, timeout=1.0):
        """Receive message from queue"""
        if queue_name in self.msg_queues:
            try:
                return self.msg_queues[queue_name].get(timeout=timeout)
            except queue.Empty:
                return None
        return None
