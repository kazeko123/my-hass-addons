# -*- coding: utf-8 -*-
"""
Test runner - chay Flask app local ma khong can HASS hay Docker
Dung: python run_local.py
Mở browser: http://localhost:2232
"""
import os
import sys

# Thêm thư mục app vào path
app_dir = os.path.join(os.path.dirname(__file__), 'rootfs', 'app')
sys.path.insert(0, app_dir)

# Set env var giả để app.py không lỗi khi không có HASS
os.environ['SUPERVISOR_TOKEN'] = 'fake_token_for_local_test'

# Patch requests tới HASS API để trả về dữ liệu giả
import unittest.mock as mock
import json

# Danh sách media player giả
FAKE_PLAYERS = [
    {
        "entity_id": "media_player.living_room",
        "state": "idle",
        "attributes": {
            "friendly_name": "Loa phòng khách",
            "volume_level": 0.7,
            "is_volume_muted": False,
            "media_title": "",
            "media_artist": "",
            "media_content_id": "",
            "entity_picture": "",
        }
    },
    {
        "entity_id": "media_player.bedroom_cast",
        "state": "playing",
        "attributes": {
            "friendly_name": "Google Home phòng ngủ",
            "volume_level": 0.5,
            "is_volume_muted": False,
            "media_title": "Bài hát đang phát",
            "media_artist": "Nghệ sĩ",
            "media_content_id": "https://youtube.com/watch?v=test",
            "entity_picture": "",
        }
    },
    {
        "entity_id": "media_player.kitchen_speaker",
        "state": "paused",
        "attributes": {
            "friendly_name": "Loa bếp",
            "volume_level": 0.3,
            "is_volume_muted": False,
        }
    },
]

class FakeResponse:
    def __init__(self, data, status=200):
        self._data = data
        self.status_code = status
        self.content = json.dumps(data).encode()
    def json(self):
        return self._data

original_get = None
original_post = None

def mock_get(url, **kwargs):
    if '/api/states' in url and url.endswith('/states'):
        return FakeResponse(FAKE_PLAYERS)
    if '/api/states/media_player.' in url:
        eid = url.split('/api/states/')[-1]
        player = next((p for p in FAKE_PLAYERS if p['entity_id'] == eid), None)
        if player:
            return FakeResponse(player)
        return FakeResponse({}, 404)
    # Với các request khác (YouTube stream URLs), dùng requests thật
    import requests as real_requests
    return real_requests.get.__wrapped__(url, **kwargs) if hasattr(real_requests.get, '__wrapped__') else original_get(url, **kwargs)

def mock_post(url, **kwargs):
    if '/api/services/' in url:
        print(f"[MOCK HASS] Service call: {url} | data: {kwargs.get('json', {})}")
        return FakeResponse([{"entity_id": "media_player.living_room", "state": "playing"}])
    import requests as real_requests
    return original_post(url, **kwargs)

# Áp dụng mock
import requests
original_get = requests.get
original_post = requests.post

# Chỉ mock các URL của HASS
_orig_get = requests.get
def smart_mock_get(url, *args, **kwargs):
    if 'supervisor' in url or '127.0.0.1' in url and '/api/' in url:
        return mock_get(url, **kwargs)
    return _orig_get(url, *args, **kwargs)

_orig_post = requests.post
def smart_mock_post(url, *args, **kwargs):
    if 'supervisor' in url:
        return mock_post(url, **kwargs)
    return _orig_post(url, *args, **kwargs)

requests.get = smart_mock_get
requests.post = smart_mock_post

# Tạo thư mục /data giả trong local
data_dir = os.path.join(os.path.dirname(__file__), 'local_data')
os.makedirs(data_dir, exist_ok=True)

# Patch đường dẫn /data -> local_data
import builtins
_orig_open = builtins.open
def patched_open(file, *args, **kwargs):
    if isinstance(file, str) and file.startswith('/data/'):
        file = file.replace('/data/', data_dir + '/')
    return _orig_open(file, *args, **kwargs)
builtins.open = patched_open

_orig_exists = os.path.exists
def patched_exists(path):
    if isinstance(path, str) and path.startswith('/data/'):
        path = path.replace('/data/', data_dir + '/')
    return _orig_exists(path)
os.path.exists = patched_exists

# Import và chạy app
print("=" * 50)
print("[YT Music] LOCAL TEST MODE")
print("=" * 50)
print(f"[DATA] Data dir: {data_dir}")
print(f"[OK] Mo browser: http://localhost:2232")
print(f"[MOCK] HASS API duoc mock (media players gia)")
print("=" * 50)

from app import app
app.run(host='0.0.0.0', port=2232, debug=True, use_reloader=True)
