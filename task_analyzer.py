"""
Task Analyzer - NEW FILE
Analyzes task performance and timing
"""

import time

class TaskAnalyzer:
    def __init__(self, logger, rtos):
        self.logger = logger
        self.rtos = rtos
        self.task_metrics = {
            'BrakeTask': {'runs': 0, 'total_time': 0, 'min': float('inf'), 'max': 0},
            'CollisionTask': {'runs': 0, 'total_time': 0, 'min': float('inf'), 'max': 0},
            'SpeedTask': {'runs': 0, 'total_time': 0, 'min': float('inf'), 'max': 0}
        }
    
    def record_execution(self, task_name, execution_time_us):
        """Record task execution metric"""
        if task_name in self.task_metrics:
            metrics = self.task_metrics[task_name]
            metrics['runs'] += 1
            metrics['total_time'] += execution_time_us
            metrics['min'] = min(metrics['min'], execution_time_us)
            metrics['max'] = max(metrics['max'], execution_time_us)
    
    def analyze_tasks(self):
        """Analyze all tasks"""
        analysis = {}
        
        for task_name, metrics in self.task_metrics.items():
            if metrics['runs'] > 0:
                avg_time = metrics['total_time'] / metrics['runs']
                analysis[task_name] = {
                    'runs': metrics['runs'],
                    'total_time_us': metrics['total_time'],
                    'avg_time_us': f"{avg_time:.2f}",
                    'min_time_us': metrics['min'],
                    'max_time_us': metrics['max'],
                    'cpu_percentage': f"{(metrics['total_time'] / 1_000_000) * 100:.2f}"
                }
            else:
                analysis[task_name] = {'runs': 0, 'status': 'never_executed'}
        
        return analysis
