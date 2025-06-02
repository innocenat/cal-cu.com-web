// Global variables
let calendarData = null;
let currentDate = new Date();
let currentView = 'month';
let language = 'en';
let weekStartsOnSunday = true;

// Academic period types
const PERIOD_TYPES = {
    REGULAR: 'regular',
    MIDTERM: 'midterm',
    FINAL: 'final',
    ADD_COURSE: 'add-course',
    REMOVE_COURSE: 'remove-course',
    WITHDRAW: 'withdraw',
    GRADUATE: 'graduate'
};

// Save settings to localStorage
function saveSettings() {
    const settings = {
        currentView,
        language,
        weekStartsOnSunday
    };
    localStorage.setItem('calendarSettings', JSON.stringify(settings));
}

// Load settings from localStorage
function loadSettings() {
    // Detect browser language
    const browserLanguage = navigator.language || navigator.userLanguage;
    const defaultLanguage = browserLanguage.startsWith('th') ? 'th' : 'en';

    const savedSettings = localStorage.getItem('calendarSettings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        currentView = settings.currentView || 'month';
        language = settings.language || defaultLanguage;
        weekStartsOnSunday = settings.weekStartsOnSunday !== undefined ? settings.weekStartsOnSunday : true;
    } else {
        // If no saved settings, use browser language
        language = defaultLanguage;
    }

    // Update UI to reflect loaded settings
    document.getElementById('language').value = language;
    document.getElementById('weekStart').value = weekStartsOnSunday ? 'sunday' : 'monday';
}

// Month names in English and Thai
const monthNames = {
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    th: ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
};

// Weekday names in English and Thai
const weekdayNames = {
    en: {
        long: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        short: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    },
    th: {
        long: ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'],
        short: ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
    }
};

// UI text translations
const uiText = {
    en: {
        calendarTitle: 'Calendar',
        monthView: 'Month View',
        yearView: 'Year View',
        language: 'Language:',
        weekStart: 'Week starts on:',
        sunday: 'Sunday',
        monday: 'Monday',
        previous: 'Previous',
        next: 'Next',
        today: 'Today',
        week: 'Week',
        semester1: 'Semester 1',
        semester2: 'Semester 2',
        summerSemester: 'Summer',
        midterm: 'Midterm',
        final: 'Final',
        addCourse: 'Add Course',
        removeCourse: 'Remove Course',
        withdraw: 'Withdraw',
        graduate: 'Apply for Graduation'
    },
    th: {
        calendarTitle: 'ปฏิทิน',
        monthView: 'มุมมองรายเดือน',
        yearView: 'มุมมองรายปี',
        language: 'ภาษา:',
        weekStart: 'สัปดาห์เริ่มต้นที่:',
        sunday: 'วันอาทิตย์',
        monday: 'วันจันทร์',
        previous: 'ก่อนหน้า',
        next: 'ถัดไป',
        today: 'วันนี้',
        week: 'สัปดาห์',
        semester1: 'ภาคการศึกษาที่ 1',
        semester2: 'ภาคการศึกษาที่ 2',
        summerSemester: 'ภาคฤดูร้อน',
        midterm: 'สอบกลางภาค',
        final: 'สอบปลายภาค',
        addCourse: 'เพิ่มรายวิชา',
        removeCourse: 'ถอนรายวิชา',
        withdraw: 'ถอนรายวิชา W',
        graduate: 'แจ้งจบการศึกษา'
    }
};

// Initialize the calendar
document.addEventListener('DOMContentLoaded', () => {
    // Load saved settings
    loadSettings();

    // Set default date to current month/year, but ensure it's not before 2025
    const now = new Date();
    const minYear = 2025;

    if (now.getFullYear() < minYear) {
        currentDate = new Date(minYear, 0, 1);
    } else {
        currentDate = now;
    }

    // Update UI language initially
    updateUILanguage();

    // Fetch holiday data
    fetchCalendarData();

    // Set up event listeners
    setupEventListeners();

    // Set initial view based on loaded settings
    setView(currentView);
});

