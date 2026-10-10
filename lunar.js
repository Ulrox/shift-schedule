/* =============================================
   農曆 / 節氣 / 節日 計算（離線，無外部套件）
   - 農曆：瀏覽器內建 Intl 中國曆（固定台灣時區）
   - 節氣：太陽黃經公式計算（台灣時間 UTC+8）
   ============================================= */

const LUNAR_FMT = new Intl.DateTimeFormat('zh-TW-u-ca-chinese', {
  timeZone: 'Asia/Taipei', month: 'numeric', day: 'numeric'
});

const LUNAR_DAY_NAMES = [
  '', '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
];
const LUNAR_MONTH_NAMES = ['', '正月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月'];

function getLunar(date) {
  // 以中午計算，避免時區邊界問題
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  const parts = LUNAR_FMT.formatToParts(d);
  let m = parts.find(p => p.type === 'month').value;
  const day = parseInt(parts.find(p => p.type === 'day').value, 10);
  const leap = m.startsWith('閏');
  m = parseInt(m.replace('閏', ''), 10);
  return {
    month: m, day, leap,
    monthName: (leap ? '閏' : '') + LUNAR_MONTH_NAMES[m],
    dayName: LUNAR_DAY_NAMES[day]
  };
}

// ----- 節氣 -----
const SOLAR_TERMS = {
  315: '立春', 330: '雨水', 345: '驚蟄', 0: '春分', 15: '清明', 30: '穀雨',
  45: '立夏', 60: '小滿', 75: '芒種', 90: '夏至', 105: '小暑', 120: '大暑',
  135: '立秋', 150: '處暑', 165: '白露', 180: '秋分', 195: '寒露', 210: '霜降',
  225: '立冬', 240: '小雪', 255: '大雪', 270: '冬至', 285: '小寒', 300: '大寒'
};

function sunLongitude(ms) {
  const jd = ms / 86400000 + 2440587.5;
  const T = (jd - 2451545.0) / 36525;
  const rad = Math.PI / 180;
  const L0 = 280.46646 + 36000.76983 * T;
  const M = (357.52911 + 35999.05029 * T) * rad;
  const C = (1.914602 - 0.004817 * T) * Math.sin(M)
          + 0.019993 * Math.sin(2 * M) + 0.000289 * Math.sin(3 * M);
  const omega = (125.04 - 1934.136 * T) * rad;
  const lon = L0 + C - 0.00569 - 0.00478 * Math.sin(omega);
  return ((lon % 360) + 360) % 360;
}

function getSolarTerm(date) {
  // 台灣時間當天 00:00 ~ 24:00
  const start = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - 8 * 3600000;
  const a = sunLongitude(start);
  const b = sunLongitude(start + 86400000);
  const ka = Math.floor(a / 15), kb = Math.floor(b / 15);
  if (ka === kb) return null;
  return SOLAR_TERMS[((kb % 24) * 15)] || null;
}

// ----- 節日 -----
const SOLAR_HOLIDAYS = {
  '1-1': '元旦', '2-28': '和平', '4-4': '兒童', '5-1': '勞動', '10-10': '國慶'
};
const LUNAR_HOLIDAYS = {
  '1-1': '春節', '1-15': '元宵', '5-5': '端午', '7-7': '七夕', '8-15': '中秋', '9-9': '重陽'
};

function getHoliday(date, lunar) {
  const solar = SOLAR_HOLIDAYS[`${date.getMonth() + 1}-${date.getDate()}`];
  if (solar) return solar;
  if (!lunar.leap) {
    const l = LUNAR_HOLIDAYS[`${lunar.month}-${lunar.day}`];
    if (l) return l;
    // 除夕：隔天是正月初一
    const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    const n = getLunar(next);
    if (n.month === 1 && n.day === 1 && !n.leap) return '除夕';
  }
  return null;
}

/**
 * 回傳月曆格子要顯示的資訊與完整文字
 * @returns {{ label, kind, lunarFull, holiday, term }}
 *  kind: 'holiday' | 'term' | 'month' | 'day'
 */
function getDayExtra(date) {
  const lunar = getLunar(date);
  const holiday = getHoliday(date, lunar);
  const term = getSolarTerm(date);
  // 農曆行：每天都有；初一顯示月份
  const lunarLabel = lunar.day === 1 ? lunar.monthName : lunar.dayName;
  // 事件行：節日優先，其次節氣；沒有就留空
  const eventLabel = holiday || term || '';
  const eventKind  = holiday ? 'holiday' : (term ? 'term' : '');
  return {
    lunarLabel, eventLabel, eventKind, holiday, term,
    lunarFull: `農曆${lunar.monthName}${lunar.dayName}`,
    lunarShort: `${lunar.monthName}${lunar.dayName}`
  };
}
