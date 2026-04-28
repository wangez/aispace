const path = require('path')
const fs = require('fs')
const rootPath = path.join(__dirname, '../../')
const serverEnv = path.join(rootPath, 'server/.env')
const frontEnv = path.join(rootPath, 'front/.env')

const needCreateFile = file => {
    try {
        fs.statSync(file)
        return false
    } catch (e) {
        return true
    }
}
const createServerEnv = () => fs.writeFileSync(
    serverEnv,
    `PORT=3000
MONGODB_URI=mongodb://localhost:27017/system_db
DEEPSEEK_API_KEY=
DASHSCOPE_API_KEY=`,
    'utf-8'
)
const createFrontEnv = () => fs.writeFileSync(
    frontEnv,
    'VUE_APP_API_BASE_URL=http://localhost:3000/api',
    'utf-8'
)
if (needCreateFile(serverEnv)) {
    createServerEnv()
}
if (needCreateFile(frontEnv)) {
    createFrontEnv()
}