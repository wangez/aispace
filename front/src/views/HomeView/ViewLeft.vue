<template>
    <div id="left">
        <div class="leftBtn" @click="emits('goNew')">
            <div class="nhbIcon"></div>
            <span>开启新对话</span>
        </div>
        <div id="conversationsWapper">
           <Conversations :active="activeHistory" @change="activeChange" :items="timeBasedItems" groupable
                :label-max-width="200" :show-tooltip="false" row-key="id"></Conversations>
        </div>
        <div class="leftBtn" @click="router.push('/meta')">
            <span>管理元数据</span>
        </div>
        <div id="userinfo">
            <div class="leftBtn" id="loginOut" @click="loginOut">
                <span>退出登录</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
// ---- 引用依赖 ----
import { Conversations } from 'vue-element-plus-x';
import { useRouter } from 'vue-router'
// ---- 文件引用 ----
import type { History } from '@/types/res.d.ts';
// ---- 声明入参、事件 ----
const props = defineProps(['activeHistory', 'timeBasedItems'])
const emits = defineEmits(['activeChange', 'goNew'])
// ---- 定义方法 ----
const router = useRouter()
const activeChange = (history: History) => emits('activeChange', history._id)
const loginOut = () => {
    localStorage.removeItem('token')
    router.push('/login')
}
</script>

<style lang="less" scoped>
#left {
    width: 304px;
    height: 100%;
    display: flex;
    flex-direction: column;
    border-right: 1px solid rgba(0, 0, 0, .04);
    background: #f9fafb;

    padding: 6px 12px 10px;
    box-sizing: border-box;

    .leftBtn {
        position: relative;
        width: 100%;
        height: 40px;
        padding: 0 16px;
        border: 1px solid rgba(103, 158, 254, 0);
        display: flex;
        box-sizing: border-box;

        justify-content: center;
        background: #fff;
        color: #0f1115;
        cursor: pointer;
        user-select: none;
        border-radius: 100px;
        outline: none;
        flex-shrink: 0;
        align-items: center;
        font-size: 14px;
        font-weight: 500;
        transition: box-shadow .3s;
        box-shadow: 0 -2px 2px rgba(72, 104, 178, .04), 0 2px 2px rgba(106, 111, 117, .09), 0 1px 2px rgba(72, 104, 178, .08);

        &#loginOut {

            /* 改为醒目的红色边框，增强退出操作的警示感 */
            border: 1px solid #dc3545;
            /* 文字颜色改为与边框呼应的红色 */
            color: #dc3545;
            /* 保留轻微阴影，略微软化视觉冲击，同时保持层级感 */
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(220, 53, 69, 0.1);

            /* 悬停时强化退出氛围：浅红背景、加深边框与文字 */
            &:hover {
                background-color: #fff5f5;
                border-color: #c82333;
                color: #c82333;
                box-shadow: 0 4px 8px rgba(220, 53, 69, 0.15);
            }

            /* 点击时的微反馈，提升操作手感 */
            &:active {
                transform: scale(0.97);
                background-color: #ffe3e3;
                transition: transform 0.05s;
            }

            /* 键盘聚焦时的清晰提示，保证可访问性 */
            &:focus-visible {
                outline: 2px solid #dc3545;
                outline-offset: 2px;
            }
        }

        .nhbIcon {
            display: inline-flex;
            width: 16px;
            height: 16px;
            margin-right: 6px;
            font-size: 16px;
            line-height: 0;
            background: url(./btn.svg) 0 0 no-repeat;
            background-size: 100% 100%;
        }
    }

    #conversationsWapper {
        width: 100%;
        height: 0;
        flex: 1;

        ::v-deep(.conversations-container) {
            box-shadow: none;

            .conversations-list {
                padding-top: 0px !important; // 覆盖内敛样式
                padding-left: 0px !important; // 覆盖内敛样式
                background-color: transparent !important; // 覆盖内敛样式

                .conversation-group-title {
                    color: #81858c;
                    background-color: #f9fafb;
                    user-select: none;
                    margin-bottom: 2px;
                    padding: 6px 10px 0;
                    font-size: 12px;
                    font-weight: 500;
                    line-height: 18px;
                    text-align: left;
                }

                .conversation-item {
                    margin-right: 0px;
                }
            }
        }
    }

    #userinfo {
        height: 40px;
        width: 100%;
        margin-top: 12px;
    }
}
</style>