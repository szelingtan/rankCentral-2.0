import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now },
    status: { 
        type: String, 
        required: true, 
        enum: ['active', 'completed', 'archived'],
        default: 'active'
    },
    documents: [{ type: String }], // References to document paths
    reports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Report' }],
});

export const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);