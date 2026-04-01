"""
SHELFLIFE AI - Local Display Simulator
Simulates LED/LCD output on the console
"""

class Display:
    """Simulates physical display (LED/LCD)"""
    
    def __init__(self):
        pass
    
    def update(self, container_id: str, day: int, hour: int, 
               health_score: int, temperature: float, 
               alerts: list):
        """Print a simulated display to console"""
        
        # Determine LED color
        if health_score >= 70:
            led_color = "🟢 GREEN"
        elif health_score >= 40:
            led_color = "🟡 YELLOW"
        else:
            led_color = "🔴 RED"
        
        # Clear screen (simulated)
        print("\n" + "="*50)
        print(f"📦 CONTAINER: {container_id}")
        print(f"📅 Day: {day} | Hour: {hour}")
        print(f"🌡️ Temp: {temperature}°C")
        print(f"❤️ Health Score: {health_score}/100")
        print(f"💡 LED Status: {led_color}")
        print("-"*50)
        
        if alerts:
            print("🔔 ACTIVE ALERTS:")
            for alert in alerts:
                severity = alert.get('severity', 'INFO')
                if severity == 'CRITICAL':
                    print(f"   🔴 {severity}: {alert['message']}")
                    print(f"      → ACTION: {alert.get('action', 'Inspect')}")
                elif severity == 'HIGH':
                    print(f"   🟠 {severity}: {alert['message']}")
                elif severity == 'WARNING':
                    print(f"   🟡 {severity}: {alert['message']}")
                else:
                    print(f"   🔵 {severity}: {alert['message']}")
        else:
            print("✅ No active alerts")
        
        print("="*50)
