import mongoose from "mongoose";

const { Schema } = mongoose;

const uploadSchema = new Schema({
    documentId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    filename: {
        type: String,
        required: true
    },
    originalname: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    mimetype: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

export default mongoose.model('Upload', uploadSchema);