(() => {
'use strict';

const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const streakEl = document.getElementById('streak');
const dreamEl = document.getElementById('dream');
const timeEl = document.getElementById('time');
const hitEl = document.getElementById('hitName');
const energyBar = document.getElementById('energyBar');
const overlay = document.getElementById('overlay');
const overlayTitle = overlay.querySelector('.title');
const overlaySub = overlay.querySelector('.sub');
const startBtn = document.getElementById('start');

let W = 0;
let H = 0;
let DPR = 1;
let last = 0;
let running = false;
let spawnT = 0;
let ringT = 0;
let hazardT = 0;
let bonusT = 0;
let timeLeft = 75;
let score = 0;
let streak = 0;
let bestStreak = 0;
let shake = 0;
let flash = 0;
let audio = null;
let best = readBest();

const keys = new Set();
const objects = [];
const rings = [];
const stars = [];
const decor = [];
const bursts = [];
const darts = [];
const mouse = { active: false, x: 0, y: 0 };
const player = {
  x: 160,
  y: 220,
  vx: 0,
  vy: 0,
  r: 28,
  energy: 100,
  dash: 0,
  inv: 0,
  slow: 0,
  fire: 0,
  magnet: 0,
  pulse: 0,
  aimX: 1,
  aimY: 0,
  muzzle: 0
};

const TYPES = {
  candy: { name: 'moon candy', r: 12, speed: 225, score: 10, energy: 4, color: '#fff36b', kind: 'good' },
  star: { name: 'star fruit', r: 15, speed: 245, score: 24, energy: 2, color: '#64e9ff', kind: 'good' },
  pearl: { name: 'moon pearl', r: 10, speed: 280, score: 34, energy: 3, color: '#fff6c9', kind: 'good' },
  gem: { name: 'prism gem', r: 14, speed: 265, score: 32, energy: 4, color: '#58ffc5', kind: 'good' },
  lotus: { name: 'lotus bloom', r: 18, speed: 195, score: 28, energy: 10, color: '#ff7ac8', kind: 'good' },
  kite: { name: 'dream kite', r: 16, speed: 235, score: 22, energy: 5, color: '#9b8cff', kind: 'good' },
  comet: { name: 'comet crumb', r: 13, speed: 325, score: 38, energy: 2, time: 2, color: '#ffd166', kind: 'good' },
  bubble: { name: 'dream bubble', r: 18, speed: 170, score: 12, energy: 18, color: '#24fff2', kind: 'good' },
  clock: { name: 'time charm', r: 16, speed: 205, score: 8, time: 7, color: '#b8ff57', kind: 'good' },
  feather: { name: 'dash feather', r: 14, speed: 260, score: 16, energy: 9, color: '#ff7ac8', kind: 'good' },
  magnet: { name: 'star magnet', r: 17, speed: 210, score: 18, energy: 7, color: '#75ffe4', kind: 'good' },
  bell: { name: 'lullaby bell', r: 16, speed: 215, score: 20, energy: 6, color: '#ffcf6f', kind: 'good' },
  bolt: { name: 'storm bolt', r: 18, speed: 300, damage: 13, color: '#fffb00', kind: 'bad' },
  pillow: { name: 'sleepy pillow', r: 20, speed: 185, damage: 8, slow: 1.3, color: '#b96cff', kind: 'bad' },
  cloud: { name: 'ghost cloud', r: 34, speed: 165, damage: 18, color: '#ff75d8', kind: 'bad' },
  thorn: { name: 'thorn spiral', r: 22, speed: 225, damage: 14, color: '#ff4f70', kind: 'bad' },
  eclipse: { name: 'eclipse shard', r: 16, speed: 335, damage: 16, color: '#7383ff', kind: 'bad' },
  knot: { name: 'gravity knot', r: 25, speed: 160, damage: 10, slow: 1.7, color: '#8f5cff', kind: 'bad' }
};

const GOOD_SPAWN = ['candy', 'candy', 'star', 'pearl', 'gem', 'lotus', 'kite', 'feather'];
const BONUS_SPAWN = ['bubble', 'clock', 'magnet', 'bell', 'comet', 'star'];
const BAD_SPAWN = ['cloud', 'bolt', 'pillow', 'thorn', 'eclipse', 'knot'];
const DREAM_NAMES = [
  [6500, 'Lucid'],
  [4300, 'Aurora'],
  [2600, 'Velvet'],
  [1300, 'Glow'],
  [500, 'Dawn'],
  [0, 'Dawn']
];

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const pick = (a) => a[(Math.random() * a.length) | 0];
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function readBest() {
  try {
    return Number(localStorage.getItem('floatingPandaDreamBest') || 0);
  } catch (_) {
    return 0;
  }
}

function saveBest(value) {
  try {
    localStorage.setItem('floatingPandaDreamBest', String(value));
  } catch (_) {}
}

function dreamName() {
  for (const [min, name] of DREAM_NAMES) {
    if (score >= min) return name;
  }
  return 'Dawn';
}

function laneY(margin = 92) {
  const top = Math.min(margin, H * 0.34);
  const bottom = Math.max(top + 1, H - margin);
  return rand(top, bottom);
}

function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1);
  W = innerWidth;
  H = innerHeight;
  cv.width = Math.floor(W * DPR);
  cv.height = Math.floor(H * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  while (stars.length < 170) {
    stars.push({
      x: rand(0, W),
      y: rand(0, H),
      r: rand(0.45, 2.2),
      s: rand(10, 42),
      a: rand(0.16, 0.82),
      tw: rand(1.5, 4.5)
    });
  }
  while (decor.length < 62) {
    const d = {};
    resetDecor(d, false);
    decor.push(d);
  }
}

function resetDecor(d, ahead = true) {
  d.kind = pick(['puff', 'puff', 'lantern', 'petal', 'crystal', 'island', 'ribbon']);
  d.r = d.kind === 'puff' ? rand(55, 170) : d.kind === 'island' ? rand(70, 150) : rand(8, 28);
  d.x = ahead ? W + rand(25, W * 0.9 + 180) : rand(-80, W + 80);
  d.y = d.kind === 'island' ? rand(H * 0.66, H * 0.9) : rand(55, Math.max(56, H - 56));
  d.s = d.kind === 'puff' || d.kind === 'island' ? rand(10, 32) : rand(24, 78);
  d.a = d.kind === 'puff' ? rand(0.05, 0.13) : rand(0.15, 0.48);
  d.t = rand(0, Math.PI * 2);
  d.layer = d.kind === 'puff' || d.kind === 'island' ? 0 : 1;
  d.color = pick(['#fff36b', '#64e9ff', '#ff7ac8', '#58ffc5', '#d7b6ff']);
}

function reset() {
  objects.length = 0;
  rings.length = 0;
  bursts.length = 0;
  darts.length = 0;
  score = 0;
  streak = 0;
  bestStreak = 0;
  timeLeft = 75;
  spawnT = 0;
  ringT = 0.65;
  hazardT = 1.05;
  bonusT = 1.25;
  shake = 0;
  flash = 0;
  hitEl.textContent = 'ready';
  player.x = Math.max(110, W * 0.16);
  player.y = H * 0.48;
  player.vx = 0;
  player.vy = 0;
  player.energy = 100;
  player.dash = 0;
  player.inv = 0;
  player.slow = 0;
  player.fire = 0;
  player.magnet = 0;
  player.pulse = 0;
  player.aimX = 1;
  player.aimY = 0;
  player.muzzle = 0;
  mouse.active = false;
  running = true;
  overlay.classList.add('hidden');
  updateHud();
}

function finishRun() {
  running = false;
  const newBest = score > best;
  if (newBest) {
    best = score;
    saveBest(best);
  }
  overlayTitle.textContent = newBest ? 'New Dream Record' : 'Dream Over';
  overlaySub.textContent = 'Score ' + score + ' with a best streak of ' + bestStreak + '. The richest runs chain rings, power charms, and hazard pops together.';
  startBtn.textContent = 'Restart dream run';
  overlay.classList.remove('hidden');
  updateHud();
}

function updateHud() {
  scoreEl.textContent = score;
  if (bestEl) bestEl.textContent = best;
  streakEl.textContent = streak;
  if (dreamEl) dreamEl.textContent = dreamName();
  timeEl.textContent = Math.max(0, Math.ceil(timeLeft));
  energyBar.style.width = clamp(player.energy, 0, 100) + '%';
}

function spawnObject(type, x = W + rand(30, 125), y = laneY()) {
  const d = TYPES[type];
  objects.push({
    type,
    x,
    y,
    r: d.r,
    t: rand(0, Math.PI * 2),
    vx: d.speed * rand(0.9, 1.18),
    bob: rand(0, Math.PI * 2),
    amp: rand(5, 17)
  });
}

function spawnRing() {
  const y = laneY(116);
  rings.push({ x: W + 78, y, r: rand(35, 45), w: 8, hit: false, t: 0 });
  if (Math.random() < 0.38) {
    rings.push({
      x: W + rand(150, 230),
      y: clamp(y + rand(-130, 130), 108, Math.max(109, H - 108)),
      r: rand(34, 48),
      w: 8,
      hit: false,
      t: rand(0, 1)
    });
  }
}

function burst(x, y, color, n = 14, power = 1) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2);
    const sp = rand(60, 240) * power;
    bursts.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: rand(0.55, 1.05),
      color,
      r: rand(2, 5.5)
    });
  }
}

