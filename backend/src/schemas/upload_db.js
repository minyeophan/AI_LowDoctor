import mongoose from "mongoose";

const { Schema } = mongoose;

const uploadSchema = new Schema({
    userID: {
        type: String,
        required: false,
        index: true
    },
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
    },
    contractType: {
        type: String,
        default: "부동산"
    },
    isSaved: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

export default mongoose.model('Upload', uploadSchema);
