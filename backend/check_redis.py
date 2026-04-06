"""
Diagnostic script to check why Redis is not available
Run this from the backend directory: python check_redis.py
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("=" * 60)
print("Redis/Vercel KV Diagnostic Check")
print("=" * 60)
print()

# Check 1: Is upstash-redis installed?
print("1. Checking if 'upstash-redis' package is installed...")
try:
    from upstash_redis import Redis
    print("   ✅ upstash-redis is installed")
    REDIS_AVAILABLE = True
except ImportError:
    print("   ❌ upstash-redis is NOT installed")
    print("   Fix: pip install upstash-redis")
    REDIS_AVAILABLE = False
    sys.exit(1)

print()

# Check 2: Environment variables
print("2. Checking environment variables...")
url = (
    os.getenv('KV_REST_API_URL') or 
    os.getenv('KV_URL') or 
    os.getenv('REDIS_URL') or 
    os.getenv('UPSTASH_REDIS_REST_URL')
)

token = (
    os.getenv('KV_REST_API_TOKEN') or 
    os.getenv('UPSTASH_REDIS_REST_TOKEN')
)

if url:
    print(f"   ✅ Redis URL found: {url[:50]}...")
else:
    print("   ❌ Redis URL NOT found")
    print("   Checked variables:")
    print("     - KV_REST_API_URL:", os.getenv('KV_REST_API_URL', 'NOT SET'))
    print("     - KV_URL:", os.getenv('KV_URL', 'NOT SET'))
    print("     - REDIS_URL:", os.getenv('REDIS_URL', 'NOT SET'))
    print("     - UPSTASH_REDIS_REST_URL:", os.getenv('UPSTASH_REDIS_REST_URL', 'NOT SET'))
    print("   Fix: Set one of these in your .env file")

if token:
    print(f"   ✅ Redis Token found: {token[:20]}...")
else:
    print("   ❌ Redis Token NOT found")
    print("   Checked variables:")
    print("     - KV_REST_API_TOKEN:", os.getenv('KV_REST_API_TOKEN', 'NOT SET'))
    print("     - UPSTASH_REDIS_REST_TOKEN:", os.getenv('UPSTASH_REDIS_REST_TOKEN', 'NOT SET'))
    print("   Fix: Set one of these in your .env file")

if not url or not token:
    print()
    print("   ⚠️  Cannot proceed without URL and Token")
    print("   See docs/VERCEL_KV_SETUP.md for setup instructions")
    sys.exit(1)

print()

# Check 3: Test connection
print("3. Testing Redis connection...")
try:
    redis = Redis(url=url, token=token)
    result = redis.ping()
    print(f"   ✅ Connection successful! Ping response: {result}")
    print("   ✅ Redis is available and working")
except Exception as e:
    print(f"   ❌ Connection failed: {e}")
    print("   Possible issues:")
    print("     - Invalid credentials (check URL and token)")
    print("     - Network connectivity issue")
    print("     - Vercel KV database not created or deleted")
    print("   Fix: Verify credentials in Vercel Dashboard → Storage → KV")
    sys.exit(1)

print()
print("=" * 60)
print("✅ All checks passed! Redis should be available.")
print("=" * 60)

