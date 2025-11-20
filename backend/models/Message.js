import mongoose from 'mongoose';
const { Schema } = mongoose;

const messageSchema = new Schema({
    chatId: {
        type: Schema.Types.ObjectId,
        ref: 'Chat',
        required: true,
        index: true
    },
    senderId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderRole: {
        type: String,
        enum: ['user', 'admin'],
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    readByAdmins: {
        type: Boolean,
        default: false
    },
    readByUser: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

messageSchema.index({ chatId: 1, createdAt: -1 });

messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days = 2592000 seconds

const Message = mongoose.model('Message', messageSchema);

export default Message;
