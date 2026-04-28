<template>
   <BubbleList :list="list" max-height="100%" style="text-align: left;">
        <template #header="{ item }">
            <div v-if="item.reasoning && item.reasoning.length" class="reasoning-wrapper">
                <div class="reasoning-head">已思考</div>
                <div class="reasoning">
                    <div class="reasoning-point"></div>
                    <div class="reasoning-line"></div>
                    <div class="reasoning-content">
                        <p v-for="(text, index) in item.reasoning" :key="index">{{ text }}</p>
                    </div>
                </div>
            </div>
        </template>
    </BubbleList>
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
    reasoning: string[],
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
    content: string | undefined,
    reasoning: string,
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
const props = defineProps(['activeKey', 'streamAnswer', 'streamReasoning', 'activeChatKey'])
// ---- 声明响应式变量 ----
const list = ref<BubbleListProps<listType>['list']>([])
// ---- 定义方法 ----
const loadData = async () => {
    let test = await getAll(props.activeKey)
    let reslist: ResItem[] = test.data.data
    list.value = reslist.map((item, index) => {
        let { role, content, reasoning = '' } = item
        return {
            key: index + 1, // 唯一标识
            role, // user | assistant 自行更据模型定义
            content, // 消息内容 流式接受的时候，只需要改这个值即可
            reasoning: reasoning ? reasoning.split('<\br>') : [],
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
watch(
    () => props.streamReasoning,
    reasoning => {
        console.log(reasoning, reasoning.split('<\br>'))
        list.value[list.value.length - 1].reasoning = reasoning.split('<\br>')
    }
)
</script>

<style scoped lang="less">
::v-deep(.el-bubble-list) {
    .reasoning-wrapper {
        margin-bottom: 10px;
        position: relative;

        .reasoning-head {
            width: 100%;
            height: 38px;
            max-height: 38px;
            cursor: pointer;
            pointer-events: all;
            top: 0px;
            z-index: 7;
            align-items: center;
            margin-bottom: 2px;
            display: flex;
            position: sticky;
            background: #fff;
        }

        .reasoning {
            margin: 0;
            padding: 5px 0 0 22px;
            position: relative;

            .reasoning-point {
                width: 16px;
                height: 16px;
                color: #3964fe;
                user-select: none;
                position: absolute;
                top: 9px;
                left: 0;
                justify-content: center;
                align-items: center;
                display: inline-flex;

                &::after {
                    content: "";
                    background: #3964fe;
                    border-radius: 50%;
                    width: 5px;
                    height: 5px;
                }
            }

            .reasoning-line {
                border-left: 1px solid #e1e5ea;
                height: calc(100% - 32px);
                position: absolute;
                top: 31px;
                left: 7.5px;
            }

            .reasoning-content {
                font: 14px/24px "quote-cjk-patch", "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
                color: #61666b;

                p {
                    margin: 0 0 12px 0;
                }
            }
        }
    }
}
</style>

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