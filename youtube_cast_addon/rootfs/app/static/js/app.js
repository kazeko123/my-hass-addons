// ===== STATE =====
const state = {
  currentVideo: null,
  queue: [],
  queueIndex: -1,
  isPlaying: false,
  isLoading: false,
  selectedDevice: null, // null = phone
  players: [],
  playlists: [],
  timers: [],
  searchQuery: '',
  searchPage: 1,
  shuffle: false,
  repeat: false, // false | 'one' | 'all'
  currentTime: 0,
  duration: 0,
  progressTimer: null,
  playerPollTimer: null,
};

// Map lưu full video data theo id - dùng để build queue đầy đủ
const videoDataMap = new Map();

const audio = document.getElementById('audioPlayer');

// ===== THEME =====
function initTheme() {
  const saved = localStorage.getItem('yt_theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon();
}
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('yt_theme', next);
  updateThemeIcon();
}
function updateThemeIcon() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
    || (window.matchMedia('(prefers-color-scheme: dark)').matches && !localStorage.getItem('yt_theme'));
  document.getElementById('iconMoon').classList.toggle('hidden', isDark);
  document.getElementById('iconSun').classList.toggle('hidden', !isDark);
}

// ===== TABS =====
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + tab));
  if (tab === 'playlist') renderPlaylists();
  if (tab === 'timer') renderTimers();
}

// ===== SEARCH =====
async function doSearch(reset = true) {
  const q = document.getElementById('searchInput').value.trim();
  state.searchQuery = q;
  if (reset) state.searchPage = 1;
  document.getElementById('listLoading').style.display = 'flex';
  document.getElementById('loadMoreSection').style.display = 'none';
  if (reset) document.getElementById('videoItems').innerHTML = '';
  document.getElementById('btnClearSearch').style.display = q ? 'block' : 'none';
  try {
    const r = await fetch(`api/search?q=${encodeURIComponent(q)}&page=${state.searchPage}&per_page=20`);
    const data = await r.json();
    if (data.success) {
      appendVideoCards(data.videos);
      if (data.has_more) {
        document.getElementById('loadMoreSection').style.display = 'block';
      }
    }
  } catch(e) { console.error(e); }
  document.getElementById('listLoading').style.display = 'none';
}

function clearSearch() {
  document.getElementById('searchInput').value = '';
  document.getElementById('btnClearSearch').style.display = 'none';
  doSearch();
}

function loadMore() {
  state.searchPage++;
  doSearch(false);
}

function appendVideoCards(videos) {
  const container = document.getElementById('videoItems');
  videos.forEach(v => {
    // Lưu full data vào map để queue dùng sau
    videoDataMap.set(v.id, v);

    const div = document.createElement('div');
    div.className = 'video-card' + (state.currentVideo?.id === v.id ? ' playing' : '');
    div.id = 'vc-' + v.id;
    div.innerHTML = `
      <div class="video-thumb-wrap" onclick="playVideo(${JSON.stringify(v).replace(/"/g,'&quot;')})">
        <img class="video-thumb" src="${v.thumbnail}" loading="lazy" onerror="this.src='static/img/placeholder.svg'">
        <span class="video-duration">${formatDuration(v.duration)}</span>
      </div>
      <div class="video-info" onclick="playVideo(${JSON.stringify(v).replace(/"/g,'&quot;')})">
        <p class="video-title">${escHtml(v.title)}</p>
        <p class="video-channel">${escHtml(v.channel)}</p>
      </div>
      <div class="video-actions">
        <button class="btn-add-song" title="Thêm vào playlist" onclick="event.stopPropagation();openAddToPlaylist(${JSON.stringify(v).replace(/"/g,'&quot;')})">+</button>
        <button class="btn-play-song" onclick="event.stopPropagation();playVideo(${JSON.stringify(v).replace(/"/g,'&quot;')})">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </button>
      </div>`;
    container.appendChild(div);
  });
}

// ===== PLAY VIDEO =====
async function playVideo(video, fromQueue = false) {
  if (!fromQueue) {
    // Build queue từ danh sách đang hiển thị, dùng videoDataMap để lấy full data
    const items = document.querySelectorAll('.video-card');
    state.queue = [];
    items.forEach(el => {
      const id = el.id.replace('vc-', '');
      if (!id) return;
      // Lấy full object từ map, fallback về {id} nếu chưa có
      state.queue.push(videoDataMap.get(id) || { id });
    });
    state.queueIndex = state.queue.findIndex(q => q.id === video.id);
    if (state.queueIndex === -1) state.queueIndex = 0;
    // Đảm bảo vị trí hiện tại có full data
    state.queue[state.queueIndex] = video;
    videoDataMap.set(video.id, video);
  }

  state.currentVideo = video;
  state.isLoading = true;
  updatePlayerUI(video);
  openPlayView();
  setPlayState(false, true);

  // Save now-playing state (FIX #2)
  saveNowPlaying(video);

  if (!state.selectedDevice) {
    // Play on phone
    await playOnPhone(video);
  } else {
    // Cast to device
    await castToDevice(video);
  }
}

