// 时间工具：全站时间显示统一为北京时间（Asia/Shanghai）

const dateTimeFmt = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const dateFmt = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

// 数据中的时间字符串形如 "2026-08-01 20:00:00"，一律视为北京时间
export function parseBJ(str: string): Date {
  if (!str) return new Date(NaN);
  const m = str.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!m) return new Date(str); // 兜底：交给 Date 解析
  const [, y, mo, d, h = '00', mi = '00', s = '00'] = m;
  return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}+08:00`);
}

export function formatDateTimeBJ(str: string): string {
  const d = parseBJ(str);
  return isNaN(d.getTime()) ? '' : dateTimeFmt.format(d);
}

export function formatDateBJ(str: string): string {
  const d = parseBJ(str);
  return isNaN(d.getTime()) ? '' : dateFmt.format(d);
}

// 当前北京时间的年/月/日（数字），用于日历与当月判断
export function nowBJ(): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return { year: get('year'), month: get('month'), day: get('day') };
}

// 当前北京时间对应的 YYYY-MM
export function currentMonthBJ(): string {
  const { year, month } = nowBJ();
  return `${year}-${String(month).padStart(2, '0')}`;
}

// 倒计时：返回距目标（北京时间字符串）的剩余毫秒，已过期返回 <= 0
export function remainMs(str: string): number {
  return parseBJ(str).getTime() - Date.now();
}
