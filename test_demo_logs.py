#!/usr/bin/env python3
"""
Test script to verify demo log format
"""

import requests
import time
import json

def test_demo_sequence():
    """Test the demo sequence and verify log format"""
    base_url = "http://localhost:5000"
    
    print("Testing Demo Log Format...")
    print("=" * 50)
    
    # Clear logs first
    response = requests.post(f"{base_url}/api/clear-log")
    print(f"Clear logs: {response.json()}")
    
    # Test Brake sensor (Priority 7)
    print("\n1. Testing Brake Sensor (P7)...")
    response = requests.post(f"{base_url}/api/trigger-sensor/Brake")
    print(f"Brake trigger: {response.json()}")
    
    time.sleep(0.1)  # Small delay
    
    # Test Speed sensor (Priority 5)
    print("\n2. Testing Speed Sensor (P5)...")
    response = requests.post(f"{base_url}/api/trigger-sensor/Speed")
    print(f"Speed trigger: {response.json()}")
    
    time.sleep(0.1)
    
    # Test Collision sensor (Priority 6) - should preempt Speed
    print("\n3. Testing Collision Sensor (P6) - Should preempt Speed...")
    response = requests.post(f"{base_url}/api/trigger-sensor/Collision")
    print(f"Collision trigger: {response.json()}")
    
    time.sleep(0.5)  # Wait for processing
    
    # Get event logs
    print("\n4. Retrieving Event Logs...")
    response = requests.get(f"{base_url}/api/event-log")
    logs = response.json()
    
    print("\nGenerated Logs (Demo Format):")
    print("-" * 60)
    for log in logs['events'][-15:]:  # Show last 15 events
        print(log)
    
    # Get statistics
    print("\n5. System Statistics:")
    response = requests.get(f"{base_url}/api/system-stats")
    stats = response.json()
    
    print(f"Brake Events: {stats['brake_events']}")
    print(f"Collision Events: {stats['collision_events']}")
    print(f"Speed Events: {stats['speed_events']}")
    print(f"Total Events: {stats['total_events']}")
    print(f"Total Interrupts: {stats['total_interrupts']}")
    print(f"Interrupts/sec: {stats['interrupts_per_sec']}")
    print(f"Avg Response Time: {stats['avg_response_time']} μs")
    
    print("\n" + "=" * 50)
    print("Demo test completed! Check the logs above.")
    print("Expected format:")
    print("[timestamp] INTERRUPT: Brake (INT0) - Priority: 7")
    print("[timestamp] ISR_ENTRY: Brake_ISR")
    print("[timestamp] ISR_EXIT: Brake_ISR - Task Signaled")
    print("[timestamp] TASK_START: BrakeTask - Priority: 7")
    print("[timestamp] TASK_END: BrakeTask")

if __name__ == "__main__":
    try:
        test_demo_sequence()
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to Flask server.")
        print("Make sure the server is running on http://localhost:5000")
    except Exception as e:
        print(f"Error: {e}")