async function playOnPhone(video) {
  try {
    const r = await fetch(`api/stream/${video.id}`);
    const data = await r.json();
    if (data.success) {
      audio.src = data.url;
      audio.play();
      state.isPlaying = true;
      state.isLoading = false;
      setPlayState(true, false);
      startProgressTimer();
    } else {
      // fallback proxy
      audio.src = `/api/proxy-stream/${video.id}`;
      audio.play();
      state.isPlaying = true;
      state.isLoading = false;
      setPlayState(true, false);
      startProgressTimer();
    }
  } catch(e) {
    state.isLoading = false;
    setPlayState(false, false);
    console.error(e);
  }
}

async function castToDevice(video) {
  try {
    const r = await fetch('api/cast', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ entity_id: state.selectedDevice.entity_id, video_id: video.id, title: video.title })
    });
    const data = await r.json();
    state.isLoading = false;
    if (data.success) {
      state.isPlaying = true;
      setPlayState(true, false);
      startDevicePoll();
    } else {
      setPlayState(false, false);
    }
  } catch(e) {
    state.isLoading = false;
    setPlayState(false, false);
  }
}

// ===== SAVE / RESTORE NOW PLAYING (FIX #2) =====
async function saveNowPlaying(video) {
  try {
    await fetch('api/now-playing', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        video,
        deviceId: state.selectedDevice?.entity_id || null,
        timestamp: Date.now()
      })
    });
  } catch(e) {}
}

async function restoreNowPlaying() {
  try {
    const r = await fetch('api/now-playing');
    const data = await r.json();
    if (data.success && data.state) {
      const { video, deviceId } = data.state;
      if (video) {
        state.currentVideo = video;
        // If device was selected, try to restore device
        if (deviceId && state.players.length) {
          const p = state.players.find(pl => pl.entity_id === deviceId);
          if (p) state.selectedDevice = p;
        }
        updatePlayerUI(video);
        showMiniPlayer(video);
        document.getElementById('selectedDeviceName').textContent =
          state.selectedDevice ? state.selectedDevice.name : 'Điện thoại';
        // Start polling device if applicable
        if (state.selectedDevice) {
          pollDeviceState();
        }
      }
    }
  } catch(e) {}
}

// ===== PLAYER CONTROLS =====
function togglePlayPause() {
  if (!state.currentVideo) return;
  if (!state.selectedDevice) {
    if (audio.paused) { audio.play(); state.isPlaying = true; }
    else { audio.pause(); state.isPlaying = false; }
    setPlayState(state.isPlaying, false);
  } else {
    const action = state.isPlaying ? 'pause' : 'play';
    fetch('api/player/control', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ entity_id: state.selectedDevice.entity_id, action })
    });
    state.isPlaying = !state.isPlaying;
    setPlayState(state.isPlaying, false);
  }
}

function playNext(autoEnded = false) {
  if (!state.queue.length) return;

  let next;
  if (state.shuffle) {
    // Phát ngẫu nhiên, tránh lặp lại bài cũ
    do { next = Math.floor(Math.random() * state.queue.length); }
    while (state.queue.length > 1 && next === state.queueIndex);
  } else {
    next = state.queueIndex + 1;
  }

  // Nếu hết danh sách
  if (next >= state.queue.length) {
    if (state.repeat === 'all') {
      next = 0; // Lặp lại từ đầu
    } else {
      // Không repeat: dừng lại, không tự phát
      state.isPlaying = false;
      setPlayState(false, false);
      return;
    }
  }

  state.queueIndex = next;
  const v = state.queue[next];
  // Nếu video chỉ có id (chưa load full data), vẫn chơi được vì playVideo sẽ fetch stream theo id
  if (v) playVideo(v, true);
}

function playPrev() {
  if (!state.queue.length) return;
  let prev = state.queueIndex - 1;
  if (prev < 0) prev = state.queue.length - 1;
  state.queueIndex = prev;
  const v = state.queue[prev];
  if (v) playVideo(v, true);
}

