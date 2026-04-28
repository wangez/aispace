<script setup lang="ts">
import { getStreamList, getAllChunks } from '@/api/streamChunks'

import { ref, onBeforeMount, watch, computed } from "vue";


interface ResData {
    chunkJSON: string,
    text: string,
    textOrigin: string,
    timeFleg: number,
    _id: string,
}

const timeList = ref([])
const active = ref(0)
const chunkList = ref<ResData[]>([])
const activeChunk = ref('')
const chunkJSON = computed(() => {
    let str = ''
    let find: ResData | undefined
    if (chunkList.value && activeChunk.value) {
        find = chunkList.value.find(item => item._id === activeChunk.value)
        if (find) {
            str = find.chunkJSON
        }
    }
    return str.split('\n')
        .filter(item => item.match(/(^\s*)([^\s].*$)/))
        .map(item => {
            let match = item.match(/(^\s*)([^\s].*$)/)
            if (match) {
                return {
                    textOrigin: find?.textOrigin,
                    indent: match[1].length / 2,
                    text: match[2]
                }
            }
        })
})

watch(() => active.value, async () => {
    const res = await getAllChunks(active.value)
    chunkList.value = res.data.data
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
        <div style="width: 0; flex: 1; height: 100%;">
            <span style="display: inline-block; padding: 4px; cursor: pointer;"
                :style="{ backgroundColor: activeChunk === item._id ? '#f66' : item.textOrigin === 'text' ? '#66f' : '#aaa' }"
                v-for="item in chunkList" :key="item._id" @click="activeChunk = item._id">{{ item.text }}</span>
        </div>
        <div style="width: 0; flex: 1; height: 100%; background: #333; text-align: left; color: #fff;">
            <div v-if="activeChunk">
                <div>{{ chunkJSON[0] && chunkJSON[0].textOrigin }}</div>
                <div v-for="(item, index) in chunkJSON" :style="{ textIndent: item?.indent + 'em' }" :key="index">{{
                    item?.text }}</div>
            </div>
        </div>
    </div>
</template>