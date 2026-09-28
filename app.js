/* =============================================
   爸爸班表行事曆 - JavaScript 邏輯
   排班規則：早班3天 → 晚班3天 → 休假3天（9天循環）
   基準日：2026/9/28 = 晚班第2天（週期第5天）
   ============================================= */

// ===== 排班計算核心 =====

// 基準日：2026/9/28 為 晚班第2天 = 週期第5天 (0-indexed: 4)
const BASE_DATE = new Date(2026, 8, 28); // 月份從0開始，8=9月
const BASE_CYCLE_INDEX = 4; // 0-indexed: 早班0-2, 晚班3-5, 休假6-8

// 班別定義
const SHIFTS = [
  { type: 'morning', label: '早班', tag: '早', dayNum: 1 },
  { type: 'morning', label: '早班', tag: '早', dayNum: 2 },
  { type: 'morning', label: '早班', tag: '早', dayNum: 3 },
  { type: 'night',   label: '晚班', tag: '晚', dayNum: 1 },
  { type: 'night',   label: '晚班', tag: '晚', dayNum: 2 },
  { type: 'night',   label: '晚班', tag: '晚', dayNum: 3 },
  { type: 'off',     label: '休假', tag: '休', dayNum: 1 },
  { type: 'off',     label: '休假', tag: '休', dayNum: 2 },
  { type: 'off',     label: '休假', tag: '休', dayNum: 3 },
];

const SHIFT_ICONS = {
  morning: '🌅',
  night:   '🌙',
  off:     '🏖️',
};

/**
 * 計算某日期的班別資訊
 * @param {Date} date
 * @returns {{ type, label, tag, dayNum }}
 */
function getShiftInfo(date) {
  const base = new Date(BASE_DATE);
  base.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  const diffMs = d - base;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  // 計算週期索引
  let cyclePos = ((BASE_CYCLE_INDEX + diffDays) % 9 + 9) % 9;
  return SHIFTS[cyclePos];
}

// ===== 狀態管理 =====
const today = new Date();
today.setHours(0, 0, 0, 0);

let currentYear  = today.getFullYear();
let currentMonth = today.getMonth(); // 0-indexed
let selectedDate = new Date(today);

// Picker 狀態
let pickerYear  = today.getFullYear();
let pickerMonth = today.getMonth() + 1; // 1-indexed
let pickerDay   = today.getDate();

// ===== 工具函數 =====
function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate();
}

function formatDateChinese(date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const w = weekdays[date.getDay()];
  return `${y}年${m}月${d}日（週${w}）`;
}

// ===== 月曆渲染 =====
function renderCalendar() {
  const title = document.getElementById('calendarTitle');
  title.textContent = `${currentYear}年 ${currentMonth + 1}月`;

  const body = document.getElementById('calendarBody');
  body.innerHTML = '';

  const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0=Sun
  const totalDays = daysInMonth(currentYear, currentMonth);

  // 空白格填充
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-cell empty';
    body.appendChild(empty);
  }

  // 日期格
  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(currentYear, currentMonth, d);
    const shift = getShiftInfo(date);
    const dayOfWeek = date.getDay();
    const isToday = isSameDay(date, today);
    const isSelected = isSameDay(date, selectedDate);

    const cell = document.createElement('div');
    let classes = ['cal-cell', shift.type];
    if (isToday) classes.push('today');
    if (isSelected) classes.push('selected');
    if (dayOfWeek === 0) classes.push('sunday');
    if (dayOfWeek === 6) classes.push('saturday');
    cell.className = classes.join(' ');

    cell.innerHTML = `
      <span class="cell-num">${d}</span>
      <span class="cell-tag">${shift.tag}${shift.dayNum}</span>
    `;

    cell.addEventListener('click', () => {
      selectDate(date);
    });

    body.appendChild(cell);
  }

  // 更新資訊卡（保持選中狀態）
  updateInfoCard(selectedDate);
}

// ===== 資訊卡更新 =====
function updateInfoCard(date) {
  const shift = getShiftInfo(date);
  const card  = document.getElementById('infoCard');
  const icon  = document.getElementById('infoIcon');
  const dateEl  = document.getElementById('infoDate');
  const shiftEl = document.getElementById('infoShift');

  card.className = `info-card ${shift.type}`;
  icon.textContent = SHIFT_ICONS[shift.type];
  dateEl.textContent  = formatDateChinese(date);
  shiftEl.textContent = `${shift.label}　第 ${shift.dayNum} 天`;
}

