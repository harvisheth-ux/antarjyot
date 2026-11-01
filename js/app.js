/**
 * ANTARJYOT - The Garden of Inner Light
 * Navaera Software · Diwali wishing tree
 *
 * No build step, no backend, no modules - open index.html and it works,
 * whether served over HTTP or opened straight from disk.
 * `BLESSINGS` comes from js/blessings.js, loaded just before this file.
 */
const $ = (sel) => document.querySelector(sel);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const screens = {
  landing: $('#screen-landing'),
  blessing: $('#screen-blessing'),
  closing: $('#screen-closing'),
};

const blessingEl = $('#blessing-text');
const leafCard = $('#leafCard');
const sparkField = $('#sparkField');
const shareBtn = $('#btn-share');
const shareLabel = $('#shareLabel');

/* ------------------------------------------------------------------
   Blessing picker - a shuffled bag so nothing repeats until the whole
   collection has been seen, and never the same one twice in a row.
   ------------------------------------------------------------------ */
function createBlessingBag(list) {
  let bag = [];
  let last = null;

  const refill = () => {
    bag = [...list];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    // avoid an immediate repeat across the shuffle boundary
    if (bag.length > 1 && bag[0] === last) {
      [bag[0], bag[1]] = [bag[1], bag[0]];
    }
  };

  return () => {
    if (!bag.length) refill();
    last = bag.pop();
    return last;
  };
}

const nextBlessing = createBlessingBag(BLESSINGS);
let currentBlessing = '';

/* ------------------------------------------------------------------
   Screen transitions
   ------------------------------------------------------------------ */
function showScreen(name) {
  Object.values(screens).forEach((s) => {
    s.classList.remove('is-active', 'is-entering');
  });
  const next = screens[name];
  next.classList.add('is-active', 'is-entering');
  // drop the class once the stagger finishes so re-entry replays cleanly
  window.setTimeout(() => next.classList.remove('is-entering'), 1400);
}

/* ------------------------------------------------------------------
   Golden particle burst
   ------------------------------------------------------------------ */
function burstSparks(originEl, count = 26) {
  if (reduceMotion) return;

  const rect = originEl
    ? originEl.getBoundingClientRect()
    : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  const frag = document.createDocumentFragment();

  for (let i = 0; i < count; i++) {
    const spark = document.createElement('span');
    spark.className = 'spark';

    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const distance = 70 + Math.random() * 180;
    const size = 3 + Math.random() * 7;
    const life = 900 + Math.random() * 900;

    spark.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
    spark.style.setProperty('--ty', `${Math.sin(angle) * distance - 40}px`);
    spark.style.setProperty('--s', `${size}px`);
    spark.style.setProperty('--life', `${life}ms`);
    spark.style.setProperty('--delay', `${Math.random() * 220}ms`);
    spark.style.setProperty('--scale', `${0.3 + Math.random() * 0.6}`);
    spark.style.left = `${cx}px`;
    spark.style.top = `${cy}px`;

    spark.addEventListener('animationend', () => spark.remove(), { once: true });
    frag.appendChild(spark);
  }

  sparkField.appendChild(frag);
}

/* ------------------------------------------------------------------
   Reveal a blessing
   ------------------------------------------------------------------ */
function revealBlessing({ firstTime = false } = {}) {
  currentBlessing = nextBlessing();

  const paint = () => {
    blessingEl.textContent = currentBlessing;
    blessingEl.classList.remove('is-out', 'is-in');
    void blessingEl.offsetWidth; // restart the animation
    blessingEl.classList.add('is-in');
  };

  if (firstTime) {
    burstSparks($('#btn-receive'), 34);
    showScreen('blessing');
    leafCard.classList.remove('is-revealing');
    void leafCard.offsetWidth;
    leafCard.classList.add('is-revealing');
    window.setTimeout(paint, reduceMotion ? 0 : 320);
  } else {
    burstSparks(leafCard, 22);
    blessingEl.classList.add('is-out');
    window.setTimeout(paint, reduceMotion ? 0 : 340);
  }
}

/* ------------------------------------------------------------------
   Native share
   ------------------------------------------------------------------ */
if (navigator.share) {
  shareBtn.hidden = false;
  shareBtn.addEventListener('click', async () => {
    try {
      await navigator.share({
        title: 'Antarjyot - The Garden of Inner Light',
        text: `${currentBlessing}\n\nA little light, just for you.\n- Antarjyot, The Garden of Inner Light`,
        url: location.href,
      });
    } catch {
      /* user dismissed the share sheet - nothing to do */
    }
  });
} else if (navigator.clipboard) {
  shareBtn.hidden = false;
  shareLabel.textContent = 'Copy this light';
  shareBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(
        `${currentBlessing}\n\n- Antarjyot, The Garden of Inner Light`
      );
      shareLabel.textContent = 'Copied';
      window.setTimeout(() => { shareLabel.textContent = 'Copy this light'; }, 2200);
    } catch {
      /* clipboard blocked - stay silent rather than break the mood */
    }
  });
}

/* ------------------------------------------------------------------
   Wiring
   ------------------------------------------------------------------ */
$('#btn-receive').addEventListener('click', () => revealBlessing({ firstTime: true }));
$('#btn-again').addEventListener('click', () => revealBlessing());

$('#btn-carry').addEventListener('click', () => {
  burstSparks($('#btn-carry'), 30);
  showScreen('closing');
});

$('#btn-return').addEventListener('click', () => showScreen('landing'));

/* ------------------------------------------------------------------
   Drifting fireflies / golden motes
   ------------------------------------------------------------------ */
(function motes() {
  const canvas = $('#motes');
  if (!canvas || reduceMotion) return;

  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, dpr = 1, particles = [];

  const density = () => Math.round(Math.min(46, Math.max(16, (w * h) / 26000)));

  const seed = () => {
    particles = Array.from({ length: density() }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.5 + Math.random() * 1.7,
      vx: (Math.random() - 0.5) * 0.16,
      vy: -0.05 - Math.random() * 0.2,
      phase: Math.random() * Math.PI * 2,
      speed: 0.006 + Math.random() * 0.016,
    }));
  };

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  };

  const draw = () => {
    ctx.clearRect(0, 0, w, h);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.phase += p.speed;

      if (p.y < -12) { p.y = h + 10; p.x = Math.random() * w; }
      if (p.x < -12) p.x = w + 10;
      if (p.x > w + 12) p.x = -10;

      const twinkle = 0.3 + 0.7 * ((Math.sin(p.phase) + 1) / 2);
      const glow = p.r * 5;

      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glow);
      g.addColorStop(0, `rgba(255, 240, 200, ${0.85 * twinkle})`);
      g.addColorStop(0.35, `rgba(232, 184, 96, ${0.34 * twinkle})`);
      g.addColorStop(1, 'rgba(232, 184, 96, 0)');

      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, glow, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(draw);
  };

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resize, 180);
  });

  resize();
  requestAnimationFrame(draw);
})();
