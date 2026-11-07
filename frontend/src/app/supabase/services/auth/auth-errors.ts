import { isAuthError, isAuthRetryableFetchError, isAuthWeakPasswordError } from '@supabase/supabase-js';

export type AuthErrorCode =
  | 'invalid_credentials' // falsche Daten ODER unbekannte E-Mail (bewusst nicht unterscheidbar)
  | 'email_not_confirmed' // Login vor Bestätigung → „Mail erneut senden“ anbieten
  | 'weak_password' // Server lehnt Passwort ab (Regeln siehe isPasswordValid)
  | 'rate_limited' // zu früh erneut gesendet → signupResend bzw. recoveryResend beachten
  | 'network' // keine Verbindung / Timeout
  | 'oauth_failed' // Google-Anmeldung aus anderem Grund als Abbruch fehlgeschlagen
  | 'unknown';

export interface AuthError {
  code: AuthErrorCode;
  message: string; // fertige deutsche Meldung für die UI
}

export type AuthResult<T = void> = { ok: true; data: T } | { ok: false; error: AuthError };

export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  invalid_credentials: 'E-Mail oder Passwort ist falsch.',
  email_not_confirmed: 'Bitte bestätige zuerst deine E-Mail-Adresse.',
  weak_password: 'Das Passwort muss mindestens 8 Zeichen, einen Buchstaben und eine Ziffer enthalten.',
  rate_limited: 'Bitte warte kurz, bevor du es erneut versuchst.',
  network: 'Keine Verbindung. Bitte prüfe deine Internetverbindung.',
  oauth_failed: 'Die Anmeldung mit Google ist fehlgeschlagen. Bitte versuche es erneut.',
  unknown: 'Das hat nicht geklappt. Bitte versuche es erneut.',
};

export function authError(code: AuthErrorCode): AuthError {
  return { code, message: AUTH_ERROR_MESSAGES[code] };
}

// Ordnet Fehler von supabase-js (und Netzwerkfehler von fetch) den Contract-Codes zu.
export function mapAuthError(error: unknown): AuthError {
  if (isNetworkError(error)) {
    return authError('network');
  }

  if (isAuthWeakPasswordError(error)) {
    return authError('weak_password');
  }

  if (isAuthError(error)) {
    switch (error.code) {
      case 'invalid_credentials':
        return authError('invalid_credentials');
      case 'email_not_confirmed':
        return authError('email_not_confirmed');
      case 'weak_password':
        return authError('weak_password');
      case 'over_email_send_rate_limit':
      case 'over_request_rate_limit':
        return authError('rate_limited');
      case 'request_timeout':
        return authError('network');
    }
  }

  return authError('unknown');
}

function isNetworkError(error: unknown): boolean {
  if (isAuthRetryableFetchError(error)) {
    return true;
  }

  // fetch wirft ohne Verbindung einen TypeError („Failed to fetch“ / „Load failed“).
  return error instanceof TypeError;
}
