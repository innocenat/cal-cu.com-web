import { setLanguage, getLanguage, _t, monthNames } from './text.js'
import { loadSettings, saveSettings } from './settings.js'
import { getHolidayMap } from './data.js'
import { renderMonth } from './month_view.js'

let settings = loadSettings()
let currentDate = new Date()

function updateLanguage () {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n
    el.textContent = _t(key)
  })
}

function updateDate () {
  const cutoffDate = new Date(2025, 0, 1)
  if (currentDate < cutoffDate) {
    currentDate = cutoffDate
  }

  document.getElementById('current-period').textContent = `${monthNames[getLanguage()][currentDate.getMonth()]} ${currentDate.getFullYear()}`
}

function init () {
  // Settings
  switch (settings.language) {
    case 'th':
      document.getElementById('language-th').checked = true
      setLanguage('th')
      break
    default:
      document.getElementById('language-en').checked = true
      setLanguage(settings.language = 'en')
  }
  switch (settings.weekStartsOnSunday) {
    case true:
      document.getElementById('week-sunday').checked = true
      break
    default:
      document.getElementById('week-monday').checked = true
      settings.weekStartsOnSunday = false
  }

  // Event listeners
  document.getElementById('language-th').addEventListener('input', () => {
    setLanguage(settings.language = 'th')
    saveSettings(settings)
    updateDate()
    updateView()
  })
  document.getElementById('language-en').addEventListener('input', () => {
    setLanguage(settings.language = 'en')
    saveSettings(settings)
    updateDate()
    updateView()
  })
  document.getElementById('week-sunday').addEventListener('input', (e) => {
    settings.weekStartsOnSunday = e.target.checked
    saveSettings(settings)
    updateView()
  })
  document.getElementById('week-monday').addEventListener('input', (e) => {
    settings.weekStartsOnSunday = !e.target.checked
    saveSettings(settings)
    updateView()
  })
  document.getElementById('cal-prev').addEventListener('click', (e) => {
    e.preventDefault()
    currentDate.setMonth(currentDate.getMonth() - 1)

    updateDate()
    updateView()

    return false
  })
  document.getElementById('cal-next').addEventListener('click', (e) => {
    e.preventDefault()
    currentDate.setMonth(currentDate.getMonth() + 1)

    updateDate()
    updateView()

    return false
  })
}

function updateView () {
  updateLanguage()

  getHolidayMap(currentDate.getFullYear()).then(calendarData => {
    renderMonth(calendarData, currentDate, getLanguage(), settings.weekStartsOnSunday)
  })
}

export default function mains () {
  init()
  updateDate()
  updateView()
}
