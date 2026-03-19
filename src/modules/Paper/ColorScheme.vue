<template>
  <div class="w-full max-w-6xl mx-auto space-y-8 pb-10 p-8">

    <!-- Color Input -->
    <div class="space-y-3">
      <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
        {{ t('color_scheme.seed_label') }}
      </label>

      <div class="flex items-center gap-3">
        <!-- Native color picker, styled -->
        <div class="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-slate-200 shadow-sm cursor-pointer shrink-0 transition-shadow hover:shadow-md">
          <input
            type="color"
            v-model="pickerColor"
            @input="onPickerChange"
            class="absolute inset-0 w-[200%] h-[200%] -top-1/4 -left-1/4 cursor-pointer opacity-0"
          />
          <div class="w-full h-full rounded-[10px] transition-colors" :style="{ backgroundColor: pickerColor }" />
        </div>

        <!-- Hex text input -->
        <div class="relative">
          <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-mono select-none">#</span>
          <input
            v-model="hexInput"
            @input="onHexInput"
            @blur="onHexBlur"
            maxlength="7"
            spellcheck="false"
            placeholder="4A90D9"
            class="pl-7 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-mono text-slate-700 w-36 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm uppercase"
            :class="hexError ? 'border-red-300 bg-red-50/40' : 'border-slate-200'"
          />
        </div>

        <!-- Live preview pill -->
        <Transition name="fade">
          <div
            v-if="activeHex && !hexError"
            class="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 shadow-sm bg-white"
          >
            <div class="w-4 h-4 rounded-full ring-1 ring-black/10" :style="{ backgroundColor: activeHex }" />
            <span class="text-sm font-mono text-slate-600">{{ activeHex.toUpperCase() }}</span>
          </div>
        </Transition>
      </div>

      <p v-if="hexError" class="text-xs text-red-400 ml-1 flex items-center gap-1">
        <AlertCircle class="w-3.5 h-3.5" />
        {{ t('color_scheme.invalid_hex') }}
      </p>
    </div>

    <!-- Scheme type selector -->
    <div>
      <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1 mb-3">
        {{ t('color_scheme.scheme_label') }}
      </p>
      <div class="relative bg-slate-100/80 p-1 rounded-lg inline-flex shadow-inner border border-slate-200/50 backdrop-blur-sm">
        <div
          class="absolute top-1 bottom-1 bg-white rounded-md shadow-sm ring-1 ring-black/5 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
          :style="gliderStyle"
        />
        <button
          v-for="(scheme, index) in schemes"
          :key="scheme.value"
          :ref="(el) => { if (el) buttonRefs[index] = el as HTMLButtonElement }"
          @click="switchScheme(scheme.value)"
          class="relative z-10 px-4 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 whitespace-nowrap"
          :class="currentScheme === scheme.value ? 'text-slate-800' : 'text-slate-500 hover:text-slate-600'"
        >
          {{ scheme.label }}
        </button>
      </div>
    </div>

    <!-- Scheme description -->
    <Transition name="fade">
      <p class="text-sm text-slate-500 leading-relaxed bg-slate-50 border border-slate-200/70 rounded-xl px-4 py-3 -mt-2">
        {{ t(`color_scheme.descriptions.${currentScheme}`) }}
      </p>
    </Transition>

    <!-- Swatch grid -->
    <div class="space-y-3">
      <div class="flex items-center justify-between ml-1 h-8">
        <label class="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {{ t('color_scheme.palette_label') }}
        </label>

        <Transition name="fade">
          <button
            v-if="swatches.length"
            @click="copyAll"
            class="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md transition-all duration-200 active:scale-95 border border-transparent"
            :class="allCopied ? 'text-green-600 bg-green-50 border-green-100' : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50/80 hover:border-blue-100'"
          >
            <component :is="allCopied ? Check : Clipboard" class="w-3.5 h-3.5" />
            <span>{{ allCopied ? t('common.copied') : t('color_scheme.copy_all') }}</span>
          </button>
        </Transition>
      </div>

      <Transition name="slide-fade" mode="out-in">
        <div
          v-if="swatches.length"
          :key="currentScheme + activeHex"
          class="grid gap-3"
          :class="swatches.length === 4 ? 'grid-cols-4' : swatches.length === 5 ? 'grid-cols-5' : 'grid-cols-3 sm:grid-cols-6'"
        >
          <div
            v-for="(sw, i) in swatches"
            :key="i"
            class="rounded-xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
            @click="copySwatch(sw.hex, i)"
          >
            <!-- Color preview area -->
            <div
              class="h-28 relative flex items-end p-2"
              :style="{ backgroundColor: sw.hex }"
            >
              <Transition name="fade">
                <span
                  v-if="copiedIndex === i"
                  class="text-[11px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm"
                  :class="sw.textOnColor === 'white' ? 'bg-white/25 text-white' : 'bg-black/10 text-slate-800'"
                >
                  ✓ {{ t('common.copied') }}
                </span>
                <span
                  v-else
                  class="text-[11px] opacity-0 group-hover:opacity-100 transition-opacity px-2 py-0.5 rounded-full backdrop-blur-sm"
                  :class="sw.textOnColor === 'white' ? 'bg-white/20 text-white' : 'bg-black/8 text-slate-700'"
                >
                  {{ t('color_scheme.click_copy') }}
                </span>
              </Transition>
            </div>

            <!-- Info strip -->
            <div class="px-3 py-2.5 bg-white">
              <p class="text-xs font-mono font-bold text-slate-700 tracking-wide">
                {{ sw.hex.toUpperCase() }}
              </p>
              <p class="text-[10px] text-slate-400 mt-0.5 truncate">{{ sw.rgbStr }}</p>
            </div>
          </div>
        </div>

        <div v-else class="w-full bg-slate-50 border border-slate-200 rounded-xl p-8 flex items-center justify-center">
          <span class="text-slate-300 italic text-sm select-none">{{ t('color_scheme.enter_color_prompt') }}</span>
        </div>
      </Transition>

      <!-- HSL detail row -->
      <Transition name="fade">
        <div v-if="swatches.length" class="flex flex-wrap gap-2 mt-1">
          <span
            v-for="(sw, i) in swatches"
            :key="i"
            class="text-[10px] font-mono text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md"
          >
            {{ sw.hslStr }}
          </span>
        </div>
      </Transition>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { Clipboard, Check, AlertCircle } from 'lucide-vue-next';
