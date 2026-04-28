<template>
    <div class="senderWapper">
        <el-radio-group v-model="type" style="margin-bottom: 30px">
            <el-radio-button value="默认">默认</el-radio-button>
            <el-radio-button value="聊天">聊天</el-radio-button>
            <el-radio-button value="查询业务数据">查询业务数据</el-radio-button>
        </el-radio-group>
        <Sender ref="senderRef" v-model="senderValue" :loading="props.loading" @submit="handleSubmit" variant="updown"
            :auto-size="{ minRows: 2, maxRows: 5 }" clearable allow-speech :placeholder="placeholder">
            <template #prefix>
                <div class="btnWapper">
                    <div :class="{ addToTemp }" class="btn" @click="addToTemp = !addToTemp">
                        <span>添加问题到模板库</span>
                    </div>
                </div>
            </template>
        </Sender>
    </div>
</template>

<script setup lang="ts">
// ---- 引用依赖 ----
import { ref, computed } from 'vue'
import { Sender } from 'vue-element-plus-x';
// ---- 声明入参、事件 ----
const props = defineProps(['loading'])
const emits = defineEmits(['create'])
// ---- 声明普通变量 ----
const placeholderDict = {
    '默认': '后台判断用户意图为聊天还是查询业务数据，会增加token消耗',
    '聊天': '请输入内容',
    '查询业务数据': '请输入内容',
} as const; // 使用 as const 让键名变成字面量类型
const typeDict = {
    '默认': '',
    '聊天': 'chat',
    '查询业务数据': 'bus',
} as const; // 使用 as const 让键名变成字面量类型
type TabKey = keyof typeof placeholderDict; // "默认" | "聊天" | "查询业务数据"
// ---- 声明响应式变量 ----
const senderRef = ref();
const senderValue = ref('今年是2026年，根据去年的趋势，帮我算算城西台区A今年7月用多少电');
const type = ref<TabKey>('默认')
const placeholder = computed(() => placeholderDict[type.value])
const addToTemp = ref<boolean>(false)
// ---- 定义方法 ----
const handleSubmit = () => {
    const label = senderValue.value
    senderRef.value.clear()
    emits('create', { label, type: typeDict[type.value], addToTemp: addToTemp.value })
}
</script>

<style lang="less" scoped>
.senderWapper {
    width: 100%;
    padding: 20px 0;
}

.btnWapper {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;

    .btn {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 2px 12px;
        border: 1px solid silver;
        border-radius: 15px;
        cursor: pointer;
        font-size: 12px;

        &.addToTemp {
            color: #626aef;
            border: 1px solid #626aef !important;
            border-radius: 15px;
            padding: 3px 12px;
            font-weight: 700;
        }
    }
}
</style>