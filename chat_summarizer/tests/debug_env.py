"""Debug script to check .env loading."""

import os
import pathlib

print("=" * 60)
print("Debugging .env Loading")
print("=" * 60)

# Check current directory
print(f"\nCurrent working directory: {os.getcwd()}")

# Check .env file location
env_path = pathlib.Path(__file__).parent.parent / '.env'
print(f"\nLooking for .env at: {env_path}")
print(f".env file exists: {env_path.exists()}")

if env_path.exists():
    print(f".env file size: {env_path.stat().st_size} bytes")
    
    # Try to read it
    try:
        with open(env_path, 'r') as f:
            content = f.read()
            print(f"\n.env file content (first 50 chars): {repr(content[:50])}")
            # Don't print full key for security
            if 'HF_API_KEY' in content:
                key_line = [line for line in content.split('\n') if 'HF_API_KEY' in line][0]
                if key_line:
                    key_value = key_line.split('=', 1)[1] if '=' in key_line else 'NOT FOUND'
                    print(f"Found HF_API_KEY in .env (length: {len(key_value.strip())} chars)")
    except Exception as e:
        print(f"Error reading .env: {e}")

# Try loading with dotenv
print("\n" + "-" * 60)
print("Testing dotenv loading:")
print("-" * 60)

try:
    from dotenv import load_dotenv
    print("✓ python-dotenv is installed")
    
    # Try loading
    if env_path.exists():
        result = load_dotenv(env_path)
        print(f"load_dotenv returned: {result}")
        
        # Check if key is now in environment
        api_key = os.getenv("HF_API_KEY")
        if api_key:
            print(f"✓ HF_API_KEY found in environment (length: {len(api_key)} chars)")
            print(f"  First 10 chars: {api_key[:10]}...")
        else:
            print("✗ HF_API_KEY not found in environment after load_dotenv")
            
        # Check all env vars
        print(f"\nAll environment variables with 'HF' or 'HUGGING':")
        for key, value in os.environ.items():
            if 'HF' in key.upper() or 'HUGGING' in key.upper():
                print(f"  {key} = {value[:20]}...")
    else:
        print("✗ .env file does not exist at expected path")
        
except ImportError:
    print("✗ python-dotenv is NOT installed")
    print("  Install with: pip install python-dotenv")

print("\n" + "=" * 60)
