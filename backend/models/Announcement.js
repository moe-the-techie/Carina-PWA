import mongoose from 'mongoose';
const { Schema } = mongoose;

const announcementSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },
    targetAudience: {
        type: String,
        enum: ['all', 'classes'],
        default: 'all'
    },
    targetClasses: [{
        type: Schema.Types.ObjectId,
        ref: 'UserClass'
    }],
    authorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    expiresAt: {
        type: Date,
        default: null
    },
    readBy: [{
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes for better performance
announcementSchema.index({ createdAt: -1 });
announcementSchema.index({ authorId: 1 });
announcementSchema.index({ targetClasses: 1 });
announcementSchema.index({ 'readBy.userId': 1 });
announcementSchema.index({ isActive: 1, expiresAt: 1 });

announcementSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Virtual to get unread count for a specific user
announcementSchema.virtual('isReadByUser').get(function() {
    return this.readBy && this.readBy.some(read => read.userId.toString() === this._userId);
});

// Method to check if announcement is visible to user
announcementSchema.methods.isVisibleToUser = function(user) {
    // Check if announcement is active and not expired
    if (!this.isActive || (this.expiresAt && new Date() > this.expiresAt)) {
        return false;
    }

    // Check target audience
    if (this.targetAudience === 'all') {
        return true;
    }

    // Check if user's class is in target classes
    if (this.targetAudience === 'classes' && user.userClass) {
        return this.targetClasses.some(classId => classId.toString() === user.userClass.toString());
    }

    return false;
};

// Method to mark as read by user
announcementSchema.methods.markAsReadByUser = function(userId) {
    const existingRead = this.readBy.find(read => read.userId.toString() === userId.toString());
    
    if (!existingRead) {
        this.readBy.push({ userId, readAt: new Date() });
    }
    
    return this.save();
};

// Static method to get announcements for user
announcementSchema.statics.getForUser = function(user) {
    const query = {
        isActive: true,
        $or: [
            { expiresAt: null },
            { expiresAt: { $gte: new Date() } }
        ]
    };

    if (user.role !== 'admin') {
        query.$and = [
            {
                $or: [
                    { targetAudience: 'all' },
                    {
                        targetAudience: 'classes',
                        targetClasses: user.userClass
                    }
                ]
            }
        ];
    }

    return this.find(query)
        .populate('authorId', 'name email')
        .populate('targetClasses', 'name color')
        .sort({ createdAt: -1 });
};

const Announcement = mongoose.model('Announcement', announcementSchema);

export default Announcement;