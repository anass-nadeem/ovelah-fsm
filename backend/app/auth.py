"""
Simple shared-password authentication.

This is deliberately NOT a full user-accounts system - there's one
password for the whole app, shared by everyone on staff. That was a
conscious choice to keep this low-risk to add to an already-working
system: no new database tables, no new pip packages to install, no
per-route code changes needed anywhere else in the app.

How it works:
  - The password's hash (never the password itself) and a random
    signing key live in auth_config.json, created once by running
    set_password.py from the backend/ folder.
  - Logging in (POST /auth/login) checks the password against that
    hash and, if it matches, returns a signed token good for 30 days.
  - Every other route requires that token in an
    "Authorization: Bearer <token>" header. FastAPI's dependency
    system enforces this centrally (see main.py) - individual route
    files do not need to be touched.
"""

import hashlib
import hmac
import json
import secrets
import time
from pathlib import Path

from fastapi import Header, HTTPException, Query

BACKEND_DIR = Path(__file__).resolve().parent.parent
AUTH_CONFIG_PATH = BACKEND_DIR / "auth_config.json"

TOKEN_LIFETIME_SECONDS = 30 * 24 * 60 * 60  # 30 days


def _load_config() -> dict | None:
    if not AUTH_CONFIG_PATH.exists():
        return None

    return json.loads(AUTH_CONFIG_PATH.read_text(encoding="utf-8"))


def is_password_set() -> bool:
    return _load_config() is not None


def set_password(password: str) -> None:
    """
    Used only by set_password.py. Overwrites any existing password.
    """

    salt = secrets.token_hex(16)
    password_hash = _hash_password(password, salt)
    secret_key = secrets.token_hex(32)

    AUTH_CONFIG_PATH.write_text(
        json.dumps(
            {
                "salt": salt,
                "password_hash": password_hash,
                "secret_key": secret_key,
            }
        ),
        encoding="utf-8",
    )


def _hash_password(password: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        200_000,
    ).hex()


def verify_password(password: str) -> bool:
    config = _load_config()

    if not config:
        return False

    candidate_hash = _hash_password(password, config["salt"])

    # Constant-time comparison - avoids leaking how much of the
    # password was correct via response-timing differences.
    return hmac.compare_digest(
        candidate_hash,
        config["password_hash"],
    )


def create_token() -> str:
    config = _load_config()

    if not config:
        raise RuntimeError(
            "No password has been set - run set_password.py first."
        )

    expires_at = int(time.time()) + TOKEN_LIFETIME_SECONDS
    payload = str(expires_at)

    signature = hmac.new(
        config["secret_key"].encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    return f"{payload}.{signature}"


def _token_is_valid(token: str) -> bool:
    config = _load_config()

    if not config:
        return False

    try:
        payload, signature = token.split(".", 1)
    except ValueError:
        return False

    expected_signature = hmac.new(
        config["secret_key"].encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(signature, expected_signature):
        return False

    try:
        expires_at = int(payload)
    except ValueError:
        return False

    return time.time() < expires_at


def require_auth(
    authorization: str | None = Header(default=None),
    token: str | None = Query(default=None),
) -> None:
    """
    FastAPI dependency - attach to every router that needs a valid
    login. Raises 401 if the request has no valid token.

    Accepts the token two ways:
      - "Authorization: Bearer <token>" header - used by every
        normal fetch() call the app makes (see AuthGate.tsx).
      - "?token=<token>" query parameter - used only for opening a
        PDF in a new browser tab, where a plain navigation can't
        attach a custom header at all.
    """

    candidate = None

    if authorization and authorization.startswith("Bearer "):
        candidate = authorization.removeprefix("Bearer ").strip()
    elif token:
        candidate = token

    if not candidate:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated.",
        )

    if not _token_is_valid(candidate):
        raise HTTPException(
            status_code=401,
            detail="Session expired or invalid - please log in again.",
        )