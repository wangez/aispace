const { defineConfig } = require("@vue/cli-service");
const AutoImport = require("unplugin-auto-import/webpack");
const Components = require("unplugin-vue-components/webpack");
const Icons = require("unplugin-icons/webpack");
const IconsResolver = require("unplugin-icons/resolver").default;  // 注意 .default
const { ElementPlusResolver } = require("unplugin-vue-components/resolvers");

module.exports = defineConfig({
    transpileDependencies: true,
    configureWebpack: {
        plugins: [
            // 自动导入 Vue/Element Plus API
            AutoImport({
                resolvers: [
                    ElementPlusResolver({ importStyle: 'css' }),
                    IconsResolver({ prefix: 'Icon' }),
                ],
                // 👇 关键配置：生成 .eslintrc-auto-import.json
                eslintrc: {
                    enabled: true,       // 默认 false，需手动开启
                    filepath: './.eslintrc-auto-import.json', // 默认路径
                    globalsPropValue: 'readonly', // 可选，默认 true
                }
            }),
            // 自动导入 Vue/Element Plus 组件
            Components({
                resolvers: [
                    ElementPlusResolver(),
                    IconsResolver({ enabledCollections: ["ep"] }),
                ],
            }),
            Icons({ autoInstall: true }),
        ],
    },
});