<template>
    <div id="main">
        <ViewLeft :activeHistory="activeHistory" :timeBasedItems="timeBasedItems"
            @activeChange="history => activeHistory = history" @goNew="activeHistory = null" />
        <div class="content">
            <div v-if="activeKey" class="historyTitle"></div>
            <div class="bubbleListWapper">
                <template v-if="activeKey">
                    <BubbleListWapper :activeKey="activeKey" :activeChatKey="activeChatKey"
                        :streamAnswer="streamAnswer" />
                </template>
                <template v-else>
                    <div class="">
                        welcome
                    </div>
                </template>
            </div>
            <SenderWapper :loading="isLoading" @create="submitChat" />
        </div>
    </div>
</template>

<script setup lang="ts">
// ---- 引用依赖 ----
import { ref, onBeforeMount, computed } from 'vue'
import type { ConversationItem } from 'vue-element-plus-x/types/Conversations';
// ---- 文件引用 ----
import { getAll } from '@/api/history'
import { createNew as createChat } from '@/api/chat'
import type { History } from '@/types/res.d.ts';
// ---- 引用组件 ----
import ViewLeft from './ViewLeft.vue'
import BubbleListWapper from './BubbleListWapper.vue'
import SenderWapper from './SenderWapper.vue'
// ---- 声明响应式变量 ----
const activeHistory = ref()
const activeChatKey = ref('');
const streamAnswer = ref('');
const isLoading = ref(false)
const timeBasedItems = ref<ConversationItem<{ id: string; label: string }>[]>([]);
// ---- 计算属性 ----
const activeKey = computed(() => {
    if (activeHistory.value) {
        return activeHistory.value._id
    } else {
        return ''
    }
})
// ---- 定义方法 ----  按照价格降序展示排名前三的图书列表
const submitChat = async ({ label, type, addToTemp }: { label: string, type: string, addToTemp: boolean }) => {
    isLoading.value = true
    console.log({ content: label, type, historyId: activeKey.value, addToTemp })
    console.log(JSON.stringify({ content: label, type, historyId: activeKey.value, addToTemp }))
    const client = await createChat({ content: label, type, historyId: activeKey.value, addToTemp })
    client
        .on('meta', (data) => {
            if (!activeKey.value) {
                // 新建会话 重新拉取会话列表
                loadHistoryData()
            }
            if (!activeHistory.value || activeHistory.value._id !== data.history._id) {
                activeHistory.value = data.history
            }
            activeChatKey.value = data.chatId
            streamAnswer.value = ''
        })
        .on('delta', (data) => {
            console.log('接收到：', data)
            // 流式传输回答 封装方法中已经拼装好了
            streamAnswer.value = (streamAnswer.value + data.content)
        })
        .on('done', () => {
            isLoading.value = false
        })
        .on('error', (data) => {
            console.error('错误:', data.message);
        });
}
const loadHistoryData = async () => {
    const all = await getAll()
    timeBasedItems.value = all.data.data.map((item: History) => {
        return {
            ...item,
            id: item._id
        }
    })
}
// ---- 生命周期 ----
onBeforeMount(loadHistoryData)
</script>

<style lang="less" scoped>
#main {
    position: relative;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    display: flex;
    flex-direction: row;

    .left {
        width: 300px;
        height: 100%;
    }

    .content {
        width: 0;
        padding: 20px;
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;

        .historyTitle {
            position: relative;
            height: 60px;
            display: flex;
            flex-grow: 0;
            flex-shrink: 0;
            justify-content: flex-start;
            box-sizing: border-box;
            color: #0f1115;
        }

        .bubbleListWapper {
            width: 100%;
            height: 0;
            flex: 1;
        }
    }
}
</style>