function trail(x, y, color, n = 2) {
  for (let i = 0; i < n; i++) {
    bursts.push({
      x: x + rand(-7, 7),
      y: y + rand(-7, 7),
      vx: rand(-42, 42),
      vy: rand(-42, 42),
      life: rand(0.22, 0.55),
      color,
      r: rand(1.2, 3.8)
    });
  }
}

function initAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  if (!audio) audio = new AC();
  if (audio.state === 'suspended') audio.resume();
}

function tone(freq, dur = 0.08, type = 'sine', gain = 0.055, sweep = 1) {
  if (!audio) return;
  const t = audio.currentTime;
  const o = audio.createOscillator();
  const g = audio.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (sweep !== 1) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * sweep), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(audio.destination);
  o.start(t);
  o.stop(t + dur + 0.03);
}

function playShoot() {
  tone(740, 0.07, 'triangle', 0.045, 1.7);
  tone(1240, 0.08, 'sine', 0.032, 1.25);
}

function playCollect() {
  tone(520, 0.06, 'sine', 0.035, 1.45);
  setTimeout(() => tone(780, 0.08, 'triangle', 0.034, 1.18), 45);
}

function playRing() {
  tone(420, 0.08, 'sine', 0.04, 1.8);
  setTimeout(() => tone(960, 0.12, 'triangle', 0.035, 1.1), 60);
}

