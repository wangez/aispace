<script setup lang="ts">
import { Chat } from "@ai-sdk/vue";
import { DefaultChatTransport } from 'ai';

const chat = new Chat(
    {
        transport: new DefaultChatTransport({
            // 修改 API 端点
            api: process.env.VUE_APP_API_BASE_URL + "/chat",
            // 设置静态请求头，如 API 版本号
            headers: {
            },
            // 设置静态请求体字段，如指定模型
            body: {
            },
        }),
    }
);

import { ref } from "vue";
const input = ref("帮我看看上个月华东区卖得最好的前三个产品是啥，跟这个月比涨了还是跌了？");

const handleSubmit = (e: Event) => {
    e.preventDefault();
    chat.sendMessage({ text: input.value });
    input.value = "";
};
</script>

<template>
    <div>
        <div v-for="(m, index) in chat.messages" :key="m.id ? m.id : index">
            {{ m.role === "user" ? "User: " : "AI: " }}
            <div v-for="(part, index) in m.parts" :key="`${m.id}-${part.type}-${index}`">
                <div v-if="part.type === 'text'">{{ part.text }}</div>
            </div>
        </div>

        <form @submit="handleSubmit">
            <input v-model="input" placeholder="Say something..." />
        </form>
    </div>
</template>