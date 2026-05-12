window.addEventListener('load', async () => {
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  window.scrollTo({ top: 0, behavior: 'auto' });
  setupRsvpModal();
  setupNavigationChoice();
  setupCountdownWindowBackground();

  updateCountdown();
  setInterval(updateCountdown, 1000);
});