import { generateScheme, isValidHex, normalizeHex, type SchemeType } from './colorScheme';

const { t } = useI18n();

// ─── State ────────────────────────────────────────────────────────────────────

const pickerColor = ref('#4a90d9');
const hexInput    = ref('4A90D9');
const hexError    = ref(false);
const activeHex   = ref('#4a90d9');

const currentScheme = ref<SchemeType>('monochromatic');
const copiedIndex   = ref<number | null>(null);
const allCopied     = ref(false);

// ─── Sliding tab ─────────────────────────────────────────────────────────────

const buttonRefs = ref<HTMLButtonElement[]>([]);
const gliderStyle = ref({ width: '0px', transform: 'translateX(0px)', opacity: '0' });

const schemes = computed(() => [
  { label: t('color_scheme.schemes.monochromatic'), value: 'monochromatic' as SchemeType },
  { label: t('color_scheme.schemes.complementary'), value: 'complementary' as SchemeType },
  { label: t('color_scheme.schemes.analogous'),     value: 'analogous'     as SchemeType },
  { label: t('color_scheme.schemes.triadic'),       value: 'triadic'       as SchemeType },
  { label: t('color_scheme.schemes.tetradic'),      value: 'tetradic'      as SchemeType },
]);

const updateGlider = () => {
  const idx = schemes.value.findIndex(s => s.value === currentScheme.value);
  if (idx < 0 || !buttonRefs.value[idx]) return;
  const btn = buttonRefs.value[idx];
  gliderStyle.value = { width: `${btn.offsetWidth}px`, transform: `translateX(${btn.offsetLeft}px)`, opacity: '1' };
};

const switchScheme = (s: SchemeType) => {
  currentScheme.value = s;
  updateGlider();
};

onMounted(() => { setTimeout(() => nextTick(updateGlider), 100); });
window.addEventListener('resize', updateGlider);

// ─── Color input handlers ─────────────────────────────────────────────────────

const onPickerChange = () => {
  hexInput.value = pickerColor.value.slice(1).toUpperCase();
  hexError.value = false;
  activeHex.value = pickerColor.value;
};

const onHexInput = () => {
  const raw = hexInput.value.replace('#', '');
  if (isValidHex(raw)) {
    const norm = normalizeHex(raw);
    pickerColor.value = norm;
    activeHex.value   = norm;
    hexError.value    = false;
  } else {
    hexError.value = raw.length > 0;
  }
};

const onHexBlur = () => {
  if (!isValidHex(hexInput.value.replace('#', ''))) {
    hexInput.value = activeHex.value.slice(1).toUpperCase();
    hexError.value = false;
  } else {
    hexInput.value = hexInput.value.replace('#', '').toUpperCase();
  }
};

// ─── Swatches ─────────────────────────────────────────────────────────────────

const swatches = computed(() => {
  if (!activeHex.value || hexError.value) return [];
  return generateScheme(activeHex.value, currentScheme.value);
});

// Reset copy state when palette changes
watch(swatches, () => { copiedIndex.value = null; });

// ─── Copy actions ─────────────────────────────────────────────────────────────

const copySwatch = (hex: string, idx: number) => {
  navigator.clipboard.writeText(hex.toUpperCase());
  copiedIndex.value = idx;
  setTimeout(() => { if (copiedIndex.value === idx) copiedIndex.value = null; }, 1800);
};

const copyAll = () => {
  if (!swatches.value.length || allCopied.value) return;
  const text = swatches.value.map(s => s.hex.toUpperCase()).join('\n');
  navigator.clipboard.writeText(text);
  allCopied.value = true;
  setTimeout(() => (allCopied.value = false), 2000);
};
</script>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(6px);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
