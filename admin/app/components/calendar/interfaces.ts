export interface IUser {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  preferredContact?: "PHONE" | "EMAIL" | "SMS" | "WHATSAPP";
  picturePath?: string | null;
  defaultRate?: number;
}

export interface IEvent {
  id: string; // Changed from number to string to match Prisma cuid()
  startDate: string | Date;
  endDate: string | Date;
  title: string;
  description?: string;
  user: IUser;
  // Additional Appointment fields from Prisma
  clientId: string;
  rate: number;
  paid?: boolean;
  format: "ONLINE" | "FACE_TO_FACE";
  status?: "NOT_YET_ATTENDED" | "ATTENDED" | "ABSENT" | "CANCELLED";
  isCompleted: boolean;
  isRecurring?: boolean;
  recurringType?: "WEEKLY" | "BIWEEKLY" | "MONTHLY";
  recurrentId?: string | null; // Common ID for all appointments in a recurring series
  hostJwt?: string | null;
  clientJwt?: string | null;
  hostAttended?: boolean | null;
  clientAttended?: boolean | null;
  notes?: any[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ICalendarCell {
  day: number;
  currentMonth: boolean;
  date: Date;
}
