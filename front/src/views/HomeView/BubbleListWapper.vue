<template>
    <BubbleList :list="list" max-height="100%" style="text-align: left;" />
</template>

<script setup lang="ts">
// ---- 引用依赖 ----
import { ref, watch } from 'vue'
import { BubbleList } from 'vue-element-plus-x';
import type { BubbleListItemProps, BubbleListProps } from 'vue-element-plus-x/types/BubbleList';
// ---- 文件引用 ----
import { getAll } from '@/api/chat'
// ---- 声明ts类型、接口 ----
type listType = BubbleListItemProps & {
    key: number;
    role: 'user' | 'assistant';
};
interface Common {
    loading: boolean;
    shape: "corner" | "round" | undefined;
    isMarkdown: boolean;
    typing: boolean;
    isFog: boolean;
}
interface SelfCommon {
    variant: "filled" | "outlined" | "borderless" | "shadow" | undefined;
    placement: "start" | "end" | undefined;
    isMarkdown: boolean;
}
interface ResItem {
    content: string,
    historyId: string,
    order: number,
    role: "user" | "assistant",
    _id: string,
}
// ---- 声明非响应式变量 ----
const common: Common = {
    loading: false, // 当前气泡的加载状态
    shape: 'corner', // 气泡的形状
    isMarkdown: false, // 是否渲染为 markdown
    typing: false, // 是否开启打字器效果 该属性不会和流式接受冲突
    isFog: false, // 是否开启打字雾化效果，该效果 v1.1.6 新增，且在 typing 为 true 时生效，该效果会覆盖 typing 的 suffix 属性
}
const aiCommon: SelfCommon = {
    variant: 'shadow',
    placement: 'start',
    isMarkdown: true
}
const userCommon: SelfCommon = {
    variant: 'filled',
    placement: 'end',
    isMarkdown: false
}
// ---- 声明入参 ----
const props = defineProps(['activeKey', 'streamAnswer', 'activeChatKey'])
// ---- 声明响应式变量 ----
const list = ref<BubbleListProps<listType>['list']>([])
// ---- 定义方法 ----
const loadData = async () => {
    let test = await getAll(props.activeKey)
    let reslist: ResItem[] = test.data.data
    list.value = reslist.map((item, index) => {
        let { role, content } = item
        return {
            key: index + 1, // 唯一标识
            role, // user | assistant 自行更据模型定义
            content, // 消息内容 流式接受的时候，只需要改这个值即可
            ...common,
            ...(role === 'assistant' ? aiCommon : userCommon)
        }
    })
}
// ---- 监听属性 ----
watch(
    () => {
        return {
            activeKey: props.activeKey,
            activeChatKey: props.activeChatKey
        }
    },
    async () => {
        await loadData()
    },
    { immediate: true }
)

watch(
    () => props.streamAnswer,
    content => {
        list.value[list.value.length - 1].content = content
    }
)
</script>

<style scoped lang="less">
::v-deep(.el-bubble-list) {
    padding-left: calc(50% - 400px);
    padding-right: calc(50% - 400px);
    width: 800px;

    .el-bubble-content-wrapper .el-bubble-content {
        max-width: 100%;

        &.el-bubble-content-filled {
            margin: 32px 0;
            background: linear-gradient(to left, #fdfcfb 0%, #ffd1ab 100%);
            border-radius: 15px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        &.el-bubble-content-shadow {
            margin-bottom: 36px;
            box-shadow: none;
        }
    }
}
</style>