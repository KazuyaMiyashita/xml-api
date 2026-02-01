<script setup lang="ts">
import { computed, ref } from "vue";
import type { Node, Element, CharacterData } from "@/ast/dom";

const props = defineProps<{
  node: Node;
  selectedNode: Node | null;
  depth?: number;
  showWhitespace?: boolean;
}>();

const emit = defineEmits<{
  (e: "select", node: Node): void;
  (e: "toggle", node: Node): void; // For expanding/collapsing
}>();

const isExpanded = ref(true);

const nodeType = computed(() => props.node.nodeType);
const isElement = computed(() => nodeType.value === 1);
const isText = computed(() => nodeType.value === 3);
const isComment = computed(() => nodeType.value === 8);

// Casting
const asElement = computed(() => props.node as Element);
const asText = computed(() => props.node as CharacterData);

// Content Helpers
const tagName = computed(() =>
  isElement.value ? asElement.value.tagName : "",
);
const textPreview = computed(() => {
  if (isText.value || isComment.value) {
    const t = asText.value.data;
    return t.length > 20 ? t.slice(0, 20) + "..." : t;
  }
  return "";
});

const isWhitespace = computed(() => {
  return isText.value && !asText.value.data.trim();
});

const children = computed(() => {
  const nodes: Node[] = [];
  const nodeList = props.node.childNodes;
  for (let i = 0; i < nodeList.length; i++) {
    const child = nodeList.item(i);
    if (child) nodes.push(child);
  }
  return nodes;
});

const hasChildren = computed(() => children.value.length > 0);

function onSelect(e: MouseEvent) {
  e.stopPropagation();
  emit("select", props.node);
}

function onToggle(e: MouseEvent) {
  e.stopPropagation();
  isExpanded.value = !isExpanded.value;
}
</script>

<template>
  <div 
    v-if="!isWhitespace || showWhitespace"
    class="tree-node-wrapper"
  >
    <div 
      class="tree-row" 
      :class="{ 
        selected: node === selectedNode,
        'is-element': isElement,
        'is-text': isText,
        'is-comment': isComment
      }"
      @click="onSelect"
    >
      <!-- Indent & Toggle -->
      <span class="toggle-icon" @click="onToggle" :style="{ visibility: hasChildren ? 'visible' : 'hidden' }">
        {{ isExpanded ? '▼' : '▶' }}
      </span>

      <!-- Icon -->
      <span class="icon">
        <span v-if="isElement" class="icon-el">{}</span>
        <span v-else-if="isText" class="icon-txt">Tx</span>
        <span v-else-if="isComment" class="icon-cmt">!!</span>
      </span>

      <!-- Label -->
      <span class="label">
        <span v-if="isElement" class="element-tag">{{ tagName }}</span>
        <span v-else-if="isText" class="text-val">"{{ textPreview }}"</span>
        <span v-else-if="isComment" class="comment-val">&lt;!-- {{ textPreview }} --&gt;</span>
      </span>
    </div>

    <!-- Children -->
    <div v-if="hasChildren && isExpanded" class="children-block">
      <XmlTreeNode 
        v-for="(child, i) in children" 
        :key="i"
        :node="child"
        :selectedNode="selectedNode"
        :showWhitespace="showWhitespace"
        @select="(n) => emit('select', n)"
      />
    </div>
  </div>
</template>

<style scoped>
.tree-node-wrapper {
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  line-height: 1.8;
  user-select: none;
}

.tree-row {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  color: var(--vp-c-text-1);
  transition: background-color 0.1s;
}

.tree-row:hover {
  background-color: var(--vp-c-bg-soft);
}

.tree-row.selected {
  background-color: var(--vp-c-brand-dimm);
  color: var(--vp-c-brand);
}

.toggle-icon {
  width: 16px;
  text-align: center;
  font-size: 10px;
  color: var(--vp-c-text-3);
  margin-right: 4px;
  cursor: pointer;
}
.toggle-icon:hover {
  color: var(--vp-c-text-1);
}

.icon {
  margin-right: 6px;
  font-weight: bold;
  font-size: 11px;
  width: 16px;
  text-align: center;
}
.icon-el { color: var(--vp-c-yellow-1); }
.icon-txt { color: var(--vp-c-green-1); }
.icon-cmt { color: var(--vp-c-text-3); }

.label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.element-tag { font-weight: 600; }
.text-val { color: var(--vp-c-text-2); }
.comment-val { color: var(--vp-c-text-3); font-style: italic; }

.children-block {
  padding-left: 18px; /* Indent */
  border-left: 1px solid var(--vp-c-divider);
  margin-left: 7px; /* Align line with toggle center */
}
</style>
