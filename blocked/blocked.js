import { timeRemainingMs } from '../src/session.js';

const $ = (id) => document.getElementById(id);

let session = null;
let timerInterval = null;

(async () => {
  session = await chrome.runtime.sendMessage({ type: 'GET_SESSION' });

  if (!session || session.status !== 'active') {
    // No active session — redirect home
    window.location.href = 'https://www.google.com';
    return;
  }

  $('intention-text').textContent = `"${session.intention}"`;
  startTimer();
  wireEvents();
})();

function startTimer() {
  const tick = () => {
    const ms = timeRemainingMs(session);
    $('timer-display').textContent = formatTime(ms);
    if (ms <= 0) {
      clearInterval(timerInterval);
      $('timer-display').textContent = '00:00';
      // Session ended naturally — go back
      setTimeout(() => history.back(), 800);
    }
  };
  tick();
  timerInterval = setInterval(tick, 1000);
}

function wireEvents() {
  $('btn-sin').addEventListener('click', () => {
    $('sin-flow').classList.remove('hidden');
    $('btn-sin').style.display = 'none';
  });

  $('btn-cancel-sin').addEventListener('click', () => {
    $('sin-flow').classList.add('hidden');
    $('btn-sin').style.display = '';
  });

  $('btn-confirm-sin').addEventListener('click', async () => {
    const domain = new URL(document.referrer || location.href).hostname;
    await chrome.runtime.sendMessage({ type: 'COMMIT_SIN', domain });
    history.back();
  });
}

function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
  const s = (totalSec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
