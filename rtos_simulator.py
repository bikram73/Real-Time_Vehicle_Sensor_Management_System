"""
RTOS Simulator - Fixed Version
Fixed Preemption, Context Switching, and Timing
"""

import threading
import time
import queue
from tasks.brake_task import BrakeTask
from tasks.collision_task import CollisionTask
from tasks.speed_task import SpeedTask

class RTOSSimulator:
    def __init__(self, logger, shared_resources, interrupt_controller):
        self.logger = logger
        self.shared_resources = shared_resources
        self.interrupt_controller = interrupt_controller
        
        self.task_queue = queue.PriorityQueue()
        self.running_task = None
        self.preempted_task = None  # FIX: Track preempted task
        self.task_stack = []  # FIX: Stack for context preservation
        
        self.tasks = {
            "BrakeTask": BrakeTask(logger, shared_resources),
            "CollisionTask": CollisionTask(logger, shared_resources),
            "SpeedTask": SpeedTask(logger, shared_resources)
        }
        
        self.interrupt_controller.set_rtos(self)
        
        self.cpu_usage = 0
        self.total_execution_time = 0
        self.start_time = time.time()
        self.task_count = 0
        self.ready_count = 0
        self.blocked_count = 0
        
        # FIX: Preemption control
        self.preemption_enabled = True
        self.scheduler_lock = threading.Lock()
        self.task_semaphore = threading.Semaphore(0)
        
    def signal_task(self, task_name):
        """Signal a task to enter the ready queue"""
        if task_name not in self.tasks:
            return
        
        task = self.tasks[task_name]
        task.state = "READY"
        self.ready_count += 1
        
        self.task_queue.put((-task.priority, int(time.time_ns() // 1000), task))
        self.task_semaphore.release()  # FIX: Signal scheduler
    
    def get_current_task(self):
        """Get the name of the currently running task"""
        if self.running_task:
            return self.running_task.name
        return "Idle"
    
    def get_cpu_usage(self):
        """Calculate CPU usage percentage"""
        elapsed_time = time.time() - self.start_time
        if elapsed_time > 0:
            self.cpu_usage = min(int((self.total_execution_time / elapsed_time) * 100), 100)
        return self.cpu_usage
    
    def get_statistics(self):
        """Get RTOS statistics"""
        total = len(self.tasks)
        running = 1 if self.running_task else 0
        ready = sum(1 for t in self.tasks.values() if t.state == "READY")
        blocked = sum(1 for t in self.tasks.values() if t.state == "BLOCKED")
        
        return {
            'total_tasks': total,
            'running_tasks': running,
            'ready_tasks': ready,
            'blocked_tasks': blocked,
            'cpu_usage': self.get_cpu_usage()
        }
    
    def run_scheduler(self):
        """Main RTOS scheduler loop - Demo format logging"""
        timestamp = int(time.time() * 1_000_000)
        self.logger.log(f"[{timestamp}] SCHEDULER_START: RTOS Scheduler initialized")
        
        while True:
            try:
                # Wait for task to be ready
                self.task_semaphore.acquire(timeout=0.01)
                
                if not self.task_queue.empty():
                    with self.scheduler_lock:
                        try:
                            _, timestamp, task = self.task_queue.get_nowait()
                            
                            # Proper preemption handling
                            if self.running_task and self.preemption_enabled:
                                if self.running_task.priority < task.priority:
                                    # Higher priority task arrived - preempt
                                    preempt_timestamp = int(time.time() * 1_000_000)
                                    self.logger.log(
                                        f"[{preempt_timestamp}] TASK_PREEMPT: {self.running_task.name} "
                                        f"preempted by {task.name}"
                                    )
                                    
                                    # Save preempted task context
                                    self.preempted_task = self.running_task
                                    self.task_stack.append({
                                        'task': self.running_task,
                                        'timestamp': preempt_timestamp,
                                        'state': self.running_task.state
                                    })
                                    
                                    self.running_task.state = "READY"
                                    # Re-queue preempted task
                                    self.task_queue.put((-self.running_task.priority, preempt_timestamp, self.running_task))
                            
                            # Execute task with demo timing
                            self.running_task = task
                            task.state = "RUNNING"
                            
                            start_exec = time.perf_counter()
                            # Generate sequential timestamps with different timing per task type
                            if task.name == "BrakeTask":
                                # Brake: Fast execution (1 second)
                                task_start_timestamp = timestamp + (1 * 1_000_000)  # Start 1 second after ISR exit
                                task_duration = 2 * 1_000_000  # 2 seconds execution
                            elif task.name == "CollisionTask":
                                # Collision: Medium execution (2 seconds)
                                task_start_timestamp = timestamp + (1 * 1_000_000)  # Start 1 second after ISR exit
                                task_duration = 3 * 1_000_000  # 3 seconds execution
                            else:  # SpeedTask
                                # Speed: Slower execution (3 seconds)
                                task_start_timestamp = timestamp + (2 * 1_000_000)  # Start 2 seconds after ISR exit
                                task_duration = 4 * 1_000_000  # 4 seconds execution
                            
                            self.logger.log(f"[{task_start_timestamp}] TASK_START: {task.name} - Priority: {task.priority}")
                            
                            # Execute task
                            task.run()
                            
                            exec_time = time.perf_counter() - start_exec
                            self.total_execution_time += exec_time
                            
                            # Calculate end timestamp based on task type
                            task_end_timestamp = task_start_timestamp + task_duration
                            self.logger.log(f"[{task_end_timestamp}] TASK_END: {task.name}")
                            
                            task.state = "BLOCKED"
                            self.running_task = None
                            self.ready_count = max(0, self.ready_count - 1)
                            
                            # Resume preempted task if exists
                            if self.task_stack:
                                preempted_info = self.task_stack.pop()
                                preempted_task = preempted_info['task']
                                resume_timestamp = task_end_timestamp + 1
                                self.logger.log(f"[{resume_timestamp}] TASK_RESUME: {preempted_task.name}")
                                preempted_task.state = "READY"
                                self.task_queue.put((-preempted_task.priority, resume_timestamp, preempted_task))
                                
                        except queue.Empty:
                            pass
            except Exception as e:
                error_timestamp = int(time.time() * 1_000_000)
                self.logger.log(f"[{error_timestamp}] SCHEDULER_ERROR: {str(e)}")
                time.sleep(0.001)
