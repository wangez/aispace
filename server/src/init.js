const path = require('path')
const fs = require('fs')
const mongoose = require('mongoose');
require('dotenv').config();
const rootPath = path.join(__dirname, '../../')
const serverEnv = path.join(rootPath, 'server/.env')
const webEnv = path.join(rootPath, 'web/.env')

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
MONGODB_URI=mongodb://localhost:27017
DEEPSEEK_API_KEY=
DASHSCOPE_API_KEY=`,
    'utf-8'
)
const createWebEnv = () => fs.writeFileSync(
    webEnv,
    'VUE_APP_API_BASE_URL=http://localhost:3000/api',
    'utf-8'
)
if (needCreateFile(serverEnv)) {
    createServerEnv()
}
if (needCreateFile(webEnv)) {
    createWebEnv()
}

const mongoodbURI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const busConnection = mongoose.createConnection(mongoodbURI + '/bus_db');
async function doDrop() {
    await mongoose.connect(mongoodbURI + '/system_db');
    await mongoose.connection.collection('sessions').drop();
    await mongoose.connection.collection('role').drop();
    await mongoose.connection.collection('history').drop();
    await mongoose.connection.collection('counters').drop();
    await mongoose.connection.collection('chat').drop();
    await mongoose.connection.collection('QuestionTemp').drop();
    await mongoose.connection.collection('LongTermMemory').drop();
    await mongoose.connection.collection('user').drop();
    await mongoose.connection.collection('user').insertMany(require('./jsons/system_db.user.json'));
    await mongoose.connection.collection('QuestionTemp').insertMany(require('./jsons/system_db.questionTemp.json'));
    await mongoose.connection.collection('role').insertMany(require('./jsons/system_db.role.json'));

    // 确保连接已经建立
    await busConnection.asPromise();
    await busConnection.collection('_meta_schema').drop();
    await busConnection.collection('book').drop();
    await busConnection.collection('movie').drop();
    await busConnection.collection('order').drop();
    await busConnection.collection('tv').drop();

    await busConnection.collection('_meta_schema').insertMany(require('./jsons/bus_db._meta_schema.json'));
    await busConnection.collection('book').insertMany(require('./jsons/bus_db.book.json'));
    await busConnection.collection('movie').insertMany(require('./jsons/bus_db.movie.json'));
    await busConnection.collection('order').insertMany(require('./jsons/bus_db.order.json'));
    await busConnection.collection('tv').insertMany(require('./jsons/bus_db.tv.json'));
}
doDrop()
    .then(() => {
        console.log('数据导入完成，关闭连接...');
        return mongoose.disconnect();      // 关闭默认连接
    })
    .then(() => busConnection.close())    // 关闭 bus_db 连接
    .catch(err => console.error(err))
    .finally(() => process.exit(0));      // 可选：强制退出