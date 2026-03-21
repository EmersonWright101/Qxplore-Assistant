<template>
  <div class="relative h-full w-full overflow-y-auto overflow-x-hidden select-none bg-slate-50/50">
    <!-- Background blobs (fixed so they stay while scrolling) -->
    <div class="fixed top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-400/15 rounded-full blur-[120px] mix-blend-multiply animate-blob pointer-events-none z-0"></div>
    <div class="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-400/15 rounded-full blur-[120px] mix-blend-multiply animate-blob animation-delay-2000 pointer-events-none z-0"></div>
    <div class="fixed top-[30%] right-[20%] w-[400px] h-[400px] bg-pink-300/10 rounded-full blur-[100px] mix-blend-multiply animate-blob animation-delay-4000 pointer-events-none z-0"></div>

    <div class="relative z-10 flex flex-col items-center px-8 pb-10">

      <!-- Hero: greeting + clock + date -->
      <div class="flex flex-col items-center pt-10 pb-8">
        <h1 class="text-4xl font-bold tracking-tight opacity-0 animate-fade-in-up" style="animation-delay: 0.1s; animation-fill-mode: forwards;">
          <span class="bg-clip-text text-transparent bg-gradient-to-r from-slate-700 to-slate-500">
            {{ translatedGreeting }}
          </span>
        </h1>

        <div class="mt-3 flex items-center justify-center opacity-0 animate-fade-in-up" style="animation-delay: 0.25s; animation-fill-mode: forwards;">
          <div v-if="settings.clockStyle === 'digital'" class="text-center">
            <div class="text-[5.5rem] leading-none font-extralight text-slate-700 tracking-tighter font-mono tabular-nums">
              {{ timeString }}
            </div>
          </div>

          <div v-else class="relative w-40 h-40 rounded-full border-4 border-slate-200 bg-white/40 backdrop-blur-sm shadow-xl">
            <div class="absolute top-1/2 left-1/2 w-3 h-3 bg-slate-700 rounded-full -translate-x-1/2 -translate-y-1/2 z-20"></div>
            <div
              class="absolute top-1/2 left-1/2 w-1.5 h-10 bg-slate-800 rounded-full origin-bottom z-10 transition-transform duration-500 ease-[cubic-bezier(0.4,2.08,0.55,0.44)]"
              :style="{ transform: `translate(-50%, -100%) rotate(${hourDeg}deg)` }"
            ></div>
            <div
              class="absolute top-1/2 left-1/2 w-1 h-14 bg-slate-600 rounded-full origin-bottom z-10 transition-transform duration-300 ease-[cubic-bezier(0.4,2.08,0.55,0.44)]"
              :style="{ transform: `translate(-50%, -100%) rotate(${minuteDeg}deg)` }"
            ></div>
            <div
              v-if="settings.showSeconds"
              class="absolute top-1/2 left-1/2 w-0.5 h-16 bg-red-500 rounded-full origin-bottom z-10 transition-transform duration-75 ease-linear"
              :style="{ transform: `translate(-50%, -100%) rotate(${secondDeg}deg)` }"
            ></div>
            <div v-if="settings.showSeconds" class="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-red-500 rounded-full -translate-x-1/2 -translate-y-1/2 z-20"></div>
          </div>
        </div>

        <div class="mt-2 text-sm text-slate-400 font-medium tracking-[0.18em] uppercase opacity-0 animate-fade-in-up" style="animation-delay: 0.4s; animation-fill-mode: forwards;">
          {{ dateString }}
        </div>
      </div>

      <!-- Quick Launch Cards -->
      <div class="w-full max-w-3xl opacity-0 animate-fade-in-up" style="animation-delay: 0.55s; animation-fill-mode: forwards;">
        <p class="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3 text-center">
          {{ t('home.quick_launch') }}
        </p>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <router-link
            v-for="f in features"
            :key="f.path"
            :to="f.path"
            class="group flex flex-col gap-2.5 p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
          >
            <div :class="`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm ${f.color}`">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path :d="f.icon" />
              </svg>
            </div>
            <div>
              <div class="text-sm font-semibold text-slate-700 group-hover:text-slate-900 leading-tight">{{ t(f.name) }}</div>
              <div class="text-[11px] text-slate-400 leading-relaxed mt-0.5">{{ t(f.desc) }}</div>
            </div>
          </router-link>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { settings } from '../../store/settings';

