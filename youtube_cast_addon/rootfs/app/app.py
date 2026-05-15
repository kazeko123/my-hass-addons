#!/usr/bin/env python3
"""
YouTube Music Cinematic - Home Assistant Add-on
Backend Flask application
"""

import os
import sys
import json
import logging
import requests
import subprocess
import threading
import time
import shutil

# Auto-detect yt-dlp command
def _find_ytdlp():
    # Try yt-dlp binary first
    cmd = shutil.which('yt-dlp') or shutil.which('yt-dlp.exe')
    if cmd:
        return [cmd]
    # Fallback: python -m yt_dlp
    return [sys.executable, '-m', 'yt_dlp']

YTDLP_CMD = _find_ytdlp()
from flask import Flask, render_template, request, jsonify, Response, stream_with_context
from flask_cors import CORS

app = Flask(__name__, 
    template_folder='templates',
    static_folder='static')
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# HASS API configuration
HASS_TOKEN = os.environ.get('SUPERVISOR_TOKEN', '')
HASS_API = 'http://supervisor/core/api'

def hass_headers():
    return {
        'Authorization': f'Bearer {HASS_TOKEN}',
        'Content-Type': 'application/json'
    }

def get_media_players():
    """Get all media players from Home Assistant"""
    try:
        resp = requests.get(f'{HASS_API}/states', headers=hass_headers(), timeout=10)
        if resp.status_code == 200:
            states = resp.json()
            players = [
                {
                    'entity_id': s['entity_id'],
                    'name': s.get('attributes', {}).get('friendly_name', s['entity_id']),
                    'state': s['state'],
                    'media_title': s.get('attributes', {}).get('media_title', ''),
                    'media_artist': s.get('attributes', {}).get('media_artist', ''),
                    'media_content_id': s.get('attributes', {}).get('media_content_id', ''),
                    'volume_level': s.get('attributes', {}).get('volume_level', 0),
                    'is_volume_muted': s.get('attributes', {}).get('is_volume_muted', False),
                    'entity_picture': s.get('attributes', {}).get('entity_picture', ''),
                    'media_duration': s.get('attributes', {}).get('media_duration', 0),
                    'media_position': s.get('attributes', {}).get('media_position', 0),
                }
                for s in states
                if s['entity_id'].startswith('media_player.')
            ]
            return players
        return []
    except Exception as e:
        logger.error(f'Error fetching media players: {e}')
        return []

def call_hass_service(domain, service, data):
    """Call a Home Assistant service"""
    try:
        resp = requests.post(
            f'{HASS_API}/services/{domain}/{service}',
            headers=hass_headers(),
            json=data,
            timeout=10
        )
        return resp.status_code == 200, resp.json() if resp.content else {}
    except Exception as e:
        logger.error(f'Error calling HASS service: {e}')
        return False, {}

