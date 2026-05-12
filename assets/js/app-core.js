const envelopeIntro = document.getElementById('envelopeIntro');
const envelope = document.getElementById('envelope');
const envelopeHint = document.getElementById('envelopeHint');
const envelopeContinue = document.getElementById('envelopeContinue');
const invitation = document.getElementById('invitation');
const countdown = document.getElementById('countdown');
const rsvpForm = document.getElementById('rsvpForm');
const rsvpMessage = document.getElementById('rsvpMessage');
const RSVP_GOOGLE_FORMS = {
  // Poti seta fie formUrl (viewform), fie formResponseUrl direct.
  formUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSfxNwP8czIB_ssnqvbDg6n9yvqM5s0imFiu8A2LSNQ-yu0E2g/viewform?usp=dialog',
  formResponseUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSfxNwP8czIB_ssnqvbDg6n9yvqM5s0imFiu8A2LSNQ-yu0E2g/formResponse',
  fields: {
    lastName: 'entry.877086558',
    firstName: 'entry.1635206441',
    guestCount: 'entry.2073851017',
    phone: 'entry.72460155',
    attendance: 'entry.1436432325',
  },
};

const resolveGoogleFormResponseUrl = cfg => {
  if (typeof cfg.formResponseUrl === 'string' && cfg.formResponseUrl.trim()) {
    return cfg.formResponseUrl.trim();
  }

  if (typeof cfg.formUrl !== 'string' || !cfg.formUrl.trim()) {
    return '';
  }

  const match = cfg.formUrl.match(/\/forms\/d\/e\/([^/]+)\//);
  if (!match) {
    return '';
  }

  return `https://docs.google.com/forms/d/e/${match[1]}/formResponse`;
};

const isGoogleFieldIdValid = value => /^entry\.\d+$/.test(String(value || '').trim());

let invitationOpened = false;
let envelopeOpened = false;
let revealSetupDone = false;
let overlayLocks = 0;

const lockPageScroll = () => {
  overlayLocks += 1;
  if (overlayLocks > 1) {
    return;
  }

  document.documentElement.classList.add('modal-open');
  document.body.classList.add('modal-open');
};

const unlockPageScroll = () => {
  overlayLocks = Math.max(overlayLocks - 1, 0);
  if (overlayLocks === 0) {
    document.documentElement.classList.remove('modal-open');
    document.body.classList.remove('modal-open');
  }
};

const setupRsvpModal = () => {
  const modal = document.getElementById('rsvpModal');
  const openBtn = document.getElementById('openRsvpModalBtn');
  const closeBtn = document.getElementById('closeRsvpModalBtn');
  const form = document.getElementById('rsvpPopupForm');
  const message = document.getElementById('rsvpPopupMessage');
  const lastNameInput = document.getElementById('rsvpLastName');
  const firstNameInput = document.getElementById('rsvpFirstName');
  const lastNameWrap = document.getElementById('rsvpLastNameWrap');
  const firstNameWrap = document.getElementById('rsvpFirstNameWrap');
  const guestCountInput = document.getElementById('rsvpGuests');
  const guestSelectWrap = document.getElementById('rsvpGuestSelect');
  const guestTrigger = document.getElementById('rsvpGuestTrigger');
  const guestTriggerText = document.getElementById('rsvpGuestTriggerText');
  const guestMenu = document.getElementById('rsvpGuestMenu');
  const attendanceChoice = form ? form.querySelector('.rsvp-popup-choice') : null;
  const attendanceOptions = form ? Array.from(form.querySelectorAll('input[name="attendance"]')) : [];
  const guestOptions = guestMenu ? Array.from(guestMenu.querySelectorAll('.rsvp-guest-option')) : [];
  let closeTimerId = null;
  let isModalOpen = false;

  if (
    !modal ||
    !openBtn ||
    !closeBtn ||
    !form ||
    !message ||
    !lastNameInput ||
    !firstNameInput ||
    !attendanceChoice
  ) {
    return;
  }

  const closeGuestMenu = () => {
    if (!guestSelectWrap || !guestTrigger) {
      return;
    }

    guestSelectWrap.classList.remove('is-open');
    guestTrigger.setAttribute('aria-expanded', 'false');
  };

  const openGuestMenu = () => {
    if (!guestSelectWrap || !guestTrigger) {
      return;
    }

    guestSelectWrap.classList.add('is-open');
    guestTrigger.setAttribute('aria-expanded', 'true');
  };

  const updateGuestPlaceholderState = () => {
    if (!guestCountInput || !guestTrigger || !guestTriggerText) {
      return;
    }

    if (guestCountInput.value) {
      guestTriggerText.textContent = guestCountInput.value;
      guestTrigger.classList.remove('is-placeholder');
    } else {
      guestTriggerText.textContent = 'Numar de persoane';
      guestTrigger.classList.add('is-placeholder');
    }
  };

  const clearValidationState = () => {
    lastNameWrap?.classList.remove('is-invalid');
    firstNameWrap?.classList.remove('is-invalid');
    guestSelectWrap?.classList.remove('is-invalid');
    attendanceChoice?.classList.remove('is-invalid');
  };

  const clearPopupMessage = () => {
    message.textContent = '';
    message.className = 'rsvp-popup-message';
  };

  const validateFormFields = () => {
    const lastName = lastNameInput.value.trim();
    const firstName = firstNameInput.value.trim();
    const attendanceInput = form.querySelector('input[name="attendance"]:checked');
    const attendance = attendanceInput ? attendanceInput.value : '';
    const guestCount = String(guestCountInput?.value || '').trim();

    const missingLastName = !lastName;
    const missingFirstName = !firstName;
    const missingAttendance = !attendance;
    const missingGuestCount = attendance === 'Confirm prezența' && !guestCount;

    lastNameWrap?.classList.toggle('is-invalid', missingLastName);
    firstNameWrap?.classList.toggle('is-invalid', missingFirstName);
    attendanceChoice?.classList.toggle('is-invalid', missingAttendance);
    guestSelectWrap?.classList.toggle('is-invalid', missingGuestCount);

    const errors = [];
    if (missingLastName) {
      errors.push('Vă rugăm să completați numele!');
    }
    if (missingFirstName) {
      errors.push('Vă rugăm să completați prenumele!');
    }
    if (missingAttendance) {
      errors.push('Vă rugăm sa selectați una dintre opțiunile de confirmare!');
    }
    if (missingGuestCount) {
      errors.push('Vă rugăm să selectați numărul de persoane!');
    }

    return {
      errors,
      attendance,
      guestCount,
      lastName,
      firstName,
    };
  };

  const resetRsvpForm = () => {
    form.reset();
    if (guestCountInput) {
      guestCountInput.value = '';
    }
    updateGuestPlaceholderState();
    clearValidationState();
    clearPopupMessage();
  };

  updateGuestPlaceholderState();
  if (guestTrigger) {
    guestTrigger.addEventListener('click', event => {
      event.stopPropagation();
      if (guestSelectWrap?.classList.contains('is-open')) {
        closeGuestMenu();
      } else {
        openGuestMenu();
      }
    });
  }

  guestOptions.forEach(option => {
    option.addEventListener('click', () => {
      if (!guestCountInput) {
        return;
      }

      guestCountInput.value = option.dataset.guestValue || '';
      updateGuestPlaceholderState();
      guestSelectWrap?.classList.remove('is-invalid');
      clearPopupMessage();
      closeGuestMenu();
    });
  });

  if (guestMenu) {
    guestMenu.addEventListener('click', event => {
      event.stopPropagation();
    });
  }

  lastNameInput.addEventListener('input', () => {
    lastNameWrap?.classList.remove('is-invalid');
    clearPopupMessage();
  });

  firstNameInput.addEventListener('input', () => {
    firstNameWrap?.classList.remove('is-invalid');
    clearPopupMessage();
  });

  attendanceOptions.forEach(option => {
    option.addEventListener('change', () => {
      attendanceChoice?.classList.remove('is-invalid');
      if (option.value !== 'Confirm prezența') {
        guestSelectWrap?.classList.remove('is-invalid');
      }
      clearPopupMessage();
    });
  });

  const closeModal = () => {
    if (!isModalOpen) {
      return;
    }

    if (closeTimerId) {
      window.clearTimeout(closeTimerId);
      closeTimerId = null;
    }

    modal.classList.remove('is-open');
    closeTimerId = window.setTimeout(() => {
      modal.hidden = true;
      isModalOpen = false;
      closeGuestMenu();
      resetRsvpForm();
      unlockPageScroll();
      closeTimerId = null;
    }, 340);
  };

  const openModal = () => {
    if (isModalOpen) {
      return;
    }

    if (closeTimerId) {
      window.clearTimeout(closeTimerId);
      closeTimerId = null;
    }

    isModalOpen = true;
    lockPageScroll();
    modal.hidden = false;
    clearValidationState();
    clearPopupMessage();
    updateGuestPlaceholderState();
    requestAnimationFrame(() => {
      modal.classList.add('is-open');
    });
  };

  const closeIfTouchInsideCloseButton = (clientX, clientY) => {
    if (!isModalOpen) {
      return false;
    }

    const rect = closeBtn.getBoundingClientRect();
    const isInsideX = clientX >= rect.left && clientX <= rect.right;
    const isInsideY = clientY >= rect.top && clientY <= rect.bottom;

    if (isInsideX && isInsideY) {
      closeModal();
      return true;
    }

    return false;
  };

  const handleCloseAction = event => {
    event.preventDefault();
    closeModal();
  };

  openBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', handleCloseAction);
  closeBtn.addEventListener('pointerup', handleCloseAction);
  closeBtn.addEventListener('touchend', handleCloseAction, { passive: false });

  modal.addEventListener(
    'pointerup',
    event => {
      if (closeIfTouchInsideCloseButton(event.clientX, event.clientY)) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true
  );

  modal.addEventListener(
    'touchend',
    event => {
      const touch = event.changedTouches && event.changedTouches[0];
      if (!touch) {
        return;
      }

      if (closeIfTouchInsideCloseButton(touch.clientX, touch.clientY)) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    { capture: true, passive: false }
  );

  modal.addEventListener('click', event => {
    const target = event.target;

    if (target instanceof Node && guestSelectWrap && !guestSelectWrap.contains(target)) {
      closeGuestMenu();
    }

    if (
      target instanceof HTMLElement &&
      (target.dataset.closeRsvp === 'true' || target.closest('#closeRsvpModalBtn'))
    ) {
      closeModal();
    }
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const validation = validateFormFields();
    if (validation.errors.length) {
      message.innerHTML = validation.errors.join('<br>');
      message.className = 'rsvp-popup-message is-error';
      return;
    }

    const formData = new FormData(form);
    const attendance = validation.attendance;
    const guestCount = validation.guestCount;
    const lastName = validation.lastName;
    const firstName = validation.firstName;

    const cfg = RSVP_GOOGLE_FORMS;
    const responseUrl = resolveGoogleFormResponseUrl(cfg);
    const hasInvalidFieldIds = Object.values(cfg.fields).some(fieldId => !isGoogleFieldIdValid(fieldId));
    if (
      !responseUrl ||
      responseUrl.includes('REPLACE_WITH_FORM_ID') ||
      hasInvalidFieldIds
    ) {
      message.textContent = 'Seteaza formUrl/formResponseUrl si ID-urile entry.* in script.js (RSVP_GOOGLE_FORMS).';
      message.className = 'rsvp-popup-message is-error';
      return;
    }

    const payload = new URLSearchParams();
    payload.append(cfg.fields.lastName, lastName);
    payload.append(cfg.fields.firstName, firstName);
    payload.append(cfg.fields.guestCount, guestCount);
    payload.append(cfg.fields.phone, String(formData.get('phone') || ''));
    payload.append(cfg.fields.attendance, String(attendance));

    try {
      await fetch(responseUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: payload.toString(),
      });

      message.textContent = 'Răspunsul a fost trimis. Mulțumim!';
      message.className = 'rsvp-popup-message is-success';
      form.reset();
      if (guestCountInput) {
        guestCountInput.value = '';
      }
      updateGuestPlaceholderState();
    } catch {
      message.textContent = 'Nu am putut trimite formularul. Incearca din nou.';
      message.className = 'rsvp-popup-message is-error';
    }
  });
};

const setupNavigationChoice = () => {
  const navChooser = document.getElementById('navChooser');
  const openGoogleMapsBtn = document.getElementById('openGoogleMapsBtn');
  const openWazeBtn = document.getElementById('openWazeBtn');
  const closeNavChooserXBtn = document.getElementById('closeNavChooserXBtn');
  const mapButtons = Array.from(document.querySelectorAll('.map-button[data-lat][data-lng]'));

  if (!navChooser || !openGoogleMapsBtn || !openWazeBtn || !closeNavChooserXBtn || !mapButtons.length) {
    return;
  }

  let selectedLat = null;
  let selectedLng = null;
  let closeTimerId = null;
  let isChooserOpen = false;

  const closeChooser = () => {
    if (!isChooserOpen) {
      return;
    }

    if (closeTimerId) {
      window.clearTimeout(closeTimerId);
      closeTimerId = null;
    }

    navChooser.classList.remove('is-open');
    closeTimerId = window.setTimeout(() => {
      navChooser.hidden = true;
      selectedLat = null;
      selectedLng = null;
      isChooserOpen = false;
      unlockPageScroll();
      closeTimerId = null;
    }, 340);
  };

  const openChooser = (lat, lng) => {
    if (isChooserOpen) {
      selectedLat = lat;
      selectedLng = lng;
      return;
    }

    if (closeTimerId) {
      window.clearTimeout(closeTimerId);
      closeTimerId = null;
    }

    isChooserOpen = true;
    lockPageScroll();
    selectedLat = lat;
    selectedLng = lng;
    navChooser.hidden = false;
    requestAnimationFrame(() => {
      navChooser.classList.add('is-open');
    });
  };

  const openGoogleMaps = () => {
    if (!selectedLat || !selectedLng) {
      return;
    }

    const url = `https://www.google.com/maps/search/?api=1&query=${selectedLat},${selectedLng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    closeChooser();
  };

  const openWaze = () => {
    if (!selectedLat || !selectedLng) {
      return;
    }

    const url = `https://www.waze.com/ul?ll=${selectedLat},${selectedLng}&navigate=yes`;
    window.open(url, '_blank', 'noopener,noreferrer');
    closeChooser();
  };

  mapButtons.forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();
      const lat = button.dataset.lat;
      const lng = button.dataset.lng;
      openChooser(lat, lng);
    });
  });

  openGoogleMapsBtn.addEventListener('click', openGoogleMaps);
  openWazeBtn.addEventListener('click', openWaze);
  closeNavChooserXBtn.addEventListener('click', closeChooser);

  navChooser.addEventListener('click', event => {
    const target = event.target;
    if (target instanceof HTMLElement && target.dataset.closeNav === 'true') {
      closeChooser();
    }
  });
};

