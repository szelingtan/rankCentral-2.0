import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ['admin', 'user'] },
    created_at: { type: Date, default: Date.now },
    last_login: { type: Date, default: Date.now },
})

export const User = mongoose.models.User || mongoose.model('User', UserSchema);