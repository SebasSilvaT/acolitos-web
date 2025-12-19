
import { NextResponse } from 'next/server';
import { doc, loadDoc } from '@/lib/googleSheets';

export async function GET() {
    try {
        await loadDoc();
        console.log(`Connected to: ${doc.title}`);

        // 1. Users Sheet
        let usersSheet = doc.sheetsByTitle['Users'];
        if (!usersSheet) {
            usersSheet = await doc.addSheet({ title: 'Users' });
        }
        await usersSheet.setHeaderRow(['id', 'name', 'role', 'active', 'limitations']);

        // 2. Config Sheet
        let configSheet = doc.sheetsByTitle['Config'];
        if (!configSheet) {
            configSheet = await doc.addSheet({ title: 'Config' });
        }
        await configSheet.setHeaderRow(['day', 'time', 'type', 'setting_key', 'setting_value']);

        // Seed data
        const rows = await configSheet.getRows();
        if (rows.length === 0) {
            await configSheet.addRows([
                { day: 'Monday', time: '19:00', type: 'regular' },
                { day: 'Tuesday', time: '19:00', type: 'regular' },
                { day: 'Wednesday', time: '19:00', type: 'regular' },
                { day: 'Thursday', time: '19:00', type: 'regular' },
                { day: 'Friday', time: '19:00', type: 'regular' },
                { day: 'Saturday', time: '19:00', type: 'regular' },
                { day: 'Sunday', time: '08:00', type: 'regular' },
                { day: 'Sunday', time: '10:00', type: 'central_option' },
                { day: 'Sunday', time: '12:00', type: 'central_option' },
                { day: 'Sunday', time: '18:00', type: 'central_option' },
                { day: 'Sunday', time: '19:30', type: 'regular' },
                { setting_key: 'acolytes_per_mass', setting_value: '2' },
            ]);
        }

        // 3. Schedule Sheet
        let scheduleSheet = doc.sheetsByTitle['Schedule'];
        if (!scheduleSheet) {
            scheduleSheet = await doc.addSheet({ title: 'Schedule' });
        }
        await scheduleSheet.setHeaderRow(['id', 'date', 'time', 'is_central_mass', 'assigned_acolyte_id', 'assigned_acolyte_name', 'attendance_status']);

        return NextResponse.json({ success: true, message: 'Database initialized successfully!' });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
