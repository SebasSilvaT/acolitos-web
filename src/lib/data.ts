
import { getSheetByTitle } from './googleSheets';
import { User, ScheduleEntry, MassConfig } from './types';

// USERS
export async function getUsers(): Promise<User[]> {
    const sheet = await getSheetByTitle('Users');
    const rows = await sheet.getRows();

    return rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        role: row.role as any,
        isActive: row.active === 'TRUE' || row.active === 'true' || row.active === true,

        limitations: row.limitations ? row.limitations.split(',').map((s: string) => s.trim()) : [],
    }));
}

export async function addUser(user: Omit<User, 'id'>): Promise<User> {
    const sheet = await getSheetByTitle('Users');
    const newId = crypto.randomUUID();

    await sheet.addRow({
        id: newId,
        name: user.name,
        role: user.role,
        active: user.isActive ? 'TRUE' : 'FALSE',
        limitations: user.limitations.join(',')
    });

    return { ...user, id: newId };
}

export async function updateUser(id: string, updates: Partial<User>): Promise<boolean> {
    const sheet = await getSheetByTitle('Users');
    const rows = await sheet.getRows();
    const row = rows.find((r: any) => r.id === id);

    if (!row) return false;

    if (updates.name !== undefined) row.name = updates.name;
    if (updates.role !== undefined) row.role = updates.role;
    if (updates.isActive !== undefined) row.active = updates.isActive ? 'TRUE' : 'FALSE';
    if (updates.limitations !== undefined) row.limitations = updates.limitations.join(',');

    await row.save();
    return true;
}

// SCHEDULE
export async function getSchedule(): Promise<ScheduleEntry[]> {
    const sheet = await getSheetByTitle('Schedule');
    const rows = await sheet.getRows();

    // Sort by date/time
    rows.sort((a: any, b: any) => {
        const da = new Date(`${a.date}T${a.time}`);
        const db = new Date(`${b.date}T${b.time}`);
        const ta = da.getTime();
        const tb = db.getTime();
        if (isNaN(ta)) return 1;
        if (isNaN(tb)) return -1;
        return ta - tb;
    });

    return rows.map((row: any) => ({
        id: row.id,
        date: row.date,
        time: row.time ? row.time.toString().trim() : '',
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
        .filter((r: any) => r.day && r.time)
        .map((r: any) => ({
            dayOfWeek: r.day,
            time: r.time,
            isCentralOption: r.type === 'central_option'
        }));
}

// SAVE SCHEDULE
export async function saveSchedule(entries: Omit<ScheduleEntry, 'id' | 'attendance'>[]): Promise<void> {
    const sheet = await getSheetByTitle('Schedule');

    // Prepare rows
    const rows = entries.map(entry => ({
        id: crypto.randomUUID(),
        date: entry.date,
        time: entry.time,
        is_central_mass: entry.isCentralMass ? 'TRUE' : 'FALSE',
        assigned_acolyte_id: entry.assignedAcolyteId,
        attendance_status: 'pending'
    }));

    await sheet.addRows(rows);
}

// CLEAR SCHEDULE RANGE
export async function clearScheduleRange(startDate: string, endDate: string): Promise<void> {
    const sheet = await getSheetByTitle('Schedule');
    const rows = await sheet.getRows();

    // Identify rows to delete
    // We iterate in reverse to avoid index shifting issues when deleting
    // Note: google-spreadsheet rows.delete() might shift indices of subsequent rows in the local array?
    // Actually, row.delete() makes a request. It's safer to filter and delete.
    // However, deleting one by one is slow. But for this scale it's fine.

    const usersToDelete = rows.filter((r: any) => r.date >= startDate && r.date <= endDate);

    // Delete in parallel or sequence
    for (const row of usersToDelete) {
        await row.delete();
    }
}

// UPDATE ATTENDANCE
export async function updateAttendance(scheduleId: string, status: 'present' | 'absent' | 'pending'): Promise<boolean> {
    const sheet = await getSheetByTitle('Schedule');
    const rows = await sheet.getRows();

    const row = rows.find((r: any) => r.id === scheduleId);
    if (!row) return false;

    row.attendance_status = status;
    await row.save();
    return true;
}

export async function clearAllSchedule(): Promise<void> {
    const sheet = await getSheetByTitle('Schedule');
    // Using clear() is much cleaner and avoids 429 Rate Limit errors from deleting row-by-row
    await sheet.clear();
    await sheet.setHeaderRow(['id', 'date', 'time', 'is_central_mass', 'assigned_acolyte_id', 'attendance_status']);
}
