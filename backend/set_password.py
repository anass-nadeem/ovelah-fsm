"""
Run this once (from the backend/ folder) to set the app's shared
login password. Safe to run again later to change it - it always
overwrites whatever password was set before.

Usage:
    python set_password.py
"""

import getpass
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.auth import set_password


def main():
    print("Set the shared app password.")
    print("Everyone on staff will use this same password to log in.")
    print()

    password = getpass.getpass("New password: ")

    if len(password) < 4:
        print("Password must be at least 4 characters. Nothing was changed.")
        return

    confirm = getpass.getpass("Confirm password: ")

    if password != confirm:
        print("Passwords didn't match. Nothing was changed.")
        return

    set_password(password)

    print()
    print("Password set. Restart uvicorn if it's currently running.")


if __name__ == "__main__":
    main()