// Fetch calendar data from data.json
function fetchCalendarData() {
    fetch('data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            calendarData = data;
            renderCalendar();
        })
        .catch(error => {
            console.error('Error fetching calendar data:', error);
        });
}

// Set up event listeners for UI controls
function setupEventListeners() {
    // View toggle buttons
    document.getElementById('monthViewBtn').addEventListener('click', () => {
        setView('month');
        saveSettings();
    });

    document.getElementById('yearViewBtn').addEventListener('click', () => {
        setView('year');
        saveSettings();
    });

    // Language selector
    document.getElementById('language').addEventListener('change', (e) => {
        language = e.target.value;
        updateUILanguage();
        renderCalendar();
        saveSettings();
    });

    // Week start selector
    document.getElementById('weekStart').addEventListener('change', (e) => {
        weekStartsOnSunday = e.target.value === 'sunday';
        renderCalendar();
        saveSettings();
    });

    // Navigation buttons
    document.getElementById('prevBtn').addEventListener('click', () => {
        navigateCalendar('prev');
    });

    document.getElementById('todayBtn').addEventListener('click', () => {
        goToToday();
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
        navigateCalendar('next');
    });
}

// Go to today's date
function goToToday() {
    const now = new Date();
    const minYear = 2025;

    // Ensure we don't go before 2025
    if (now.getFullYear() >= minYear) {
        currentDate = now;
    } else {
        currentDate = new Date(minYear, 0, 1);
    }

    renderCalendar();
}

// Set the current view (month or year)
function setView(view) {
    currentView = view;

    // Update active button
    document.getElementById('monthViewBtn').classList.toggle('active', view === 'month');
    document.getElementById('yearViewBtn').classList.toggle('active', view === 'year');

    // Show/hide appropriate view
    document.getElementById('monthView').classList.toggle('hidden', view !== 'month');
    document.getElementById('yearView').classList.toggle('hidden', view !== 'year');

    renderCalendar();
}

// Update UI text based on selected language
function updateUILanguage() {
    const texts = uiText[language];

    // Update static UI elements
    document.getElementById('calendarTitle').textContent = texts.calendarTitle;
    document.getElementById('monthViewBtn').textContent = texts.monthView;
    document.getElementById('yearViewBtn').textContent = texts.yearView;
    document.querySelector('label[for="language"]').textContent = texts.language;
    document.querySelector('label[for="weekStart"]').textContent = texts.weekStart;
    document.querySelector('option[value="sunday"]').textContent = texts.sunday;
    document.querySelector('option[value="monday"]').textContent = texts.monday;
    document.getElementById('prevBtn').textContent = texts.previous;
    document.getElementById('todayBtn').textContent = texts.today;
    document.getElementById('nextBtn').textContent = texts.next;
}

// Navigate the calendar (previous/next month or year)
function navigateCalendar(direction) {
    const minYear = 2025;
    let newDate = new Date(currentDate);

    if (currentView === 'month') {
        // Navigate month
        if (direction === 'prev') {
            newDate.setMonth(newDate.getMonth() - 1);
        } else {
            newDate.setMonth(newDate.getMonth() + 1);
        }
    } else {
        // Navigate year
        if (direction === 'prev') {
            newDate.setFullYear(newDate.getFullYear() - 1);
        } else {
            newDate.setFullYear(newDate.getFullYear() + 1);
        }
    }

    // Check if the new date is before 2025
    if (newDate.getFullYear() >= minYear) {
        currentDate = newDate;
        renderCalendar();
    }
}

// Main function to render the calendar
function renderCalendar() {
    if (!calendarData) return;

    if (currentView === 'month') {
        renderMonthView();
    } else {
        renderYearView();
    }
}

// Render the month view
function renderMonthView() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Update month/year label
    const monthYearLabel = `${monthNames[language][month]} ${year}`;
    document.getElementById('monthYearLabel').textContent = monthYearLabel;
    document.getElementById('currentPeriod').textContent = monthYearLabel;

    // Render weekday headers
    renderWeekdayHeaders();

    // Render days grid
    renderDaysGrid(year, month);
}

