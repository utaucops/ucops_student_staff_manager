import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
    firstName: string;
    lastName: string;
    rolePosition: "Department Head" | "Technician" | "Operations" | "Crew Member" | "Crew Lead";
    graduationDate?: Date;
    dateHired?: Date;
    mavId: number;
    status: "Active" | "Inactive";
    phoneNumber?: string;
    studentEmail?: string;
    workEmail?: string;
    dietaryRestrictions?: string;
    shirtSize?: "S" | "M" | "L" | "XL" | "2XL";
    keyRequest?: boolean;
}

const UserSchema: Schema = new Schema<IUser>({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    rolePosition: {
        type: String,
        enum: ["Department Head", "Technician", "Operations", "Crew Member", "Crew Lead"],
        required: true,
    },
    graduationDate: { type: Date },
    dateHired: { type: Date },
    mavId: { type: Number, required: true, unique: true },
    status: { type: String, enum: ["Active", "Inactive"], required: true },
    phoneNumber: { type: String },
    studentEmail: { type: String, match: /.+\@.+\..+/ },
    workEmail: { type: String, match: /.+\@.+\..+/ },
    dietaryRestrictions: { type: String },
    shirtSize: { type: String, enum: ["S", "M", "L", "XL", "2XL"] },
    keyRequest: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
