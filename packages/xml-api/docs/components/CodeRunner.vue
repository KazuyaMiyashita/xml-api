<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { scenarios } from "./scenarios";

const props = defineProps<{
  scenario: string;
}>();

const scenarioData = computed(() => scenarios[props.scenario]);
const output = ref<string[]>([]);
const isRunning = ref(false);
const hasRun = ref(false);
const isMounted = ref(false);

onMounted(() => {
  isMounted.value = true;
});

async function run() {
  if (!scenarioData.value) return;

  output.value = [];
  isRunning.value = true;
  hasRun.value = true;

  try {
    await scenarioData.value.run((msg: string) => {
      output.value.push(msg);
    });
  } catch (e: any) {
    output.value.push(`Error: ${e.message}`);
    console.error(e);
  } finally {
    isRunning.value = false;
  }
}

const copyText = async () => {
  if (!scenarioData.value) return;
  try {
    await navigator.clipboard.writeText(scenarioData.value.code);
    // Optional: Visual feedback could be added here
  } catch (err) {
    console.error("Failed to copy", err);
  }
};
</script>

<template>
  <div v-if="isMounted && scenarioData" class="code-runner-container">
    <div class="code-block-wrapper" :class="'language-typescript'">
      <button title="Copy Code" class="copy-btn" @click="copyText"></button>
      <span class="lang-label">ts</span>
      
      <pre class="code-display"><code>{{ scenarioData.code }}</code></pre>
      
      <button 
        class="run-icon-btn" 
        @click="run" 
        :disabled="isRunning"
        :title="isRunning ? 'Running...' : 'Run Code'"
      >
        <svg v-if="!isRunning" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
        <svg v-else class="spinner" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
      </button>
    </div>

    <div v-if="hasRun" class="output-container">
      <div class="output-header">Execution Result</div>
      <div class="output-content">
        <div v-if="output.length === 0 && isRunning" class="loading">Executing...</div>
        <div v-for="(line, i) in output" :key="i" class="output-line">{{ line }}</div>
      </div>
    </div>
  </div>
  <div v-else-if="isMounted" class="error">
    Scenario "{{ scenario }}" not found.
  </div>
  <div v-else class="skeleton-loader">
    <!-- Placeholder while loading -->
    Loading Example...
  </div>
</template>

<style scoped>
.code-runner-container {
  margin: 16px 0;
  border-radius: 8px;
  overflow: hidden;
}

.code-block-wrapper {
  position: relative;
  background-color: var(--vp-code-block-bg);
  border-radius: 8px;
  margin-bottom: 0;
}

.code-display {
  margin: 0;
  padding: 20px;
  overflow-x: auto;
  font-family: var(--vp-font-family-mono);
  font-size: var(--vp-code-font-size);
  line-height: var(--vp-code-line-height);
  color: var(--vp-code-block-color);
}

.lang-label {
  position: absolute;
  top: 10px;
  right: 12px;
  font-size: 12px;
  color: var(--vp-c-text-3);
  font-weight: 500;
  pointer-events: none;
}

.copy-btn {
  position: absolute;
  top: 12px;
  right: 40px;
  width: 32px;
  height: 32px;
  border: 1px solid var(--vp-code-copy-code-border-color);
  border-radius: 4px;
  background-color: var(--vp-code-copy-code-bg);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='rgba(128,128,128,1)' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' viewBox='0 0 24 24'%3E%3Crect width='8' height='4' x='8' y='2' rx='1' ry='1'/%3E%3Cpath d='M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 10;
}

.code-block-wrapper:hover .copy-btn {
  opacity: 1;
}

.run-icon-btn {
  position: absolute;
  bottom: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background-color: var(--vp-c-brand);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  transition: transform 0.1s, background-color 0.2s;
  z-index: 10;
}

.run-icon-btn:hover:not(:disabled) {
  background-color: var(--vp-c-brand-dark);
  transform: scale(1.05);
}

.run-icon-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.run-icon-btn:disabled {
  background-color: var(--vp-c-gray-1);
  opacity: 0.6;
  cursor: not-allowed;
}

.output-container {
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-top: none;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
}

.output-header {
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--vp-c-text-2);
  border-bottom: 1px solid var(--vp-c-divider);
}

.output-content {
  padding: 12px 16px;
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-wrap;
  color: var(--vp-c-text-1);
}

.output-line {
  margin-bottom: 4px;
}

.spinner {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  100% { transform: rotate(360deg); }
}

.error {

  color: var(--vp-c-danger);

  padding: 1rem;

  border: 1px solid var(--vp-c-danger);

  border-radius: 8px;

}



.skeleton-loader {

  padding: 20px;

  background-color: var(--vp-c-bg-soft);

  border-radius: 8px;

  color: var(--vp-c-text-2);

  margin: 16px 0;

  border: 1px dashed var(--vp-c-divider);

  text-align: center;

  font-size: 13px;

}

</style>