function toggleShuffle() {
  state.shuffle = !state.shuffle;
  document.getElementById('btnShuffle').classList.toggle('active', state.shuffle);
}

function toggleRepeat() {
  if (!state.repeat) state.repeat = 'all';
  else if (state.repeat === 'all') state.repeat = 'one';
  else state.repeat = false;
  const btn = document.getElementById('btnRepeat');
  btn.classList.toggle('active', !!state.repeat);
}

function setVolume(val) {
  const v = val / 100;
  if (!state.selectedDevice) {
    audio.volume = v;
  } else {
    fetch('api/player/volume', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ entity_id: state.selectedDevice.entity_id, volume: v })
    });
  }
  // Update slider gradient
  const slider = document.getElementById('volumeSlider');
  slider.style.background = `linear-gradient(to right, var(--accent) ${val}%, var(--border) ${val}%)`;
}

function seekTo(event) {
  const bar = document.getElementById('progressContainer');
  const rect = bar.getBoundingClientRect();
  const pct = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
  const pos = pct * state.duration;
  if (!state.selectedDevice) {
    audio.currentTime = pos;
  } else {
    fetch('api/player/seek', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ entity_id: state.selectedDevice.entity_id, position: pos })
    });
  }
  updateProgress(pos, state.duration);
}

// ===== PROGRESS =====
function startProgressTimer() {
  clearInterval(state.progressTimer);
  state.progressTimer = setInterval(() => {
    if (!state.selectedDevice && !audio.paused) {
      state.currentTime = audio.currentTime;
      state.duration = audio.duration || 0;
      updateProgress(state.currentTime, state.duration);
    }
  }, 1000);
}

function startDevicePoll() {
  clearInterval(state.playerPollTimer);
  pollDeviceState();
  state.playerPollTimer = setInterval(pollDeviceState, 3000);
}

async function pollDeviceState() {
  if (!state.selectedDevice) return;
  try {
    const r = await fetch(`api/player/${state.selectedDevice.entity_id}/state`);
    const data = await r.json();
    if (data.success) {
      const s = data.state;
      state.isPlaying = s.state === 'playing';
      state.currentTime = s.media_position || 0;
      state.duration = s.media_duration || 0;
      setPlayState(state.isPlaying, false);
      updateProgress(state.currentTime, state.duration);
      if (s.volume_level !== undefined) {
        const vol = Math.round(s.volume_level * 100);
        document.getElementById('volumeSlider').value = vol;
        setVolume(vol);
      }
    }
  } catch(e) {}
}

function updateProgress(cur, dur) {
  const pct = dur > 0 ? (cur / dur) * 100 : 0;
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressDot').style.left = pct + '%';
  document.getElementById('currentTime').textContent = formatTime(cur);
  document.getElementById('totalTime').textContent = formatTime(dur);
  document.getElementById('miniProgressFill').style.width = pct + '%';
}

// ===== UI UPDATES =====
function setPlayState(playing, loading) {
  state.isPlaying = playing;
  state.isLoading = loading;
  document.getElementById('iconPlay').classList.toggle('hidden', playing || loading);
  document.getElementById('iconPause').classList.toggle('hidden', !playing || loading);
  document.getElementById('iconLoading').classList.toggle('hidden', !loading);
  document.getElementById('miniIconPlay').classList.toggle('hidden', playing);
  document.getElementById('miniIconPause').classList.toggle('hidden', !playing);
  document.getElementById('playThumbWrapper').classList.toggle('playing', playing);
}

function updatePlayerUI(video) {
  document.getElementById('playTitle').textContent = video.title;
  document.getElementById('playArtist').textContent = video.channel;
  document.getElementById('playThumb').src = video.thumbnail;
  document.getElementById('playBg').style.backgroundImage = `url(${video.thumbnail})`;
  document.getElementById('miniTitle').textContent = video.title;
  document.getElementById('miniArtist').textContent = video.channel;
  document.getElementById('miniThumb').src = video.thumbnail;
  // Update playing indicator in list
  document.querySelectorAll('.video-card').forEach(c => {
    c.classList.toggle('playing', c.id === 'vc-' + video.id);
  });
}

function showMiniPlayer(video) {
  document.getElementById('miniPlayer').classList.remove('hidden');
}

// ===== PLAY VIEW =====
function openPlayView() {
  const pv = document.getElementById('playView');
  pv.classList.remove('hidden');
  // FIX #4: ensure scroll works
  const sc = document.getElementById('playScrollContainer');
  sc.style.overflowY = 'auto';
  sc.scrollTop = 0;
  showMiniPlayer(state.currentVideo);
}

