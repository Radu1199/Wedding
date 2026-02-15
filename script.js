const soundButton = document.getElementById('soundToggle');
const music = document.getElementById('bgMusic');
const video = document.getElementById('introVideo');
const cover = document.querySelector('.cover');
const invitation = document.getElementById('invitation');
const countdown = document.getElementById('countdown');
const rsvpForm = document.getElementById('rsvpForm');
const rsvpMessage = document.getElementById('rsvpMessage');

let muted = false;

const syncLabel = () => {
  soundButton.textContent = muted ? '🔇' : '🔊';
  soundButton.setAttribute('aria-label', muted ? 'Activar sonido' : 'Silenciar');
  soundButton.title = muted ? 'Activar sonido' : 'Silenciar';
};

const updateCountdown = () => {
  const targetDate = new Date('2026-09-12T18:00:00+02:00').getTime();
  const now = Date.now();
  const diff = Math.max(targetDate - now, 0);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const secs = Math.floor((diff / 1000) % 60);
  countdown.textContent = `${days} días · ${hours} horas · ${mins} minutos · ${secs} segundos`;
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

const openInvitation = () => {
  cover.classList.add('hide');
  invitation.classList.add('show');
  invitation.setAttribute('aria-hidden', 'false');
  document.body.classList.add('invite-open');

  video.pause();
  updateCountdown();
};

cover.addEventListener('click', openInvitation);

rsvpForm.addEventListener('submit', event => {
  event.preventDefault();
  rsvpMessage.hidden = false;
  rsvpForm.reset();
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

  updateCountdown();
  setInterval(updateCountdown, 1000);
});