// Render weekday headers for month view
function renderWeekdayHeaders() {
    const weekdaysHeader = document.getElementById('weekdaysHeader');
    weekdaysHeader.innerHTML = '';

    // Add week number header
    const weekNumberHeader = document.createElement('div');
    weekNumberHeader.className = 'weekday week-number-header';
    weekNumberHeader.textContent = uiText[language].week;
    weekdaysHeader.appendChild(weekNumberHeader);

    let weekdays = [...weekdayNames[language].short];
    if (!weekStartsOnSunday) {
        // If week starts on Monday, move Sunday to the end
        weekdays.push(weekdays.shift());
    }

    weekdays.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'weekday';
        dayElement.textContent = day;
        weekdaysHeader.appendChild(dayElement);
    });
}

// Render days grid for month view
function renderDaysGrid(year, month) {
    const daysGrid = document.getElementById('daysGrid');
    daysGrid.innerHTML = '';

    // Get first day of the month
    const firstDay = new Date(year, month, 1);
    // Get last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Calculate the first day to display (might be from previous month)
    let startDay = new Date(firstDay);
    let dayOfWeek = startDay.getDay(); // 0 = Sunday, 1 = Monday, etc.

    if (!weekStartsOnSunday) {
        // Adjust for Monday start
        dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    }

    startDay.setDate(startDay.getDate() - dayOfWeek);

    // Create maps of holidays and days for quick lookup
    const { holidays: holidayMap, days: daysMap, academicPeriods, weekNumbers } = createHolidayMap(year);

    // Generate 6 weeks (42 days) to ensure we cover the whole month
    for (let i = 0; i < 42; i++) {
        // If this is the first day of the week, add a week number cell
        if (i % 7 === 0) {
            const weekNumberElement = document.createElement('div');
            weekNumberElement.className = 'week-number';

            // Get the date for this week
            const weekDate = new Date(startDay);
            weekDate.setDate(startDay.getDate() + i);
            const dateString = formatDate(weekDate);

            // Check if this week is part of an academic semester
            const weekInfo = weekNumbers[dateString];
            if (weekInfo) {
                const { semester, week } = weekInfo;
                weekNumberElement.textContent = week;

                // Add semester indicator
                if (semester === 1) {
                    weekNumberElement.classList.add('semester-1');
                    weekNumberElement.title = `${uiText[language].semester1} ${uiText[language].week} ${week}`;
                } else if (semester === 2) {
                    weekNumberElement.classList.add('semester-2');
                    weekNumberElement.title = `${uiText[language].semester2} ${uiText[language].week} ${week}`;
                } else if (semester === 3) {
                    weekNumberElement.classList.add('semester-summer');
                    weekNumberElement.title = `${uiText[language].summerSemester} ${uiText[language].week} ${week}`;
                }

                // Check for special periods
                for (let j = 0; j < 7; j++) {
                    const dayDate = new Date(weekDate);
                    dayDate.setDate(weekDate.getDate() + j);
                    const dayDateString = formatDate(dayDate);
                    const periodInfo = academicPeriods[dayDateString];

                    if (periodInfo && periodInfo.specialPeriod) {
                        switch (periodInfo.specialPeriod) {
                            case PERIOD_TYPES.ADD_COURSE:
                                weekNumberElement.classList.add('period-add-course');
                                weekNumberElement.title += ` - ${uiText[language].addCourse}`;
                                break;
                            case PERIOD_TYPES.REMOVE_COURSE:
                                weekNumberElement.classList.add('period-remove-course');
                                weekNumberElement.title += ` - ${uiText[language].removeCourse}`;
                                break;
                            case PERIOD_TYPES.WITHDRAW:
                                weekNumberElement.classList.add('period-withdraw');
                                weekNumberElement.title += ` - ${uiText[language].withdraw}`;
                                break;
                            case PERIOD_TYPES.GRADUATE:
                                weekNumberElement.classList.add('period-graduate');
                                weekNumberElement.title += ` - ${uiText[language].graduate}`;
                                break;
                        }
                        break; // Only need to find one day with a special period
                    }
                }
            }

            daysGrid.appendChild(weekNumberElement);
        }

        const currentDay = new Date(startDay);
        currentDay.setDate(startDay.getDate() + i);

        const dayElement = document.createElement('div');
        dayElement.className = 'day';

        // Check if day is from current month or not
        if (currentDay.getMonth() !== month) {
            dayElement.classList.add('other-month');
            // We still want to highlight days from other months
        }

        // Add day number
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = currentDay.getDate();

        // Check if it's a holiday (weekend or special holiday)
        const isWeekend = currentDay.getDay() === 0 || currentDay.getDay() === 6;
        const dateString = formatDate(currentDay);
        const holidayInfo = holidayMap[dateString];
        const periodInfo = academicPeriods[dateString];

        if (isWeekend || holidayInfo) {
            dayNumber.classList.add('holiday');
        }

        // Add academic period indicators
        if (periodInfo) {
            // Add semester class
            if (periodInfo.semester === 1) {
                dayElement.classList.add('semester-1');
            } else if (periodInfo.semester === 2) {
                dayElement.classList.add('semester-2');
            } else if (periodInfo.semester === 3) {
                dayElement.classList.add('semester-summer');
            }

            // Add period type class
            if (periodInfo.type === PERIOD_TYPES.MIDTERM) {
                dayElement.classList.add('period-midterm');
                dayElement.title = uiText[language].midterm;

                // Add period indicator
                const periodIndicator = document.createElement('div');
                periodIndicator.className = 'period-indicator midterm-indicator';
                periodIndicator.textContent = uiText[language].midterm;
                dayElement.appendChild(periodIndicator);
            } else if (periodInfo.type === PERIOD_TYPES.FINAL) {
                dayElement.classList.add('period-final');
                dayElement.title = uiText[language].final;

                // Add period indicator
                const periodIndicator = document.createElement('div');
                periodIndicator.className = 'period-indicator final-indicator';
                periodIndicator.textContent = uiText[language].final;
                dayElement.appendChild(periodIndicator);
            }

            // Add special period class
            if (periodInfo.specialPeriod) {
                let periodText = '';
                switch (periodInfo.specialPeriod) {
                    case PERIOD_TYPES.ADD_COURSE:
                        dayElement.classList.add('period-add-course');
                        dayElement.title = uiText[language].addCourse;
                        periodText = uiText[language].addCourse;
                        break;
                    case PERIOD_TYPES.REMOVE_COURSE:
                        dayElement.classList.add('period-remove-course');
                        dayElement.title = uiText[language].removeCourse;
                        periodText = uiText[language].removeCourse;
                        break;
                    case PERIOD_TYPES.WITHDRAW:
                        dayElement.classList.add('period-withdraw');
                        dayElement.title = uiText[language].withdraw;
                        periodText = uiText[language].withdraw;
                        break;
                    case PERIOD_TYPES.GRADUATE:
                        dayElement.classList.add('period-graduate');
                        dayElement.title = uiText[language].graduate;
                        periodText = uiText[language].graduate;
                        break;
                }

                // Add period indicator
                if (periodText) {
                    const periodIndicator = document.createElement('div');
                    periodIndicator.className = `period-indicator ${periodInfo.specialPeriod}-indicator`;
                    periodIndicator.textContent = periodText;
                    dayElement.appendChild(periodIndicator);
                }
            }
        }

        dayElement.appendChild(dayNumber);

        // Add holiday name if available
        if (holidayInfo) {
            const holidayName = document.createElement('div');
            holidayName.className = 'holiday-name';
            holidayName.textContent = holidayInfo[language];
            dayElement.appendChild(holidayName);
        }

        // Add day name if available (not marked as holiday)
        const dayInfo = daysMap[dateString];
        if (dayInfo) {
            const dayName = document.createElement('div');
            dayName.className = 'holiday-name'; // Reuse the same class for styling
            dayName.textContent = dayInfo[language];
            dayElement.appendChild(dayName);
        }

        daysGrid.appendChild(dayElement);
    }
}

