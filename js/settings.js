export function saveSettings ({ language, weekStartsOnSunday, theme }) {
  const settings = {
    language,
    weekStartsOnSunday,
    theme
  }
  localStorage.setItem('calendarSettings', JSON.stringify(settings))
}

export function loadSettings () {
  // noinspection JSDeprecatedSymbols
  const browserLanguage = navigator.language || navigator.userLanguage
  const defaultLanguage = browserLanguage.startsWith('th') ? 'th' : 'en'

  let settings = {
    language: defaultLanguage,
    weekStartsOnSunday: true,
    theme: 'light'
  }

  const savedSettings = localStorage.getItem('calendarSettings')
  if (savedSettings) {
    const loaded = JSON.parse(savedSettings)
    settings.language = loaded.language || defaultLanguage
    settings.weekStartsOnSunday = loaded.weekStartsOnSunday !== undefined ? loaded.weekStartsOnSunday : true
    settings.theme = loaded.theme || 'light'
  }

  return settings
}
