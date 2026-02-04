<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import type { CharacterData, Element } from "@/dom";

const props = defineProps<{
  node: Element | CharacterData | null;
}>();

const emit = defineEmits<{
  (e: "update:attr", key: string, value: string): void;
  (e: "remove:attr", key: string): void;
  (e: "update:text", value: string): void;
}>();

const newAttrKey = ref("");
const newAttrValue = ref("");
const attrKeyInput = ref<HTMLInputElement | null>(null);

// Helper to determine type
const isElement = computed(() => props.node && props.node.nodeType === 1);
const isText = computed(() => props.node && props.node.nodeType === 3);

// Data Extraction
const tagName = computed(() =>
  isElement.value ? (props.node as Element).tagName : "",
);
const nodeName = computed(() => (props.node ? props.node.nodeName : ""));

const attributes = computed(() => {
  if (!isElement.value) return [];
  const el = props.node as Element;
  const model = el.getModel();
  const attributes = Array.from(model.attributes.entries());
  if (model.attributes) {
    model.attributes.forEach((v: string, k: string) => {
      attrs.push({ key: k, value: v });
    });
  }
  return attrs.sort((a, b) => a.key.localeCompare(b.key));
});

const textContent = computed(() => {
  if (!props.node) return "";
  if (isText.value) return (props.node as CharacterData).data;
  return props.node.textContent || "";
});

function onAttrChange(key: string, e: Event) {
  const val = (e.target as HTMLInputElement).value;
  emit("update:attr", key, val);
}

function onAttrRemove(key: string) {
  emit("remove:attr", key);
}

function onAttrAdd() {
  if (newAttrKey.value) {
    emit("update:attr", newAttrKey.value, newAttrValue.value);
    newAttrKey.value = "";
    newAttrValue.value = "";
    // Focus back to key input for continuous entry
    nextTick(() => {
      attrKeyInput.value?.focus();
    });
  }
}

function onTextInput(e: Event) {
  const val = (e.target as HTMLTextAreaElement).value;
  emit("update:text", val);
}
</script>

<template>
  <div class="inspector">
    <div v-if="!node" class="empty-state">
      Select a node from the tree to edit properties.
    </div>
    
    <div v-else class="content">
      <div class="header">
        <span class="type-badge">{{ nodeName }}</span>
        <span v-if="isElement" class="node-id">{{ tagName }}</span>
      </div>
      
      <div class="panels-container">
        <!-- Left: Attributes (for Element) -->
        <div v-if="isElement" class="panel-section attr-section">
          <div class="section-title">Attributes</div>
          
          <div class="attr-table">
            <div v-for="attr in attributes" :key="attr.key" class="attr-row">
              <div class="attr-key">{{ attr.key }}</div>
              <input 
                class="attr-value-input"
                :value="attr.value"
                @input="onAttrChange(attr.key, $event)" 
                placeholder="value"
              />
              <button class="icon-btn remove" @click="onAttrRemove(attr.key)" title="Remove">×</button>
            </div>
            
            <!-- Add New Row -->
            <div class="attr-row add-row">
              <input 
                ref="attrKeyInput"
                v-model="newAttrKey" 
                class="attr-key-input"
                placeholder="Name"
                @keydown.enter="onAttrAdd"
              />
              <input 
                v-model="newAttrValue" 
                class="attr-value-input"
                placeholder="Value"
                @keydown.enter="onAttrAdd"
              />
              <button class="icon-btn add" @click="onAttrAdd" :disabled="!newAttrKey">+</button>
            </div>
          </div>
        </div>

        <!-- Right (or Full): Text Content -->
        <div class="panel-section text-section" :class="{ 'full-width': !isElement }">
          <div class="section-title">
            {{ isElement ? 'Text Content' : 'Text Data' }}
          </div>
          <textarea 
            :value="textContent"
            @input="onTextInput"
            class="text-editor"
            spellcheck="false"
          ></textarea>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.inspector {
  height: 100%;
  background-color: var(--vp-c-bg);
  display: flex;
  flex-direction: column;
}

.empty-state {
  padding: 40px;
  color: var(--vp-c-text-3);
  text-align: center;
  font-size: 14px;
}

.content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.header {
  padding: 8px 16px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.type-badge {
  font-size: 10px;
  text-transform: uppercase;
  background: var(--vp-c-brand);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
}

.node-id {
  font-weight: 600;
  font-size: 13px;
  color: var(--vp-c-text-1);
}

.panels-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.panel-section {
  padding: 16px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.attr-section {
  flex: 1;
  border-right: 1px solid var(--vp-c-divider);
  min-width: 300px;
}

.text-section {
  flex: 1;
  min-width: 200px;
}
.text-section.full-width {
  flex: 1;
  border-right: none;
}

.section-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--vp-c-text-2);
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Attributes Table Style */
.attr-table {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attr-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.attr-key {
  width: 100px;
  font-size: 12px;
  color: var(--vp-c-text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--vp-font-family-mono);
}

.attr-key-input {
  width: 100px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-alt);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.attr-value-input {
  flex: 1;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-alt);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: var(--vp-c-text-1);
}
.attr-value-input:focus, .attr-key-input:focus {
  border-color: var(--vp-c-brand);
  outline: none;
}

.icon-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  background: none;
  cursor: pointer;
  border-radius: 4px;
  color: var(--vp-c-text-2);
  font-size: 14px;
  transition: all 0.2s;
}
.icon-btn:hover {
  background: var(--vp-c-bg-mute);
  color: var(--vp-c-text-1);
}
.icon-btn.remove:hover {
  color: var(--vp-c-red);
  background: var(--vp-c-bg-red-dimm);
}
.icon-btn.add {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
}
.icon-btn.add:hover:not(:disabled) {
  background: var(--vp-c-brand);
  color: white;
  border-color: var(--vp-c-brand);
}
.icon-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.text-editor {
  flex: 1;
  width: 100%;
  resize: none;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg-alt);
  padding: 12px;
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  line-height: 1.5;
}
.text-editor:focus {
  border-color: var(--vp-c-brand);
  outline: none;
}
</style>