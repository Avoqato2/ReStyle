export type CallbackFlow = 'signup' | 'recovery' | 'google';

export interface CallbackError {
  // `error` aus der URL, z. B. `access_denied`
  name: string;
  // `error_code`, z. B. `otp_expired`
  code?: string;
  description?: string;
}

export interface ParsedCallback {
  flow: CallbackFlow;
  code?: string;
  error?: CallbackError;
}

const FLOWS: readonly CallbackFlow[] = ['signup', 'recovery', 'google'];

// Zerlegt `restyle://auth/callback?flow=…&code=…` bzw. die Web-Variante
// `http(s)://…/auth/callback?…`. Fehler hängt Supabase je nach Flow an die Query
// oder das Fragment an, deshalb werden beide gelesen.
// Liefert `null`, wenn die URL kein Auth-Callback ist oder `flow` fehlt.
export function parseCallbackUrl(url: string): ParsedCallback | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (!`${parsed.host}${parsed.pathname}`.replace(/\/+$/, '').endsWith('auth/callback')) {
    return null;
  }

  const query = parsed.searchParams;
  const fragment = new URLSearchParams(parsed.hash.replace(/^#/, ''));
  const param = (key: string): string | undefined => query.get(key) ?? fragment.get(key) ?? undefined;

  const flow = param('flow');
  if (!isFlow(flow)) {
    return null;
  }

  const result: ParsedCallback = { flow };

  const errorName = param('error') ?? param('error_code');
  if (errorName) {
    result.error = { name: errorName };
    const errorCode = param('error_code');
    const description = param('error_description');
    if (errorCode) result.error.code = errorCode;
    if (description) result.error.description = description;
    return result;
  }

  const code = param('code');
  if (code) {
    result.code = code;
  }

  return result;
}

function isFlow(value: string | undefined): value is CallbackFlow {
  return FLOWS.includes(value as CallbackFlow);
}
