'use client';

import { useEffect, useState } from 'react';
import {
  isTelegramWebApp,
  getTelegramWebApp,
  getTelegramUser,
  getTelegramStartParam,
  initTelegramWebApp,
  applyTelegramTheme,
  type TelegramUser,
  type TelegramWebAppInstance,
} from '@/lib/telegram-webapp';

/**
 * React hook for Telegram Web App integration.
 *
 * Usage:
 * ```tsx
 * const { isTelegram, user, webApp, startParam } = useTelegramWebApp();
 * ```
 */
export function useTelegramWebApp() {
  const [isTelegram, setIsTelegram] = useState(false);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [webApp, setWebApp] = useState<TelegramWebAppInstance | null>(null);
  const [startParam, setStartParam] = useState<string | null>(null);

  useEffect(() => {
    const tg = isTelegramWebApp();
    setIsTelegram(tg);

    if (tg) {
      // Initialize the WebApp SDK
      initTelegramWebApp();

      // Get user data
      setUser(getTelegramUser());

      // Get WebApp instance
      setWebApp(getTelegramWebApp());

      // Get start parameter (for deep-linking)
      setStartParam(getTelegramStartParam());

      // Re-apply theme when Telegram changes it (e.g., dark/light toggle)
      const interval = setInterval(() => {
        applyTelegramTheme();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, []);

  return {
    isTelegram,
    user,
    webApp,
    startParam,
    /** Navigate back in Telegram (uses BackButton or closes) */
    goBack: () => {
      if (typeof window !== 'undefined' && window.history.length > 1) {
        window.history.back();
      } else {
        webApp?.close();
      }
    },
    /** Show the Telegram MainButton */
    showMainButton: (text: string, onClick: () => void) => {
      if (!webApp) return;
      webApp.MainButton.setText(text);
      webApp.MainButton.onClick(onClick);
      webApp.MainButton.show();
    },
    /** Hide the Telegram MainButton */
    hideMainButton: () => {
      webApp?.MainButton.hide();
    },
  };
}
