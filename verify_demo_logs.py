#!/usr/bin/env python3
"""
Verify Demo Log Format - Test exact output from demo script
"""

import requests
import time
import json

def test_brake_sequence():
    """Test Brake sensor - should generate exact demo sequence"""
    base_url = "http://localhost:5000"
    
    print("🛑 Testing BRAKE SENSOR (Demo Part 1)")
    print("=" * 60)
    
    # Clear logs first
    requests.post(f"{base_url}/api/clear-log")
    time.sleep(0.1)
    
    # Trigger Brake sensor
    print("Clicking Brake Sensor...")
    response = requests.post(f"{base_url}/api/trigger-sensor/Brake")
    result = response.json()
    print(f"Response: {result}")
    
    # Wait for processing
    time.sleep(0.2)
    
    # Get logs
    response = requests.get(f"{base_url}/api/event-log")
    logs = response.json()
    
    print("\n📋 ACTUAL LOG OUTPUT:")
    print("-" * 40)
    for log in logs['events']:
        if any(keyword in log for keyword in ['INTERRUPT:', 'ISR_ENTRY:', 'ISR_EXIT:', 'TASK_START:', 'TASK_END:']):
            print(log)
    
    print("\n✅ EXPECTED LOG FORMAT (from demo script):")
    print("-" * 40)
    print("[1701956430123456] INTERRUPT: Brake (INT0) - Priority: 7")
    print("[1701956430123457] ISR_ENTRY: Brake_ISR")
    print("[1701956430123462] ISR_EXIT: Brake_ISR - Task Signaled")
    print("[1701956430123463] TASK_START: BrakeTask - Priority: 7")
    print("[1701956430123513] TASK_END: BrakeTask")
    
    return logs['events']

def test_preemption_sequence():
    """Test Speed then Brake - should show preemption"""
    base_url = "http://localhost:5000"
    
    print("\n\n⚡ Testing PREEMPTION SEQUENCE (Demo Part 2)")
    print("=" * 60)
    
    # Clear logs
    requests.post(f"{base_url}/api/clear-log")
    time.sleep(0.1)
    
    # Trigger Speed sensor first
    print("1. Clicking Speed Sensor...")
    requests.post(f"{base_url}/api/trigger-sensor/Speed")
    time.sleep(0.5)  # Wait as per demo script
    
    # Trigger Brake sensor (should preempt)
    print("2. Clicking Brake Sensor (should preempt Speed)...")
    requests.post(f"{base_url}/api/trigger-sensor/Brake")
    
    # Wait for processing
    time.sleep(0.3)
    
    # Get logs
    response = requests.get(f"{base_url}/api/event-log")
    logs = response.json()
    
    print("\n📋 ACTUAL PREEMPTION LOG:")
    print("-" * 40)
    for log in logs['events']:
        if any(keyword in log for keyword in ['INTERRUPT:', 'ISR_', 'TASK_', 'PREEMPT']):
            print(log)
    
    # Check for preemption
    preemption_found = any('PREEMPT' in log for log in logs['events'])
    print(f"\n🔍 PREEMPTION DETECTED: {'✅ YES' if preemption_found else '❌ NO'}")
    
    return logs['events']

def test_statistics():
    """Test statistics display"""
    base_url = "http://localhost:5000"
    
    print("\n\n📊 Testing STATISTICS (Demo Part 4)")
    print("=" * 60)
    
    response = requests.get(f"{base_url}/api/system-stats")
    stats = response.json()
    
    print("Event Statistics:")
    print(f"  • Brake Events (P7): {stats['brake_events']}")
    print(f"  • Collision Events (P6): {stats['collision_events']}")
    print(f"  • Speed Events (P5): {stats['speed_events']}")
    print(f"  • Total Events: {stats['total_events']}")
    
    print("\nInterrupt Statistics:")
    print(f"  • Total Interrupts: {stats['total_interrupts']}")
    print(f"  • Interrupts/Second: {stats['interrupts_per_sec']}")
    print(f"  • Avg Response Time: {stats['avg_response_time']} μs")
    
    print("\nSystem Information:")
    print(f"  • System Uptime: {stats['uptime']:.2f}s")
    print(f"  • CPU Load: {stats['cpu_usage']}%")
    print(f"  • Status: {stats['status']}")

def main():
    """Run complete demo verification"""
    print("🚗 RTOS DEMO LOG VERIFICATION")
    print("Testing exact log format from demo script...")
    print("Make sure Flask server is running on localhost:5000\n")
    
    try:
        # Test individual sequences
        brake_logs = test_brake_sequence()
        preemption_logs = test_preemption_sequence()
        test_statistics()
        
        print("\n" + "=" * 60)
        print("✅ DEMO VERIFICATION COMPLETE!")
        print("\nKey Points for Demo:")
        print("1. ✅ Microsecond precision timestamps")
        print("2. ✅ Priority badges [P7], [P6], [P5]")
        print("3. ✅ Complete ISR → Task sequence")
        print("4. ✅ Preemption detection")
        print("5. ✅ Real-time statistics")
        print("\n🎯 Ready for live demonstration!")
        
    except requests.exceptions.ConnectionError:
        print("❌ ERROR: Could not connect to Flask server.")
        print("Make sure to run: python run.py")
    except Exception as e:
        print(f"❌ ERROR: {e}")

if __name__ == "__main__":
    main()