const revealVisibleItems = () => {
  const triggerPoint = window.innerHeight * 0.9;
  const hiddenItems = document.querySelectorAll('.reveal-up:not(.is-visible)');

  hiddenItems.forEach(item => {
    const rect = item.getBoundingClientRect();
    if (rect.top <= triggerPoint) {
      item.classList.add('is-visible');
    }
  });
};

const setupRevealAnimations = () => {
  if (revealSetupDone) {
    revealVisibleItems();
    return;
  }

  const revealItems = document.querySelectorAll('.reveal-up');
  if (!revealItems.length) {
    return;
  }

  revealSetupDone = true;
  window.addEventListener('scroll', revealVisibleItems, { passive: true });
  window.addEventListener('resize', revealVisibleItems);
  revealVisibleItems();
};

const setupCountdownWindowBackground = () => {
  const countdownFrame = document.querySelector('.countdown-frame');

  if (!countdownFrame) {
    return;
  }

  let ticking = false;
  let countdownAnchorTop = 0;

  const getScrollY = () => window.scrollY || window.pageYOffset || 0;

  const refreshAnchors = () => {
    const scrollY = getScrollY();

    if (countdownFrame) {
      const rect = countdownFrame.getBoundingClientRect();
      countdownAnchorTop = rect.top + scrollY;
    }
  };

  const syncOffset = () => {
    const scrollY = getScrollY();
    const roundedScrollY = Math.max(0, Math.round(scrollY));

    if (countdownFrame) {
      countdownFrame.style.setProperty('--countdown-bg-offset', `${Math.round(roundedScrollY - countdownAnchorTop)}px`);
    }

    ticking = false;
  };

  const onScroll = () => {
    if (ticking) {
      return;
    }

    ticking = true;
    requestAnimationFrame(syncOffset);
  };

  refreshAnchors();
  syncOffset();
  window.addEventListener('load', () => {
    refreshAnchors();
    syncOffset();
  });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    refreshAnchors();
    syncOffset();
  });
};

