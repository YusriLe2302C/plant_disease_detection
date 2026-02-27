import requests
import sys

def test_ml_service():
    """Test if ML service is running and responding"""
    
    print("=" * 50)
    print("  Testing ML Service")
    print("=" * 50)
    print()
    
    # Test health endpoint
    try:
        print("[1/2] Testing health endpoint...")
        response = requests.get("http://localhost:5001/health", timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ ML Service is healthy!")
            print(f"   Status: {data.get('status')}")
            print(f"   Device: {data.get('device')}")
            print(f"   Model Loaded: {data.get('model_loaded')}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to ML service")
        print("   Make sure Flask is running: python ml_service.py")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    print()
    print("[2/2] ML Service is ready for predictions!")
    print()
    print("=" * 50)
    print("  Next Steps:")
    print("=" * 50)
    print("1. Start frontend: cd frontend && npm run dev -- --host")
    print("2. Open browser: http://localhost:5173/live-scan")
    print("3. Click 'Start Scanning'")
    print()
    
    return True

if __name__ == "__main__":
    success = test_ml_service()
    sys.exit(0 if success else 1)
