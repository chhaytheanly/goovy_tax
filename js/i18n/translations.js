let translations = {};

export function setTranslations(data) {
  translations = data || {};
}

export function getTranslations() {
  return translations;
}
