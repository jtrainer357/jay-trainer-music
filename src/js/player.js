/**
 * AudioPlayer — persistent HTML5 audio player for Jay Trainer
 * Supports playlists, seek, volume, prev/next, and session persistence.
 */
(function () {
  const player = document.getElementById('audioPlayer');
  if (!player) return;

  const audio = new Audio();
  audio.preload = 'metadata';

  // DOM refs
  const playBtn = document.getElementById('playBtn');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const progressBar = document.getElementById('progressBar');
  const progressFill = document.getElementById('progressFill');
  const currentTimeEl = document.getElementById('currentTime');
  const totalTimeEl = document.getElementById('totalTime');
  const trackNameEl = document.getElementById('playerTrack');
  const volumeSlider = document.getElementById('volumeSlider');
  const volumeBtn = document.getElementById('volumeBtn');
  const playIcon = playBtn.querySelector('.play-icon');
  const pauseIcon = playBtn.querySelector('.pause-icon');

  let playlist = [];
  let currentIndex = 0;
  let isMuted = false;
  let lastVolume = 0.8;

  // Helpers
  function formatTime(seconds) {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function updatePlayIcon(isPlaying) {
    playIcon.style.display = isPlaying ? 'none' : 'block';
    pauseIcon.style.display = isPlaying ? 'block' : 'none';
    playBtn.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
  }

  function loadTrack(index) {
    if (!playlist.length) return;
    currentIndex = Math.max(0, Math.min(index, playlist.length - 1));
    const track = playlist[currentIndex];

    trackNameEl.textContent = track.title || 'Select a track to play';

    if (track.audioFile) {
      audio.src = track.audioFile;
      audio.load();
      progressFill.style.width = '0%';
      currentTimeEl.textContent = '0:00';
      totalTimeEl.textContent = '0:00';
    } else {
      // No audio file — show player with track info but don't load audio
      audio.src = '';
      progressFill.style.width = '0%';
      currentTimeEl.textContent = '0:00';
      totalTimeEl.textContent = track.duration || '0:00';
    }
  }

  // Public API: play a playlist starting at an index
  window.playTrack = function (tracks, index, coverArt) {
    playlist = tracks.map(t => ({
      title: t.title,
      audioFile: t.audioFile || '',
      duration: t.duration || '',
      coverArt: t.coverArt || coverArt || '',
      bandcampUrl: t.bandcampUrl || ''
    }));
    currentIndex = index || 0;

    loadTrack(currentIndex);

    if (playlist[currentIndex].audioFile) {
      audio.play().catch(() => {});
    } else if (playlist[currentIndex].bandcampUrl) {
      // No local audio — fall back to Bandcamp
      window.open(playlist[currentIndex].bandcampUrl, '_blank');
    }
  };

  // Play / Pause
  playBtn.addEventListener('click', () => {
    if (!audio.src || !playlist.length) return;
    if (!playlist[currentIndex].audioFile) {
      // No audio file — open bandcamp
      const track = playlist[currentIndex];
      if (track.bandcampUrl) window.open(track.bandcampUrl, '_blank');
      return;
    }
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  });

  // Prev / Next
  prevBtn.addEventListener('click', () => {
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
    } else if (currentIndex > 0) {
      loadTrack(currentIndex - 1);
      if (!audio.paused || playlist[currentIndex].audioFile) audio.play().catch(() => {});
    }
  });

  nextBtn.addEventListener('click', () => {
    if (currentIndex < playlist.length - 1) {
      loadTrack(currentIndex + 1);
      if (playlist[currentIndex].audioFile) audio.play().catch(() => {});
    }
  });

  // Progress bar seek
  progressBar.addEventListener('click', (e) => {
    if (!audio.duration) return;
    const rect = progressBar.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * audio.duration;
  });

  // Audio events
  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    progressFill.style.width = pct + '%';
    currentTimeEl.textContent = formatTime(audio.currentTime);
  });

  audio.addEventListener('loadedmetadata', () => {
    totalTimeEl.textContent = formatTime(audio.duration);
  });

  audio.addEventListener('play', () => updatePlayIcon(true));
  audio.addEventListener('pause', () => updatePlayIcon(false));

  audio.addEventListener('ended', () => {
    updatePlayIcon(false);
    if (currentIndex < playlist.length - 1) {
      loadTrack(currentIndex + 1);
      audio.play().catch(() => {});
    }
  });

  // Volume
  audio.volume = 0.8;
  volumeSlider.addEventListener('input', () => {
    const vol = volumeSlider.value / 100;
    audio.volume = vol;
    lastVolume = vol;
    isMuted = vol === 0;
  });

  volumeBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    audio.volume = isMuted ? 0 : lastVolume;
    volumeSlider.value = isMuted ? 0 : lastVolume * 100;
  });


  // Session persistence — save state on page unload
  window.addEventListener('beforeunload', () => {
    if (!playlist.length) return;
    const state = {
      playlist,
      currentIndex,
      currentTime: audio.currentTime,
      volume: audio.volume,
      wasPlaying: !audio.paused
    };
    sessionStorage.setItem('jaytrainer_player', JSON.stringify(state));
  });

  // Restore state on load
  (function restoreState() {
    try {
      const saved = sessionStorage.getItem('jaytrainer_player');
      if (!saved) return;
      const state = JSON.parse(saved);
      if (!state.playlist || !state.playlist.length) return;

      playlist = state.playlist;
      currentIndex = state.currentIndex || 0;

      loadTrack(currentIndex);

      audio.volume = state.volume || 0.8;
      volumeSlider.value = (state.volume || 0.8) * 100;

      if (state.currentTime && playlist[currentIndex].audioFile) {
        audio.addEventListener('loadedmetadata', function onMeta() {
          audio.currentTime = state.currentTime;
          if (state.wasPlaying) audio.play().catch(() => {});
          audio.removeEventListener('loadedmetadata', onMeta);
        });
      }
    } catch (e) {
      // Ignore restore errors
    }
  })();

  // Hook album page play buttons
  document.addEventListener('click', (e) => {
    const trackBtn = e.target.closest('.album-track-btn');
    const playAllBtn = e.target.closest('.album-play-btn');
    const btn = trackBtn || playAllBtn;
    if (!btn) return;

    e.preventDefault();
    const releaseSlug = btn.dataset.release;
    const index = parseInt(btn.dataset.index, 10) || 0;

    // Find release data from global releases JSON embedded in page
    const releaseDataEl = document.getElementById('releaseData');
    if (releaseDataEl) {
      try {
        const release = JSON.parse(releaseDataEl.textContent);
        window.playTrack(release.tracks, index, release.coverArt);
      } catch (err) {
        // Fallback — open bandcamp
      }
    }
  });
})();
