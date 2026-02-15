/**
 * RoutineRise
 */

// DOM Elements (script is loaded with `defer` so DOM is available)
const routineRise = document.getElementById('routine-rise');
const progressPulseValue = document.getElementById('progress-pulse-value');
const dailyElevationValue = document.getElementById('daily-elevation-value');
const progressPathValue = document.getElementById('progress-path-value');
const categoryFilter = document.getElementById('category-filter');
const goalNameInput = document.getElementById('goal-name');
const goalCategorySelect = document.getElementById('goal-category');
const addGoalForm = document.getElementById('add-goal-form');
const contactToggle = document.getElementById('contact-toggle');
const themeToggle = document.getElementById('theme-toggle');
const miniCalendar = document.getElementById('mini-calendar');

// Basic guards (avoid exceptions if elements are missing)
function $(el) { return document.getElementById(el); }

function handleAddGoal(e) {
  e.preventDefault();
  if (!goalNameInput) return;
  const name = goalNameInput.value.trim();
  const category = goalCategorySelect ? goalCategorySelect.value : '';
  if (!name) return;

  const item = document.createElement('div');
  item.className = 'panel goal-item';
  item.innerHTML = `
    <strong>${escapeHtml(name)}</strong>
    ${category ? `<div class="muted small">Category: ${escapeHtml(category)}</div>` : ''}
  `;
  routineRise && routineRise.appendChild(item);
  addGoalForm && addGoalForm.reset();
}

function toggleContact() {
  const contactFloat = document.querySelector('.contact-float');
  if (!contactFloat) return;
  const isOpen = contactFloat.classList.toggle('hidden') === false;
  contactFloat.setAttribute('aria-hidden', String(!isOpen));
  if (contactToggle) contactToggle.setAttribute('aria-pressed', String(isOpen));
}

/* Theme handling: apply, toggle, persist and init */
function applyTheme(isDark) {
  document.body.classList.toggle('dark-mode', !!isDark);
  if (themeToggle) {
    themeToggle.setAttribute('aria-pressed', String(!!isDark));
    themeToggle.textContent = !!isDark ? 'Light mode' : 'Dark mode';
  }
  try { localStorage.setItem('rr-theme', !!isDark ? 'dark' : 'light'); } catch (e) { /* ignore */ }
}

function toggleTheme() {
  applyTheme(!document.body.classList.contains('dark-mode'));
}

function initTheme() {
  try {
    const stored = localStorage.getItem('rr-theme');
    if (stored === 'dark' || stored === 'light') {
      applyTheme(stored === 'dark');
    } else if (window.matchMedia) {
      applyTheme(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  } catch (e) {
    if (window.matchMedia) applyTheme(window.matchMedia('(prefers-color-scheme: dark)').matches);
  }
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
}

/* Simple utility to avoid XSS when inserting text */
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* Mini calendar module */
(function () {
  const ensureCalendarDOM = () => {
    let container = document.getElementById('mini-calendar');
    if (container) return container;

    container = document.createElement('aside');
    container.id = 'mini-calendar';
    container.className = 'panel mini-calendar';
    container.setAttribute('aria-label', 'Mini calendar');
    container.innerHTML = `
      <div class="calendar-header">
        <button id="cal-prev" class="cal-nav" aria-label="Previous month">&lt;</button>
        <strong id="cal-title" class="cal-title"></strong>
        <button id="cal-next" class="cal-nav" aria-label="Next month">&gt;</button>
      </div>
      <div id="cal-grid" class="calendar-grid" role="grid" aria-live="polite"></div>
    `;
    const main = document.querySelector('main.container');
    if (main && main.parentNode) main.parentNode.insertBefore(container, main);
    else document.body.insertBefore(container, document.body.firstChild);
    return container;
  };

  const toISO = d => new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
  const startOfMonth = d => new Date(d.getFullYear(), d.getMonth(), 1);
  const daysInMonth = d => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

  let calendarDate = new Date();
  let selectedDateISO = null;

  function renderCalendar(date) {
    const container = ensureCalendarDOM();
    const title = container.querySelector('#cal-title');
    const grid = container.querySelector('#cal-grid');
    if (!title || !grid) return;

    calendarDate = new Date(date.getFullYear(), date.getMonth(), 1);
    title.textContent = calendarDate.toLocaleString(undefined, { month: 'long', year: 'numeric' });
    grid.innerHTML = '';

    const weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const headerRow = document.createElement('div');
    headerRow.className = 'calendar-row calendar-weekdays';
    weekdays.forEach(w => {
      const h = document.createElement('div');
      h.className = 'weekday';
      h.textContent = w;
      headerRow.appendChild(h);
    });
    grid.appendChild(headerRow);

    const firstDayIndex = startOfMonth(calendarDate).getDay();
    const totalDays = daysInMonth(calendarDate);
    const prevMonthLast = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 0).getDate();

    const days = [];
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({ day: prevMonthLast - i, other: true, date: new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, prevMonthLast - i) });
    }
    for (let d = 1; d <= totalDays; d++) {
      days.push({ day: d, other: false, date: new Date(calendarDate.getFullYear(), calendarDate.getMonth(), d) });
    }
    while (days.length % 7 !== 0) {
      const nextIndex = days.length - firstDayIndex - totalDays + 1;
      days.push({ day: nextIndex, other: true, date: new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, nextIndex) });
    }

    for (let i = 0; i < days.length; i += 7) {
      const row = document.createElement('div');
      row.className = 'calendar-row';
      for (let j = 0; j < 7; j++) {
        const d = days[i + j];
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'calendar-cell';
        if (d.other) cell.classList.add('other-month');
        if ((new Date()).toDateString() === d.date.toDateString()) cell.classList.add('today');
        const iso = toISO(d.date);
        cell.dataset.date = iso;
        cell.textContent = d.day;
        if (selectedDateISO === iso) cell.classList.add('selected');
        cell.addEventListener('click', () => {
          container.querySelectorAll('.calendar-cell.selected').forEach(n => n.classList.remove('selected'));
          cell.classList.add('selected');
          selectedDateISO = iso;
          const ev = new CustomEvent('rr:date-selected', { detail: { date: new Date(iso) } });
          document.dispatchEvent(ev);
        });
        row.appendChild(cell);
      }
      grid.appendChild(row);
    }
  }

  function initCalendar() {
    const container = ensureCalendarDOM();
    const prev = container.querySelector('#cal-prev');
    const next = container.querySelector('#cal-next');

    prev && prev.addEventListener('click', () => renderCalendar(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1)));
    next && next.addEventListener('click', () => renderCalendar(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1)));

    container.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') renderCalendar(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
      if (e.key === 'ArrowRight') renderCalendar(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
    });

    renderCalendar(new Date());
  }

  window.RR_initCalendar = initCalendar;

  if (document.readyState !== 'loading') initCalendar();
  else document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('cal-grid')) initCalendar();
  });
})();

/* Init app */
function init() {
  if (addGoalForm) addGoalForm.addEventListener('submit', handleAddGoal);
  if (contactToggle) contactToggle.addEventListener('click', toggleContact);
  initTheme();
  // wire calendar init (safe if already initialized)
  if (window.RR_initCalendar) window.RR_initCalendar();
}

/* Run init on DOM ready */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}