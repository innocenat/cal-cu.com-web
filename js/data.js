let _rawData = undefined

function getRawData () {
  if (!_rawData) {
    return fetch('data/data.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        return response.json()
      })
      .then(data => {
        return _rawData = data
      })
  }
  return Promise.resolve(_rawData)
}

function getDateFromHolidayFormat (holiday, year) {
  if (Array.isArray(holiday[0])) {
    if (Array.isArray(holiday[0]) && holiday[0].length === 2) {
      // Format: [[start-date, end-date], name-en, name-th]
      const startDate = new Date(holiday[0][0])
      const endDate = new Date(holiday[0][1])

      // Check if the date range overlaps with the current, previous, or next year
      if (startDate.getFullYear() <= year + 1 && endDate.getFullYear() >= year - 1) {
        // Create a range of dates
        // noinspection JSCheckFunctionSignatures
        const currentDate = new Date(Math.max(startDate, new Date(year, 0, 1)))
        // noinspection JSCheckFunctionSignatures
        const lastDate = new Date(Math.min(endDate, new Date(year, 11, 31)))

        let returnList = []

        // Loop over all dates
        while (currentDate <= lastDate) {
          returnList.push([
            formatDate(currentDate),
            {
              en: holiday[1],
              th: holiday[2]
            }
          ])
          currentDate.setDate(currentDate.getDate() + 1)
        }
        return returnList
      }
    } else {
      // Format: [["MM-DD", start_year, end_year], name-en, name-th]
      const dateInfo = holiday[0]
      if (Array.isArray(dateInfo)) {
        const monthDay = dateInfo[0]
        const startYear = dateInfo[1]
        const endYear = dateInfo[2]

        let returnList = []

        const makeDateFunc = (year) => {
          if ((startYear <= year) && (!endYear || endYear >= year)) {
            // Convert MM-DD to YYYY-MM-DD
            const dateString = `${year}-${monthDay}`
            returnList.push([dateString, {
              en: holiday[1],
              th: holiday[2]
            }])
          }
        }

        // Do it for current, previous, and next year.
        makeDateFunc(year)
        makeDateFunc(year + 1)
        makeDateFunc(year - 1)

        return returnList
      }
    }
  } else {
    // Format: ["YYYY-MM-DD", "Name", "ชื่อไทย"]
    const dateString = holiday[0]
    if (typeof dateString === 'string' && (dateString.startsWith(year.toString()) || dateString.startsWith((year - 1).toString()) || dateString.startsWith((year + 1).toString()))) {
      return [[dateString, {
        en: holiday[1],
        th: holiday[2]
      }]]
    }
  }
}

function processChulaPeriods (name, period, midterm, final) {
  const start = new Date(period[0])
  const end = new Date(period[1])

  // Add all days in the semester
  const currentDate = new Date(start)

  let dateMap = {}

  // Just for this, we don't include the end date
  while (currentDate < end) {
    const dateString = formatDate(currentDate)

    // Add semester period
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      dateMap[dateString] = {
        semester: name,
        type: ['semester']
      }
    }

    currentDate.setDate(currentDate.getDate() + 1)
  }

  if (midterm) {
    const midtermStart = new Date(midterm[0])
    const midtermEnd = new Date(midterm[1])

    const currentDate = new Date(midtermStart)
    while (currentDate <= midtermEnd) {
      const dateString = formatDate(currentDate)
      if (dateMap[dateString]) {
        dateMap[dateString].type.push('midterm')
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }
  }

  if (final) {
    const finalStart = new Date(final[0])
    const finalEnd = new Date(final[1])

    const currentDate = new Date(finalStart)
    while (currentDate <= finalEnd) {
      const dateString = formatDate(currentDate)
      if (dateMap[dateString]) {
        dateMap[dateString].type.push('final')
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }
  }

  return dateMap

}

export function getHolidayMap (year) {
  const dayNameMap = {}
  let academicDayMap = {}

  return getRawData().then(calendarData => {
    // Process holidays from data.json
    if (calendarData.holidays) {
      calendarData.holidays.forEach(holiday => {
        const parsed = getDateFromHolidayFormat(holiday, year)

        if (parsed) {
          parsed.forEach(date => {
            const item = { type: 'holiday', name: date[1] }
            if (date[0] in dayNameMap) {
              dayNameMap[date[0]].push(item)
            } else {
              dayNameMap[date[0]] = [item]
            }
          })
        }
      })
    }

    // Process days from data.json
    if (calendarData.days) {
      calendarData.days.forEach(day => {
        const parsed = getDateFromHolidayFormat(day, year)
        if (parsed) {
          parsed.forEach(date => {
            const item = { type: 'day', name: date[1] }
            if (date[0] in dayNameMap) {
              dayNameMap[date[0]].push(item)
            } else {
              dayNameMap[date[0]] = [item]
            }
          })
        }
      })
    }

    // Process academic calendar data
    if (calendarData.chula) {
      // Find all academic years that overlap with the current calendar year
      const relevantAcademicYears = calendarData.chula.filter(data => {
        // Check if the calendar year overlaps with this academic year
        const academicYear = data.year
        const nextAcademicYear = academicYear + 1
        return (year === academicYear || year === nextAcademicYear)
      })

      // Process all academic years that overlap with the current calendar year
      for (const academicYearData of relevantAcademicYears) {
        academicDayMap = {
          ...academicDayMap,
          ...processChulaPeriods('s1', academicYearData.s1, academicYearData.s1_midterm, academicYearData.s1_final),
          ...processChulaPeriods('s2', academicYearData.s2, academicYearData.s2_midterm, academicYearData.s2_final),
          ...processChulaPeriods('ss', academicYearData.ss),
        }
      }

      for (const academicYearData of relevantAcademicYears) {
        if (academicYearData.days) {
          academicYearData.days.forEach(holiday => {
            const parsed = getDateFromHolidayFormat(holiday, year)
            if (parsed) {
              parsed.forEach(date => {
                const item = { type: 'chula', name: date[1] }
                if (date[0] in academicDayMap) {
                  academicDayMap[date[0]].type.push(item)
                } else {
                  academicDayMap[date[0]] = {
                    semester: null,
                    type: [item]
                  }
                }
              })
            }
          })
        }
      }
    }

    return { days: dayNameMap, academic: academicDayMap }
  })
}

// Format date as YYYY-MM-DD
export function formatDate (date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}



