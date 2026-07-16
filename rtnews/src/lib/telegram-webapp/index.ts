/**
 * Telegram Web App Detection and Integration
 *
 * Detects when the app is running inside Telegram's in-app browser
 * (Telegram Mini App / Web App) and provides utilities for:
 * - Theme integration (matching Telegram's color scheme)
 * - User data extraction (Telegram user ID, name)
 * - WebApp SDK methods (ready, expand, close, etc.)
 */

// ─── Type Definitions ─────────────────────────────────────────

export interface TelegramThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
  header_bg_color?: string;
  subtitle_text_color?: string;
  destructive_text_color?: string;
  accent_text_color?: string;
  section_bg_color?: string;
  section_header_text_color?: string;
  section_separator_color?: string;
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface TelegramWebAppInstance {
  ready: () => void;
  expand: () => void;
  close: () => void;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    show: () => void;
    hide: () => void;
    onClick: (fn: () => void) => void;
    setText: (text: string) => void;
  };
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (fn: () => void) => void;
  };
  themeParams: TelegramThemeParams;
  colorScheme: 'light' | 'dark';
  initData?: string;
  initDataUnsafe?: {
    user?: TelegramUser;
    chat?: { id: number; type: string };
    start_param?: string;
  };
  version: string;
  platform: string;
  headerColor: string;
  backgroundColor: string;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebAppInstance;
    };
  }
}

// ─── Detection ────────────────────────────────────────────────

/**
 * Check if the app is running inside Telegram's in-app browser.
 * Uses multiple detection methods for reliability:
 * 1. window.Telegram.WebApp SDK presence (most reliable)
 * 2. User-Agent string check
 * 3. URL parameter check (tgWebAppData)
 */
export function isTelegramWebApp(): boolean {
  if (typeof window === 'undefined') return false;

  // Method 1: Telegram WebApp SDK
  if (window.Telegram?.WebApp) return true;

  // Method 2: User-Agent check
  if (/Telegram/i.test(navigator.userAgent)) return true;

  // Method 3: URL parameter (Telegram passes initData via hash)
  if (window.location.hash.includes('tgWebAppData')) return true;

  return false;
}

/**
 * Get the Telegram WebApp instance if available.
 * Returns null if not running inside Telegram.
 */
export function getTelegramWebApp(): TelegramWebAppInstance | null {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp || null;
}

/**
 * Get the Telegram user data if available.
 * Returns null if not in Telegram or user data not available.
 */
export function getTelegramUser(): TelegramUser | null {
  const webApp = getTelegramWebApp();
  return webApp?.initDataUnsafe?.user || null;
}

/**
 * Get the start parameter passed from Telegram.
 * This can be used to deep-link to specific content.
 * e.g., t.me/Rouatradingnews_bot/app?startapp=report_abc123
 */
export function getTelegramStartParam(): string | null {
  const webApp = getTelegramWebApp();
  return webApp?.initDataUnsafe?.start_param || null;
}

// ─── Theme Integration ────────────────────────────────────────

/**
 * Telegram theme to CSS custom properties mapping.
 * Maps Telegram WebApp theme params to our CSS variables.
 */
const THEME_MAP: Record<string, string> = {
  bg_color: '--bg',
  text_color: '--text-head',
  hint_color: '--text3',
  link_color: '--cyan',
  button_color: '--accent',
  button_text_color: '--btn-text',
  secondary_bg_color: '--bg3',
  header_bg_color: '--header-bg',
  subtitle_text_color: '--text2',
  destructive_text_color: '--bear',
  accent_text_color: '--bull',
  section_bg_color: '--card',
  section_header_text_color: '--text2',
  section_separator_color: '--border',
};

/**
 * Apply Telegram's theme colors as CSS custom properties.
 * Falls back to default dark theme if not in Telegram.
 */
export function applyTelegramTheme(): void {
  const webApp = getTelegramWebApp();
  if (!webApp) return;

  const root = document.documentElement;
  const params = webApp.themeParams;

  for (const [tgKey, cssVar] of Object.entries(THEME_MAP)) {
    const value = params[tgKey as keyof TelegramThemeParams];
    if (value) {
      root.style.setProperty(cssVar, value);
    }
  }

  // Set Telegram-specific CSS variables
  root.style.setProperty('--tg-color-scheme', webApp.colorScheme);
  root.classList.toggle('tg-light', webApp.colorScheme === 'light');
  root.classList.toggle('tg-dark', webApp.colorScheme === 'dark');
}

/**
 * Initialize the Telegram WebApp SDK.
 * Must be called once when the app loads inside Telegram.
 * - Calls WebApp.ready() to signal the app is loaded
 * - Calls WebApp.expand() to use full height
 * - Applies Telegram theme
 * - Sets up BackButton if needed
 */
export function initTelegramWebApp(): void {
  const webApp = getTelegramWebApp();
  if (!webApp) return;

  // Signal that the app is ready
  try {
    webApp.ready();
  } catch (e) {
    console.warn('[TG WebApp] ready() failed:', e);
  }

  // Expand to full height
  try {
    webApp.expand();
  } catch (e) {
    console.warn('[TG WebApp] expand() failed:', e);
  }

  // Apply theme
  applyTelegramTheme();

  // Mark body as Telegram context
  document.body.classList.add('tg-webapp');

  console.log('[TG WebApp] Initialized', {
    version: webApp.version,
    platform: webApp.platform,
    colorScheme: webApp.colorScheme,
    user: webApp.initDataUnsafe?.user?.first_name || 'unknown',
  });
}

/**
 * Get CSS classes for Telegram-specific styling.
 * Returns an object with active classes based on context.
 */
export function getTelegramClasses(): {
  isTelegram: boolean;
  bodyClass: string;
  containerClass: string;
} {
  const isTg = isTelegramWebApp();
  return {
    isTelegram: isTg,
    bodyClass: isTg ? 'tg-webapp' : '',
    containerClass: isTg ? 'tg-container' : '',
  };
}
