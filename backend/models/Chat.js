import mongoose from 'mongoose';
const { Schema } = mongoose;

const chatSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    },
    unreadByAdmins: {
        type: Number,
        default: 0
    },
    unreadByUser: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

chatSchema.index({ lastMessageAt: -1 });

chatSchema.index({ lastMessageAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;
