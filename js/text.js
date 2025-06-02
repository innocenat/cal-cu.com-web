let currentLanguage = 'en'

const _strings = {
  'th': {
    'View:': 'มุมมอง',
    'Monthly': 'รายเดือน',
    'Yearly': 'รายปี',
    'Week starts on:': 'วันเริ่มสัปดาห์',
    'Monday': 'วันจันทร์',
    'Sunday': 'วันอาทิตย์',
    'Language:': 'ภาษา',
    'Prev': 'ก่อนหน้า',
    'Next': 'ต่อไป',
    'Midterm': 'สอบกลางภาค',
    'Finals': 'สอบปลายภาค',
    'Week of midterm': 'สัปดาห์สอบกลางภาค',
    'Week of finals': 'สัปดาห์สอบปลายภาค'
  }
}

// Month names in English and Thai
export const monthNames = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  th: ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
}

// Weekday names in English and Thai
export const weekdayNames = {
  en: {
    long: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    short: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  },
  th: {
    long: ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'],
    short: ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
  }
}

export function setLanguage (lang) {
  if (Object.keys(_strings).includes(lang) && lang !== currentLanguage) {
    currentLanguage = lang
  } else {
    currentLanguage = 'en'
  }
}

export function getLanguage () {
  return currentLanguage
}

export function _t (key, ret = null) {
  if (!ret) {
    ret = key
  }

  if (Object.keys(_strings).includes(currentLanguage)) {
    return _strings[currentLanguage][key] || ret
  } else {
    return ret
  }
}
