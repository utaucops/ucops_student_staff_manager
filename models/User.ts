// models/User.ts
import mongoose, {Document, Schema, Types} from "mongoose";

export enum RolePosition {
    DepartmentHead = "Department Head",
    Technician = "Technician",
    Operations = "Operations",
    CrewLead = "Crew Lead",
    FrontDeskAssistant = "Front Desk Assistant",
    FrontDeskTrainerOrLead = "Front Desk Trainer or Lead",
    MarketingWebsiteAssistant = "Marketing | Website Assistant",
    BuildingManagementAssociate = "Building Management Associate",
    CampusInformationAssistant = "Campus Information Assistant",
    CampusInformationAssistantTrainer = "Campus Information Assistant Trainer",
    CampusInformationAssistantLead = "Campus Information Assistant Lead",
    SetupCrew = "Crew Member",
    EventPersonnel = "Event Personnel",
    OperationsAssistant = "Operations Assistant",
}

export enum UserStatus {
    Active = "Active",
    Inactive = "Inactive",
}

export enum ShirtSize {
    S = "S",
    M = "M",
    L = "L",
    XL = "XL",
    XXL = "2XL",
}

export interface IUser extends Document {
    firstName?: string | null;
    lastName?: string | null;
    rolePosition?: RolePosition | null;

    mavId?: number | null;
    w2w_employee_id?: string | null;
    teams_id?: string | null;

    status?: UserStatus | null;
    phoneNumber?: string | null;
    studentEmail?: string | null;
    workEmail?: string | null;

    shirtSize?: ShirtSize | null;

    dateHired?: Date | null;
    graduationDate?: Date | null;
    dietaryRestrictions?: string | null;
    favorite_plant?: string | null;
    address?: string | null;
    updated_at?: Date | null;
    updated_by?: string | null;
    birthday?: Date | null;
    has_a_second_job?: boolean | null;
    has_ssn?: boolean | null;
    major?: string | null;
    hourlyPayRate?: number | null;
    mostRecentRaiseGranted?: Date | null;
    keyRequest?: boolean | null;

    merits?: Types.ObjectId[] | null;   // references to Metric docs
    demerits?: Types.ObjectId[] | null; // references to Metric docs

    createdAt: Date;
    updatedAt: Date;

    computeNextRaiseEligibility(): Date | null;
    nextRaiseEligibility?: Date | null;
}

const UserSchema: Schema<IUser> = new Schema<IUser>(
    {
        firstName: { type: String, trim: true, default: null },
        lastName: { type: String, trim: true, default: null },
        rolePosition: {
            type: String,
            enum: Object.values(RolePosition),
            default: null,
        },

        mavId: { type: Number, sparse: true, default: null },
        w2w_employee_id: { type: String, default: null },
        teams_id: { type: String, default: null },

        status: {
            type: String,
            enum: Object.values(UserStatus),
            default: null,
        },
        phoneNumber: { type: String, default: null },
        studentEmail: { type: String, match: /.+\@.+\..+/, default: null },
        workEmail: { type: String, match: /.+\@.+\..+/, default: null },

        shirtSize: {
            type: String,
            enum: Object.values(ShirtSize),
            default: null,
        },

        dateHired: { type: Date, default: null },
        graduationDate: { type: Date, default: null },
        dietaryRestrictions: { type: String, default: null },
        favorite_plant: { type: String, default: null },
        address: { type: String, default: null },
        updated_at: { type: Date, default: null },
        updated_by: { type: String, default: null },
        birthday: { type: Date, default: null },
        has_a_second_job: { type: Boolean, default: null },
        has_ssn: { type: Boolean, default: null },
        major: { type: String, default: null },
        hourlyPayRate: { type: Number, min: 0, default: null },
        mostRecentRaiseGranted: { type: Date, default: null },
        keyRequest: { type: Boolean, default: null },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Role pay caps
const ROLE_PAY_CAPS: Partial<Record<RolePosition, number>> = {
    [RolePosition.FrontDeskAssistant]: 13,
    [RolePosition.FrontDeskTrainerOrLead]: 15,
    [RolePosition.MarketingWebsiteAssistant]: 14,
    [RolePosition.BuildingManagementAssociate]: 15,
    [RolePosition.CampusInformationAssistant]: 13,
    [RolePosition.CampusInformationAssistantTrainer]: 15,
    [RolePosition.CampusInformationAssistantLead]: 16,
    [RolePosition.SetupCrew]: 12,
    [RolePosition.CrewLead]: 13,
    [RolePosition.EventPersonnel]: 16,
    [RolePosition.OperationsAssistant]: 16,
    [RolePosition.DepartmentHead]: 15,
    [RolePosition.Technician]: 18,
    [RolePosition.Operations]: 20,
};

function firstOfAnchoredMonth(baseYear: number, hiredAnchor: Date): Date {
    const month = hiredAnchor.getMonth();
    return new Date(baseYear, month, 1, 0, 0, 0, 0);
}

UserSchema.methods.computeNextRaiseEligibility = function (
    this: IUser
): Date | null {
    const cap = this.rolePosition ? ROLE_PAY_CAPS[this.rolePosition] : null;
    if (cap == null || this.hourlyPayRate == null) return null;
    if (this.hourlyPayRate >= cap) return null;
    if (!this.dateHired) return null;

    const baseYear = this.mostRecentRaiseGranted
        ? new Date(this.mostRecentRaiseGranted).getFullYear() + 1
        : new Date(this.dateHired).getFullYear() + 1;

    return firstOfAnchoredMonth(baseYear, this.dateHired);
};

UserSchema.virtual("nextRaiseEligibility").get(function (this: IUser) {
    return this.computeNextRaiseEligibility();
});

const UserModel =
    (mongoose.models?.User as mongoose.Model<IUser>) ||
    mongoose.model<IUser>("User", UserSchema);

export default UserModel;
