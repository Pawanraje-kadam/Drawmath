/**
 * DOM-level sanity check for the motion layer:
 *  - buttons ripple when pressed
 *  - the mode switch pill moves between segments
 *  - the hand-off overlay appears while switching modes
 *  - the stage animates through the Web Animations API
 *
 * Run with:
 *   npm i --no-save --prefix /tmp/dmtest jsdom
 *   NODE_PATH=/tmp/dmtest/node_modules node scripts/check-motion-dom.mjs
 */
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dm-motion-'));

const { JSDOM } = require('jsdom');

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
});

const { window } = dom;
global.window = window;
global.document = window.document;
Object.defineProperty(global, 'navigator', { value: window.navigator, configurable: true });
global.HTMLElement = window.HTMLElement;
global.Element = window.Element;
global.Event = window.Event;
global.MouseEvent = window.MouseEvent;
global.getComputedStyle = window.getComputedStyle.bind(window);
global.requestAnimationFrame = window.requestAnimationFrame.bind(window);
global.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
window.ResizeObserver = global.ResizeObserver;
global.DOMMatrix = window.DOMMatrix;
global.IS_REACT_ACT_ENVIRONMENT = true;

// Record every Web Animations call so we can inspect the keyframes.
const animations = [];
window.Element.prototype.animate = function (keyframes, options) {
  animations.push({ el: this, keyframes, options });
  return {
    cancel() {},
    finished: Promise.resolve(),
    onfinish: null,
  };
};

// Give every element a real-ish box so the layout maths has something to work with.
window.Element.prototype.getBoundingClientRect = function () {
  const cls = String(this.className || '');
  let left = 0;
  let width = 800;
  if (cls.includes('dm-mode-switch__btn')) {
    width = 70;
    const parent = this.parentElement;
    const index = parent ? Array.from(parent.children).indexOf(this) : 0;
    left = index * 72; // the second segment sits further to the right
  }
  const height = 40;
  return { x: left, y: 0, top: 0, left, right: left + width, bottom: height, width, height, toJSON() {} };
};

const result = await build({
  entryPoints: [path.join(root, 'src/App.tsx')],
  bundle: true,
  format: 'cjs',
  write: false,
  platform: 'browser',
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"development"' },
  loader: { '.ts': 'ts', '.tsx': 'tsx', '.css': 'empty' },
  alias: { '@': path.join(root, 'src') },
  external: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime'],
});
fs.writeFileSync(path.join(outDir, 'app.cjs'), result.outputFiles[0].text);

const React = require('react');
const ReactDOM = require('react-dom/client');
const { act } = require('react-dom/test-utils');

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(require(path.join(outDir, 'app.cjs')).default));

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fail = [];
const check = (cond, msg) => {
  if (!cond) { fail.push(msg); console.log('  ✗ ' + msg); }
  else console.log('  ✓ ' + msg);
};

await act(async () => { await sleep(60); });

const doc = document;
const q = (sel) => doc.querySelector(sel);
const qa = (sel) => Array.from(doc.querySelectorAll(sel));

console.log('--- app rendered ---');
check(!!q('.dm-stage'), 'workspace stage is mounted');
check(qa('.dm-mode-switch__btn').length === 2, 'mode switch has two segments');
check(!!q('.dm-mode-pill'), 'sliding pill is rendered');

console.log('\n--- button ripple ---');
const firstTool = qa('.dm-mode-switch__btn')[0];
const rect = firstTool.getBoundingClientRect();
firstTool.dispatchEvent(new window.PointerEvent('pointerdown', {
  bubbles: true, clientX: rect.left + 10, clientY: rect.top + 10, button: 0, pointerType: 'mouse',
}));
let ripple = firstTool.querySelector('.dm-ripple');
check(!!ripple, 'pointer press spawns a ripple inside the button');
if (ripple) {
  check(ripple.style.width !== '' && parseFloat(ripple.style.width) > 0, 'ripple is sized');
  check(ripple.getAttribute('aria-hidden') === 'true', 'ripple is hidden from a11y tree');
}
check(firstTool.classList.contains('dm-btn'), 'button is marked as a ripple host');

console.log('\n--- keyboard activation ripples from the centre ---');
const themeBtn = qa('button').find(b => (b.getAttribute('title') || '').startsWith('Theme'));
themeBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true, detail: 0 }));
const keyboardRipple = themeBtn.querySelector('.dm-ripple');
check(!!keyboardRipple, 'keyboard activation also ripples');
if (keyboardRipple) {
  const left = parseFloat(keyboardRipple.style.left);
  const size = parseFloat(keyboardRipple.style.width);
  check(Math.abs(left + size / 2 - 400) < 1, 'keyboard ripple starts at the button centre');
}

console.log('\n--- mode switch pill moves ---');
const pill = q('.dm-mode-pill');
const before = pill.style.transform;
const matrixBtn = qa('.dm-mode-switch__btn')[1];
await act(async () => {
  matrixBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await sleep(30);
});
// The mode only flips once the exit animation finished, so the pill starts
// travelling a little later.
await act(async () => { await sleep(400); });
const after = pill.style.transform;
check(before !== after, `pill transform changed (${before} → ${after})`);
check(qa('.dm-mode-switch__btn')[1].getAttribute('aria-pressed') === 'true', 'matrix segment is pressed');

console.log('\n--- hand-off animation + overlay ---');
check(animations.length > 0, 'stage animation was started');
const last = animations[animations.length - 1];
check(last.el.classList.contains('dm-stage'), 'animation targets the stage element');
check(Array.isArray(last.keyframes) && last.keyframes.length === 2, 'animation has from/to keyframes');
const overlay = q('.dm-overlay');
check(!!overlay, 'transition overlay is mounted during the hand-off');
check(overlay && overlay.getAttribute('data-direction') === 'forward', 'overlay points at the target mode');
const badge = q('.dm-overlay__badge');
check(!!badge && badge.textContent.includes('Matrix Mode'), 'overlay badge names the incoming mode');
const sweep = q('.dm-overlay__sweep');
check(!!sweep, 'overlay contains the light sweep');

console.log('\n--- the new workspace is mounted after the exit animation ---');
await act(async () => { await sleep(760); });
check(!q('.dm-overlay'), 'overlay is gone once the hand-off completes');
const stageChildren = q('.dm-stage').children.length;
check(stageChildren > 0, 'matrix workspace is mounted inside the stage');

console.log('\n--- switching back ---');
animations.length = 0;
const drawBtn = qa('.dm-mode-switch__btn')[0];
await act(async () => {
  drawBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await sleep(30);
});
check(animations.length > 0, 'switching back animates the stage again');
const backOverlay = q('.dm-overlay');
check(backOverlay && backOverlay.getAttribute('data-direction') === 'backward', 'overlay reverses direction');

console.log('\n' + (fail.length === 0 ? '✅ all checks passed' : `❌ ${fail.length} check(s) failed`));
process.exit(fail.length === 0 ? 0 : 1);
