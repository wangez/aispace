<template>
    <div class="metadata-manager">
        <!-- 页面标题 -->
        <div class="header">
            <h2>集合元数据管理</h2>
        </div>

        <!-- 筛选区域 -->
        <div class="filter-bar">
            <el-input v-model="filterText" placeholder="搜索集合名称或描述" clearable style="width: 260px"
                @clear="handleFilterChange" @input="handleFilterChange" />
            <el-select v-model="vectorFilter" placeholder="向量提取状态" clearable style="width: 160px"
                @change="handleFilterChange">
                <el-option label="已提取" :value="true" />
                <el-option label="未提取" :value="false" />
            </el-select>
            <el-button @click="resetFilters">重置筛选</el-button>
        </div>

        <!-- 数据表格 -->
        <el-table :data="pagedData" v-loading="loading" border style="width: 100%" @sort-change="handleSortChange">
            <el-table-column prop="collectionName" label="集合名称" sortable="custom" width="180" />
            <el-table-column prop="description" label="集合描述" min-width="200" show-overflow-tooltip />
            <el-table-column prop="fields" label="字段数量" width="100">
                <template #default="{ row }">
                    {{ row.fields?.length || 0 }}
                </template>
            </el-table-column>
            <el-table-column prop="updatedAt" label="更新时间" sortable="custom" width="180">
                <template #default="{ row }">
                    {{ formatDate(row.updatedAt) }}
                </template>
            </el-table-column>
            <el-table-column prop="vectorExtracted" label="向量提取" width="100">
                <template #default="{ row }">
                    <el-tag :type="row.vectorExtracted ? 'success' : 'info'">
                        {{ row.vectorExtracted ? '已提取' : '未提取' }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
                <template #default="{ row }">
                    <el-button link type="primary" size="small" @click="handleView(row)">查看</el-button>
                    <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
                    <el-button link type="primary" size="small" @click="handleEmbedding(row)">提取向量</el-button>
                </template>
            </el-table-column>
        </el-table>

        <!-- 分页组件 -->
        <div class="pagination">
            <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50]"
                :total="filteredAndSortedData.length" layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleSizeChange" @current-change="handleCurrentChange" />
        </div>

        <!-- 查看/编辑/新建 对话框 -->
        <el-dialog v-model="dialogVisible" :title="dialogMode === 'view' ? '查看集合元数据' : '编辑集合元数据'" width="70%" top="5vh"
            destroy-on-close @close="closeDialog">
            <el-form ref="formRef" :model="formData" :rules="formRules" label-width="110px"
                :disabled="dialogMode === 'view'">
                <el-form-item label="集合名称" prop="collectionName">
                    <el-input v-model="formData.collectionName" placeholder="集合名称（唯一）" />
                </el-form-item>
                <el-form-item label="集合描述" prop="description">
                    <el-input v-model="formData.description" type="textarea" :rows="2" placeholder="集合简介" />
                </el-form-item>
                <el-form-item label="向量提取状态" prop="vectorExtracted">
                    <el-switch v-model="formData.vectorExtracted" active-text="已提取" inactive-text="未提取" />
                </el-form-item>
                <el-form-item label="字段定义" required>
                    <div class="fields-editor">
                        <el-table :data="formData.fields" border style="width: 100%">
                            <el-table-column label="字段名称" min-width="120">
                                <template #default="scope">
                                    <el-input v-model="scope.row.fieldName" placeholder="字段名" size="small" />
                                </template>
                            </el-table-column>
                            <el-table-column label="字段类型" min-width="120">
                                <template #default="scope">
                                    <el-select v-model="scope.row.type" placeholder="选择类型" size="small">
                                        <el-option label="String" value="String" />
                                        <el-option label="Number" value="Number" />
                                        <el-option label="Boolean" value="Boolean" />
                                        <el-option label="Date" value="Date" />
                                        <el-option label="Object" value="Object" />
                                        <el-option label="Array" value="Array" />
                                    </el-select>
                                </template>
                            </el-table-column>
                            <el-table-column label="字段描述" min-width="150">
                                <template #default="scope">
                                    <el-input v-model="scope.row.description" placeholder="描述" size="small" />
                                </template>
                            </el-table-column>
                            <el-table-column label="示例值" min-width="150">
                                <template #default="scope">
                                    <el-input v-model="scope.row.example" placeholder="示例值" size="small" />
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" width="70" fixed="right" v-if="dialogMode !== 'view'">
                                <template #default="scope">
                                    <el-button link type="danger" size="small"
                                        @click="removeField(scope.$index)">删除</el-button>
                                </template>
                            </el-table-column>
                        </el-table>
                        <el-button v-if="dialogMode !== 'view'" type="primary" link style="margin-top: 12px"
                            @click="addField">
                            + 添加字段
                        </el-button>
                    </div>
                </el-form-item>
            </el-form>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button v-if="dialogMode !== 'view'" type="primary" @click="submitForm">保存</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { getAll, doEmbedding, updateMeta } from '@/api/embedding'

// ---------- 类型定义 ----------
interface Field {
    fieldName: string
    type: string
    description: string
    example: any
}

interface Metadata {
    _id?: string
    collectionName: string
    description: string
    fields: Field[]
    updatedAt: Date | string
    vectorExtracted: boolean
}

// ---------- 全局状态 ----------
const loading = ref(false)
const dataList = ref<Metadata[]>([])

