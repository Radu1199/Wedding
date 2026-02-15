const soundButton = document.getElementById('soundToggle');
const openButton = document.getElementById('openInvite');
const music = document.getElementById('bgMusic');
const video = document.getElementById('introVideo');

let muted = false;

const syncLabel = () => {
  soundButton.textContent = muted ? '🔇' : '🔊';
  soundButton.setAttribute('aria-label', muted ? 'Activar sonido' : 'Silenciar');
  soundButton.title = muted ? 'Activar sonido' : 'Silenciar';
};

soundButton.addEventListener('click', async () => {
  muted = !muted;
  music.muted = muted;
  syncLabel();

  if (!muted) {
    try {
      await music.play();
    } catch {
      // autoplay can be blocked by the browser until user gesture
    }
  }
});

openButton.addEventListener('click', () => {
  video.style.opacity = '0';
  video.style.transition = 'opacity 0.8s ease';
  openButton.style.opacity = '0';
  openButton.style.pointerEvents = 'none';
});

window.addEventListener('load', async () => {
  syncLabel();

  try {
    await video.play();
  } catch {
    // keep poster visible if video playback is blocked
  }

  try {
    await music.play();
  } catch {
    muted = true;
    music.muted = true;
    syncLabel();
  }
});
