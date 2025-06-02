import { _t, getLanguage, weekdayNames } from './text.js'
import { formatDate } from './data.js'

function getPreviousDOW (date, dow) {
  const currentDate = new Date(date)
  while (currentDate.getDay() !== dow) {
    currentDate.setDate(currentDate.getDate() - 1)
  }
  return currentDate
}

function getNextDOW (date, dow) {
  const currentDate = new Date(date)
  while (currentDate.getDay() !== dow) {
    currentDate.setDate(currentDate.getDate() + 1)
  }
  return currentDate
}

export function renderMonth ({ days, academic }, displayDate, language, weekStartsOnSunday) {
  const month = displayDate.getMonth()
  const year = displayDate.getFullYear()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const firstInCalendar = getPreviousDOW(firstDay, weekStartsOnSunday ? 0 : 1)
  const lastInCalendar = getNextDOW(lastDay, weekStartsOnSunday ? 6 : 0)

  const calEl = document.getElementById('calendar-month')

  // Clear previous html
  calEl.innerHTML = ''

  // Header cell
  for (let i = 0; i < 7; i++) {
    const dow = (i + (weekStartsOnSunday ? 0 : 1)) % 7
    const cellEl = document.createElement('div')
    cellEl.classList.add('cal-header')
    cellEl.classList.add(`cal-c${i + 1}`)
    cellEl.appendChild(responsiveText(weekdayNames[language].short[dow], weekdayNames[language].long[dow]))
    calEl.appendChild(cellEl)
  }

  const dayTypeMap = {}

  let currentDate = new Date(firstInCalendar)
  let collectedHolidays = [], collectedExams = new Set()
  while (currentDate <= lastInCalendar) {
    // Calculate column number 1-7
    const colNo = (currentDate.getDay() + (weekStartsOnSunday ? 0 : 6)) % 7 + 1

    const cellEl = document.createElement('div')
    cellEl.classList.add('cal-cell')
    cellEl.classList.add(`cal-c${colNo}`)

    if (currentDate.getMonth() !== month) {
      cellEl.classList.add('cal-cell--other-month')
    }

    if (currentDate.getDay() === 0) {
      cellEl.classList.add('cal-cell--sunday')
    }

    if (currentDate.getDay() === 6) {
      cellEl.classList.add('cal-cell--saturday')
    }

    if (formatDate(currentDate) === formatDate(new Date())) {
      cellEl.classList.add('cal-cell--today')
    }

    const dayNamesEl = document.createElement('div')
    dayNamesEl.classList.add('cal-cell__day-names')
    if (days[formatDate(currentDate)]) {
      for (const day of days[formatDate(currentDate)]) {
        if (day.type === 'holiday') {
          cellEl.classList.add('cal-cell--holiday')
          dayNamesEl.appendChild(wrapTextEl(getLocalName(day), ['cal-cell__day-name', 'cal-cell__day-name--holiday']))
          cellEl.classList.add('cal-cell--legend-holiday')

          dayTypeMap[formatDate(currentDate)] = 'holiday'
        }
        if (day.type === 'day') {
          cellEl.classList.add('cal-cell--day')
          dayNamesEl.appendChild(wrapTextEl(getLocalName(day), 'cal-cell__day-name'))
          cellEl.classList.add('cal-cell--legend-day')

          if (!(formatDate(currentDate) in dayTypeMap)) {
            dayTypeMap[formatDate(currentDate)] = 'day'
          }
        }
      }

      // Collect holidays for legend under each week
      if (currentDate.getMonth() === month) {
        collectedHolidays.push(formatDate(currentDate))
      }
    }

    if (academic[formatDate(currentDate)]) {
      const academicDay = academic[formatDate(currentDate)]
      if (academicDay.type.includes('semester')) {
        cellEl.classList.add('cal-cell--semester')
      }
      if (academicDay.type.includes('midterm') || academicDay.type.includes('final')) {
        if (dayTypeMap[formatDate(currentDate)] !== 'holiday') {
          cellEl.classList.add('cal-cell--exam')
          cellEl.classList.add('cal-cell--legend-exam')

          if (currentDate.getMonth() === month) {
            if (academicDay.type.includes('midterm')) {
              dayNamesEl.appendChild(wrapTextEl(_t('Midterm'), 'cal-cell__day-name cal-cell__day-name--exam'))
              collectedExams.add('midterm')
            }

            if (academicDay.type.includes('final')) {
              dayNamesEl.appendChild(wrapTextEl(_t('Finals'), 'cal-cell__day-name cal-cell__day-name--exam'))
              collectedExams.add('final')
            }
          }
        }
      }

      for (const dayType of academicDay.type) {
        if (typeof dayType === 'object') {
          cellEl.classList.add('cal-cell--chula')
          cellEl.classList.add('cal-cell--legend-chula')
          dayNamesEl.appendChild(wrapTextEl(getLocalName(dayType), 'cal-cell__day-name cal-cell__day-name--chula'))


          if (currentDate.getMonth() === month) {
            if (!(formatDate(currentDate) in dayTypeMap)) {
              dayTypeMap[formatDate(currentDate)] = 'chula'
              collectedHolidays.push(formatDate(currentDate))
            } else if (dayTypeMap[formatDate(currentDate)] === 'day') {
              dayTypeMap[formatDate(currentDate)] = 'chula'
            }
          }
        }
      }
    }

    const dateString = currentDate.getDate().toString()

    cellEl.appendChild(wrapTextEl(dateString, 'cal-cell__date-num'))
    cellEl.appendChild(dayNamesEl)
    calEl.appendChild(cellEl)

    // Display holidays name under each week row for smaller screens
    if (colNo === 7 && collectedHolidays.length > 0) {
      const legendEl = document.createElement('div')
      legendEl.classList.add('cal-legend')
      legendEl.classList.add('cal-span')

      for (const exam of collectedExams) {
        const examName = exam === 'midterm' ? _t('Week of midterm') : _t('Week of finals')
        legendEl.appendChild(wrapTextEl(examName, 'cal-legend__date cal-legend__date--exam'))
      }

      for (const day of collectedHolidays) {
        const ccDate = new Date(day)
        let holidayName = [], dayName = [], chulaName = []
        if (days[day]) {
          for (const holiday of days[day]) {
            if (holiday.type === 'holiday') {
              holidayName.push(getLocalName(holiday))
            }
            if (holiday.type === 'day') {
              dayName.push(getLocalName(holiday))
            }
          }
        }
        if (academic[day]) {
          for (const academicDay of academic[day].type) {
            if (typeof academicDay === 'object') {
              chulaName.push(getLocalName(academicDay))
            }
          }
        }

        const dayLegend = document.createElement('div')
        const legendClassName = `cal-legend__date--${dayTypeMap[day]}`

        dayLegend.classList.add('cal-legend__item')
        dayLegend.appendChild(wrapTextEl(ccDate.getDate().toString() + ': ', 'cal-legend__date ' + legendClassName))

        for (const holiday of holidayName) {
          dayLegend.appendChild(wrapTextEl(holiday, 'cal-legend__day-name--holiday'))
        }
        for (const day of dayName) {
          dayLegend.appendChild(wrapTextEl(day, 'cal-legend__day-name'))
        }
        for (const chula of chulaName) {
          dayLegend.appendChild(wrapTextEl(chula, 'cal-legend__day-name--chula'))
        }
        legendEl.appendChild(dayLegend)
      }

      calEl.appendChild(legendEl)

      collectedHolidays = []
      collectedExams = new Set()
    }

    currentDate.setDate(currentDate.getDate() + 1)
  }
}

function wrapTextEl (text, cls) {
  const el = document.createElement('div')
  if (Array.isArray(cls)) {
    cls.forEach(c => el.classList.add(c))
  } else {
    cls.split(' ').forEach(c => el.classList.add(c))
  }
  el.innerText = text
  return el
}

function getLocalName (d) {
  return d.name[getLanguage()]
}

function responsiveText (short, long) {
  const el = document.createElement('span')
  const sel = document.createElement('span')
  const tel = document.createElement('span')
  sel.classList.add('r640-text-short')
  tel.classList.add('r640-text-long')
  sel.innerText = short
  tel.innerText = long
  el.appendChild(sel)
  el.appendChild(tel)
  return el
}