// ===== 選擇日期 =====
function selectDate(date) {
  selectedDate = new Date(date);
  selectedDate.setHours(0, 0, 0, 0);

  // 切換月份到選中日期
  currentYear  = selectedDate.getFullYear();
  currentMonth = selectedDate.getMonth();

  // 同步 picker
  pickerYear  = selectedDate.getFullYear();
  pickerMonth = selectedDate.getMonth() + 1;
  pickerDay   = selectedDate.getDate();
  scrollPickerToValues();

  renderCalendar();
}

// ===== 月份切換 =====
function changeMonth(delta) {
  currentMonth += delta;
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  if (currentMonth < 0)  { currentMonth = 11; currentYear--; }
  renderCalendar();
}

// ===== 今天按鈕 =====
function goToToday() {
  selectDate(today);
}

// ===== 滾輪選擇器 =====
const YEAR_MIN = 2020;
const YEAR_MAX = 2050;
const years  = Array.from({ length: YEAR_MAX - YEAR_MIN + 1 }, (_, i) => YEAR_MIN + i);
const months = Array.from({ length: 12 }, (_, i) => i + 1);

function getDays(year, month) {
  return Array.from({ length: daysInMonth(year, month - 1) }, (_, i) => i + 1);
}

function buildPickerItems(containerId, items, selectedVal, formatFn) {
  const scroll = document.getElementById(containerId);
  scroll.innerHTML = '';
  items.forEach(val => {
    const item = document.createElement('div');
    item.className = 'picker-item' + (val === selectedVal ? ' selected' : '');
    item.textContent = formatFn ? formatFn(val) : String(val);
    item.dataset.val = val;
    scroll.appendChild(item);
  });

  // Add highlight bar
  const col = scroll.parentElement;
  if (!col.querySelector('.picker-highlight')) {
    const hl = document.createElement('div');
    hl.className = 'picker-highlight';
    col.appendChild(hl);
  }
}

function scrollPickerToValues() {
  scrollTo('yearScroll',  years,             pickerYear,  null);
  scrollTo('monthScroll', months,            pickerMonth, null);
  const days = getDays(pickerYear, pickerMonth);
  const clampedDay = Math.min(pickerDay, days[days.length - 1]);
  scrollTo('dayScroll',   days,              clampedDay,  null);
}

function scrollTo(scrollId, items, selectedVal, formatFn) {
  buildPickerItems(scrollId, items, selectedVal, formatFn);
  const scroll = document.getElementById(scrollId);
  const idx = items.indexOf(selectedVal);
  if (idx === -1) return;
  const targetY = idx * 40; // each item is 40px
  scroll.style.transition = 'none';
  scroll.style.transform = `translateY(-${targetY}px)`;
  // Mark selected
  scroll.querySelectorAll('.picker-item').forEach((el, i) => {
    el.classList.toggle('selected', i === idx);
  });
}

