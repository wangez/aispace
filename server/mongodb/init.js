const mongoose = require('mongoose');
require('dotenv').config();

const mongoodbURI = process.env.MONGODB_URI
async function doDrop() {
    await mongoose.connect(mongoodbURI)

    await mongoose.connection.collection('_sys_chat').drop()
    await mongoose.connection.collection('_sys_counter').drop()
    await mongoose.connection.collection('_sys_history').drop()
    await mongoose.connection.collection('_sys_session').drop()
    await mongoose.connection.collection('_sys_user').drop()

    await mongoose.connection.collection('_sys_user').insertMany(require('./jsons/system_db.user.json'))
    // 业务数据
    await mongoose.connection.collection('bus_area').drop()
    await mongoose.connection.collection('bus_manager').drop()
    await mongoose.connection.collection('bus_usage').drop()
    await mongoose.connection.collection('bus_user').drop()
    await mongoose.connection.collection('bus_area').insertMany(require('./jsons/bus_db.area.json'))
    await mongoose.connection.collection('bus_manager').insertMany(require('./jsons/bus_db.manager.json'))
    await mongoose.connection.collection('bus_usage').insertMany(require('./jsons/bus_db.usage.json'))
    await mongoose.connection.collection('bus_user').insertMany(require('./jsons/bus_db.user.json'))
}
doDrop()
    .then(() => {
        console.log('数据导入完成，关闭连接...');
        return mongoose.disconnect();      // 关闭默认连接
    })
    .catch(err => console.error(err))
// .finally(() => process.exit(0));      // 可选：强制退出