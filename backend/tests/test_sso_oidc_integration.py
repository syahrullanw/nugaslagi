"""Regression coverage for the SCI-ID OIDC entry and one-time ticket boundary."""

import os
from urllib.parse import parse_qs, urlsplit

import httpx
import pytest


BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")


@pytest.mark.skipif(not BASE_URL, reason="REACT_APP_BACKEND_URL is required")
def test_sso_config_and_pkce_authorization_redirect():
    with httpx.Client(timeout=20, follow_redirects=False) as client:
        config = client.get(f"{BASE_URL}/api/auth/sso/config")
        assert config.status_code == 200
        assert config.json()["enabled"] is True
        assert config.json()["provider"] == "SCI-ID"

        response = client.get(config.json()["login_url"])
        assert response.status_code == 307
        location = response.headers["location"]
        query = parse_qs(urlsplit(location).query)
        assert query["client_id"] == ["nugaslagi-local"]
        assert query["response_type"] == ["code"]
        assert query["code_challenge_method"] == ["S256"]
        assert query["state"][0]
        assert query["nonce"][0]
        assert query["code_challenge"][0]


@pytest.mark.skipif(not BASE_URL, reason="REACT_APP_BACKEND_URL is required")
def test_sso_rejects_unknown_state_and_invalid_exchange_ticket():
    with httpx.Client(timeout=20, follow_redirects=False) as client:
        callback = client.get(
            f"{BASE_URL}/api/auth/sso/callback",
            params={"state": "unknown-state", "code": "unknown-code"},
        )
        assert callback.status_code == 303
        assert "sso_error=" in callback.headers["location"]

        exchange = client.post(
            f"{BASE_URL}/api/auth/sso/exchange",
            json={"ticket": "invalid-ticket-value-long-enough"},
        )
        assert exchange.status_code == 401


@pytest.mark.skipif(not BASE_URL, reason="REACT_APP_BACKEND_URL is required")
def test_admin_sso_settings_are_protected_and_never_return_secret():
    with httpx.Client(timeout=20) as client:
        unauthorized = client.get(f"{BASE_URL}/api/sso/settings")
        assert unauthorized.status_code == 401

        login = client.post(
            f"{BASE_URL}/api/auth/login",
            json={"identifier": "dosenadmin", "password": "Dosen123!"},
        )
        assert login.status_code == 200
        headers = {"Authorization": f"Bearer {login.json()['token']}"}
        settings = client.get(f"{BASE_URL}/api/sso/settings", headers=headers)
        assert settings.status_code == 200
        payload = settings.json()
        assert payload["provider"] == "SCI-ID"
        assert payload["client_id"] == "nugaslagi-local"
        assert "client_secret" not in payload
        assert payload["client_secret_masked"] in {"", "••••••••••••"}

        connection = client.post(f"{BASE_URL}/api/sso/settings/test", headers=headers)
        assert connection.status_code == 200
        assert connection.json()["ok"] is True