// Render the year view
function renderYearView() {
    const year = currentDate.getFullYear();

    // Update year label
    document.getElementById('yearLabel').textContent = year;
    document.getElementById('currentPeriod').textContent = year.toString();

    const yearGrid = document.getElementById('yearGrid');
    yearGrid.innerHTML = '';

    // Create maps of holidays and days for quick lookup
    const { holidays: holidayMap, days: daysMap } = createHolidayMap(year);

    // Render mini calendar for each month
    for (let month = 0; month < 12; month++) {
        const miniMonth = document.createElement('div');
        miniMonth.className = 'mini-month';

        // Month header
        const miniMonthHeader = document.createElement('div');
        miniMonthHeader.className = 'mini-month-header';
        miniMonthHeader.textContent = monthNames[language][month];
        miniMonth.appendChild(miniMonthHeader);

        // Weekday headers
        const miniMonthGrid = document.createElement('div');
        miniMonthGrid.className = 'mini-month-grid';

        let weekdays = [...weekdayNames[language].short.map(day => day.charAt(0))];
        if (!weekStartsOnSunday) {
            // If week starts on Monday, move Sunday to the end
            weekdays.push(weekdays.shift());
        }

        weekdays.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = 'mini-weekday';
            dayElement.textContent = day;
            miniMonthGrid.appendChild(dayElement);
        });

        // Get first day of the month
        const firstDay = new Date(year, month, 1);
        // Get last day of the month
        const lastDay = new Date(year, month + 1, 0);

        // Calculate the first day to display (might be from previous month)
        let startDay = new Date(firstDay);
        let dayOfWeek = startDay.getDay(); // 0 = Sunday, 1 = Monday, etc.

        if (!weekStartsOnSunday) {
            // Adjust for Monday start
            dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        }

        startDay.setDate(startDay.getDate() - dayOfWeek);

        // Generate days for the mini calendar
        for (let i = 0; i < 42; i++) {
            const currentDay = new Date(startDay);
            currentDay.setDate(startDay.getDate() + i);

            const dayElement = document.createElement('div');
            dayElement.className = 'mini-day';

            // Check if day is from current month or not
            if (currentDay.getMonth() !== month) {
                dayElement.textContent = '';
            } else {
                dayElement.textContent = currentDay.getDate();

                // Check if it's a holiday (weekend or special holiday)
                const isWeekend = currentDay.getDay() === 0 || currentDay.getDay() === 6;
                const dateString = formatDate(currentDay);
                const isHoliday = holidayMap[dateString] !== undefined;

                // Only mark holidays in red, not regular days
                if (isWeekend || isHoliday) {
                    dayElement.classList.add('holiday');
                }
            }

            miniMonthGrid.appendChild(dayElement);
        }

        miniMonth.appendChild(miniMonthGrid);
        yearGrid.appendChild(miniMonth);
    }
}

