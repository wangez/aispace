const mongoose = require("mongoose");

const usageSchema = new mongoose.Schema({
    user_id: { type: String, ref: 'User' },
    year_month: String,
    usage: Number
}, { collection: 'bus_usage' });
const Usage = mongoose.model("Usage", usageSchema);

const userSchema = new mongoose.Schema({
    _id: String,
    area_id: { type: String, ref: 'Area' },
    manager_id: String,
    name: String,
    address: String
}, { collection: 'bus_user' });
const User = mongoose.model("User", userSchema);

const areaSchema = new mongoose.Schema({
    _id: String,
    name: String,
    address: String,
    manager_id: String
}, { collection: 'bus_area' });
const Area = mongoose.model("Area", areaSchema);

module.exports = {
    Usage,
    User,
    Area
}