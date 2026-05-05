interface TokenPayload {
  sub?: string;
  [key: string]: unknown;
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  return atob(padded);
}

export function parseJwtPayload(token: string): TokenPayload | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    return JSON.parse(decodeBase64Url(payload)) as TokenPayload;
  } catch {
    return null;
  }
}

export async function getUserIdFromTokenGetter(
  getToken?: () => Promise<string | null>
): Promise<string | null> {
  const token = await getToken?.();
  if (!token) return null;
  return parseJwtPayload(token)?.sub ?? null;
}
