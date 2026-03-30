<template>
  <div class="relative w-full min-h-full flex flex-col select-none bg-slate-50/50">
    <!-- Background blobs -->
    <div class="fixed top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-400/15 rounded-full blur-[120px] mix-blend-multiply animate-blob pointer-events-none z-0"></div>
    <div class="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-400/15 rounded-full blur-[120px] mix-blend-multiply animate-blob animation-delay-2000 pointer-events-none z-0"></div>
    <div class="fixed top-[30%] right-[20%] w-[400px] h-[400px] bg-pink-300/10 rounded-full blur-[100px] mix-blend-multiply animate-blob animation-delay-4000 pointer-events-none z-0"></div>

    <!-- Content: fills available height, distributes space -->
    <div class="relative z-10 w-full max-w-5xl mx-auto px-7 pt-14 pb-6 flex flex-col flex-1 min-h-0 gap-0">

      <!-- ── Header ── -->
      <div
        class="flex items-start justify-between pb-4 opacity-0 animate-fade-in-up"
        style="animation-delay:0.08s;animation-fill-mode:forwards;"
      >
        <!-- Left: zodiac badge + text info -->
        <div class="flex items-start gap-4">
          <!-- Zodiac SVG badge, colored by five-element -->
          <div
            :class="`w-16 h-16 rounded-2xl border shadow-sm flex items-center justify-center p-2 shrink-0 ${zodiacBadgeClass}`"
            v-html="zodiacSvgHtml"
          ></div>

          <!-- Text -->
          <div class="flex flex-col gap-1.5 pt-1">
            <h1 class="text-3xl font-semibold text-slate-600 leading-none">{{ translatedGreeting }}</h1>
            <div class="text-sm text-slate-400 tracking-wide">{{ dateString }}</div>
            <div class="flex items-center gap-1.5 text-sm">
              <span class="text-slate-500">{{ ganzhiStr }} · {{ zodiacName }}年</span>
              <span class="text-slate-300">·</span>
              <span class="text-slate-400">{{ lunarMonthDay }}</span>
            </div>
          </div>
        </div>

        <!-- Right: clock + 时辰 -->
        <div class="flex flex-col items-end gap-1.5 shrink-0">
          <div
            v-if="settings.clockStyle === 'digital'"
            class="text-[3.25rem] leading-none font-extralight text-slate-700 tracking-tighter font-mono tabular-nums"
          >
            {{ timeString }}
          </div>
          <div
            v-else
            class="relative w-14 h-14 rounded-full border-2 border-slate-200 bg-white/50 backdrop-blur-sm shadow-md"
          >
            <div class="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-slate-700 rounded-full -translate-x-1/2 -translate-y-1/2 z-20"></div>
            <div
              class="absolute top-1/2 left-1/2 w-[3px] h-[14px] bg-slate-800 rounded-full origin-bottom z-10 transition-transform duration-500 ease-[cubic-bezier(0.4,2.08,0.55,0.44)]"
              :style="{ transform: `translate(-50%, -100%) rotate(${hourDeg}deg)` }"
            ></div>
            <div
              class="absolute top-1/2 left-1/2 w-[2px] h-[18px] bg-slate-600 rounded-full origin-bottom z-10 transition-transform duration-300 ease-[cubic-bezier(0.4,2.08,0.55,0.44)]"
              :style="{ transform: `translate(-50%, -100%) rotate(${minuteDeg}deg)` }"
            ></div>
            <div
              v-if="settings.showSeconds"
              class="absolute top-1/2 left-1/2 w-px h-5 bg-red-400 rounded-full origin-bottom z-10 transition-transform duration-75"
              :style="{ transform: `translate(-50%, -100%) rotate(${secondDeg}deg)` }"
            ></div>
          </div>
          <div class="text-sm text-slate-400 tracking-widest">{{ chineseTimeString }}</div>
        </div>
      </div>

      <!-- ── Divider ── -->
      <div class="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

      <!-- ── Progress strips (side by side) ── -->
      <div
        class="py-2.5 opacity-0 animate-fade-in-up"
        style="animation-delay:0.18s;animation-fill-mode:forwards;"
      >
        <div class="flex gap-4">
          <!-- Solar term -->
          <div class="flex-1 flex items-center gap-2.5">
            <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">{{ prevSolarTerm }}</span>
            <div class="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                class="h-full rounded-full bg-gradient-to-r from-emerald-300 to-teal-300 transition-all duration-1000 ease-out"
                :style="{ width: solarTermProgress + '%' }"
              ></div>
            </div>
            <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 shrink-0">{{ nextSolarTerm }}</span>
            <span class="text-xs text-slate-400 shrink-0 min-w-[3.5em] text-right">{{ daysUntilNextTerm }}天后</span>
          </div>

          <div class="w-px bg-slate-200 shrink-0"></div>

          <!-- Year progress -->
          <div class="flex-1 flex items-center gap-2.5">
            <span class="text-xs text-slate-400 shrink-0">{{ currentYear }}年</span>
            <div class="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                class="h-full rounded-full bg-gradient-to-r from-amber-300 to-orange-300 transition-all duration-1000 ease-out"
                :style="{ width: yearProgress + '%' }"
              ></div>
            </div>
            <span class="text-xs text-slate-400 shrink-0">{{ yearProgress }}%</span>
            <span class="text-xs text-slate-400 shrink-0 min-w-[4em] text-right">剩{{ yearDaysLeft }}天</span>
          </div>
        </div>
      </div>

      <!-- ── Divider ── -->
      <div class="h-px bg-gradient-to-r from-transparent via-slate-100 to-transparent"></div>

      <!-- ── Quick Launch cards ── -->
      <div
        class="pt-4 flex flex-col opacity-0 animate-fade-in-up"
        style="animation-delay:0.28s;animation-fill-mode:forwards;"
      >
        <p class="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
          {{ t('home.quick_launch') }}
        </p>
        <div class="grid grid-cols-4 gap-3">
          <router-link
            v-for="f in features"
            :key="f.path"
            :to="f.path"
            class="group flex flex-col gap-3 p-5 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
          >
            <div :class="`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0 ${f.color}`">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path :d="f.icon" />
              </svg>
            </div>
            <div class="flex flex-col gap-1 min-h-0">
              <div class="text-sm font-semibold text-slate-700 group-hover:text-slate-900 leading-tight">{{ t(f.name) }}</div>
              <div class="text-xs text-slate-400 leading-relaxed">{{ t(f.desc) }}</div>
            </div>
          </router-link>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { settings } from '../../store/settings';