const updateCountdown = () => {
  const targetDate = new Date('2026-10-10T00:00:00+03:00').getTime();
  const now = Date.now();
  const diff = Math.max(targetDate - now, 0);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24).toString().padStart(2, '0');
  const mins = Math.floor((diff / (1000 * 60)) % 60).toString().padStart(2, '0');
  const secs = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
  countdown.innerHTML = `
    <div class="countdown-unit">
      <span class="countdown-number">${days}</span>
      <span class="countdown-label">Zile</span>
    </div>
    <div class="countdown-unit">
      <span class="countdown-number">${hours}</span>
      <span class="countdown-label">Ore</span>
    </div>
    <div class="countdown-unit">
      <span class="countdown-number">${mins}</span>
      <span class="countdown-label">Minute</span>
    </div>
    <div class="countdown-unit">
      <span class="countdown-number">${secs}</span>
      <span class="countdown-label">Secunde</span>
    </div>
  `;
};

const openInvitation = () => {
  if (invitationOpened) {
    return;
  }

  invitationOpened = true;
  if (envelopeIntro) {
    // Stop any remaining hit-area from the intro/button on mobile browsers.
    envelopeContinue?.classList.remove('visible');
    envelopeContinue?.setAttribute('aria-hidden', 'true');
    envelopeIntro.classList.add('hidden');
    envelopeIntro.setAttribute('aria-hidden', 'true');
    envelopeIntro.setAttribute('tabindex', '-1');

    window.setTimeout(() => {
      envelopeIntro.style.display = 'none';
    }, 500);
  }

  invitation.classList.add('show');
  invitation.setAttribute('aria-hidden', 'false');
  document.body.classList.add('invite-open');
  window.scrollTo({ top: 0, behavior: 'auto' });

  updateCountdown();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setupRevealAnimations();
    });
  });
};

