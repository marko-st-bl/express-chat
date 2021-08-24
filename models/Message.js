const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
    message: {
        type: String,
        required: true
    },
    from: {
        type: Object,
        required: true
    },
    to: {
        type: Schema.Types.ObjectId,
        required: true
    },
    time: {
        type: String //Change to Date
    }
})

const Message = mongoose.model('messages', MessageSchema)

module.exports = Message;