function closePlayView() {
  document.getElementById('playView').classList.add('hidden');
}

function shareCurrentTrack() {
  if (!state.currentVideo) return;
  const url = `https://youtube.com/watch?v=${state.currentVideo.id}`;
  if (navigator.share) navigator.share({ title: state.currentVideo.title, url });
  else navigator.clipboard.writeText(url).then(() => alert('Đã copy link!'));
}

// ===== DEVICE MODAL =====
async function openDeviceModal() {
  document.getElementById('deviceModal').classList.remove('hidden');
  await loadPlayers();
  renderDeviceList();
}
function closeDeviceModal() {
  document.getElementById('deviceModal').classList.add('hidden');
}

async function loadPlayers() {
  try {
    const r = await fetch('api/players');
    const data = await r.json();
    if (data.success) state.players = data.players;
  } catch(e) {}
}

function renderDeviceList() {
  const list = document.getElementById('deviceList');
  // FIX #1: device items use CSS var --bg3 so they're dark on dark mode
  const phoneSel = !state.selectedDevice;
  let html = `
    <div class="device-item ${phoneSel ? 'selected' : ''}" onclick="selectDevice(null)">
      <div class="device-icon">📱</div>
      <div>
        <div class="device-name">Điện thoại</div>
        <div class="device-state">Trình duyệt hiện tại</div>
      </div>
      ${phoneSel ? '<span class="device-check">✓</span>' : ''}
    </div>`;

  state.players.forEach(p => {
    const sel = state.selectedDevice?.entity_id === p.entity_id;
    const icon = p.entity_id.includes('tv') ? '📺' : p.entity_id.includes('cast') ? '📡' : '🔊';
    html += `
      <div class="device-item ${sel ? 'selected' : ''}" onclick="selectDevice(${JSON.stringify(p).replace(/"/g,'&quot;')})">
        <div class="device-icon">${icon}</div>
        <div>
          <div class="device-name">${escHtml(p.name)}</div>
          <div class="device-state">${p.state === 'playing' ? '▶ Đang phát' : p.state === 'paused' ? '⏸ Tạm dừng' : p.state === 'idle' ? 'Sẵn sàng' : p.state}</div>
        </div>
        ${sel ? '<span class="device-check">✓</span>' : ''}
      </div>`;
  });
  list.innerHTML = html;
}

function selectDevice(player) {
  state.selectedDevice = player;
  const name = player ? player.name : 'Điện thoại';
  document.getElementById('selectedDeviceName').textContent = name;
  document.getElementById('playDeviceName').textContent = name;
  closeDeviceModal();
  if (player) startDevicePoll();
  else clearInterval(state.playerPollTimer);
}

// ===== PLAYLIST =====
async function loadPlaylists() {
  try {
    const r = await fetch('api/playlists');
    const data = await r.json();
    if (data.success) state.playlists = data.playlists;
  } catch(e) {}
}

function renderPlaylists() {
  const c = document.getElementById('playlistContainer');
  if (!state.playlists.length) {
    c.innerHTML = '<div class="empty-state"><p>Chưa có playlist nào</p></div>';
    return;
  }
  c.innerHTML = state.playlists.map(pl => `
    <div class="playlist-card" onclick="openPlaylist('${pl.id}')">
      <div class="playlist-thumb">🎵</div>
      <div class="playlist-info">
        <div class="playlist-name">${escHtml(pl.name)}</div>
        <div class="playlist-count">${pl.songs?.length || 0} bài</div>
      </div>
      <button class="btn-del" onclick="event.stopPropagation();deletePlaylist('${pl.id}')">🗑</button>
    </div>`).join('');
}

async function createPlaylist() {
  const name = document.getElementById('newPlaylistName').value.trim();
  if (!name) return;
  const pl = { id: Date.now().toString(), name, songs: [] };
  state.playlists.push(pl);
  await savePlaylist(pl);
  document.getElementById('newPlaylistName').value = '';
  renderPlaylists();
}

async function savePlaylist(pl) {
  await fetch('api/playlists', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(pl)
  });
}

async function deletePlaylist(id) {
  if (!confirm('Xóa playlist này?')) return;
  state.playlists = state.playlists.filter(p => p.id !== id);
  await fetch(`api/playlists/${id}`, { method: 'DELETE' });
  renderPlaylists();
}

function openPlaylist(id) {
  const pl = state.playlists.find(p => p.id === id);
  if (!pl || !pl.songs?.length) return;
  state.queue = pl.songs;
  state.queueIndex = 0;
  playVideo(pl.songs[0], true);
}

