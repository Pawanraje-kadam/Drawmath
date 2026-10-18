/**
 * Sanity check for the Draw ↔ Matrix hand-off state machine.
 * Run with: node scripts/check-mode-transition.mjs
 */
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import path from 'node:path';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const result = await build({
  entryPoints: [path.join(root, 'src/store/useStore.ts')],
  bundle: true,
  format: 'cjs',
  write: false,
  platform: 'node',
  define: { 'process.env.NODE_ENV': '"development"' },
  loader: { '.ts': 'ts' },
});
const code = result.outputFiles[0].text;

// Minimal browser-ish globals the store touches at import time.
const store = {};
const sandbox = {
  module: { exports: store },
  exports: store,
  require,
  console,
  setTimeout,
  clearTimeout,
  window: { innerWidth: 1280, addEventListener() {}, removeEventListener() {} },
  localStorage: {
    store: {},
    getItem(k) { return this.store[k] ?? null; },
    setItem(k, v) { this.store[k] = String(v); },
    removeItem(k) { delete this.store[k]; },
  },
  document: { documentElement: { setAttribute() {} } },
  performance: { now: () => Date.now() },
  requestAnimationFrame: (cb) => setTimeout(() => cb(Date.now()), 16),
  cancelAnimationFrame: (id) => clearTimeout(id),
};
sandbox.globalThis = sandbox;
sandbox.self = sandbox;
vm.createContext(sandbox);
vm.runInContext(code, sandbox);

const { useStore, MODE_TRANSITION_OUT_MS, MODE_TRANSITION_IN_MS } = sandbox.module.exports;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const snap = (label) => {
  const s = useStore.getState();
  console.log(
    `${label.padEnd(34)} appMode=${s.appMode.padEnd(6)} phase=${s.modeTransition.padEnd(9)} target=${s.transitionTarget}`
  );
};

const fail = [];
const check = (cond, msg) => { if (!cond) { fail.push(msg); console.log('  ✗ ' + msg); } else { console.log('  ✓ ' + msg); } };

(async () => {
  console.log('--- initial state ---');
  snap('start');
  check(useStore.getState().appMode === 'draw', 'starts in draw mode');
  check(useStore.getState().modeTransition === 'idle', 'starts idle');

  console.log('\n--- switch to matrix ---');
  useStore.getState().setAppMode('matrix');
  snap('immediately after setAppMode');
  check(useStore.getState().appMode === 'draw', 'still renders draw while leaving');
  check(useStore.getState().modeTransition === 'leaving', 'phase = leaving');
  check(useStore.getState().transitionTarget === 'matrix', 'target = matrix');

  await sleep(MODE_TRANSITION_OUT_MS + 40);
  snap('after exit animation');
  check(useStore.getState().appMode === 'matrix', 'swapped to matrix');
  check(useStore.getState().modeTransition === 'entering', 'phase = entering');

  await sleep(MODE_TRANSITION_IN_MS + 60);
  snap('after entrance animation');
  check(useStore.getState().modeTransition === 'idle', 'phase back to idle');
  check(useStore.getState().transitionTarget === null, 'target cleared');

  console.log('\n--- switch back to draw ---');
  useStore.getState().setAppMode('draw');
  await sleep(MODE_TRANSITION_OUT_MS + MODE_TRANSITION_IN_MS + 80);
  snap('after full round trip');
  check(useStore.getState().appMode === 'draw', 'back in draw mode');
  check(useStore.getState().modeTransition === 'idle', 'idle again');

  console.log('\n--- re-click the same mode (no-op) ---');
  useStore.getState().setAppMode('draw');
  snap('after redundant setAppMode(draw)');
  check(useStore.getState().modeTransition === 'idle', 'stays idle');

  console.log('\n--- cancel a pending hand-off by clicking the current mode ---');
  useStore.getState().setAppMode('matrix');
  snap('asked for matrix');
  useStore.getState().setAppMode('draw');
  snap('asked for draw again');
  check(useStore.getState().modeTransition === 'idle', 'transition cancelled');
  check(useStore.getState().transitionTarget === null, 'target cleared');
  await sleep(MODE_TRANSITION_OUT_MS + MODE_TRANSITION_IN_MS + 80);
  check(useStore.getState().appMode === 'draw', 'stayed in draw mode');

  console.log('\n--- interrupt mid-flight (matrix → draw while entering) ---');
  useStore.getState().setAppMode('matrix');
  await sleep(MODE_TRANSITION_OUT_MS + 30);
  snap('entering matrix');
  useStore.getState().setAppMode('draw');
  snap('asked for draw mid-flight');
  check(useStore.getState().modeTransition === 'leaving', 're-targeted to leaving');
  await sleep(MODE_TRANSITION_OUT_MS + MODE_TRANSITION_IN_MS + 80);
  snap('settled');
  check(useStore.getState().appMode === 'draw', 'ended in draw mode');
  check(useStore.getState().modeTransition === 'idle', 'idle again');

  console.log('\n' + (fail.length === 0 ? '✅ all checks passed' : `❌ ${fail.length} check(s) failed`));
  process.exit(fail.length === 0 ? 0 : 1);
})();
