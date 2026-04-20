"""Backend API tests for Mapa Personal."""
import os
import io
import base64
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001").rstrip("/")
# Use internal backend if external is slow/sleeping
INTERNAL = "http://localhost:8001"


@pytest.fixture(scope="session")
def base_url():
    # Try external first, fallback to internal
    try:
        r = requests.get(f"{BASE_URL}/api/", timeout=5)
        if r.status_code == 200:
            return BASE_URL
    except Exception:
        pass
    return INTERNAL


@pytest.fixture(scope="session")
def client():
    s = requests.Session()
    return s


@pytest.fixture(scope="session")
def test_location(client, base_url):
    r = client.post(f"{base_url}/api/locations", json={
        "name": "TEST_Location_PyTest",
        "latitude": 19.4326,
        "longitude": -99.1332,
    }, timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["name"] == "TEST_Location_PyTest"
    assert "id" in data
    yield data
    # cleanup
    client.delete(f"{base_url}/api/locations/{data['id']}", timeout=10)


# --- Config ---
def test_get_config(client, base_url):
    r = client.get(f"{base_url}/api/config", timeout=10)
    assert r.status_code == 200
    d = r.json()
    assert "accessToken" in d and d["accessToken"].startswith("pk.")
    assert len(d["center"]) == 2
    assert d["pitch"] == 60


# --- Locations CRUD ---
def test_list_locations(client, base_url, test_location):
    r = client.get(f"{base_url}/api/locations", timeout=10)
    assert r.status_code == 200
    locs = r.json()
    assert isinstance(locs, list)
    ids = [l["id"] for l in locs]
    assert test_location["id"] in ids


def test_get_location_by_id(client, base_url, test_location):
    r = client.get(f"{base_url}/api/locations/{test_location['id']}", timeout=10)
    assert r.status_code == 200
    assert r.json()["name"] == "TEST_Location_PyTest"


def test_get_location_404(client, base_url):
    r = client.get(f"{base_url}/api/locations/nonexistent-id", timeout=10)
    assert r.status_code == 404


# --- Comments ---
def test_add_comment(client, base_url, test_location):
    r = client.post(
        f"{base_url}/api/locations/{test_location['id']}/comments",
        json={"text": "Test comment"}, timeout=10,
    )
    assert r.status_code == 200
    assert r.json()["text"] == "Test comment"
    # verify persist
    g = client.get(f"{base_url}/api/locations/{test_location['id']}", timeout=10)
    assert any(c["text"] == "Test comment" for c in g.json().get("comments", []))


# --- Tags ---
def test_add_and_remove_tag(client, base_url, test_location):
    r = client.post(
        f"{base_url}/api/locations/{test_location['id']}/tags",
        json={"tag": "testtag"}, timeout=10,
    )
    assert r.status_code == 200
    g = client.get(f"{base_url}/api/locations/{test_location['id']}", timeout=10)
    assert "testtag" in g.json()["tags"]

    # remove
    r2 = client.delete(
        f"{base_url}/api/locations/{test_location['id']}/tags/testtag", timeout=10,
    )
    assert r2.status_code == 200
    g2 = client.get(f"{base_url}/api/locations/{test_location['id']}", timeout=10)
    assert "testtag" not in g2.json()["tags"]


# --- Images ---
# 1x1 valid PNG (real pixel, but tiny). Replace with a richer image if needed.
# This is a small PNG with some variance - created by base64
TEST_PNG_B64 = (
    "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAIElEQVR42mP8z8AARI"
    "xAEBsbGxsVpGJAYGhgYGAAAwBQAwH2mgwbYwAAAABJRU5ErkJggg=="
)


def test_upload_and_get_image(client, base_url, test_location):
    img_bytes = base64.b64decode(TEST_PNG_B64)
    files = {"file": ("test.png", io.BytesIO(img_bytes), "image/png")}
    r = client.post(
        f"{base_url}/api/locations/{test_location['id']}/images",
        files=files, timeout=60,
    )
    assert r.status_code == 200, r.text
    d = r.json()
    assert "storage_path" in d
    assert d["content_type"] == "image/png"
    # Retrieve image
    r2 = client.get(f"{base_url}/api/images/{d['storage_path']}", timeout=30)
    assert r2.status_code == 200
    assert len(r2.content) > 0


# --- AI Analyze ---
def test_ai_analyze(client, base_url, test_location):
    # Endpoint takes location_id as QUERY PARAM (FastAPI body-less POST)
    r = client.post(
        f"{base_url}/api/ai/analyze",
        params={"location_id": test_location["id"]},
        timeout=60,
    )
    assert r.status_code == 200
    assert "analysis" in r.json()


# --- Emergency ---
def test_emergency_send(client, base_url):
    payload = {
        "latitude": 19.4326,
        "longitude": -99.1332,
        "message": "Test emergency",
        "contact": {"name": "TestContact", "phone": "+1234567890"},
    }
    r = client.post(f"{base_url}/api/emergency/send", json=payload, timeout=15)
    assert r.status_code == 200
    d = r.json()
    assert d["success"] is True
    assert d["sent_to"] == "TestContact"
