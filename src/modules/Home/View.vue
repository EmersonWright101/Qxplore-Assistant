<template>
  <div class="relative h-full w-full overflow-hidden flex flex-col items-center justify-center select-none bg-slate-50/50">
    <div class="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-[100px] mix-blend-multiply animate-blob"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-400/20 rounded-full blur-[100px] mix-blend-multiply animate-blob animation-delay-2000"></div>
    <div class="absolute top-[30%] right-[30%] w-[400px] h-[400px] bg-pink-300/20 rounded-full blur-[80px] mix-blend-multiply animate-blob animation-delay-4000"></div>

    <div class="relative z-10 text-center space-y-8 flex flex-col items-center">
      
      <h1 class="text-5xl font-bold tracking-tight opacity-0 animate-fade-in-up" style="animation-delay: 0.1s; animation-fill-mode: forwards;">
        <span class="bg-clip-text text-transparent bg-gradient-to-r from-slate-700 to-slate-500">
          {{ translatedGreeting }}
        </span>
      </h1>

      <div class="h-[180px] flex items-center justify-center opacity-0 animate-fade-in-up" style="animation-delay: 0.3s; animation-fill-mode: forwards;">
        
        <div v-if="settings.clockStyle === 'digital'" class="text-center">
          <div class="text-[7rem] md:text-[8rem] leading-none font-extralight text-slate-700 tracking-tighter font-mono tabular-nums">
            {{ timeString }}
          </div>
        </div>

        <div v-else class="relative w-48 h-48 rounded-full border-4 border-slate-200 bg-white/40 backdrop-blur-sm shadow-xl">
          <div class="absolute top-1/2 left-1/2 w-3 h-3 bg-slate-700 rounded-full -translate-x-1/2 -translate-y-1/2 z-20"></div>
          
          <div 
            class="absolute top-1/2 left-1/2 w-1.5 h-12 bg-slate-800 rounded-full origin-bottom -translate-x-1/2 -translate-y-full z-10 transition-transform duration-500 ease-[cubic-bezier(0.4,2.08,0.55,0.44)]"
            :style="{ transform: `translate(-50%, -100%) rotate(${hourDeg}deg)` }"
          ></div>
          
          <div 
            class="absolute top-1/2 left-1/2 w-1 h-16 bg-slate-600 rounded-full origin-bottom -translate-x-1/2 -translate-y-full z-10 transition-transform duration-300 ease-[cubic-bezier(0.4,2.08,0.55,0.44)]"
            :style="{ transform: `translate(-50%, -100%) rotate(${minuteDeg}deg)` }"
          ></div>

          <div 
            v-if="settings.showSeconds"
            class="absolute top-1/2 left-1/2 w-0.5 h-20 bg-red-500 rounded-full origin-bottom -translate-x-1/2 -translate-y-full z-10 transition-transform duration-75 ease-linear"
            :style="{ transform: `translate(-50%, -100%) rotate(${secondDeg}deg)` }"
          ></div>
          <div v-if="settings.showSeconds" class="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-red-500 rounded-full -translate-x-1/2 -translate-y-1/2 z-20"></div>
        </div>

      </div>

      <div class="text-xl text-slate-400 font-medium tracking-[0.2em] uppercase opacity-0 animate-fade-in-up" style="animation-delay: 0.4s; animation-fill-mode: forwards;">
        {{ dateString }}
      </div>

      <div class="pt-6 opacity-0 animate-fade-in-up" style="animation-delay: 0.6s; animation-fill-mode: forwards;">
        <router-link 
          to="/text"
          class="inline-flex items-center gap-2 px-8 py-3 bg-white/60 hover:bg-white border border-white/60 backdrop-blur-xl rounded-full shadow-sm hover:shadow-md text-slate-600 hover:text-blue-600 transition-all duration-300 active:scale-95"
        >
          <span>{{ t('start_work') }}</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </router-link>
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
const greetingKey = ref('good_morning'); // 存 key 而不是存文字

// 模拟时钟的角度
const hourDeg = ref(0);
const minuteDeg = ref(0);
const secondDeg = ref(0);

let timer: any = null;

// 计算属性：自动翻译问候语
const translatedGreeting = computed(() => t(greetingKey.value));

const updateTime = () => {
  const now = new Date();
  
  // 1. 数字时钟逻辑
  const options: Intl.DateTimeFormatOptions = {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  };
  // 🟢 如果设置里开启了秒，才显示秒
  if (settings.showSeconds) {
    options.second = '2-digit';
  }
  timeString.value = now.toLocaleTimeString(
    settings.language === 'zh' ? 'zh-CN' : 'en-US', 
    options
  );

  // 2. 模拟时钟逻辑 (计算角度)
  const sec = now.getSeconds();
  const min = now.getMinutes();
  const hr = now.getHours();
  
  secondDeg.value = sec * 6; // 360 / 60 = 6度
  minuteDeg.value = min * 6 + sec * 0.1; 
  hourDeg.value = (hr % 12) * 30 + min * 0.5;

  // 3. 日期
  dateString.value = now.toLocaleDateString(
    settings.language === 'zh' ? 'zh-CN' : 'en-US', 
    { weekday: 'long', month: 'long', day: 'numeric' }
  );

  // 4. 问候语 Key
  if (hr >= 5 && hr < 12) greetingKey.value = 'good_morning';
  else if (hr >= 12 && hr < 18) greetingKey.value = 'good_afternoon';
  else if (hr >= 18 && hr < 22) greetingKey.value = 'good_evening';
  else greetingKey.value = 'good_night';
};

onMounted(() => {
  updateTime();
  timer = setInterval(updateTime, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
/* 动画代码不变 */
@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}
.animate-blob { animation: blob 10s infinite; }
.animation-delay-2000 { animation-delay: 2s; }
.animation-delay-4000 { animation-delay: 4s; }

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up { animation: fadeInUp 0.8s ease-out; }
</style>