// Add to playlist modal
let pendingAddVideo = null;
function openAddToPlaylist(video) {
  pendingAddVideo = video;
  const modal = document.getElementById('addToPlaylistModal');
  const list = document.getElementById('playlistPickerList');
  if (!state.playlists.length) {
    list.innerHTML = '<div class="empty-state"><p>Chưa có playlist. Tạo playlist trong tab Playlist.</p></div>';
  } else {
    list.innerHTML = state.playlists.map(pl => `
      <div class="device-item" onclick="addSongToPlaylist('${pl.id}')">
        <div class="device-icon">🎵</div>
        <div class="device-name">${escHtml(pl.name)}</div>
      </div>`).join('');
  }
  modal.classList.remove('hidden');
}
function closeAddToPlaylistModal() {
  document.getElementById('addToPlaylistModal').classList.add('hidden');
}
async function addSongToPlaylist(plId) {
  const pl = state.playlists.find(p => p.id === plId);
  if (!pl || !pendingAddVideo) return;
  if (!pl.songs) pl.songs = [];
  if (!pl.songs.find(s => s.id === pendingAddVideo.id)) {
    pl.songs.push(pendingAddVideo);
    await savePlaylist(pl);
  }
  closeAddToPlaylistModal();
}

// ===== TIMERS =====
async function loadTimers() {
  try {
    const r = await fetch('api/timers');
    const data = await r.json();
    if (data.success) state.timers = data.timers;
  } catch(e) {}
}

function renderTimers() {
  const c = document.getElementById('timerList');
  if (!state.timers.length) {
    c.innerHTML = '<div class="empty-state"><p>Chưa có hẹn giờ nào</p></div>';
    return;
  }
  const days = ['CN','T2','T3','T4','T5','T6','T7'];
  c.innerHTML = state.timers.map((t, i) => `
    <div class="timer-card">
      <div class="timer-info">
        <div class="timer-time-display">${String(t.hour).padStart(2,'0')}:${String(t.minute).padStart(2,'0')}</div>
        <div class="timer-days-display">${t.days.map(d => days[d]).join(', ')} • ${t.action === 'play' ? '▶ Phát' : '■ Tắt'}</div>
      </div>
      <button class="timer-toggle ${t.enabled ? 'on' : ''}" onclick="toggleTimer(${i})"></button>
      <button class="btn-del" onclick="deleteTimer(${i})">🗑</button>
    </div>`).join('');
}

let selectedAction = 'play';
function selectAction(a) {
  selectedAction = a;
  document.querySelectorAll('.action-btn').forEach(b => b.classList.toggle('active', b.dataset.action === a));
}

async function addTimer() {
  const days = [...document.querySelectorAll('.day-btn.active')].map(b => parseInt(b.dataset.day));
  if (!days.length) return alert('Chọn ít nhất 1 ngày');
  const hour = parseInt(document.getElementById('timerHour').value) || 0;
  const minute = parseInt(document.getElementById('timerMinute').value) || 0;
  const timer = { id: Date.now().toString(), days, hour, minute, action: selectedAction, enabled: true };
  state.timers.push(timer);
  await fetch('api/timers', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(state.timers) });
  renderTimers();
}

async function toggleTimer(idx) {
  state.timers[idx].enabled = !state.timers[idx].enabled;
  await fetch('api/timers', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(state.timers) });
  renderTimers();
}

async function deleteTimer(idx) {
  state.timers.splice(idx, 1);
  await fetch('api/timers', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(state.timers) });
  renderTimers();
}

// ===== AUDIO EVENTS =====
audio.addEventListener('ended', () => {
  if (state.repeat === 'one') { audio.currentTime = 0; audio.play(); return; }
  // Luôn phát bài tiếp theo (playNext sẽ tự dừng nếu hết list và không repeat)
  playNext(true);
});
audio.addEventListener('timeupdate', () => {
  updateProgress(audio.currentTime, audio.duration || 0);
});
audio.addEventListener('play', () => setPlayState(true, false));
audio.addEventListener('pause', () => setPlayState(false, false));

// ===== UTILS =====
function formatDuration(s) {
  if (!s) return '';
  const m = Math.floor(s / 60), sec = s % 60;
  return `${m}:${String(sec).padStart(2,'0')}`;
}
function formatTime(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2,'0')}`;
}
function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ===== INIT =====
async function init() {
  initTheme();
  await loadPlaylists();
  await loadTimers();
  await loadPlayers();
  doSearch(); // load default suggestions
  await restoreNowPlaying(); // FIX #2: restore last playing track
}

document.addEventListener('DOMContentLoaded', init);
