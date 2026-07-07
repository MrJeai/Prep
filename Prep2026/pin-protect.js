(function () {
  const STORAGE_KEYS = {
    auth: 'prep2026_pin_auth',
    expiresAt: 'prep2026_pin_expires_at'
  };
  const SESSION_TIMEOUT_MS = 60 * 60 * 1000;
  const AUTH_EVENT = 'prep-pin-unlocked';
  const SIDEBAR_COLLAPSED_CLASS = 'prep-sidebar-collapsed';

  function getStorage() {
    return window.sessionStorage;
  }

  function getAuthState() {
    const storage = getStorage();
    const expiresAt = Number(storage.getItem(STORAGE_KEYS.expiresAt) || 0);
    const isAuthenticated = storage.getItem(STORAGE_KEYS.auth) === 'true';

    if (!isAuthenticated || !expiresAt) {
      return { authenticated: false };
    }

    if (Date.now() > expiresAt) {
      clearAuthState();
      return { authenticated: false };
    }

    return { authenticated: true, expiresAt };
  }

  function persistAuthState() {
    const storage = getStorage();
    storage.setItem(STORAGE_KEYS.auth, 'true');
    storage.setItem(STORAGE_KEYS.expiresAt, String(Date.now() + SESSION_TIMEOUT_MS));
  }

  function clearAuthState() {
    const storage = getStorage();
    storage.removeItem(STORAGE_KEYS.auth);
    storage.removeItem(STORAGE_KEYS.expiresAt);
  }

  function addNavigationControls() {
    const sidebar = document.querySelector('.sidebar');
    const main = document.querySelector('.main') || document.querySelector('main');

    if (!sidebar || !main) {
      return;
    }

    if (document.getElementById('prep-sidebar-toggle')) {
      return;
    }

    const style = document.createElement('style');
    style.textContent = `
      body.${SIDEBAR_COLLAPSED_CLASS} .sidebar {
        width: 0 !important;
        padding: 0 !important;
        overflow: hidden;
      }
      body.${SIDEBAR_COLLAPSED_CLASS} .sidebar .sidebar-brand,
      body.${SIDEBAR_COLLAPSED_CLASS} .sidebar .nav-section-label,
      body.${SIDEBAR_COLLAPSED_CLASS} .sidebar .nav-item,
      body.${SIDEBAR_COLLAPSED_CLASS} .sidebar #prep-home-link {
        display: none !important;
      }
      body.${SIDEBAR_COLLAPSED_CLASS} .main,
      body.${SIDEBAR_COLLAPSED_CLASS} main {
        margin-left: 0 !important;
      }
      .sidebar {
        transition: width 0.2s ease, padding 0.2s ease;
      }
      .main, main {
        transition: margin-left 0.2s ease;
      }
      #prep-sidebar-toggle {
        position: fixed;
        top: 16px;
        left: 230px;
        width: 30px;
        height: 30px;
        border: 1px solid rgba(255,255,255,0.16);
        border-radius: 0 8px 8px 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--purple-900, #26215C);
        color: #fff;
        cursor: pointer;
        font-size: 16px;
        line-height: 1;
        z-index: 140;
      }
      #prep-sidebar-toggle:hover {
        background: var(--purple-800, #3C3489);
      }
      body.${SIDEBAR_COLLAPSED_CLASS} #prep-sidebar-toggle {
        left: 0;
        border-radius: 0 8px 8px 0;
      }
      #prep-home-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin: 0 20px 12px;
        padding: 7px 10px;
        border-radius: 8px;
        background: rgba(255,255,255,0.08);
        color: #fff;
        text-decoration: none;
        font-size: 12px;
        font-weight: 600;
        border: 1px solid rgba(255,255,255,0.14);
      }
      #prep-home-link:hover {
        background: rgba(255,255,255,0.14);
      }
    `;
    document.head.appendChild(style);

    const toggleButton = document.createElement('button');
    toggleButton.id = 'prep-sidebar-toggle';
    toggleButton.type = 'button';
    toggleButton.setAttribute('aria-label', 'Toggle navigation');
    toggleButton.setAttribute('aria-expanded', 'true');
    toggleButton.innerHTML = '‹';
    document.body.appendChild(toggleButton);

    const homeLink = document.createElement('a');
    homeLink.id = 'prep-home-link';
    homeLink.href = 'master_index.html';
    homeLink.setAttribute('aria-label', 'Go to home');
    homeLink.innerHTML = '🏠 Home';
    sidebar.prepend(homeLink);

    toggleButton.addEventListener('click', () => {
      const collapsed = document.body.classList.toggle(SIDEBAR_COLLAPSED_CLASS);
      toggleButton.setAttribute('aria-expanded', String(!collapsed));
      toggleButton.innerHTML = collapsed ? '›' : '‹';
    });

    if (window.innerWidth < 900) {
      document.body.classList.add(SIDEBAR_COLLAPSED_CLASS);
      toggleButton.setAttribute('aria-expanded', 'false');
      toggleButton.innerHTML = '›';
    }
  }

  async function verifyPin(pin) {
    const response = await fetch('/.netlify/functions/check-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin })
    });

    const data = await response.json();
    return response.ok && data.ok;
  }

  function createModal() {
    const overlay = document.createElement('div');
    overlay.id = 'prep-pin-overlay';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(9, 12, 24, 0.78)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '999999';
    overlay.style.padding = '20px';

    const card = document.createElement('div');
    card.style.width = 'min(420px, 100%)';
    card.style.background = '#ffffff';
    card.style.borderRadius = '16px';
    card.style.boxShadow = '0 20px 48px rgba(0, 0, 0, 0.26)';
    card.style.padding = '28px';
    card.style.textAlign = 'center';

    card.innerHTML = `
      <h2 style="margin:0 0 8px; font-size: 24px; color:#1f2937;">Site access</h2>
      <p style="margin:0 0 18px; color:#6b7280; line-height:1.6;">Enter the PIN to continue.</p>
      <form id="prep-pin-form">
        <input id="prep-pin-input" type="password" autocomplete="current-password" placeholder="Enter PIN" style="width:100%; padding:12px 14px; border:1px solid #d1d5db; border-radius:10px; font-size:15px; outline:none;" />
        <button type="submit" style="margin-top:12px; width:100%; padding:12px 14px; border:none; border-radius:10px; background:#4f46e5; color:white; font-weight:600; cursor:pointer;">Unlock site</button>
      </form>
      <p id="prep-pin-error" style="margin:12px 0 0; color:#dc2626; min-height:20px; font-size:14px;"></p>
      <p style="margin-top:14px; color:#9ca3af; font-size:12px;">PIN is stored locally in this browser for one hour.</p>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    return { overlay, form: card.querySelector('#prep-pin-form'), input: card.querySelector('#prep-pin-input'), error: card.querySelector('#prep-pin-error') };
  }

  function showPrompt() {
    const modal = createModal();
    modal.form.addEventListener('submit', async function (event) {
      event.preventDefault();
      const value = modal.input.value.trim();
      const isValid = await verifyPin(value);

      if (isValid) {
        persistAuthState();
        modal.overlay.remove();
        document.body.classList.add('prep-pin-unlocked');
        document.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: { authenticated: true } }));
      } else {
        modal.error.textContent = 'Incorrect PIN. Please try again.';
        modal.input.value = '';
        modal.input.focus();
      }
    });

    modal.input.focus();
  }

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    addNavigationControls();

    if (getAuthState().authenticated) {
      document.body.classList.add('prep-pin-unlocked');
      return;
    }

    showPrompt();
  }

  init();
})();