const filterText = ref('')
const vectorFilter = ref<boolean | null>(null)
const sortProp = ref<string>('updatedAt')
const sortOrder = ref<'ascending' | 'descending' | null>('descending')
const currentPage = ref(1)
const pageSize = ref(10)

const dialogVisible = ref(false)
const dialogMode = ref<'view' | 'edit'>('view')
const formRef = ref()
const formData = reactive<Metadata>({
    collectionName: '',
    description: '',
    fields: [],
    updatedAt: new Date().toISOString(),
    vectorExtracted: false,
})
let editingId: string | null = null

const formRules = {
    collectionName: [
        { required: true, message: '集合名称不能为空', trigger: 'blur' },
        {
            validator: (_: any, value: string, callback: any) => {
                if (dialogMode.value === 'edit') {
                    const exists = dataList.value.some(
                        (item) => item.collectionName === value && item._id !== editingId
                    )
                    if (exists) {
                        callback(new Error('集合名称已存在，请使用唯一名称'))
                    } else {
                        callback()
                    }
                } else {
                    callback()
                }
            },
            trigger: 'blur',
        },
    ],
    description: [{ required: true, message: '集合描述不能为空', trigger: 'blur' }],
}

// ---------- 辅助函数 ----------
const formatDate = (date: Date | string) => {
    if (!date) return ''
    const d = new Date(date)
    return d.toLocaleString('zh-CN')
}

const deepCopy = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj))

// ---------- 筛选 & 排序 ----------
const filteredData = computed(() => {
    let result = [...dataList.value]
    if (filterText.value.trim()) {
        const keyword = filterText.value.trim().toLowerCase()
        result = result.filter(
            (item) =>
                item.collectionName.toLowerCase().includes(keyword) ||
                item.description.toLowerCase().includes(keyword)
        )
    }
    if (vectorFilter.value !== null) {
        result = result.filter((item) => item.vectorExtracted === vectorFilter.value)
    }
    return result
})

const filteredAndSortedData = computed(() => {
    const sorted = [...filteredData.value]
    if (sortProp.value && sortOrder.value) {
        sorted.sort((a, b) => {
            let aVal: any = a[sortProp.value as keyof Metadata]
            let bVal: any = b[sortProp.value as keyof Metadata]
            if (sortProp.value === 'updatedAt') {
                aVal = new Date(aVal).getTime()
                bVal = new Date(bVal).getTime()
            }
            if (aVal === bVal) return 0
            return sortOrder.value === 'ascending' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1)
        })
    }
    return sorted
})

const pagedData = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    return filteredAndSortedData.value.slice(start, start + pageSize.value)
})

const resetPage = () => {
    currentPage.value = 1
}

const handleFilterChange = () => {
    resetPage()
}

const resetFilters = () => {
    filterText.value = ''
    vectorFilter.value = null
    resetPage()
}

const handleSortChange = ({ prop, order }: { prop: string | null; order: string | null }) => {
    if (prop) {
        sortProp.value = prop
        sortOrder.value = order as 'ascending' | 'descending' | null
    } else {
        sortProp.value = 'updatedAt'
        sortOrder.value = 'descending'
    }
    resetPage()
}

const handleSizeChange = (size: number) => {
    pageSize.value = size
    resetPage()
}

const handleCurrentChange = () => {
    // 仅翻页
}

// ---------- 增删改查 ----------
const loadData = async () => {
    loading.value = true
    const res = await getAll()
    dataList.value = res.data.data
    loading.value = false
}

const submitForm = async () => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid: boolean) => {
        if (!valid) return
        for (let i = 0; i < formData.fields.length; i++) {
            const field = formData.fields[i]
            if (!field.fieldName || !field.type) {
                ElMessage.error(`第${i + 1}个字段的“字段名称”和“字段类型”不能为空`)
                return
            }
        }
        const newMetadata: Metadata = {
            ...deepCopy(formData),
            updatedAt: new Date().toISOString(),
        }
        let res = await updateMeta(newMetadata)
        if (res.data.success) {
            dialogVisible.value = false
            resetPage()
            loadData()
        }
    })
}

const handleEmbedding = async (row: Metadata) => {
    let res = await doEmbedding(row)
    if (res.data.success) {
        ElMessage.success('向量提取成功')
        loadData()
    }
}

const handleView = (row: Metadata) => {
    dialogMode.value = 'view'
    editingId = row._id || null
    Object.assign(formData, deepCopy(row))
    dialogVisible.value = true
}

const handleEdit = (row: Metadata) => {
    dialogMode.value = 'edit'
    editingId = row._id || null
    Object.assign(formData, deepCopy(row))
    dialogVisible.value = true
}

const closeDialog = () => {
    formRef.value?.resetFields()
}

const addField = () => {
    formData.fields.push({
        fieldName: '',
        type: 'String',
        description: '',
        example: '',
    })
}

const removeField = (index: number) => {
    formData.fields.splice(index, 1)
}

onMounted(() => {
    loadData()
})
</script>

<style scoped lang="less">
.metadata-manager {
    padding: 20px;
    background-color: #f5f7fa;
    min-height: 100vh;
    box-sizing: border-box;

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;

        h2 {
            margin: 0;
            font-weight: 500;
        }
    }

    .filter-bar {
        display: flex;
        gap: 12px;
        margin-bottom: 20px;
        flex-wrap: wrap;
        align-items: center;
    }

    .pagination {
        margin-top: 20px;
        display: flex;
        justify-content: flex-end;
    }

    .fields-editor {
        width: 100%;
        overflow-x: auto;
    }
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}
</style>