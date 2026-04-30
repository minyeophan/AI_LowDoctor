import mongoose from "mongoose";

const { Schema, model } = mongoose;

const calendarSchema = new Schema(
  {
    userRef: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
      default: null,
    },

    userId: {
      type: String,
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    location: {
      type: String,
      default: "",
      trim: true,
    },

    category: {
      type: String,
      default: "general",
      trim: true,
    },

    alarmEnabled: {
      type: Boolean,
      default: false,
    },

    googleEventId: {
      type: String,
      default: "",
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

calendarSchema.index({ userId: 1, startDate: 1 });
calendarSchema.index({ userRef: 1, startDate: 1 });

const Calendar = model("Calendar", calendarSchema);

export default Calendar;