const revealEnvelope = () => {
  if (!envelope || !envelopeHint || !envelopeContinue || envelopeOpened) {
    return;
  }

  envelopeOpened = true;
  envelope.classList.add('open');
  envelopeHint.classList.add('hidden');

  window.setTimeout(() => {
    envelopeContinue.classList.add('visible');
  }, 550);
};

const handleEnvelopeClick = event => {
  const target = event.target;
  if (target instanceof HTMLElement && target.closest('#envelopeContinue')) {
    return;
  }

  if (!envelopeOpened) {
    revealEnvelope();
    return;
  }

  if (!invitationOpened) {
    openInvitation();
  }
};

if (envelopeIntro) {
  envelopeIntro.addEventListener('click', handleEnvelopeClick);
  envelopeIntro.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    if (!envelopeOpened) {
      revealEnvelope();
      return;
    }

    openInvitation();
  });
}

if (envelopeContinue) {
  envelopeContinue.addEventListener('click', event => {
    event.stopPropagation();
    if (!invitationOpened) {
      openInvitation();
    }
  });
}

if (envelope) {
  envelope.addEventListener('click', event => {
    if (!envelopeOpened) {
      event.stopPropagation();
      revealEnvelope();
    }
  });
}

if (rsvpForm && rsvpMessage) {
  rsvpForm.addEventListener('submit', event => {
    event.preventDefault();
    rsvpMessage.hidden = false;
    rsvpForm.reset();
  });
}


