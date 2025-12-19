import { User, ScheduleEntry, MassConfig } from './types';

// MOCK DATA
export const MOCK_USERS: User[] = [
    { id: '1', name: 'Juan Pérez', role: 'acolyte', isActive: true, limitations: ['Mon-19:00'] },
    { id: '2', name: 'María Gómez', role: 'acolyte', isActive: true, limitations: [] },
    { id: '3', name: 'Carlos Ruíz', role: 'admin', isActive: true, limitations: [] },
    { id: '4', name: 'Ana Torres', role: 'master', isActive: true, limitations: ['Sun-10:00'] },
    { id: '5', name: 'Pedro Almodóvar', role: 'acolyte', isActive: true, limitations: [] },
];

export const MOCK_SCHEDULE: ScheduleEntry[] = [
    { id: '101', date: '2025-12-21', time: '10:00', isCentralMass: true, assignedAcolyteId: '1', attendance: 'pending' },
    { id: '102', date: '2025-12-21', time: '10:00', isCentralMass: true, assignedAcolyteId: '2', attendance: 'pending' },
    { id: '103', date: '2025-12-22', time: '19:00', isCentralMass: false, assignedAcolyteId: '5', attendance: 'present' },
];

export const MOCK_MASS_CONFIG: MassConfig[] = [
    { dayOfWeek: 'Sunday', time: '10:00', isCentralOption: true },
    { dayOfWeek: 'Monday', time: '19:00', isCentralOption: false },
];

// Service functions (Mock implementation)
export async function getUsers(): Promise<User[]> {
    return new Promise(resolve => setTimeout(() => resolve(MOCK_USERS), 500));
}

export async function getSchedule(): Promise<ScheduleEntry[]> {
    return new Promise(resolve => setTimeout(() => resolve(MOCK_SCHEDULE), 500));
}
