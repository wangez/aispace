const QuicklyExtractIntention = require('../routes/chatRouters/QuicklyExtractIntention')

const getUserIntent = async question => {
    const index = QuicklyExtractIntention(question) - 1
}