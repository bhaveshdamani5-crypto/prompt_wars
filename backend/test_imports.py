"""Quick import validation test."""
try:
    from app.main import app
    print("All imports validated successfully.")
    print(f"Routes registered: {[r.path for r in app.routes]}")
    print("Server is ready to launch.")
except Exception as e:
    print(f"Import error: {e}")
    import traceback
    traceback.print_exc()
