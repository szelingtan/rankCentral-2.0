import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema({
    timestamp: { type: Date, required: true, default: Date.now },
    documents: { type: [String], required: true },
    top_ranked: { type: String, required: true },
    csv_files: { type: [String], required: true },
    criteria_count: { type: Number, required: true },
    evaluation_method: {
        type: String,
        required: true,
        enum: ['prompt', 'criteria']
    },
    custom_prompt: { type: String, default: '' },
    report_name: { type: String, required: true },
    api_key_status: {
        type: String,
        required: true,
        enum: ['Valid API key', 'Invalid API key']
    }
});

export const Report = mongoose.models.Report || mongoose.model('Report', ReportSchema);
