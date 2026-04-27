<script setup lang="ts">
import { getStreamList, getAllChunks } from '@/api/agentMessage'
import { ref, onBeforeMount, watch } from "vue";

interface Formated {
    type: string,
    indent: number,
    text: string,
}

const timeList = ref([])
const active = ref(0)
const msgList = ref<any[]>([])

const formatJSON = (json: string) => json.split('\n')
    .filter(item => item.match(/(^\s*)([^\s].*$)/))
    .map(item => {
        let match = item.match(/(^\s*)([^\s].*$)/)
        if (match) {
            return {
                indent: match[1].length / 2,
                text: match[2]
            }
        }
    })

watch(() => active.value, async () => {
    const res = await getAllChunks(active.value)
    let data = JSON.parse(res.data.data.messageList)
    msgList.value = data.map((item: any) => {
        let obj: any = {
            type: item.id[2],
            content: item.kwargs.content.split('\n'),
            reasoning_content: item.kwargs.additional_kwargs?.reasoning_content,
            tool_calls: item.kwargs.tool_calls
        }
        obj.formated = formatJSON(JSON.stringify(obj, null, 4))
        return obj
    })
})

onBeforeMount(async () => {
    const res = await getStreamList()
    timeList.value = res.data.data
})
</script>

<template>
    <div style="width: 100%; height: 100%; display: flex; flex-direction: row;">
        <div
            style="width: 160px; background: #333; color: #ccc; height: 100%; overflow: auto; padding: 12px; box-sizing: border-box;">
            <div v-for="item in timeList" :key="item"
                style="height: 36px; line-height: 36px; background-color: #666; margin-bottom: 6px; cursor: pointer;"
                :style="{ backgroundColor: active === item ? '#999' : '#666' }" @click="active = item">
                {{ item }}</div>
        </div>
        <div style="width: 0; flex: 1; height: 100%; overflow: auto; background: #ccc; text-align: left; color: #fff;">
            <div v-for="item in msgList" :class="item.type" :key="item.id" style="margin-bottom: 16px;">
                <div>
                    <span class="type">{{ item.type }}</span>
                </div>
                <!-- <div v-for="(msg, index) in item.formated" :style="{ textIndent: msg?.indent + 'em' }" :key="index">
                    {{ msg?.text }}
                </div> -->
                <div v-if="item.reasoning_content" class="reasoning">
                    <div>思考过程</div>
                    {{ item.reasoning_content }}
                </div>
                <div class="content" v-for="(text, index) in item.content" :key="index">{{ text }}</div>
                <div class="toolCalls" v-if="item.tool_calls">
                    <div>方法调用</div>
                    <div v-for="tool in item.tool_calls" :key="tool.id" class="toolCall">
                        <div>调用方法：{{ tool.name }}</div>
                        <div>调用参数：{{ tool.args }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>


<style scoped lang="less">
.HumanMessage,
.AIMessageChunk,
.ToolMessage,
.SystemPrompt {
    /* 布局与尺寸相关 - 保持一致 */
    display: block;
    width: fit-content;
    max-width: 85%;
    padding: 12px 18px;

    /* 排版与字体 - 完全一致 */
    font-size: 0.95rem;
    font-weight: 400;
    line-height: 1.5;
    color: #1e293b;
    font-family: inherit;
    word-break: break-word;
    white-space: normal;

    /* 边框与圆角 - 边框宽度/样式一致，圆角一致 */
    border-width: 1px;
    border-style: solid;
    border-radius: 20px;

    /* 背景与边框颜色将由具体类单独定义 (只有这两个属性变化) */
    /* 其余样式: 阴影、过渡效果保持一致 */
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03), 0 2px 4px rgba(0, 0, 0, 0.05);
    transition: all 0.2s ease;

    /* 确保内外元素行为一致 */
    text-align: left;
    backdrop-filter: blur(0px);

    /* 保持光标与交互一致性 */
    cursor: default;

    .type {
        font-size: 0.8em;
        border: 1px solid #000;
        padding: 0 0.5em;
        border-radius: 0.5em;
    }

    .reasoning {
        font-size: 0.9em;
        color: #666;
    }

    .content {
        font-size: 1.2em;
        color: #000;
    }

    .toolCall {
        border: 1px solid rgb(51, 51, 238);
        border-radius: 12px;
        padding: 2px 16px;
        box-sizing: border-box;
    }
}

/* 可选: 悬浮微交互 (保持样式一致，只增强光影) */
.HumanMessage:hover,
.AIMessageChunk:hover,
.ToolMessage:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
}

/* -------------------- HumanMessage 样式 -------------------- */
/* 仅定义背景色 + 边框颜色，其余继承 .message 所有样式 */
.HumanMessage {
    background-color: #e9f2fe;
    /* 轻柔蓝调背景 */
    border-color: #b9d0f0;
    /* 同色系边框，稍深一点 */
    /* 注意：未覆盖任何 padding、font、圆角等，完全一致 */
}

/* -------------------- AIMessageChunk 样式 -------------------- */
/* AI 消息块 / 流式片段使用相同视觉风格 */
.AIMessageChunk {
    background-color: #eafaf1;
    /* 清新翠绿背景 */
    border-color: #b9e0c8;
    /* 绿色边框，柔和自然 */
}

/* -------------------- ToolMessage 样式 -------------------- */
/* 工具调用/执行结果消息块 */
.ToolMessage {
    background-color: #fef7e0;
    /* 淡暖黄色背景, 工具消息友好提示 */
    border-color: #f5e2b9;
    /* 沙金色边框 */
}

.SystemPrompt {
    background-color: #f2effa;
    /* 柔和灰紫背景 */
    border-color: #ddd2f0;
    /* 淡紫罗兰边框 */
}
</style>