function playHurt() {
  tone(190, 0.14, 'sawtooth', 0.05, 0.55);
  tone(90, 0.18, 'square', 0.024, 0.8);
}

function playDash() {
  tone(260, 0.06, 'triangle', 0.045, 2.2);
  tone(900, 0.09, 'sine', 0.03, 1.4);
}

function playPop() {
  tone(680, 0.05, 'square', 0.032, 1.5);
  tone(1160, 0.07, 'triangle', 0.028, 1.2);
}

function playPower() {
  tone(360, 0.08, 'triangle', 0.04, 1.8);
  setTimeout(() => tone(1080, 0.11, 'sine', 0.035, 1.15), 50);
}

function muzzlePoint(dx = player.aimX || 1, dy = player.aimY || 0) {
  return {
    x: player.x + dx * 46 - dy * 8,
    y: player.y + dy * 31 + dx * 8,
    baseX: player.x + dx * 25 - dy * 7,
    baseY: player.y + dy * 17 + dx * 7
  };
}

function shoot() {
  if (!running || player.fire > 0) return;
  initAudio();
  const tx = mouse.active ? mouse.x : W + 120;
  const ty = mouse.active ? mouse.y : player.y;
  const d = Math.hypot(tx - player.x, ty - player.y) || 1;
  const dx = (tx - player.x) / d;
  const dy = (ty - player.y) / d;
  const color = pick(['#fff36b', '#64e9ff', '#ff7ac8', '#58ffc5', '#ffffff']);
  const muzzle = muzzlePoint(dx, dy);
  player.aimX = dx;
  player.aimY = dy;
  darts.push({
    x: muzzle.x,
    y: muzzle.y,
    vx: dx * 720 + player.vx * 0.12,
    vy: dy * 720 + player.vy * 0.12,
    life: 1.08,
    r: 7,
    color,
    t: 0,
    tail: [
      { x: muzzle.baseX, y: muzzle.baseY },
      { x: muzzle.x - dx * 12, y: muzzle.y - dy * 12 }
    ]
  });
  player.fire = 0.16;
  player.muzzle = 0.12;
  player.energy = clamp(player.energy - 0.35, 0, 100);
  playShoot();
  trail(muzzle.x, muzzle.y, color, 10);
}

function hit(a, b, rr) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy < rr * rr;
}

function label(name) {
  hitEl.textContent = name;
  clearTimeout(label.t);
  label.t = setTimeout(() => {
    hitEl.textContent = running ? 'flying' : 'done';
  }, 900);
}

function clearHazards(x, y, range) {
  let popped = 0;
  for (let i = objects.length - 1; i >= 0; i--) {
    const o = objects[i];
    const d = TYPES[o.type];
    if (d.kind !== 'bad') continue;
    if (Math.hypot(o.x - x, o.y - y) > range) continue;
    burst(o.x, o.y, d.color, 24, 1.15);
    objects.splice(i, 1);
    popped++;
  }
  if (popped) {
    score += popped * (24 + Math.max(1, streak) * 3);
    shake = Math.max(shake, 0.14);
    playPop();
  }
  return popped;
}

function collect(o, d) {
  streak++;
  bestStreak = Math.max(bestStreak, streak);
  score += d.score + streak * 2;
  player.energy = clamp(player.energy + (d.energy || 0), 0, 100);
  if (d.time) timeLeft += d.time;
  if (o.type === 'bubble') player.inv = Math.max(player.inv, 2.2);
  if (o.type === 'feather') player.dash = Math.max(player.dash, 0.55);
  if (o.type === 'magnet') player.magnet = Math.max(player.magnet, 5.8);
  if (o.type === 'bell') {
    player.pulse = 0.48;
    const popped = clearHazards(o.x, o.y, 240);
    if (popped) label(d.name + ' +' + popped);
  }
  if (o.type === 'magnet' || o.type === 'bell' || o.type === 'clock') playPower();
  else playCollect();
  if (o.type !== 'bell') label(d.name);
  burst(o.x, o.y, d.color, o.type === 'comet' ? 28 : 18, o.type === 'comet' ? 1.18 : 1);
}

