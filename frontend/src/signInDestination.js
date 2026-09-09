export function signInDestination(from) {
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') && !from.startsWith('/login')
    ? from
    : '/employment-dashboard';
}
