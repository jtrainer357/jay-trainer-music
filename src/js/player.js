/**
 * AudioPlayer — persistent HTML5 audio player for Jay Trainer
 * Builds a master playlist from all releases. Plays 1-minute previews continuously.
 * Clicking a specific track jumps there, then continues through that album and beyond.
 * Resets on page navigation.
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

  let masterPlaylist = [];  // All tracks across all releases
  let currentIndex = 0;
  let isMuted = false;
  let lastVolume = 0.8;

  // Build master playlist from all releases data
  function buildMasterPlaylist() {
    const el = document.getElementById('allReleasesData');
    if (!el) return [];
    try {
      const releases = JSON.parse(el.textContent);
      const tracks = [];
      releases.forEach(release => {
        (release.tracks || []).forEach(track => {
          const playable = track.previewFile || track.audioFile || '';
          if (!playable) return; // skip tracks with no audio
          tracks.push({
            title: track.title,
            album: release.shortTitle || release.title,
            audioFile: track.audioFile || '',
            previewFile: track.previewFile || '',
            duration: track.duration || '',
            coverArt: release.coverArt || ''
          });
        });
      });
      return tracks;
    } catch (e) {
      return [];
    }
  }

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

  function getPlayableFile(track) {
    return track.previewFile || track.audioFile || '';
  }

  function loadTrack(index) {
    if (!masterPlaylist.length) return;
    currentIndex = Math.max(0, Math.min(index, masterPlaylist.length - 1));
    const track = masterPlaylist[currentIndex];
    const playable = getPlayableFile(track);

    trackNameEl.textContent = track.title || 'Select a track to play';

    if (playable) {
      audio.src = playable;
      audio.load();
      progressFill.style.width = '0%';
      currentTimeEl.textContent = '0:00';
      totalTimeEl.textContent = '0:00';
    } else {
      audio.src = '';
      progressFill.style.width = '0%';
      currentTimeEl.textContent = '0:00';
      totalTimeEl.textContent = track.duration || '0:00';
    }
  }

  // Find a track index in the master playlist by title and album
  function findTrackIndex(title, albumTitle) {
    // Try exact match on title + album first
    let idx = masterPlaylist.findIndex(t => t.title === title && t.album === albumTitle);
    if (idx !== -1) return idx;
    // Fall back to title-only match
    idx = masterPlaylist.findIndex(t => t.title === title);
    return idx !== -1 ? idx : 0;
  }

  // Public API: play a specific track from a release
  window.playTrack = function (tracks, index, coverArt) {
    // Find the clicked track in the master playlist and start from there
    const clickedTrack = tracks[index];
    if (!clickedTrack) return;

    // Get the album title from the release data on the page
    let albumTitle = '';
    const releaseDataEl = document.getElementById('releaseData');
    if (releaseDataEl) {
      try {
        const release = JSON.parse(releaseDataEl.textContent);
        albumTitle = release.shortTitle || release.title || '';
      } catch (e) {}
    }

    const masterIdx = findTrackIndex(clickedTrack.title, albumTitle);
    loadTrack(masterIdx);

    const playable = getPlayableFile(masterPlaylist[currentIndex]);
    if (playable) {
      audio.play().catch(() => {});
    }
  };

  // Play / Pause
  playBtn.addEventListener('click', () => {
    if (!masterPlaylist.length) {
      // Nothing loaded yet — start from the beginning
      loadTrack(0);
      audio.play().catch(() => {});
      return;
    }
    if (!audio.src) {
      loadTrack(currentIndex);
      audio.play().catch(() => {});
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
    if (!masterPlaylist.length) return;
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
    } else if (currentIndex > 0) {
      loadTrack(currentIndex - 1);
      audio.play().catch(() => {});
    }
  });

  nextBtn.addEventListener('click', () => {
    if (!masterPlaylist.length) return;
    if (currentIndex < masterPlaylist.length - 1) {
      loadTrack(currentIndex + 1);
      audio.play().catch(() => {});
    } else {
      // Wrap to beginning
      loadTrack(0);
      audio.play().catch(() => {});
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

  // When a track ends, auto-advance to the next track
  audio.addEventListener('ended', () => {
    updatePlayIcon(false);
    if (currentIndex < masterPlaylist.length - 1) {
      loadTrack(currentIndex + 1);
      audio.play().catch(() => {});
    } else {
      // Reached the end of the entire catalogue
      trackNameEl.textContent = 'Select a track to play';
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

  // Hook album page play buttons
  document.addEventListener('click', (e) => {
    const trackBtn = e.target.closest('.album-track-btn');
    const playAllBtn = e.target.closest('.album-play-btn');
    const btn = trackBtn || playAllBtn;
    if (!btn) return;

    e.preventDefault();
    const index = parseInt(btn.dataset.index, 10) || 0;

    const releaseDataEl = document.getElementById('releaseData');
    if (releaseDataEl) {
      try {
        const release = JSON.parse(releaseDataEl.textContent);
        window.playTrack(release.tracks, index, release.coverArt);
      } catch (err) {}
    }
  });

  // Initialize: build the master playlist, load first track paused
  masterPlaylist = buildMasterPlaylist();
  if (masterPlaylist.length) {
    loadTrack(0);
    updatePlayIcon(false);
  }
})();
