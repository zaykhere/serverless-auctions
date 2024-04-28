export function isValidBase64(str) {
  const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$/;
  const parts = str.split(',');
  if (parts.length !== 2 || !parts[0].startsWith('data:')) {
    return false;
  }
  return base64Regex.test(parts[1]);
}