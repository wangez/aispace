<template>
    <div class="metadataManager">
        <div class="formWapper">
            <h3>设置模型key</h3>
            <el-form ref="formRef" :model="formData" :rules="formRules" label-width="200px">
                <el-form-item label="DEEPSEEK_API_KEY" prop="collectionName">
                    <el-input v-model="formData.DEEPSEEK_API_KEY" placeholder="设置deepseek api秘钥" />
                </el-form-item>
                <el-form-item label="DASHSCOPE_API_KEY" prop="description">
                    <el-input v-model="formData.DASHSCOPE_API_KEY" placeholder="设置百炼秘钥" />
                </el-form-item>
                <div style="text-align: center;">
                    <el-button v-if="isSkipShow" @click="doSkip">跳过</el-button>
                    <el-button type="primary" @click="submitForm">保存</el-button>
                </div>
            </el-form>
            <div>注意：key会明文保存到server/.env文件中</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onBeforeMount } from 'vue'
import { useRouter } from 'vue-router'
import { getKey, updateKey, skip } from '@/api/set'

// ---------- 类型定义 ----------
interface Metadata {
    DEEPSEEK_API_KEY: string
    DASHSCOPE_API_KEY: string
}
// ---------- 全局状态 ----------
const router = useRouter()

const isSkipShow = ref(true)
const formRef = ref()
const formData = reactive<Metadata>({
    DEEPSEEK_API_KEY: '',
    DASHSCOPE_API_KEY: ''
})
const formRules = {
    DEEPSEEK_API_KEY: [{ required: true, message: 'deepseek api秘钥不能为空', trigger: 'blur' }],
    DASHSCOPE_API_KEY: [{ required: true, message: '百炼秘钥不能为空', trigger: 'blur' }],
}

// ---------- 辅助函数 ----------
const deepCopy = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj))

// ---------- 筛选 & 排序 ----------

const submitForm = async () => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid: boolean) => {
        if (!valid) return
        const newMetadata: Metadata = {
            ...deepCopy(formData),
        }
        let res = await updateKey(newMetadata)
        if (res.data.success) {
            router.push('/')
        }
    })
}
const doSkip = async () => {
    await skip()
    router.push('/')
}

onBeforeMount(async () => {
    let res = await getKey()
    const { DASHSCOPE_API_KEY, DEEPSEEK_API_KEY, SKIP_SET_KEY } = res.data.data
    formData.DASHSCOPE_API_KEY = DASHSCOPE_API_KEY
    formData.DEEPSEEK_API_KEY = DEEPSEEK_API_KEY
    if (DASHSCOPE_API_KEY || DEEPSEEK_API_KEY || SKIP_SET_KEY) {
        isSkipShow.value = false
    }
})
</script>

<style scoped lang="less">
.metadataManager {
    position: relative;
    padding: 20px;
    background-color: #f5f7fa;
    min-height: 100vh;
    box-sizing: border-box;

    .formWapper {
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        width: 600px;
        height: 220px;
        margin: auto;
        padding: 0 19px 19px 19px;
        border: 1px solid #ccc;
        border-radius: 6px;
        box-shadow: rgba(0, 0, 0, 0.02) 2.76726px 2.76726px 2.21381px 0px, rgba(0, 0, 0, 0.027) 6.6501px 6.6501px 5.32008px 0px, rgba(0, 0, 0, 0.035) 12.5216px 12.5216px 10.0172px 0px, rgba(0, 0, 0, 0.043) 22.3363px 22.3363px 17.869px 0px, rgba(0, 0, 0, 0.05) 41.7776px 41.7776px 33.4221px 0px, rgba(0, 0, 0, 0.07) 100px 100px 80px 0px;
    }
}
</style>