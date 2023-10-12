export function buildAppSelectUrl(identifier: string, select = true) {
  return `https://nostrapp.link/main/apps/social#${identifier}` + (select ? "?select=true" : "");
}