const { t } = useI18n();

const timeString = ref('');
const dateString = ref('');
const greetingKey = ref('home.greeting.morning');
const hourDeg = ref(0);
const minuteDeg = ref(0);
const secondDeg = ref(0);
let timer: any = null;

const translatedGreeting = computed(() => t(greetingKey.value));

const features = [
  {
    path: '/text',
    name: 'sidebar.text_manipulation',
    desc: 'home.features.text.desc',
    color: 'bg-blue-500',
    icon: 'M4 6h16M4 10h12M4 14h8M4 18h6',
  },
  {
    path: '/text/bibtex',
    name: 'sidebar.bibtex_converter',
    desc: 'home.features.bibtex.desc',
    color: 'bg-indigo-500',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  },
  {
    path: '/text/diff',
    name: 'sidebar.diff_viewer',
    desc: 'home.features.diff.desc',
    color: 'bg-cyan-500',
    icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
  },
  {
    path: '/text/stats',
    name: 'sidebar.text_stats',
    desc: 'home.features.stats.desc',
    color: 'bg-teal-500',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
  {
    path: '/paper/color',
    name: 'sidebar.color_scheme',
    desc: 'home.features.color.desc',
    color: 'bg-violet-500',
    icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',
  },
  {
    path: '/latex',
    name: 'sidebar.latex2png',
    desc: 'home.features.latex.desc',
    color: 'bg-purple-500',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
  },
  {
    path: '/image/remove-bg',
    name: 'sidebar.remove_bg',
    desc: 'home.features.remove_bg.desc',
    color: 'bg-pink-500',
    icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
  {
    path: '/misc/printer',
    name: 'sidebar.printer',
    desc: 'home.features.printer.desc',
    color: 'bg-orange-500',
    icon: 'M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z',
  },
];

const updateTime = () => {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = { hour12: false, hour: '2-digit', minute: '2-digit' };
  if (settings.showSeconds) options.second = '2-digit';
  timeString.value = now.toLocaleTimeString(settings.language === 'zh' ? 'zh-CN' : 'en-US', options);

  const sec = now.getSeconds();
  const min = now.getMinutes();
  const hr  = now.getHours();
  secondDeg.value = sec * 6;
  minuteDeg.value = min * 6 + sec * 0.1;
  hourDeg.value   = (hr % 12) * 30 + min * 0.5;

  dateString.value = now.toLocaleDateString(
    settings.language === 'zh' ? 'zh-CN' : 'en-US',
    { weekday: 'long', month: 'long', day: 'numeric' }
  );

  if (hr >= 5  && hr < 12) greetingKey.value = 'home.greeting.morning';
  else if (hr >= 12 && hr < 18) greetingKey.value = 'home.greeting.afternoon';
  else if (hr >= 18 && hr < 22) greetingKey.value = 'home.greeting.evening';
  else greetingKey.value = 'home.greeting.night';
};

onMounted(() => { updateTime(); timer = setInterval(updateTime, 1000); });
onUnmounted(() => { if (timer) clearInterval(timer); });
</script>

<style scoped>
@keyframes blob {
  0%   { transform: translate(0px, 0px) scale(1); }
  33%  { transform: translate(30px, -50px) scale(1.1); }
  66%  { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}
.animate-blob { animation: blob 10s infinite; }
.animation-delay-2000 { animation-delay: 2s; }
.animation-delay-4000 { animation-delay: 4s; }

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up { animation: fadeInUp 0.8s ease-out; }
</style>