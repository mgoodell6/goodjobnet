// Lightweight click tracking for dashboard buttons.
// Events are sent fire-and-forget so navigation is never delayed or blocked.

const SESSION_KEY = 'gjn_session_id';

function getSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = (window.crypto && crypto.randomUUID)
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return '';
  }
}

/**
 * Log a button click.
 * @param {string} target   Button identifier, e.g. 'nearby_jobs_search'
 * @param {string} page     'job_seeker_dashboard' | 'employment_center_dashboard'
 * @param {string|null} username  Staff username (Employment Center only)
 */
export function trackClick(target, page, username = null) {
  try {
    const payload = JSON.stringify({
      target,
      page,
      session_id: getSessionId(),
      ...(username ? { username } : {}),
    });
    const blob = new Blob([payload], { type: 'application/json' });
    if (navigator.sendBeacon && navigator.sendBeacon('/api/track-click', blob)) return;
    fetch('/api/track-click', {
      method: 'POST',
      body: payload,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Tracking must never break the UI
  }
}

