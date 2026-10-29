# Contract: AuthService

Öffentliche API von `frontend/src/app/supabase/services/auth.service.ts`. Screens bauen nur gegen
diesen Contract und importieren nie direkt `supabase-js`. Änderungen am Contract nur per Spec-PR.

```ts
@Injectable({ providedIn: 'root' })
export class AuthService { /* siehe unten */ }
```

## Typen

```ts
export type AuthStatus = 'initializing' | 'authenticated' | 'unauthenticated';

export type SignOutReason = 'user' | 'expired';

export type AuthErrorCode =
  | 'invalid_credentials'   // falsche Daten ODER unbekannte E-Mail (bewusst nicht unterscheidbar)
  | 'email_not_confirmed'   // Login vor Bestätigung → „Mail erneut senden“ anbieten
  | 'weak_password'         // Server lehnt Passwort ab (Regeln siehe isPasswordValid)
  | 'rate_limited'          // zu früh erneut gesendet → signupResend bzw. recoveryResend beachten
  | 'network'               // keine Verbindung / Timeout
  | 'oauth_failed'          // Google-Anmeldung aus anderem Grund als Abbruch fehlgeschlagen
  | 'unknown';

export interface AuthError {
  code: AuthErrorCode;
  message: string;          // fertige deutsche Meldung für die UI
}

export type AuthResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: AuthError };

export interface AuthUser {
  id: string;
  email: string;
}

export type AuthCallbackEvent =
  | { type: 'email_confirmed' }                  // Bestätigt + eingeloggt → Garderobe
  | { type: 'email_confirmed_login_required' }   // Bestätigt, aber anderes Gerät → Login mit Hinweis
  | { type: 'password_recovery' }                // → /auth/reset-password
  | { type: 'oauth_signed_in' }                  // Google erfolgreich → Garderobe
  | { type: 'oauth_failed'; error: AuthError }   // → Login mit Fehlermeldung
  | { type: 'link_invalid'; flow: 'signup' | 'recovery' };
      // signup:   „Link ungültig oder E-Mail bereits bestätigt“ + Einloggen / Neue Mail
      // recovery: „Link ungültig oder abgelaufen“ + Neuen Link anfordern
```

## Signals (readonly)

| Signal | Typ | Beschreibung |
|---|---|---|
| `status` | `Signal<AuthStatus>` | Startet mit `initializing` |
| `user` | `Signal<AuthUser \| null>` | Eingeloggter User |
| `isAuthenticated` | `Signal<boolean>` | `status() === 'authenticated'` |
| `signOutReason` | `Signal<SignOutReason \| null>` | Login zeigt bei `'expired'` „Sitzung abgelaufen, bitte erneut einloggen“; wird bei nächstem Login zurückgesetzt |
| `signupResend` | `Signal<{ email: string; availableAt: Date } \| null>` | Countdown für die Bestätigungsmail zur angegebenen Adresse |
| `recoveryResend` | `Signal<{ email: string; availableAt: Date } \| null>` | Countdown für den Reset-Link zur angegebenen Adresse |

Die UI verwendet einen Countdown nur, wenn die Adresse im jeweiligen Signal
mit der aktuell angezeigten Adresse übereinstimmt. Der Service und die UI
verwenden dafür dieselbe E-Mail-Normalisierung. Ohne passenden Eintrag zeigt
die UI keinen Countdown an. Die serverseitige Versandbegrenzung bleibt maßgeblich.

## Methoden

Methoden mit dem Rückgabetyp `Promise<AuthResult<T>>` liefern ihr Ergebnis
als `AuthResult<T>`. Fehler werden über dessen Fehlerfall zurückgegeben.

Davon ausgenommen sind:
- `signOut(): Promise<void>`
- `registerSignOutCleanup(...): void`
- `handleCallbackUrl(...): Promise<AuthCallbackEvent>`

Für diese Methoden gelten die jeweils dokumentierten Rückgabeformen.

Ladezustand und Formularsperre verwaltet der Screen
(`await` der Methode, FR-009b). Mehrfachaufrufe derselben asynchronen Methode
während eines laufenden Aufrufs geben dasselbe Promise zurück.