// Create a map of holidays and days for quick lookup
function createHolidayMap(year) {
    const holidayMap = {};
    const daysMap = {};
    const academicPeriods = {};
    const weekNumbers = {};

    if (!calendarData) return { holidays: holidayMap, days: daysMap, academicPeriods, weekNumbers };

    // Process holidays from data.json
    if (calendarData.holidays) {
        calendarData.holidays.forEach(holiday => {
            if (Array.isArray(holiday[0])) {
                // Format: [["MM-DD", start_year, end_year], "Name", "ชื่อไทย"]
                const dateInfo = holiday[0];
                if (Array.isArray(dateInfo)) {
                    const monthDay = dateInfo[0];
                    const startYear = dateInfo[1];
                    const endYear = dateInfo[2];

                    // Check if the holiday applies to the current year
                    if ((startYear <= year) && (!endYear || endYear >= year)) {
                        // Convert MM-DD to YYYY-MM-DD
                        const dateString = `${year}-${monthDay}`;
                        holidayMap[dateString] = {
                            en: holiday[1],
                            th: holiday[2]
                        };
                    }
                }
            } else {
                // Format: ["YYYY-MM-DD", "Name", "ชื่อไทย"]
                const dateString = holiday[0];
                if (typeof dateString === 'string' && dateString.startsWith(year.toString())) {
                    holidayMap[dateString] = {
                        en: holiday[1],
                        th: holiday[2]
                    };
                }
            }
        });
    }

    // Process days from data.json
    if (calendarData.days) {
        calendarData.days.forEach(day => {
            if (Array.isArray(day[0])) {
                if (Array.isArray(day[0]) && day[0].length === 2) {
                    // Format: [[start-date, end-date], name-en, name-th]
                    const startDate = new Date(day[0][0]);
                    const endDate = new Date(day[0][1]);

                    // Check if the date range overlaps with the current year
                    if (startDate.getFullYear() <= year && endDate.getFullYear() >= year) {
                        // Create a range of dates
                        const currentDate = new Date(Math.max(startDate, new Date(year, 0, 1)));
                        const lastDate = new Date(Math.min(endDate, new Date(year, 11, 31)));

                        while (currentDate <= lastDate) {
                            const dateString = formatDate(currentDate);
                            daysMap[dateString] = {
                                en: day[1],
                                th: day[2]
                            };
                            currentDate.setDate(currentDate.getDate() + 1);
                        }
                    }
                } else {
                    // Format: [["MM-DD", start_year, end_year], "Name", "ชื่อไทย"]
                    const dateInfo = day[0];
                    if (Array.isArray(dateInfo)) {
                        const monthDay = dateInfo[0];
                        const startYear = dateInfo[1];
                        const endYear = dateInfo[2];

                        // Check if the day applies to the current year
                        if ((startYear <= year) && (!endYear || endYear >= year)) {
                            // Convert MM-DD to YYYY-MM-DD
                            const dateString = `${year}-${monthDay}`;
                            daysMap[dateString] = {
                                en: day[1],
                                th: day[2]
                            };
                        }
                    }
                }
            } else {
                // Format: ["YYYY-MM-DD", "Name", "ชื่อไทย"]
                const dateString = day[0];
                if (typeof dateString === 'string' && dateString.startsWith(year.toString())) {
                    daysMap[dateString] = {
                        en: day[1],
                        th: day[2]
                    };
                }
            }
        });
    }

    // Process academic calendar data
    if (calendarData.chula) {
        // Find all academic years that overlap with the current calendar year
        const relevantAcademicYears = calendarData.chula.filter(data => {
            // Check if the calendar year overlaps with this academic year
            const academicYear = data.year;
            const nextAcademicYear = academicYear + 1;
            return (year === academicYear || year === nextAcademicYear);
        });

        // Process all academic years that overlap with the current calendar year
        for (const academicYearData of relevantAcademicYears) {
            // Process semester 1 period
            if (academicYearData.s1_open && academicYearData.s1_close) {
                const s1Start = new Date(academicYearData.s1_open);
                const s1End = new Date(academicYearData.s1_close);

                // Add all days in semester 1 to academicPeriods
                const currentDate = new Date(s1Start);
                let weekCounter = 1;
                let weekStartDate = new Date(currentDate);

                while (currentDate <= s1End) {
                    const dateString = formatDate(currentDate);

                    // Add semester period
                    academicPeriods[dateString] = {
                        type: PERIOD_TYPES.REGULAR,
                        semester: 1,
                        week: weekCounter
                    };

                    // Track week numbers
                    if (currentDate.getDay() === 1) { // Monday
                        weekStartDate = new Date(currentDate);
                    }

                    if (currentDate.getDay() === 0) { // Sunday
                        // Store the week number for this week
                        for (let i = 0; i < 7; i++) {
                            const weekDate = new Date(weekStartDate);
                            weekDate.setDate(weekStartDate.getDate() + i);
                            const weekDateString = formatDate(weekDate);
                            weekNumbers[weekDateString] = {
                                semester: 1,
                                week: weekCounter
                            };
                        }
                        weekCounter++;
                    }

                    currentDate.setDate(currentDate.getDate() + 1);
                }

                // Handle the last week if it doesn't end on Sunday
                if (s1End.getDay() !== 0) {
                    for (let i = 0; i <= s1End.getDay(); i++) {
                        const weekDate = new Date(weekStartDate);
                        weekDate.setDate(weekStartDate.getDate() + i);
                        const weekDateString = formatDate(weekDate);
                        weekNumbers[weekDateString] = {
                            semester: 1,
                            week: weekCounter
                        };
                    }
                }

                // Process midterm period
                if (academicYearData.s1_midterm && academicYearData.s1_midterm.length === 2) {
                    const midtermStart = new Date(academicYearData.s1_midterm[0]);
                    const midtermEnd = new Date(academicYearData.s1_midterm[1]);

                    const currentDate = new Date(midtermStart);
                    while (currentDate <= midtermEnd) {
                        const dateString = formatDate(currentDate);
                        if (academicPeriods[dateString]) {
                            academicPeriods[dateString].type = PERIOD_TYPES.MIDTERM;
                        }
                        currentDate.setDate(currentDate.getDate() + 1);
                    }
                }

                // Process final period
                if (academicYearData.s1_final && academicYearData.s1_final.length === 2) {
                    const finalStart = new Date(academicYearData.s1_final[0]);
                    const finalEnd = new Date(academicYearData.s1_final[1]);

                    const currentDate = new Date(finalStart);
                    while (currentDate <= finalEnd) {
                        const dateString = formatDate(currentDate);
                        if (academicPeriods[dateString]) {
                            academicPeriods[dateString].type = PERIOD_TYPES.FINAL;
                        }
                        currentDate.setDate(currentDate.getDate() + 1);
                    }
                }
            }

            // Process semester 2 period
            if (academicYearData.s2_open && academicYearData.s2_close) {
                const s2Start = new Date(academicYearData.s2_open);
                const s2End = new Date(academicYearData.s2_close);

                // Add all days in semester 2 to academicPeriods
                const currentDate = new Date(s2Start);
                let weekCounter = 1;
                let weekStartDate = new Date(currentDate);

                while (currentDate <= s2End) {
                    const dateString = formatDate(currentDate);

                    // Add semester period
                    academicPeriods[dateString] = {
                        type: PERIOD_TYPES.REGULAR,
                        semester: 2,
                        week: weekCounter
                    };

                    // Track week numbers
                    if (currentDate.getDay() === 1) { // Monday
                        weekStartDate = new Date(currentDate);
                    }

                    if (currentDate.getDay() === 0) { // Sunday
                        // Store the week number for this week
                        for (let i = 0; i < 7; i++) {
                            const weekDate = new Date(weekStartDate);
                            weekDate.setDate(weekStartDate.getDate() + i);
                            const weekDateString = formatDate(weekDate);
                            weekNumbers[weekDateString] = {
                                semester: 2,
                                week: weekCounter
                            };
                        }
                        weekCounter++;
                    }

                    currentDate.setDate(currentDate.getDate() + 1);
                }

                // Handle the last week if it doesn't end on Sunday
                if (s2End.getDay() !== 0) {
                    for (let i = 0; i <= s2End.getDay(); i++) {
                        const weekDate = new Date(weekStartDate);
                        weekDate.setDate(weekStartDate.getDate() + i);
                        const weekDateString = formatDate(weekDate);
                        weekNumbers[weekDateString] = {
                            semester: 2,
                            week: weekCounter
                        };
                    }
                }

                // Process midterm period
                if (academicYearData.s2_midterm && academicYearData.s2_midterm.length === 2) {
                    const midtermStart = new Date(academicYearData.s2_midterm[0]);
                    const midtermEnd = new Date(academicYearData.s2_midterm[1]);

                    const currentDate = new Date(midtermStart);
                    while (currentDate <= midtermEnd) {
                        const dateString = formatDate(currentDate);
                        if (academicPeriods[dateString]) {
                            academicPeriods[dateString].type = PERIOD_TYPES.MIDTERM;
                        }
                        currentDate.setDate(currentDate.getDate() + 1);
                    }
                }

                // Process final period
                if (academicYearData.s2_final && academicYearData.s2_final.length === 2) {
                    const finalStart = new Date(academicYearData.s2_final[0]);
                    const finalEnd = new Date(academicYearData.s2_final[1]);

                    const currentDate = new Date(finalStart);
                    while (currentDate <= finalEnd) {
                        const dateString = formatDate(currentDate);
                        if (academicPeriods[dateString]) {
                            academicPeriods[dateString].type = PERIOD_TYPES.FINAL;
                        }
                        currentDate.setDate(currentDate.getDate() + 1);
                    }
                }
            }

            // Process summer semester period
            if (academicYearData.ss_open && academicYearData.ss_close) {
                const ssStart = new Date(academicYearData.ss_open);
                const ssEnd = new Date(academicYearData.ss_close);

                // Add all days in summer semester to academicPeriods
                const currentDate = new Date(ssStart);
                let weekCounter = 1;
                let weekStartDate = new Date(currentDate);

                while (currentDate <= ssEnd) {
                    const dateString = formatDate(currentDate);

                    // Add semester period
                    academicPeriods[dateString] = {
                        type: PERIOD_TYPES.REGULAR,
                        semester: 3, // Summer semester
                        week: weekCounter
                    };

                    // Track week numbers
                    if (currentDate.getDay() === 1) { // Monday
                        weekStartDate = new Date(currentDate);
                    }

                    if (currentDate.getDay() === 0) { // Sunday
                        // Store the week number for this week
                        for (let i = 0; i < 7; i++) {
                            const weekDate = new Date(weekStartDate);
                            weekDate.setDate(weekStartDate.getDate() + i);
                            const weekDateString = formatDate(weekDate);
                            weekNumbers[weekDateString] = {
                                semester: 3,
                                week: weekCounter
                            };
                        }
                        weekCounter++;
                    }

                    currentDate.setDate(currentDate.getDate() + 1);
                }

                // Handle the last week if it doesn't end on Sunday
                if (ssEnd.getDay() !== 0) {
                    for (let i = 0; i <= ssEnd.getDay(); i++) {
                        const weekDate = new Date(weekStartDate);
                        weekDate.setDate(weekStartDate.getDate() + i);
                        const weekDateString = formatDate(weekDate);
                        weekNumbers[weekDateString] = {
                            semester: 3,
                            week: weekCounter
                        };
                    }
                }
            }
        }
    }

    // Process special periods from chula_cfg
    if (calendarData.chula_cfg) {
        const cfg = calendarData.chula_cfg;

        // Process each date to check if it falls within a special period
        for (const dateString in academicPeriods) {
            const periodInfo = academicPeriods[dateString];
            const weekInfo = weekNumbers[dateString];

            if (weekInfo) {
                const { semester, week } = weekInfo;

                // Check for add course period
                if (cfg.add && 
                    ((semester === 1 || semester === 2) && week >= cfg.add[0] && week <= cfg.add[1]) ||
                    (semester === 3 && week >= cfg.add[2] && week <= cfg.add[3])) {
                    academicPeriods[dateString].specialPeriod = PERIOD_TYPES.ADD_COURSE;
                }

                // Check for remove course period
                if (cfg.remove && 
                    ((semester === 1 || semester === 2) && week >= cfg.remove[0] && week <= cfg.remove[1]) ||
                    (semester === 3 && week >= cfg.remove[2] && week <= cfg.remove[3])) {
                    academicPeriods[dateString].specialPeriod = PERIOD_TYPES.REMOVE_COURSE;
                }

                // Check for withdraw period
                if (cfg.withdraw && 
                    ((semester === 1 || semester === 2) && week >= cfg.withdraw[0] && week <= cfg.withdraw[1]) ||
                    (semester === 3 && week >= cfg.withdraw[2] && week <= cfg.withdraw[3])) {
                    academicPeriods[dateString].specialPeriod = PERIOD_TYPES.WITHDRAW;
                }

                // Check for graduate application period
                if (cfg.graduate && 
                    ((semester === 1 || semester === 2) && week >= cfg.graduate[0] && week <= cfg.graduate[1]) ||
                    (semester === 3 && week >= cfg.graduate[2] && week <= cfg.graduate[3])) {
                    academicPeriods[dateString].specialPeriod = PERIOD_TYPES.GRADUATE;
                }
            }
        }
    }

    return { holidays: holidayMap, days: daysMap, academicPeriods, weekNumbers };
}

// Format date as YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
