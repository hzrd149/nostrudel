export function buildAppSelectUrl(identifier: string, select = true) {
  return `https://nostrapp.link/#${identifier}` + (select ? "?select=true" : "");
}
