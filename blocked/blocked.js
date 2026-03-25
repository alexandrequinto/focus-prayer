import { timeRemainingMs } from '../src/session.js';

const $ = (id) => document.getElementById(id);

const GUILT = [
  {
    prompt: 'You are about to betray yourself.',
    sub: 'You said this mattered. It still does.',
  },
  {
    prompt: 'You made a promise.',
    sub: 'Not to anyone else. To yourself. That\'s the hardest one to break.',
  },
  {
    prompt: 'This is the moment that separates you.',
    sub: 'The version of you that stayed — and the one that didn\'t.',
  },
  {
    prompt: 'The distraction will still be there later.',
    sub: 'This focus won\'t be.',
  },
  {
    prompt: 'You already know how this feels.',
    sub: 'You\'ve been here before. You know what comes after.',
  },
  {
    prompt: 'One click away from breaking it.',
    sub: 'Is whatever\'s over there worth more than what you\'re building here?',
  },
  {
    prompt: 'This will be recorded.',
    sub: 'Not by anyone watching. By you. You\'ll know.',
  },
];

let session = null;
let timerInterval = null;

(async () => {
  session = await chrome.runtime.sendMessage({ type: 'GET_SESSION' });

  if (!session || session.status !== 'active') {
    window.location.href = 'about:blank';
    return;
  }

  const label = session.intention === 'Silence' ? 'Silence.' : `"${session.intention}"`;
  $('intention-text').textContent = label;
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
      setTimeout(() => history.back(), 800);
    }
  };
  tick();
  timerInterval = setInterval(tick, 1000);
}

function wireEvents() {
  $('btn-sin').addEventListener('click', () => {
    const g = GUILT[Math.floor(Math.random() * GUILT.length)];
    $('sin-prompt-text').textContent = g.prompt;
    $('sin-sub-text').textContent = g.sub;
    $('sin-flow').classList.remove('hidden');
    $('btn-sin').style.display = 'none';
  });

  $('btn-cancel-sin').addEventListener('click', () => {
    $('sin-flow').classList.add('hidden');
    $('btn-sin').style.display = '';
  });

  $('btn-confirm-sin').addEventListener('click', async () => {
    const params = new URLSearchParams(location.search);
    const domain = params.get('from') || 'unknown';
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