| Methode | Erfolg | Mögliche Fehler | Hinweis |
|---|---|---|---|
| `signUp(email, password): Promise<AuthResult>` | → `/auth/check-email` | `weak_password`, `rate_limited`, `network`, `unknown` | Auch bei bereits registrierter E-Mail `ok: true` (FR-006) |
| `signIn(email, password): Promise<AuthResult>` | Sitzung aktiv → Garderobe | `invalid_credentials`, `email_not_confirmed`, `network`, `unknown` | |
| `signInWithGoogle(): Promise<AuthResult<'signed_in' \| 'cancelled'>>` | `'signed_in'` → Garderobe; `'cancelled'` → im Login bleiben, keine Meldung | `oauth_failed`, `network` | Öffnet In-App-Browser; resolved erst nach Callback oder Schließen |
| `resendConfirmation(email): Promise<AuthResult>` | Hinweis „Mail gesendet“ | `rate_limited`, `network` | Setzt `signupResend` mit Adresse und frühestem Sendezeitpunkt bei Erfolg und bei `rate_limited`; verändert `recoveryResend` nicht |
| `requestPasswordReset(email): Promise<AuthResult>` | Neutrale Bestätigung (FR-011) | `rate_limited`, `network` | Immer `ok: true` bei unbekannter E-Mail; setzt `recoveryResend` mit Adresse und frühestem Sendezeitpunkt bei Erfolg und bei `rate_limited`; verändert `signupResend` nicht |
| `requestPasswordReset(email): Promise<AuthResult>` | Neutrale Bestätigung (FR-011) | `rate_limited`, `network` | Immer `ok: true` bei unbekannter E-Mail |
| `updatePassword(newPassword): Promise<AuthResult>` | Eingeloggt → Garderobe | `weak_password`, `network`, `unknown` | Nur nach `password_recovery`; meldet andere Geräte ab |
| `registerSignOutCleanup(fn: () => void \| Promise<void>): void` | – | – | Für Features mit lokalen Daten (F01-Cache) |

## Callback-Events

| Member | Typ | Beschreibung |
|---|---|---|
| `callbackEvents` | `Observable<AuthCallbackEvent>` | Ein Event pro eingelöstem Link/Google-Redirect. Navigation übernimmt die App-Shell (`AppComponent`), Screens zeigen nur Hinweise. |
| `handleCallbackUrl(url: string): Promise<AuthCallbackEvent>` | | Intern vom `appUrlOpen`-Listener und der Web-Route `/auth/callback` genutzt; öffentlich für Tests |

### Navigation nach Callback-Events (AppComponent)

| Event | Ziel | Screen zeigt |
|---|---|---|
| `email_confirmed` | `/home` | – |
| `email_confirmed_login_required` | `/auth/login?hint=confirmed` | „E-Mail bestätigt, bitte einloggen“ |
| `password_recovery` | `/auth/reset-password` | – |
| `oauth_signed_in` | `/home` | – |
| `oauth_failed` | `/auth/login` | Deutsche Fehlermeldung aus `event.error.message` |
| `link_invalid` (`signup`) | `/auth/login?hint=link_invalid` | „Link ungültig oder E-Mail bereits bestätigt“ + Neue Mail anfordern |
| `link_invalid` (`recovery`) | `/auth/forgot-password?hint=link_invalid` | „Link ungültig oder abgelaufen“ |

Sitzungsablauf: Login mit `signOutReason() === 'expired'` zeigt „Sitzung abgelaufen, bitte erneut
einloggen“.

## Hilfsfunktionen (`frontend/src/app/auth/password-rules.ts`)

```ts
export interface PasswordRuleState { minLength: boolean; hasLetter: boolean; hasDigit: boolean; }
export function checkPasswordRules(password: string): PasswordRuleState;
export function isPasswordValid(password: string): boolean;
```

## Guards (`frontend/src/app/auth/guards.ts`)

| Guard | Verhalten |
|---|---|
| `authGuard` | Wartet, bis `status !== 'initializing'`; ohne Sitzung → `/auth/login` |
| `guestGuard` | Für `/auth/*` außer `reset-password` und `callback`; mit Sitzung → Garderobe |

## Routen

| Pfad | Screen | Guard |
|---|---|---|
| `/auth/login` | Login, Google-Button, Links zu Registrierung/Passwort vergessen | `guestGuard` |
| `/auth/register` | Registrierung mit Live-Passwortregeln | `guestGuard` |
| `/auth/check-email` | „Bestätigungsmail unterwegs“, erneut senden mit Countdown | `guestGuard` |
| `/auth/forgot-password` | E-Mail eingeben, neutrale Bestätigung | `guestGuard` |
| `/auth/reset-password` | Neues Passwort festlegen | nur nach `password_recovery` |
| `/auth/callback` | Nur Web: ruft `handleCallbackUrl` auf | – |
| alle anderen | App | `authGuard` |
