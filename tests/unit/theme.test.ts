import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { THEME_KEY, THEME_PREFS, THEME_SCRIPT, applyTheme, isLight, readThemePref, saveThemePref, watchSystemTheme } from '@/lib/theme';

let systemLight = false;
let listeners: (() => void)[] = [];
beforeEach(() => {
  systemLight = false;
  listeners = [];
  vi.stubGlobal('matchMedia', () => ({
    get matches() { return systemLight; },
    addEventListener: (_: string, fn: () => void) => listeners.push(fn),
    removeEventListener: (_: string, fn: () => void) => { listeners = listeners.filter(l => l !== fn); },
  }));
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});
afterEach(() => vi.unstubAllGlobals());

const theme = () => document.documentElement.dataset.theme;

describe('theme preference', () => {
  it('defaults to dark, the original look, when nothing (or junk) is stored', () => {
    expect(readThemePref()).toBe('dark');
    localStorage.setItem(THEME_KEY, 'purple');
    expect(readThemePref()).toBe('dark');
  });

  it('falls back to dark when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => { throw new Error('denied'); });
    expect(readThemePref()).toBe('dark');
  });

  it('saving applies it at once and survives a reload', () => {
    saveThemePref('light');
    expect(theme()).toBe('light');
    expect(readThemePref()).toBe('light');
    saveThemePref('dark');
    expect(theme()).toBeUndefined();
  });

  it('auto follows the phone, including a switch while the app is open', () => {
    saveThemePref('auto');
    expect(theme()).toBeUndefined();
    const stop = watchSystemTheme();
    systemLight = true;
    listeners.forEach(l => l());
    expect(theme()).toBe('light');
    stop();
    expect(listeners).toHaveLength(0);
  });

  it('the pre-paint <head> script picks the same theme as the app for every case', () => {
    for (const pref of THEME_PREFS) {
      for (const sys of [false, true]) {
        systemLight = sys;
        localStorage.setItem(THEME_KEY, pref);
        delete document.documentElement.dataset.theme;
        new Function(THEME_SCRIPT)();
        expect(theme() === 'light', `${pref}, system light=${sys}`).toBe(isLight(pref));
        applyTheme(pref);
        expect(theme() === 'light').toBe(isLight(pref));
      }
    }
  });
});

// Guards that keep light mode readable as the UI grows.
const root = join(__dirname, '../..');
const sources = (dir: string): string[] =>
  readdirSync(join(root, dir)).flatMap(name => {
    const path = join(dir, name);
    return statSync(join(root, path)).isDirectory() ? sources(path) : /\.tsx?$/.test(name) ? [path] : [];
  });
const ui = [...sources('app'), ...sources('components')].map(f => [f, readFileSync(join(root, f), 'utf8')] as const);
const css = readFileSync(join(root, 'app/globals.css'), 'utf8');
const lightBlock = css.slice(css.indexOf(':root[data-theme="light"]'));
const lightVars = new Set(lightBlock.slice(0, lightBlock.indexOf('}')).match(/--color-[\w-]+(?=:)/g));

describe('colour tokens', () => {
  it('no hard-coded [#hex] colour classes: they would not change in light mode', () => {
    const offenders = ui.flatMap(([f, src]) => (src.match(/-\[#[0-9a-fA-F]{3,8}\]/g) ?? []).map(m => `${f}: ${m}`));
    expect(offenders).toEqual([]);
  });

  it('every theme token has a light value (on-fill is white on purpose)', () => {
    const tokens = css.slice(css.indexOf('@theme'), css.indexOf('}')).match(/--color-[\w-]+(?=:)/g)!;
    expect(tokens.filter(t => t !== '--color-on-fill' && !lightVars.has(t))).toEqual([]);
  });

  it('every bright accent shade in use (100-500) has a darker light-mode value', () => {
    const used = new Set(ui.flatMap(([, src]) =>
      [...src.matchAll(/-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-([1-5]00)\b/g)]
        .map(m => `--color-${m[1]}-${m[2]}`)));
    expect([...used].filter(v => !lightVars.has(v))).toEqual([]);
  });
});
