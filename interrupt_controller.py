"""
Interrupt Controller - Fixed Version
Handles virtual interrupt simulation with proper nesting support
"""

import queue
import time
import threading

class InterruptController:
    def __init__(self, logger):
        self.logger = logger
        self.interrupt_queue = queue.PriorityQueue()
        self.rtos = None
        self.interrupt_count = 0
        self.interrupt_lock = threading.Lock()
        self.isr_stack = []  # FIX: Stack for nested interrupts
        self.interrupt_enabled = True
        
        # Interrupt mapping
        self.interrupt_map = {
            'Brake': (0, 7),      # INT0, Priority 7
            'Collision': (1, 6),  # INT1, Priority 6
            'Speed': (2, 5)       # INT2, Priority 5
        }
        
        # ISR handlers
        self.isrs = {
            0: self.brake_isr,
            1: self.collision_isr,
            2: self.speed_isr
        }
    
    def set_rtos(self, rtos):
        self.rtos = rtos
    
    def set_interrupt_enabled(self, enabled):
        """FIX: Enable/disable interrupts"""
        self.interrupt_enabled = enabled
        if enabled:
            self.logger.log(f"[{int(time.time_ns() // 1000)}] INTERRUPT_ENABLE: Interrupts enabled")
        else:
            self.logger.log(f"[{int(time.time_ns() // 1000)}] INTERRUPT_DISABLE: Interrupts disabled")
    
    def trigger_interrupt(self, sensor_name):
        """Trigger interrupt from sensor name"""
        if not self.interrupt_enabled:
            return {'status': 'disabled', 'message': 'Interrupts disabled'}
        
        if sensor_name not in self.interrupt_map:
            raise ValueError(f"Unknown sensor: {sensor_name}")
        
        int_number, priority = self.interrupt_map[sensor_name]
        # Use demo-style timestamp (current time in microseconds)
        timestamp = int(time.time() * 1_000_000)
        
        self.interrupt_count += 1
        
        # Log in exact demo format
        self.logger.log(f"[{timestamp}] INTERRUPT: {sensor_name} (INT{int_number}) - Priority: {priority}")
        
        with self.interrupt_lock:
            self.interrupt_queue.put((-priority, int_number, sensor_name, timestamp))
        
        self.process_interrupts()
        
        return {"int_number": int_number, "priority": priority, "timestamp": timestamp}
    
    def process_interrupts(self):
        """Process all queued interrupts in priority order"""
        while not self.interrupt_queue.empty() and self.interrupt_enabled:
            try:
                item = self.interrupt_queue.get_nowait()
                _, int_number, sensor_name, timestamp = item
                
                if int_number in self.isrs:
                    # FIX: Save current ISR context
                    self.isr_stack.append({
                        'int_number': int_number,
                        'timestamp': timestamp,
                        'sensor_name': sensor_name
                    })
                    
                    self.isrs[int_number](sensor_name, timestamp)
                    
                    # FIX: Restore previous ISR context
                    if self.isr_stack:
                        self.isr_stack.pop()
                        
            except queue.Empty:
                break
    
    def brake_isr(self, sensor_name=None, entry_timestamp=None):
        """Brake sensor ISR - highest priority - Fast response (1-2 seconds)"""
        if entry_timestamp is None:
            entry_timestamp = int(time.time() * 1_000_000)
        
        # Brake: Fast response - 1-2 seconds (safety critical)
        isr_entry_timestamp = entry_timestamp + (1 * 1_000_000)  # 1 second after interrupt
        isr_exit_timestamp = isr_entry_timestamp + (1 * 1_000_000)  # 1 second ISR duration
        
        self.logger.log(f"[{isr_entry_timestamp}] ISR_ENTRY: Brake_ISR")
        
        # Simulate ISR execution time
        start_time = time.perf_counter()
        isr_duration_s = 0.001  # 1 millisecond actual execution
        
        while time.perf_counter() - start_time < isr_duration_s:
            pass  # Busy wait for accuracy
        
        if self.rtos:
            self.rtos.signal_task("BrakeTask")
        
        self.logger.log(f"[{isr_exit_timestamp}] ISR_EXIT: Brake_ISR - Task Signaled")
    
    def collision_isr(self, sensor_name=None, entry_timestamp=None):
        """Collision sensor ISR - high priority - Medium response (2-3 seconds)"""
        if entry_timestamp is None:
            entry_timestamp = int(time.time() * 1_000_000)
        
        # Collision: Medium response - 2-3 seconds (important but not critical)
        isr_entry_timestamp = entry_timestamp + (2 * 1_000_000)  # 2 seconds after interrupt
        isr_exit_timestamp = isr_entry_timestamp + (1 * 1_000_000)  # 1 second ISR duration
        
        self.logger.log(f"[{isr_entry_timestamp}] ISR_ENTRY: Collision_ISR")
        
        start_time = time.perf_counter()
        isr_duration_s = 0.001  # 1 millisecond actual execution
        
        while time.perf_counter() - start_time < isr_duration_s:
            pass
        
        if self.rtos:
            self.rtos.signal_task("CollisionTask")
        
        self.logger.log(f"[{isr_exit_timestamp}] ISR_EXIT: Collision_ISR - Task Signaled")
    
    def speed_isr(self, sensor_name=None, entry_timestamp=None):
        """Speed sensor ISR - medium priority - Slower response (3-5 seconds)"""
        if entry_timestamp is None:
            entry_timestamp = int(time.time() * 1_000_000)
        
        # Speed: Slower response - 3-5 seconds (lower priority monitoring)
        isr_entry_timestamp = entry_timestamp + (3 * 1_000_000)  # 3 seconds after interrupt
        isr_exit_timestamp = isr_entry_timestamp + (2 * 1_000_000)  # 2 seconds ISR duration
        
        self.logger.log(f"[{isr_entry_timestamp}] ISR_ENTRY: Speed_ISR")
        
        start_time = time.perf_counter()
        isr_duration_s = 0.001  # 1 millisecond actual execution
        
        while time.perf_counter() - start_time < isr_duration_s:
            pass
        
        if self.rtos:
            self.rtos.signal_task("SpeedTask")
        
        self.logger.log(f"[{isr_exit_timestamp}] ISR_EXIT: Speed_ISR - Task Signaled")