// ===== 觸控滾輪邏輯 =====
function initPicker(colId, scrollId, getItems, getCurrentVal, onSelect) {
  const col    = document.getElementById(colId);
  const scroll = document.getElementById(scrollId);

  let startY   = 0;
  let startTranslate = 0;
  let currentTranslate = 0;
  let isDragging = false;
  let velocity = 0;
  let lastY = 0;
  let lastTime = 0;
  let animFrame = null;

  function getTranslate() {
    const style = window.getComputedStyle(scroll);
    const mat = new DOMMatrix(style.transform);
    return mat.m42;
  }

  function snapToItem(translate) {
    const items = getItems();
    const itemH = 40;
    const maxTranslate = 0;
    const minTranslate = -(items.length - 1) * itemH;
    let clamped = Math.max(minTranslate, Math.min(maxTranslate, translate));
    let idx = Math.round(-clamped / itemH);
    idx = Math.max(0, Math.min(items.length - 1, idx));
    return { idx, translate: -idx * itemH };
  }

  function applyTranslate(y, animated = true) {
    scroll.style.transition = animated ? 'transform 0.25s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none';
    scroll.style.transform = `translateY(${y}px)`;
  }

  function highlightItem(idx) {
    scroll.querySelectorAll('.picker-item').forEach((el, i) => {
      el.classList.toggle('selected', i === idx);
    });
  }

  function onPointerDown(e) {
    if (animFrame) cancelAnimationFrame(animFrame);
    isDragging = true;
    startY = e.touches ? e.touches[0].clientY : e.clientY;
    startTranslate = getTranslate();
    currentTranslate = startTranslate;
    velocity = 0;
    lastY = startY;
    lastTime = Date.now();
    scroll.style.transition = 'none';
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const dy = clientY - startY;
    const now = Date.now();
    velocity = (clientY - lastY) / (now - lastTime + 1) * 16;
    lastY = clientY;
    lastTime = now;

    const items = getItems();
    const maxT = 40; // allow slight drag past edge
    const minT = -(items.length - 1) * 40 - maxT;
    currentTranslate = Math.max(minT, Math.min(maxT, startTranslate + dy));
    scroll.style.transform = `translateY(${currentTranslate}px)`;

    // Live highlight
    const { idx } = snapToItem(currentTranslate);
    highlightItem(idx);
    e.preventDefault();
  }

  function onPointerUp(e) {
    if (!isDragging) return;
    isDragging = false;

    // Inertia
    let translate = currentTranslate + velocity * 8;
    const { idx, translate: snapped } = snapToItem(translate);

    applyTranslate(snapped, true);
    highlightItem(idx);
    currentTranslate = snapped;

    // Commit value
    const items = getItems();
    if (items[idx] !== undefined) {
      onSelect(items[idx]);
    }
  }

  col.addEventListener('touchstart', onPointerDown, { passive: false });
  col.addEventListener('touchmove',  onPointerMove, { passive: false });
  col.addEventListener('touchend',   onPointerUp);

  // Mouse support (for testing on desktop)
  col.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', (e) => { if (isDragging) onPointerMove(e); });
  window.addEventListener('mouseup',   (e) => { if (isDragging) onPointerUp(e); });

  // Wheel support
  col.addEventListener('wheel', (e) => {
    e.preventDefault();
    const items = getItems();
    const curT = getTranslate();
    const { idx } = snapToItem(curT);
    const dir = e.deltaY > 0 ? 1 : -1;
    const newIdx = Math.max(0, Math.min(items.length - 1, idx + dir));
    const newT = -newIdx * 40;
    applyTranslate(newT, true);
    highlightItem(newIdx);
    currentTranslate = newT;
    onSelect(items[newIdx]);
  }, { passive: false });
}

// ===== 初始化滾輪 =====
function initAllPickers() {
  // Year
  initPicker('yearPicker', 'yearScroll',
    () => years,
    () => pickerYear,
    (val) => {
      pickerYear = val;
      rebuildDayPicker();
      triggerPickerUpdate();
    }
  );

  // Month
  initPicker('monthPicker', 'monthScroll',
    () => months,
    () => pickerMonth,
    (val) => {
      pickerMonth = val;
      rebuildDayPicker();
      triggerPickerUpdate();
    }
  );

  // Day
  initPicker('dayPicker', 'dayScroll',
    () => getDays(pickerYear, pickerMonth),
    () => pickerDay,
    (val) => {
      pickerDay = val;
      triggerPickerUpdate();
    }
  );
}

function rebuildDayPicker() {
  const days = getDays(pickerYear, pickerMonth);
  pickerDay = Math.min(pickerDay, days[days.length - 1]);
  scrollTo('dayScroll', days, pickerDay, null);
  // Re-init not needed, getItems() is dynamic
}

function triggerPickerUpdate() {
  const date = new Date(pickerYear, pickerMonth - 1, pickerDay);
  date.setHours(0, 0, 0, 0);
  selectedDate = date;
  currentYear  = pickerYear;
  currentMonth = pickerMonth - 1;
  renderCalendar();
}

// ===== 啟動 =====
function init() {
  // Build initial pickers
  scrollTo('yearScroll',  years,                       pickerYear,  null);
  scrollTo('monthScroll', months,                      pickerMonth, null);
  scrollTo('dayScroll',   getDays(pickerYear, pickerMonth), pickerDay, null);

  initAllPickers();
  renderCalendar();
  updateInfoCard(selectedDate);
}

document.addEventListener('DOMContentLoaded', init);

// ===== PWA Service Worker 註冊 =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.log('SW error:', err));
  });
}