function hurt(o, d) {
  player.energy -= d.damage;
  player.inv = 1.05;
  player.slow = Math.max(player.slow, d.slow || 0);
  player.vx -= 180;
  player.vy += rand(-135, 135);
  streak = 0;
  shake = 0.28;
  flash = 0.35;
  label(d.name);
  playHurt();
  burst(o.x, o.y, d.color, 24, 1.1);
}

function update(dt) {
  if (!running) return;
  timeLeft -= dt;
  if (timeLeft <= 0 || player.energy <= 0) {
    finishRun();
    return;
  }

  let ax = 0;
  let ay = 0;
  if (keys.has('ArrowLeft') || keys.has('a')) ax -= 1;
  if (keys.has('ArrowRight') || keys.has('d')) ax += 1;
  if (keys.has('ArrowUp') || keys.has('w')) ay -= 1;
  if (keys.has('ArrowDown') || keys.has('s')) ay += 1;
  if (mouse.active) {
    const dx = mouse.x - player.x;
    const dy = mouse.y - player.y;
    const d = Math.hypot(dx, dy);
    if (d > 8) {
      ax = dx / d;
      ay = dy / d;
    }
  }

  player.fire = Math.max(0, player.fire - dt);
  if (keys.has(' ')) {
    if (player.dash <= 0) {
      player.dash = 0.4;
      player.vx += (ax || 1) * 485;
      player.vy += ay * 360;
      player.energy = Math.max(0, player.energy - 4);
      playDash();
    }
    keys.delete(' ');
  }
  if (keys.has('f') || keys.has('Enter') || mouse.active) shoot();

  const slowMul = player.slow > 0 ? 0.66 : 1;
  const dashMul = player.dash > 0 ? 1.28 : 1;
  const thrust = 860 * dashMul * slowMul;
  player.vx += ax * thrust * dt;
  player.vy += ay * thrust * dt;
  player.vy += 35 * dt;
  player.vx *= Math.pow(0.055, dt);
  player.vy *= Math.pow(0.075, dt);
  player.x = clamp(player.x + player.vx * dt, 42, W - 42);
  player.y = clamp(player.y + player.vy * dt, 68, H - 44);
  player.dash = Math.max(0, player.dash - dt);
  player.inv = Math.max(0, player.inv - dt);
  player.slow = Math.max(0, player.slow - dt);
  player.magnet = Math.max(0, player.magnet - dt);
  player.pulse = Math.max(0, player.pulse - dt);
  player.muzzle = Math.max(0, player.muzzle - dt);
  player.energy = clamp(player.energy + dt * 3.4, 0, 100);
  trail(player.x - 30, player.y + rand(-10, 10), player.dash > 0 ? '#64e9ff' : '#ff7ac8', player.dash > 0 ? 4 : 1);

  const elapsed = 75 - timeLeft;
  const intensity = clamp(elapsed / 95 + score / 7200, 0, 1);
  spawnT -= dt;
  ringT -= dt;
  hazardT -= dt;
  bonusT -= dt;
  if (spawnT <= 0) {
    spawnObject(pick(GOOD_SPAWN));
    if (Math.random() < 0.42 + intensity * 0.22) spawnObject(pick(['candy', 'pearl', 'gem', 'lotus', 'kite']));
    spawnT = rand(0.24, 0.52 - intensity * 0.16);
  }
  if (bonusT <= 0) {
    spawnObject(pick(BONUS_SPAWN));
    bonusT = rand(1.85 - intensity * 0.28, 3.35 - intensity * 0.4);
  }
  if (ringT <= 0) {
    spawnRing();
    ringT = rand(1.55 - intensity * 0.3, 2.55 - intensity * 0.42);
  }
  if (hazardT <= 0) {
    spawnObject(pick(BAD_SPAWN));
    if (Math.random() < 0.18 + intensity * 0.24) spawnObject(pick(['bolt', 'thorn', 'eclipse']));
    hazardT = rand(0.82 - intensity * 0.16, 1.45 - intensity * 0.24);
  }

  for (const s of stars) {
    s.x -= s.s * dt;
    if (s.x < -8) {
      s.x = W + 8;
      s.y = rand(0, H);
    }
  }
  for (const d of decor) {
    d.t += dt;
    d.x -= d.s * dt;
    d.y += Math.sin(d.t * 1.8) * dt * (d.kind === 'petal' ? 10 : 3);
    if (d.x < -d.r * 3) resetDecor(d, true);
  }

  for (let i = darts.length - 1; i >= 0; i--) {
    const d = darts[i];
    d.life -= dt;
    d.t += dt;
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    d.tail.push({ x: d.x, y: d.y });
    if (d.tail.length > 8) d.tail.shift();
    trail(d.x, d.y, d.color, 1);
    if (d.life <= 0 || d.x > W + 90 || d.x < -90 || d.y < -90 || d.y > H + 90) darts.splice(i, 1);
  }

  for (let i = objects.length - 1; i >= 0; i--) {
    const o = objects[i];
    const d = TYPES[o.type];
    o.x -= o.vx * dt;
    o.t += dt;
    o.y += Math.sin(o.t * 2 + o.bob) * o.amp * dt;

    if (player.magnet > 0 && d.kind === 'good') {
      const dx = player.x - o.x;
      const dy = player.y - o.y;
      const pullDist = Math.hypot(dx, dy);
      if (pullDist > 1 && pullDist < 255) {
        const pull = (1 - pullDist / 255) * 410 * dt;
        o.x += dx / pullDist * pull;
        o.y += dy / pullDist * pull;
      }
    }

    let dartHit = -1;
    for (let j = darts.length - 1; j >= 0; j--) {
      if (hit(darts[j], o, darts[j].r + o.r)) {
        dartHit = j;
        break;
      }
    }
    if (dartHit >= 0) {
      const dart = darts[dartHit];
      burst(dart.x, dart.y, dart.color, 12);
      if (d.kind === 'good') {
        collect(o, d);
      } else {
        score += 14 + streak;
        player.energy = clamp(player.energy + 1.5, 0, 100);
        label('dart popped ' + d.name);
        playPop();
        burst(o.x, o.y, d.color, 28, 1.05);
        shake = Math.max(shake, 0.1);
      }
      darts.splice(dartHit, 1);
      objects.splice(i, 1);
      continue;
    }

    if (hit(player, o, player.r + o.r)) {
      if (d.kind === 'good') {
        collect(o, d);
      } else if (player.inv > 0) {
        score += 10 + streak;
        label('shield popped ' + d.name);
        playPop();
        burst(o.x, o.y, d.color, 22);
      } else {
        hurt(o, d);
      }
      objects.splice(i, 1);
      continue;
    }
    if (o.x < -90) objects.splice(i, 1);
  }

  for (let i = rings.length - 1; i >= 0; i--) {
    const r = rings[i];
    r.x -= (190 + intensity * 25) * dt;
    r.t += dt;
    const d = Math.hypot(player.x - r.x, player.y - r.y);
    if (!r.hit && d < r.r && d > r.r - r.w - 23) {
      r.hit = true;
      streak++;
      bestStreak = Math.max(bestStreak, streak);
      score += Math.round(26 * streak + 12 * intensity);
      player.energy = clamp(player.energy + 8, 0, 100);
      label('lantern ring');
      playRing();
      burst(r.x, r.y, '#ffcf6f', 28, 1.06);
    }
    if (r.x < -95) rings.splice(i, 1);
  }

  for (let i = bursts.length - 1; i >= 0; i--) {
    const p = bursts[i];
    p.life -= dt * 1.65;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 90 * dt;
    if (p.life <= 0) bursts.splice(i, 1);
  }
  shake = Math.max(0, shake - dt);
  flash = Math.max(0, flash - dt);
  updateHud();
}

