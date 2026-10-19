// Which colour theme is on. The colours themselves live in app/globals.css: light mode is the
// `:root[data-theme="light"]` block, dark mode is everything else, so dark is also the fallback
// whenever storage or scripts fail.

export type ThemePref = 'auto' | 'light' | 'dark';
export const THEME_PREFS: ThemePref[] = ['auto', 'light', 'dark'];
export const THEME_KEY = 'apex-theme';
const LIGHT_QUERY = '(prefers-color-scheme: light)';
const BAR = { light: '#f2f2f7', dark: '#000000' }; // browser toolbar; matches --color-black

// Dark is the default so nothing changes for anyone who never opens the setting.
export function readThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === 'auto' || v === 'light' ? v : 'dark';
  } catch {
    return 'dark';
  }
}

export function isLight(pref: ThemePref) {
  return pref === 'light' || (pref === 'auto' && typeof matchMedia === 'function' && matchMedia(LIGHT_QUERY).matches);
}

export function applyTheme(pref: ThemePref) {
  const light = isLight(pref);
  if (light) document.documentElement.dataset.theme = 'light';
  else delete document.documentElement.dataset.theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', light ? BAR.light : BAR.dark);
}

export function saveThemePref(pref: ThemePref) {
  try {
    localStorage.setItem(THEME_KEY, pref);
  } catch {} // private mode: the choice still applies until reload
  applyTheme(pref);
}

// Re-applies the saved choice when the phone switches between light and dark (matters for 'auto').
export function watchSystemTheme() {
  if (typeof matchMedia !== 'function') return () => {};
  const query = matchMedia(LIGHT_QUERY);
  const sync = () => applyTheme(readThemePref());
  query.addEventListener('change', sync);
  return () => query.removeEventListener('change', sync);
}

// Inlined in <head> so the page paints in the right theme; React only takes over after hydration.
// Same rule as isLight(); tests/unit/theme.test.ts checks they agree.
export const THEME_SCRIPT = `try{var p=localStorage.getItem('${THEME_KEY}');if(p==='light'||(p==='auto'&&matchMedia('${LIGHT_QUERY}').matches))document.documentElement.dataset.theme='light'}catch(e){}`;
