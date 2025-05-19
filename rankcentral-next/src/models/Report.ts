import mongoose from 'mongoose';

// Define schema for CSV files
const CsvFileSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    content: { type: String, required: true }
}, { _id: false });

const ReportSchema = new mongoose.Schema({
    timestamp: { type: Date, required: true, default: Date.now },
    documents: { type: [String], required: true },
    top_ranked: { type: String, required: true },
    csv_files: { type: [mongoose.Schema.Types.Mixed], required: true },
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
