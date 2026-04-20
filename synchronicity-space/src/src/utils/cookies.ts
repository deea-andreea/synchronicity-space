export const setCookie = (name: string, value: string, days = 7) => {
  const maxAge = days * 24 * 60 * 60;
  console.log(value);
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}`;
  // console.log(document.cookie);
};

export const getCookie = (name: string): string | null => {
  const cookies = document.cookie.split("; ");
  const found = cookies.find(c => c.startsWith(name + "="));
  return found ? decodeURIComponent(found.split("=")[1]) : null;
};