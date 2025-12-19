
import { getSheetByTitle } from './googleSheets';
import { User, ScheduleEntry, MassConfig } from './types';

// USERS
export async function getUsers(): Promise<User[]> {
    const sheet = await getSheetByTitle('Users');
    const rows = await sheet.getRows();

    return rows.map(row => ({
        id: row.id,
        name: row.name,
        role: row.role as any,
        isActive: row.active === 'TRUE' || row.active === 'true' || row.active === true,
        limitations: row.limitations ? row.limitations.split(',').map((s: string) => s.trim()) : [],
    }));
}

// SCHEDULE
export async function getSchedule(): Promise<ScheduleEntry[]> {
    const sheet = await getSheetByTitle('Schedule');
    const rows = await sheet.getRows();

    // Sort by date/time
    rows.sort((a, b) => {
        const da = new Date(`${a.date}T${a.time}`);
        const db = new Date(`${b.date}T${b.time}`);
        return da.getTime() - db.getTime();
    });

    return rows.map(row => ({
        id: row.id,
        date: row.date,
        time: row.time,
        isCentralMass: row.is_central_mass === 'TRUE',
        assignedAcolyteId: row.assigned_acolyte_id,
        attendance: row.attendance_status as any,
    }));
}

// CONFIG
export async function getMassConfig(): Promise<MassConfig[]> {
    const sheet = await getSheetByTitle('Config');
    const rows = await sheet.getRows();
    // Filter only mass definitions
    return rows
        .filter(r => r.day && r.time)
        .map(r => ({
            dayOfWeek: r.day,
            time: r.time,
            isCentralOption: r.type === 'central_option'
        }));
}
