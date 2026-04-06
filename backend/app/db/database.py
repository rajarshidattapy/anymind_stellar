from supabase import create_client, Client
from app.core.config import settings
from typing import Optional

_supabase: Optional[Client] = None


def get_supabase() -> Optional[Client]:
    """
    Get Supabase client. Returns None if Supabase is not configured or invalid.
    This allows the app to run with in-memory storage for development.
    Uses service role key if available, otherwise falls back to anon key.
    """
    global _supabase
    if _supabase is None:
        if not settings.SUPABASE_URL:
            # Return None instead of raising - allows in-memory fallback
            # print("WARNING: Supabase not configured - using in-memory storage")
            return None
        
        # Try service role key first, then anon key
        api_key = None
        key_type = None
        
        if settings.SUPABASE_SERVICE_KEY:
            api_key = settings.SUPABASE_SERVICE_KEY
            key_type = 'service role'
        elif settings.SUPABASE_KEY:
            api_key = settings.SUPABASE_KEY
            key_type = 'anon/publishable'
        
        if not api_key:
            # print("WARNING: Supabase API key not configured - using in-memory storage")
            return None
        
        # Try to create client, but catch invalid credentials
        try:
            # Use explicit keyword arguments to avoid version compatibility issues
            _supabase = create_client(
                supabase_url=settings.SUPABASE_URL,
                supabase_key=api_key
            )
            # print(f"Supabase client created (using {key_type} key)")
        except Exception as e:
            # If credentials are invalid or connection fails, fall back to in-memory
            error_msg = str(e)
            # print(f"WARNING: Supabase connection failed: {error_msg}")
            # if "Invalid API key" in error_msg:
            #     print("NOTE: Make sure you're using the correct key format.")
            #     print("For Supabase Python client, you need JWT keys (starting with 'eyJ...')")
            #     print("Get your keys from: Settings -> API -> Project API keys")
            # print("WARNING: Falling back to in-memory storage")
            _supabase = None
            return None
    
    return _supabase


async def init_db():
    """Initialize database connection and create tables if needed"""
    supabase = get_supabase()
    
    if not supabase:
        # print("=" * 60)
        # print("⚠️  WARNING: Supabase is not configured!")
        # print("=" * 60)
        # print("Data will be stored in memory only and will be lost on server restart.")
        # print("To enable persistence:")
        # print("1. Create a Supabase project at https://supabase.com")
        # print("2. Add SUPABASE_URL and SUPABASE_KEY to your .env file")
        # print("3. Run the SQL schema from docs/DATABASE_SCHEMA.md in Supabase SQL editor")
        # print("=" * 60)
        return
    
    try:
        # Test connection by checking if agents table exists
        supabase.table("agents").select("id").limit(1).execute()
        # print("✅ Database connection established")
        print("✅ Supabase connected")
    except Exception as e:
        # print("=" * 60)
        # print("⚠️  WARNING: Supabase connection test failed!")
        # print("=" * 60)
        # print(f"Error: {e}")
        # print("This might mean:")
        # print("1. Tables don't exist - run the SQL schema from docs/DATABASE_SCHEMA.md")
        # print("2. Invalid credentials - check your SUPABASE_URL and SUPABASE_KEY")
        # print("3. Network issue - check your internet connection")
        # print("=" * 60)
        # print("The app will continue with in-memory storage (data will be lost on restart)")
        # print("=" * 60)
        pass

