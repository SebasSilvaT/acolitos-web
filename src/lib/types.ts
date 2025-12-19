
export type Role = 'admin' | 'master' | 'acolyte';

export interface User {
  id: string;
  name: string;
  role: Role;
  isActive: boolean;
  limitations: string[]; // e.g. ["Mon-19:00", "Sun-08:00"]
}

export interface MassConfig {
  dayOfWeek: string; // "Monday", "Sunday"
  time: string;      // "19:00", "10:00"
  isCentralOption: boolean; // true if this slot can be a central mass
}

export interface ScheduleEntry {
  id: string;
  date: string; // ISO string "2025-12-25"
  time: string; // "10:00"
  isCentralMass: boolean;
  assignedAcolyteId: string;
  masterId?: string;
  attendance: 'pending' | 'present' | 'absent';
}