def search_youtube(query, max_results=20):
    """Search YouTube using yt-dlp"""
    try:
        if not query or query.strip() == '':
            query = 'nhạc hay 2025 top hits'
        
        cmd = [
            *YTDLP_CMD,
            f'ytsearch{max_results}:{query}',
            '--dump-json',
            '--no-playlist',
            '--no-warnings',
            '--quiet',
            '--ignore-errors',
            '--no-download',
            '--flat-playlist',
            '--extractor-args', 'youtube:skip=dash',
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        
        videos = []
        for line in result.stdout.strip().split('\n'):
            if not line.strip():
                continue
            try:
                data = json.loads(line)
                videos.append({
                    'id': data.get('id', ''),
                    'title': data.get('title', 'Unknown'),
                    'channel': data.get('uploader', data.get('channel', 'Unknown')),
                    'duration': data.get('duration', 0),
                    'thumbnail': data.get('thumbnail', f"https://i.ytimg.com/vi/{data.get('id', '')}/hqdefault.jpg"),
                    'view_count': data.get('view_count', 0),
                    'url': f"https://www.youtube.com/watch?v={data.get('id', '')}",
                })
            except json.JSONDecodeError:
                continue
        
        return videos
    except subprocess.TimeoutExpired:
        logger.error('YouTube search timed out')
        return []
    except Exception as e:
        logger.error(f'Error searching YouTube: {e}')
        return []

def get_stream_url(video_id):
    """Get stream URL for a video"""
    try:
        youtube_url = f'https://www.youtube.com/watch?v={video_id}'
        cmd = [
            *YTDLP_CMD,
            '-f', 'bestaudio[ext=m4a]/bestaudio/best',
            '--get-url',
            '--no-playlist',
            '--no-warnings',
            '--quiet',
            '--no-check-certificate',
            youtube_url
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            return result.stdout.strip()
        return None
    except Exception as e:
        logger.error(f'Error getting stream URL: {e}')
        return None

def get_video_info(video_id):
    """Get video information"""
    try:
        youtube_url = f'https://www.youtube.com/watch?v={video_id}'
        cmd = [
            *YTDLP_CMD,
            '--dump-json',
            '--no-playlist',
            '--no-warnings',
            '--quiet',
            '--no-download',
            youtube_url
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode == 0 and result.stdout.strip():
            data = json.loads(result.stdout.strip())
            return {
                'id': data.get('id', video_id),
                'title': data.get('title', 'Unknown'),
                'channel': data.get('uploader', data.get('channel', 'Unknown')),
                'duration': data.get('duration', 0),
                'thumbnail': data.get('thumbnail', f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"),
                'description': data.get('description', ''),
            }
        return None
    except Exception as e:
        logger.error(f'Error getting video info: {e}')
        return None

# ==================== ROUTES ====================

@app.route('/')
def index():
    """Main page"""
    return render_template('index.html')

@app.route('/api/search')
def search():
    """Search YouTube"""
    query = request.args.get('q', '')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    max_results = page * per_page
    
    videos = search_youtube(query, max_results=min(max_results, 50))
    
    # Return only the current page
    start = (page - 1) * per_page
    page_videos = videos[start:start + per_page]
    
    return jsonify({
        'success': True,
        'videos': page_videos,
        'total': len(videos),
        'page': page,
        'has_more': len(videos) > page * per_page
    })

@app.route('/api/stream/<video_id>')
def stream(video_id):
    """Get stream URL"""
    url = get_stream_url(video_id)
    if url:
        return jsonify({'success': True, 'url': url})
    return jsonify({'success': False, 'error': 'Could not get stream URL'}), 404

@app.route('/api/video/<video_id>')
def video_info(video_id):
    """Get video information"""
    info = get_video_info(video_id)
    if info:
        return jsonify({'success': True, 'video': info})
    return jsonify({'success': False, 'error': 'Video not found'}), 404

@app.route('/api/proxy-stream/<video_id>')
def proxy_stream(video_id):
    """Proxy the audio stream"""
    try:
        stream_url = get_stream_url(video_id)
        if not stream_url:
            return jsonify({'error': 'Cannot get stream URL'}), 404
        
        def generate():
            with requests.get(stream_url, stream=True, timeout=60) as r:
                for chunk in r.iter_content(chunk_size=8192):
                    if chunk:
                        yield chunk
        
        resp = requests.head(stream_url, timeout=10)
        content_type = resp.headers.get('Content-Type', 'audio/mp4')
        
        return Response(
            stream_with_context(generate()),
            content_type=content_type,
            headers={
                'Accept-Ranges': 'bytes',
                'Cache-Control': 'no-cache',
            }
        )
    except Exception as e:
        logger.error(f'Proxy stream error: {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/players')
def players():
    """Get media players"""
    player_list = get_media_players()
    return jsonify({'success': True, 'players': player_list})

@app.route('/api/player/<entity_id>/state')
def player_state(entity_id):
    """Get player state"""
    try:
        resp = requests.get(
            f'{HASS_API}/states/{entity_id}',
            headers=hass_headers(),
            timeout=10
        )
        if resp.status_code == 200:
            state = resp.json()
            return jsonify({'success': True, 'state': {
                'state': state['state'],
                'media_title': state.get('attributes', {}).get('media_title', ''),
                'media_artist': state.get('attributes', {}).get('media_artist', ''),
                'media_content_id': state.get('attributes', {}).get('media_content_id', ''),
                'volume_level': state.get('attributes', {}).get('volume_level', 0),
                'is_volume_muted': state.get('attributes', {}).get('is_volume_muted', False),
                'media_duration': state.get('attributes', {}).get('media_duration', 0),
                'media_position': state.get('attributes', {}).get('media_position', 0),
                'media_position_updated_at': state.get('attributes', {}).get('media_position_updated_at', ''),
            }})
        return jsonify({'success': False}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/cast', methods=['POST'])
def cast():
    """Cast media to a device"""
    data = request.json
    entity_id = data.get('entity_id')
    video_id = data.get('video_id')
    video_title = data.get('title', '')
    
    if not entity_id or not video_id:
        return jsonify({'success': False, 'error': 'Missing entity_id or video_id'}), 400
    
    # Get stream URL 
    stream_url = get_stream_url(video_id)
    if not stream_url:
        return jsonify({'success': False, 'error': 'Cannot get stream URL'}), 404
    
    # Play on media player
    success, result = call_hass_service('media_player', 'play_media', {
        'entity_id': entity_id,
        'media_content_id': stream_url,
        'media_content_type': 'music',
    })
    
    if success:
        return jsonify({'success': True, 'stream_url': stream_url})
    return jsonify({'success': False, 'error': 'Failed to cast'}), 500

@app.route('/api/player/control', methods=['POST'])
def player_control():
    """Control media player"""
    data = request.json
    entity_id = data.get('entity_id')
    action = data.get('action')
    
    if not entity_id or not action:
        return jsonify({'success': False, 'error': 'Missing entity_id or action'}), 400
    
    action_map = {
        'play': ('media_player', 'media_play'),
        'pause': ('media_player', 'media_pause'),
        'stop': ('media_player', 'media_stop'),
        'next': ('media_player', 'media_next_track'),
        'prev': ('media_player', 'media_previous_track'),
        'volume_up': ('media_player', 'volume_up'),
        'volume_down': ('media_player', 'volume_down'),
        'mute': ('media_player', 'volume_mute'),
    }
    
    if action not in action_map:
        return jsonify({'success': False, 'error': f'Unknown action: {action}'}), 400
    
    domain, service = action_map[action]
    service_data = {'entity_id': entity_id}
    
    if action == 'mute':
        service_data['is_volume_muted'] = data.get('muted', True)
    
    success, result = call_hass_service(domain, service, service_data)
    return jsonify({'success': success})

@app.route('/api/player/volume', methods=['POST'])
def set_volume():
    """Set volume"""
    data = request.json
    entity_id = data.get('entity_id')
    volume = data.get('volume', 0.5)
    
    success, result = call_hass_service('media_player', 'volume_set', {
        'entity_id': entity_id,
        'volume_level': volume
    })
    return jsonify({'success': success})

@app.route('/api/player/seek', methods=['POST'])
def seek():
    """Seek to position"""
    data = request.json
    entity_id = data.get('entity_id')
    position = data.get('position', 0)
    
    success, result = call_hass_service('media_player', 'media_seek', {
        'entity_id': entity_id,
        'seek_position': position
    })
    return jsonify({'success': success})

@app.route('/api/playlists', methods=['GET'])
def get_playlists():
    """Get playlists from persistent storage"""
    try:
        playlist_file = '/data/playlists.json'
        if os.path.exists(playlist_file):
            with open(playlist_file, 'r', encoding='utf-8') as f:
                playlists = json.load(f)
        else:
            playlists = []
        return jsonify({'success': True, 'playlists': playlists})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/playlists', methods=['POST'])
def save_playlist():
    """Save a playlist"""
    try:
        data = request.json
        playlist_file = '/data/playlists.json'
        
        if os.path.exists(playlist_file):
            with open(playlist_file, 'r', encoding='utf-8') as f:
                playlists = json.load(f)
        else:
            playlists = []
        
        # Find existing or add new
        existing_idx = next((i for i, p in enumerate(playlists) if p['id'] == data.get('id')), None)
        if existing_idx is not None:
            playlists[existing_idx] = data
        else:
            playlists.append(data)
        
        with open(playlist_file, 'w', encoding='utf-8') as f:
            json.dump(playlists, f, ensure_ascii=False, indent=2)
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/playlists/<playlist_id>', methods=['DELETE'])
def delete_playlist(playlist_id):
    """Delete a playlist"""
    try:
        playlist_file = '/data/playlists.json'
        if os.path.exists(playlist_file):
            with open(playlist_file, 'r', encoding='utf-8') as f:
                playlists = json.load(f)
            playlists = [p for p in playlists if p['id'] != playlist_id]
            with open(playlist_file, 'w', encoding='utf-8') as f:
                json.dump(playlists, f, ensure_ascii=False, indent=2)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/now-playing', methods=['GET'])
def get_now_playing():
    """Get currently playing track from storage (for restore on reload)"""
    try:
        state_file = '/data/now_playing.json'
        if os.path.exists(state_file):
            with open(state_file, 'r', encoding='utf-8') as f:
                state = json.load(f)
            return jsonify({'success': True, 'state': state})
        return jsonify({'success': True, 'state': None})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/now-playing', methods=['POST'])
def save_now_playing():
    """Save currently playing track state"""
    try:
        data = request.json
        state_file = '/data/now_playing.json'
        with open(state_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/timers', methods=['GET'])
def get_timers():
    """Get timers"""
    try:
        timer_file = '/data/timers.json'
        if os.path.exists(timer_file):
            with open(timer_file, 'r', encoding='utf-8') as f:
                timers = json.load(f)
        else:
            timers = []
        return jsonify({'success': True, 'timers': timers})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/timers', methods=['POST'])
def save_timers():
    """Save timers"""
    try:
        data = request.json
        timer_file = '/data/timers.json'
        with open(timer_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=2232, debug=False)
