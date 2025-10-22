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

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;