const { t } = useI18n();

// ── Refs ───────────────────────────────────────────────────────────────────────
const timeString        = ref('');
const dateString        = ref('');
const chineseTimeString = ref('');
const ganzhiStr         = ref('');
const zodiacName        = ref('');
const lunarMonthDay     = ref('');
const prevSolarTerm     = ref('');
const nextSolarTerm     = ref('');
const daysUntilNextTerm = ref(0);
const solarTermProgress = ref(0);
const yearProgress      = ref(0);
const yearDaysLeft      = ref(0);
const currentYear       = ref(new Date().getFullYear());
const ganIndex          = ref(2);  // 甲=0…癸=9; default 丙=2 (2026)
const zhiIndex          = ref(6);  // 子=0…亥=11; default 午=6 (2026)
const greetingKey       = ref('home.greeting.morning');
const hourDeg           = ref(0);
const minuteDeg         = ref(0);
const secondDeg         = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;

const translatedGreeting = computed(() => t(greetingKey.value));

// ── Features ───────────────────────────────────────────────────────────────────
const features = [
  { path: '/text',            name: 'sidebar.text_manipulation', desc: 'home.features.text.desc',      color: 'bg-blue-500',   icon: 'M4 6h16M4 10h12M4 14h8M4 18h6' },
  { path: '/text/bibtex',     name: 'sidebar.bibtex_converter',  desc: 'home.features.bibtex.desc',    color: 'bg-indigo-500', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { path: '/text/diff',       name: 'sidebar.diff_viewer',       desc: 'home.features.diff.desc',      color: 'bg-cyan-500',   icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
  { path: '/text/stats',      name: 'sidebar.text_stats',        desc: 'home.features.stats.desc',     color: 'bg-teal-500',   icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { path: '/paper/color',     name: 'sidebar.color_scheme',      desc: 'home.features.color.desc',     color: 'bg-violet-500', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
  { path: '/latex',           name: 'sidebar.latex2png',         desc: 'home.features.latex.desc',     color: 'bg-purple-500', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { path: '/media/remove-bg', name: 'sidebar.remove_bg',         desc: 'home.features.remove_bg.desc', color: 'bg-pink-500',   icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { path: '/misc/printer',    name: 'sidebar.printer',           desc: 'home.features.printer.desc',   color: 'bg-orange-500', icon: 'M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z' },
];

// ── Five-element badge colors (天干 index 0-9 → element) ──────────────────────
// 甲乙=木(green), 丙丁=火(amber), 戊己=土(yellow), 庚辛=金(slate), 壬癸=水(blue)
const ELEMENT_BADGE = [
  'bg-emerald-50 border-emerald-200 text-emerald-600', // 甲 Wood
  'bg-emerald-50 border-emerald-200 text-emerald-600', // 乙 Wood
  'bg-amber-50   border-amber-200   text-amber-600',   // 丙 Fire
  'bg-amber-50   border-amber-200   text-amber-600',   // 丁 Fire
  'bg-yellow-50  border-yellow-200  text-yellow-600',  // 戊 Earth
  'bg-yellow-50  border-yellow-200  text-yellow-600',  // 己 Earth
  'bg-slate-100  border-slate-300   text-slate-500',   // 庚 Metal
  'bg-slate-100  border-slate-300   text-slate-500',   // 辛 Metal
  'bg-blue-50    border-blue-200    text-blue-600',    // 壬 Water
  'bg-blue-50    border-blue-200    text-blue-600',    // 癸 Water
];

const zodiacBadgeClass = computed(() => ELEMENT_BADGE[ganIndex.value] ?? ELEMENT_BADGE[0]);


// Render the zodiac character (马/虎/龙…) in large serif — clean and instantly readable
const zodiacSvgHtml = computed(() => {
  const char = ZODIAC_NAMES[zhiIndex.value] ?? '马';
  return `<svg viewBox="0 0 100 100" width="100%" height="100%"><text x="50" y="78" text-anchor="middle" font-size="74" fill="currentColor" font-family="serif, 'Songti SC', 'STSong', 'SimSun'">${char}</text></svg>`;
});

// ── Chinese New Year dates (ganzhi/zodiac year boundary) ──────────────────────
const CNY_DATES: Record<number, [number, number]> = {
  2020:[1,25], 2021:[2,12], 2022:[2, 1], 2023:[1,22],
  2024:[2,10], 2025:[1,29], 2026:[2,17], 2027:[2, 6],
  2028:[1,26], 2029:[2,13], 2030:[2, 3], 2031:[1,23],
  2032:[2,11], 2033:[1,31], 2034:[2,19], 2035:[2, 8],
};

// ── 24 Solar Terms ─────────────────────────────────────────────────────────────
const TERM_NAMES = ['小寒','大寒','立春','雨水','惊蛰','春分','清明','谷雨','立夏','小满','芒种','夏至','小暑','大暑','立秋','处暑','白露','秋分','寒露','霜降','立冬','小雪','大雪','冬至'];
const TERM_C     = [5.4055,20.12,3.87,18.73,5.63,20.646,4.81,20.1,5.52,21.04,5.678,21.37,7.108,22.83,7.5,23.13,7.646,23.042,8.318,23.438,7.438,22.36,7.18,21.94];
const TERM_MONTH = [1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12];

const calcTermDay = (year: number, i: number) => {
  const Y = year - 2000;
  return Math.floor(Y * 0.2422 + TERM_C[i]) - Math.floor(Y / 4);
};
const buildTerms = (year: number) =>
  TERM_NAMES.map((name, i) => ({ name, date: new Date(year, TERM_MONTH[i] - 1, calcTermDay(year, i)) }));

const getSolarTermInfo = (now: Date) => {
  const y = now.getFullYear();
  const terms = [...buildTerms(y - 1).slice(-3), ...buildTerms(y), ...buildTerms(y + 1).slice(0, 3)]
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  for (let i = 1; i < terms.length; i++) {
    const p = terms[i - 1].date.getTime(), n = terms[i].date.getTime();
    if (today >= p && today < n) {
      const total = Math.round((n - p) / 86400000), passed = Math.round((today - p) / 86400000);
      return { prev: terms[i - 1].name, next: terms[i].name, daysUntilNext: Math.max(1, Math.round((n - today) / 86400000)), progress: Math.min(99, Math.round((passed / total) * 100)) };
    }
  }
  return { prev: '冬至', next: '小寒', daysUntilNext: 1, progress: 50 };
};

// ── 时辰 ───────────────────────────────────────────────────────────────────────
const getChineseTime = (hour: number, minute: number) => {
  const stems = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  const ke    = ['初刻','一刻','二刻','三刻'];
  const stemIndex = hour === 23 ? 0 : Math.ceil(hour / 2) % 12;
  const phase     = hour === 23 ? '初' : hour % 2 === 0 ? '正' : '初';
  return `${stems[stemIndex]}${phase}${ke[Math.floor(minute / 15)]}`;
};

// ── Ganzhi / Zodiac ────────────────────────────────────────────────────────────
const GAN          = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const ZHI          = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const ZODIAC_NAMES = ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];

// ── Main update loop ───────────────────────────────────────────────────────────
const updateTime = () => {
  const now = new Date();
  const sec = now.getSeconds(), min = now.getMinutes(), hr = now.getHours();

  // Clock
  const opts: Intl.DateTimeFormatOptions = { hour12: false, hour: '2-digit', minute: '2-digit' };
  if (settings.showSeconds) opts.second = '2-digit';
  timeString.value    = now.toLocaleTimeString(settings.language === 'zh' ? 'zh-CN' : 'en-US', opts);
  secondDeg.value     = sec * 6;
  minuteDeg.value     = min * 6 + sec * 0.1;
  hourDeg.value       = (hr % 12) * 30 + min * 0.5;
  chineseTimeString.value = getChineseTime(hr, min);

  // Ganzhi + zodiac (CNY-corrected)
  let y = now.getFullYear();
  const cny = CNY_DATES[y];
  if (cny && now < new Date(y, cny[0] - 1, cny[1])) y--;
  const gi = ((y - 2024) % 10 + 10) % 10;
  const zi = (((y - 2024) % 12) + 4 + 12) % 12;
  ganIndex.value  = gi;
  zhiIndex.value  = zi;
  ganzhiStr.value = GAN[gi] + ZHI[zi] + '年';
  zodiacName.value = ZODIAC_NAMES[zi];

  // Lunar month+day
  try {
    const md = new Intl.DateTimeFormat('zh-u-ca-chinese', { month: 'long', day: 'numeric' }).format(now);
    if (md && /[月日]/.test(md)) lunarMonthDay.value = md;
  } catch { /* keep previous */ }

  // Gregorian date
  dateString.value = now.toLocaleDateString(
    settings.language === 'zh' ? 'zh-CN' : 'en-US',
    { weekday: 'long', month: 'long', day: 'numeric' },
  );

  // Greeting
  if      (hr >= 5  && hr < 12) greetingKey.value = 'home.greeting.morning';
  else if (hr >= 12 && hr < 18) greetingKey.value = 'home.greeting.afternoon';
  else if (hr >= 18 && hr < 22) greetingKey.value = 'home.greeting.evening';
  else                           greetingKey.value = 'home.greeting.night';

  // Solar terms
  const sti = getSolarTermInfo(now);
  prevSolarTerm.value     = sti.prev;
  nextSolarTerm.value     = sti.next;
  daysUntilNextTerm.value = sti.daysUntilNext;
  solarTermProgress.value = sti.progress;

  // Year progress
  const y0 = now.getFullYear();
  const yearStart    = new Date(y0, 0, 1).getTime();
  const yearEnd      = new Date(y0 + 1, 0, 1).getTime();
  const totalDays    = Math.round((yearEnd - yearStart) / 86400000);
  const passedDays   = Math.round((now.getTime() - yearStart) / 86400000);
  currentYear.value  = y0;
  yearProgress.value = Math.min(99, Math.round((passedDays / totalDays) * 100));
  yearDaysLeft.value = totalDays - passedDays;
};

onMounted(() => { updateTime(); timer = setInterval(updateTime, 1000); });
onUnmounted(() => { if (timer) clearInterval(timer); });
</script>

<style scoped>
@keyframes blob {
  0%   { transform: translate(0, 0) scale(1); }
  33%  { transform: translate(30px, -50px) scale(1.1); }
  66%  { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0, 0) scale(1); }
}
.animate-blob { animation: blob 10s infinite; }
.animation-delay-2000 { animation-delay: 2s; }
.animation-delay-4000 { animation-delay: 4s; }

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up { animation: fadeInUp 0.7s ease-out; }
</style>
