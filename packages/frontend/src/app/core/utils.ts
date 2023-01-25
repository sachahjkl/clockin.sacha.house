export function parseJWT(token: string) {
  const payload = JSON.parse(window.atob(token.split('.')[1]));

  return payload as { exp: number };
}