function drawSky() {
  const now = performance.now() / 1000;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#140833');
  g.addColorStop(0.38, '#173b8f');
  g.addColorStop(0.68, '#9d4e9f');
  g.addColorStop(1, '#0c2940');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const moon = ctx.createRadialGradient(W * 0.8, H * 0.17, 0, W * 0.8, H * 0.17, 160);
  moon.addColorStop(0, 'rgba(255,243,107,.88)');
  moon.addColorStop(0.25, 'rgba(100,233,255,.32)');
  moon.addColorStop(0.72, 'rgba(255,122,200,.08)');
  moon.addColorStop(1, 'rgba(255,122,200,0)');
  ctx.fillStyle = moon;
  ctx.beginPath();
  ctx.arc(W * 0.8, H * 0.17, 160, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 6; i++) {
    const y = H * (0.16 + i * 0.13);
    ctx.strokeStyle = ['#64e9ff', '#ff7ac8', '#58ffc5', '#fff36b', '#d7b6ff', '#ff9f7a'][i];
    ctx.globalAlpha = 0.13;
    ctx.lineWidth = 2 + i * 0.35;
    ctx.beginPath();
    ctx.moveTo(-40, y + Math.sin(now + i) * 14);
    ctx.bezierCurveTo(W * 0.3, y - 95 + i * 24, W * 0.68, y + 110 - i * 18, W + 40, y - 12);
    ctx.stroke();
  }
  ctx.restore();

  drawDecor(0);
  for (const s of stars) {
    ctx.globalAlpha = s.a * (0.72 + Math.sin(now * s.tw + s.x) * 0.28);
    ctx.fillStyle = s.r > 1.3 ? '#64e9ff' : '#fff7d1';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  drawDecor(1);
}

function drawDecor(layer) {
  const now = performance.now() / 1000;
  ctx.save();
  for (const d of decor) {
    if (d.layer !== layer) continue;
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.globalAlpha = d.a;
    if (d.kind === 'puff') {
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, d.r, d.r * 0.18, Math.sin(d.t) * 0.08, 0, Math.PI * 2);
      ctx.ellipse(d.r * 0.22, -d.r * 0.08, d.r * 0.45, d.r * 0.18, 0, 0, Math.PI * 2);
      ctx.ellipse(-d.r * 0.38, d.r * 0.03, d.r * 0.35, d.r * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (d.kind === 'island') {
      ctx.fillStyle = '#192251';
      ctx.beginPath();
      ctx.ellipse(0, 0, d.r, d.r * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = d.color;
      ctx.globalAlpha = d.a * 1.5;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.ellipse(i * d.r * 0.2, -d.r * 0.12 + Math.sin(now + i) * 2, 8, 20, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (d.kind === 'lantern') {
      ctx.rotate(Math.sin(d.t) * 0.18);
      ctx.strokeStyle = d.color;
      ctx.fillStyle = d.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -d.r * 1.7);
      ctx.lineTo(0, -d.r * 0.55);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, 0, d.r * 0.55, d.r, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff8d6';
      ctx.globalAlpha = d.a * 0.7;
      ctx.beginPath();
      ctx.ellipse(0, 0, d.r * 0.25, d.r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (d.kind === 'petal') {
      ctx.rotate(d.t * 2);
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, d.r * 0.45, d.r, 0.35, 0, Math.PI * 2);
      ctx.fill();
    } else if (d.kind === 'crystal') {
      ctx.rotate(d.t);
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.moveTo(0, -d.r);
      ctx.lineTo(d.r * 0.62, 0);
      ctx.lineTo(0, d.r);
      ctx.lineTo(-d.r * 0.62, 0);
      ctx.closePath();
      ctx.fill();
    } else if (d.kind === 'ribbon') {
      ctx.strokeStyle = d.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-d.r, 0);
      ctx.bezierCurveTo(-d.r * 0.3, -d.r, d.r * 0.3, d.r, d.r, 0);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawStarShape(x, y, r, color, spin = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin);
  ctx.fillStyle = color;
  ctx.strokeStyle = 'rgba(255,255,255,.78)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = i * Math.PI / 5 - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawObject(o) {
  const d = TYPES[o.type];
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(o.t * (o.type === 'bolt' || o.type === 'eclipse' ? 0.5 : 1.2));
  ctx.shadowColor = d.color;
  ctx.shadowBlur = 18;

  if (o.type === 'candy') {
    drawStarShape(0, 0, 14, d.color, o.t * 2);
    ctx.strokeStyle = '#ff7ac8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 1.35);
    ctx.stroke();
  } else if (o.type === 'star') {
    drawStarShape(0, 0, 18, d.color, o.t * 2);
  } else if (o.type === 'pearl') {
    ctx.fillStyle = d.color;
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.8)';
    ctx.beginPath();
    ctx.arc(-4, -4, 3.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (o.type === 'gem') {
    ctx.fillStyle = d.color;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -17);
    ctx.lineTo(14, -4);
    ctx.lineTo(8, 16);
    ctx.lineTo(-8, 16);
    ctx.lineTo(-14, -4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.5)';
    ctx.beginPath();
    ctx.moveTo(0, -17);
    ctx.lineTo(0, 16);
    ctx.moveTo(-14, -4);
    ctx.lineTo(14, -4);
    ctx.stroke();
  } else if (o.type === 'lotus') {
    ctx.fillStyle = d.color;
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.rotate(i * Math.PI / 3);
      ctx.beginPath();
      ctx.ellipse(0, -10, 7, 17, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#fff36b';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (o.type === 'kite') {
    ctx.fillStyle = d.color;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(15, 0);
    ctx.lineTo(0, 18);
    ctx.lineTo(-15, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#fff36b';
    ctx.beginPath();
    ctx.moveTo(0, 18);
    ctx.quadraticCurveTo(-10, 28, 3, 36);
    ctx.quadraticCurveTo(12, 43, -2, 50);
    ctx.stroke();
  } else if (o.type === 'comet') {
    ctx.strokeStyle = d.color;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-34, 8);
    ctx.quadraticCurveTo(-16, -8, 0, 0);
    ctx.stroke();
    ctx.fillStyle = d.color;
    ctx.beginPath();
    ctx.arc(8, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(4, -4, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (o.type === 'bubble') {
    ctx.globalAlpha = 0.78;
    ctx.strokeStyle = d.color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(155,231,255,.18)';
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    ctx.beginPath();
    ctx.arc(-6, -7, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (o.type === 'clock') {
    ctx.fillStyle = '#c7ff7a';
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1f2b16';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -9);
    ctx.moveTo(0, 0);
    ctx.lineTo(8, 3);
    ctx.stroke();
  } else if (o.type === 'feather') {
    ctx.fillStyle = d.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 20, 0.65, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-7, 14);
    ctx.lineTo(8, -15);
    ctx.stroke();
  } else if (o.type === 'magnet') {
    ctx.strokeStyle = d.color;
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, 15, Math.PI * 0.1, Math.PI * 0.9);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.fillRect(-16, 3, 8, 9);
    ctx.fillRect(8, 3, 8, 9);
  } else if (o.type === 'bell') {
    ctx.fillStyle = d.color;
    ctx.beginPath();
    ctx.moveTo(-13, 8);
    ctx.quadraticCurveTo(-12, -13, 0, -16);
    ctx.quadraticCurveTo(12, -13, 13, 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff6c9';
    ctx.beginPath();
    ctx.arc(0, 12, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (o.type === 'bolt') {
    ctx.fillStyle = d.color;
    ctx.beginPath();
    ctx.moveTo(-6, -22);
    ctx.lineTo(12, -4);
    ctx.lineTo(2, -3);
    ctx.lineTo(8, 22);
    ctx.lineTo(-12, 1);
    ctx.lineTo(-1, 0);
    ctx.closePath();
    ctx.fill();
  } else if (o.type === 'pillow') {
    ctx.fillStyle = d.color;
    ctx.beginPath();
    ctx.roundRect(-22, -14, 44, 28, 9);
    ctx.fill();
    ctx.strokeStyle = 'rgba(85,65,140,.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else if (o.type === 'cloud') {
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = d.color;
    for (const p of [[0, 0, 1], [-22, 6, 0.72], [23, 8, 0.82], [-4, -18, 0.76]]) {
      ctx.beginPath();
      ctx.arc(p[0], p[1], 34 * p[2], 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(65,50,96,.75)';
    ctx.beginPath();
    ctx.arc(-12, 4, 4, 0, Math.PI * 2);
    ctx.arc(12, 4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(65,50,96,.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 15, 10, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
  } else if (o.type === 'thorn') {
    ctx.strokeStyle = d.color;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 2.6; a += 0.24) {
      const rr = 2 + a * 3.1;
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr;
      if (a === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.fillStyle = '#fff36b';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(Math.cos(i * 1.8) * 18, Math.sin(i * 1.8) * 18, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (o.type === 'eclipse') {
    ctx.fillStyle = '#111229';
    ctx.strokeStyle = d.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -21);
    ctx.lineTo(16, -5);
    ctx.lineTo(7, 19);
    ctx.lineTo(-12, 10);
    ctx.lineTo(-17, -9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (o.type === 'knot') {
    ctx.strokeStyle = d.color;
    ctx.lineWidth = 4;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(0, 0, 8 + i * 7, 18 + i * 3, i * Math.PI / 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawRing(r) {
  ctx.save();
  ctx.translate(r.x, r.y);
  ctx.rotate(Math.sin(r.t * 2) * 0.05);
  ctx.strokeStyle = r.hit ? '#6ff0bd' : '#ffcf6f';
  ctx.lineWidth = r.w;
  ctx.shadowColor = ctx.strokeStyle;
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(0, 0, r.r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,255,255,.7)';
  ctx.setLineDash([4, 8]);
  ctx.beginPath();
  ctx.arc(0, 0, r.r - 12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#fff36b';
  for (let i = 0; i < 4; i++) {
    const a = r.t + i * Math.PI / 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r.r, Math.sin(a) * r.r, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPanda() {
  ctx.save();
  ctx.translate(player.x, player.y);
  if (player.inv > 0) ctx.globalAlpha = 0.52 + 0.34 * Math.sin(performance.now() / 45);
  ctx.rotate(player.vx * 0.0009);
  const flap = Math.sin(performance.now() / 120) * 5;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  if (player.magnet > 0) {
    ctx.strokeStyle = 'rgba(117,255,228,.45)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 72 + Math.sin(performance.now() / 120) * 5, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (player.pulse > 0) {
    ctx.strokeStyle = 'rgba(255,207,111,' + player.pulse + ')';
    ctx.lineWidth = 8 * player.pulse;
    ctx.beginPath();
    ctx.arc(0, 0, 55 + (0.48 - player.pulse) * 360, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = player.dash > 0 ? 'rgba(100,233,255,.4)' : 'rgba(255,122,200,.15)';
  ctx.beginPath();
  ctx.ellipse(-26, 0, player.dash > 0 ? 66 : 44, player.dash > 0 ? 24 : 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,243,107,.38)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 38 + Math.sin(performance.now() / 120) * 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = 'rgba(0,0,0,.22)';
  ctx.beginPath();
  ctx.ellipse(0, 34, 36, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f7f7f0';
  ctx.beginPath();
  ctx.arc(0, 0, 27, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#202026';
  ctx.beginPath();
  ctx.arc(-22, -19, 11, 0, Math.PI * 2);
  ctx.arc(22, -19, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#202026';
  ctx.beginPath();
  ctx.ellipse(-10, -4, 8, 10, -0.35, 0, Math.PI * 2);
  ctx.ellipse(10, -4, 8, 10, 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f7f7f0';
  ctx.beginPath();
  ctx.arc(-10, -5, 3, 0, Math.PI * 2);
  ctx.arc(10, -5, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff9ebd';
  ctx.beginPath();
  ctx.arc(-16, 7, 4, 0, Math.PI * 2);
  ctx.arc(16, 7, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#202026';
  ctx.beginPath();
  ctx.arc(0, 8, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#202026';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, 14, 10, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.strokeStyle = '#202026';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-19, 18);
  ctx.lineTo(-38, 24 + flap);
  ctx.moveTo(19, 18);
  ctx.lineTo(38, 24 - flap);
  ctx.stroke();
  ctx.strokeStyle = '#ffcf6f';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-18, -30);
  ctx.lineTo(-6, -36);
  ctx.lineTo(0, -29);
  ctx.lineTo(7, -36);
  ctx.lineTo(18, -30);
  ctx.stroke();
  ctx.restore();
}

function drawBlaster() {
  const aimX = player.aimX || 1;
  const aimY = player.aimY || 0;
  const muzzle = muzzlePoint(aimX, aimY);
  const angle = Math.atan2(aimY, aimX);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = '#202026';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(muzzle.baseX, muzzle.baseY);
  ctx.lineTo(muzzle.x - aimX * 6, muzzle.y - aimY * 6);
  ctx.stroke();
  ctx.strokeStyle = '#fff36b';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(muzzle.baseX + aimX * 5, muzzle.baseY + aimY * 5);
  ctx.lineTo(muzzle.x, muzzle.y);
  ctx.stroke();
  ctx.fillStyle = '#64e9ff';
  ctx.beginPath();
  ctx.arc(muzzle.x, muzzle.y, 5, 0, Math.PI * 2);
  ctx.fill();
  if (player.muzzle > 0) {
    const glow = player.muzzle / 0.12;
    ctx.fillStyle = 'rgba(255,243,107,' + glow + ')';
    ctx.shadowColor = '#fff36b';
    ctx.shadowBlur = 22;
    ctx.beginPath();
    ctx.arc(muzzle.x + Math.cos(angle) * 8, muzzle.y + Math.sin(angle) * 8, 7 + glow * 8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawDarts() {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const d of darts) {
    ctx.strokeStyle = d.color;
    ctx.fillStyle = d.color;
    ctx.shadowColor = d.color;
    ctx.shadowBlur = 22;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.78;
    if (d.tail.length) {
      ctx.beginPath();
      ctx.moveTo(d.tail[0].x, d.tail[0].y);
      for (const p of d.tail) ctx.lineTo(p.x, p.y);
      ctx.lineTo(d.x, d.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    const a = Math.atan2(d.vy, d.vx);
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-8, -6);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-1, 0, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawBursts() {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const p of bursts) {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawMouseTarget() {
  if (!mouse.active) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = '#64e9ff';
  ctx.fillStyle = 'rgba(100,233,255,.12)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(mouse.x, mouse.y, 24 + Math.sin(performance.now() / 90) * 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(mouse.x - 34, mouse.y);
  ctx.lineTo(mouse.x + 34, mouse.y);
  ctx.moveTo(mouse.x, mouse.y - 34);
  ctx.lineTo(mouse.x, mouse.y + 34);
  ctx.stroke();
  ctx.restore();
}

function render() {
  ctx.save();
  if (shake > 0) ctx.translate(rand(-6, 6) * shake * 4, rand(-4, 4) * shake * 4);
  drawSky();
  for (const r of rings) drawRing(r);
  for (const o of objects) drawObject(o);
  drawDarts();
  drawBursts();
  drawMouseTarget();
  drawPanda();
  drawBlaster();
  if (flash > 0) {
    ctx.fillStyle = 'rgba(255,110,90,' + flash * 0.32 + ')';
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

function loop(t) {
  const dt = Math.min(0.033, (t - last) / 1000 || 0);
  last = t;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

addEventListener('resize', resize);
cv.addEventListener('pointerdown', (e) => {
  initAudio();
  mouse.active = true;
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  if (cv.setPointerCapture) cv.setPointerCapture(e.pointerId);
});
cv.addEventListener('pointermove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});
cv.addEventListener('pointerup', () => {
  mouse.active = false;
});
cv.addEventListener('pointercancel', () => {
  mouse.active = false;
});
cv.addEventListener('dblclick', () => {
  keys.add(' ');
});
addEventListener('keydown', (e) => {
  initAudio();
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'a', 's', 'd', 'f', 'Enter'].includes(k)) {
    e.preventDefault();
    keys.add(k);
  }
});
addEventListener('keyup', (e) => {
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  keys.delete(k);
});

document.querySelectorAll('[data-k]').forEach((b) => {
  const k = b.dataset.k;
  b.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (k === 'stop') {
      keys.clear();
      return;
    }
    keys.add(k === 'Space' ? ' ' : k);
  });
  b.addEventListener('pointerup', () => keys.delete(k === 'Space' ? ' ' : k));
  b.addEventListener('pointercancel', () => keys.delete(k === 'Space' ? ' ' : k));
});

startBtn.onclick = () => {
  initAudio();
  reset();
};

resize();
updateHud();
requestAnimationFrame(loop);
})();
