#!/usr/bin/env python3
"""
Test what the backend is actually returning for logs
"""

import requests
import time
import json

def test_backend_logs():
    """Test what logs the backend is generating"""
    base_url = "http://localhost:5000"
    
    print("🔍 Testing Backend Log Generation")
    print("=" * 50)
    
    # Clear logs first
    print("1. Clearing logs...")
    response = requests.post(f"{base_url}/api/clear-log")
    print(f"Clear response: {response.json()}")
    
    # Trigger a brake sensor
    print("\n2. Triggering Brake sensor...")
    response = requests.post(f"{base_url}/api/trigger-sensor/Brake")
    result = response.json()
    print(f"Trigger response: {result}")
    
    # Wait a moment for processing
    time.sleep(0.3)
    
    # Get the actual logs from backend
    print("\n3. Fetching logs from backend...")
    response = requests.get(f"{base_url}/api/event-log")
    logs_data = response.json()
    
    print(f"\nBackend returned {len(logs_data['events'])} log entries:")
    print("-" * 40)
    
    for i, log in enumerate(logs_data['events']):
        print(f"{i+1:2d}. {log}")
    
    print("\n" + "=" * 50)
    print("✅ Expected format:")
    print("[timestamp] INTERRUPT: Brake (INT0) - Priority: 7")
    print("[timestamp] ISR_ENTRY: Brake_ISR")
    print("[timestamp] ISR_EXIT: Brake_ISR - Task Signaled")
    print("[timestamp] TASK_START: BrakeTask - Priority: 7")
    print("[timestamp] TASK_END: BrakeTask")

if __name__ == "__main__":
    try:
        test_backend_logs()
    except requests.exceptions.ConnectionError:
        print("❌ ERROR: Could not connect to Flask server.")
        print("Make sure to run: python run.py")
    except Exception as e:
        print(f"❌ ERROR: {e}")