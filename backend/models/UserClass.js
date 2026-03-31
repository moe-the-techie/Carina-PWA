import mongoose from 'mongoose';
const { Schema } = mongoose;

const userClassSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    description: {
        type: String,
        default: '',
        trim: true,
    },
    color: {
        type: String,
        default: '#1976d2',
        validate: {
            validator: function(v) {
                return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
            },
            message: props => `${props.value} is not a valid hex color!`
        }
    },
    icon: {
        type: String,
        default: null,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    order: {
        type: Number,
        default: 0,
        min: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
});

// Update the updatedAt timestamp before saving
userClassSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const UserClass = mongoose.model('UserClass', userClassSchema);

export default UserClass;
