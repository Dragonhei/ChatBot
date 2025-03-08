<template>
  <div class="typewriter-content" v-html="displayedContent"></div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { marked } from 'marked';

const props = defineProps({
  content: {
    type: String,
    required: true
  },
  speed: {
    type: Number,
    default: 30
  }
});

const emit = defineEmits(['complete']);
const displayedContent = ref('');
const rawContent = ref('');
const isTyping = ref(false);
let currentIndex = 0;
let typingInterval = null;

// 将Markdown转换为HTML
const parseMarkdown = (text) => {
  return marked(text);
};

// 打字机效果
const typeText = () => {
  if (currentIndex < rawContent.value.length) {
    displayedContent.value = parseMarkdown(rawContent.value.substring(0, currentIndex + 1));
    currentIndex++;
  } else {
    clearInterval(typingInterval);
    isTyping.value = false;
    emit('complete');
  }
};

// 开始打字效果
const startTyping = () => {
  if (isTyping.value) return;
  
  isTyping.value = true;
  currentIndex = 0;
  displayedContent.value = '';
  rawContent.value = props.content;
  
  if (typingInterval) clearInterval(typingInterval);
  typingInterval = setInterval(typeText, props.speed);
};

// 监听内容变化
watch(() => props.content, (newContent) => {
  if (newContent) {
    rawContent.value = newContent;
    startTyping();
  }
});

onMounted(() => {
  if (props.content) {
    rawContent.value = props.content;
    startTyping();
  }
});
</script>

<style scoped>
.typewriter-content {
  line-height: 1.6;
  font-size: 1rem;
}

.typewriter-content :deep(p) {
  margin: 0.5rem 0;
}

.typewriter-content :deep(pre) {
  background-color: #f6f8fa;
  border-radius: 6px;
  padding: 1rem;
  overflow-x: auto;
  margin: 0.75rem 0;
}

.typewriter-content :deep(code) {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  background-color: rgba(175, 184, 193, 0.2);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-size: 0.9em;
}

.typewriter-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
}

.typewriter-content :deep(a) {
  color: #0969da;
  text-decoration: none;
}

.typewriter-content :deep(a:hover) {
  text-decoration: underline;
}

.typewriter-content :deep(blockquote) {
  border-left: 4px solid #d0d7de;
  padding-left: 1rem;
  color: #57606a;
  margin: 0.75rem 0;
}

.typewriter-content :deep(ul), .typewriter-content :deep(ol) {
  padding-left: 2rem;
  margin: 0.75rem 0;
}

.typewriter-content :deep(img) {
  max-width: 100%;
  border-radius: 6px;
}

.typewriter-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 0.75rem 0;
}

.typewriter-content :deep(th), .typewriter-content :deep(td) {
  border: 1px solid #d0d7de;
  padding: 0.5rem;
}

.typewriter-content :deep(th) {
  background-color: #f6f8fa;
}
</style>