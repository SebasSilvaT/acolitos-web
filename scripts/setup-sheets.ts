
import { doc, loadDoc } from '../src/lib/googleSheets';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function setupSheets() {
    console.log('Connecting to Google Sheets...');
    try {
        await loadDoc();
        console.log(`Connected to sheet: ${doc.title}`);

        // 1. Setup Users Sheet
        let usersSheet = doc.sheetsByTitle['Users'];
        if (!usersSheet) {
            console.log('Creating "Users" sheet...');
            usersSheet = await doc.addSheet({ title: 'Users' });
        }
        await usersSheet.setHeaderRow(['id', 'name', 'role', 'active', 'limitations']);
        console.log('✅ Users sheet ready');

        // 2. Setup Config/Masses Sheet
        // We'll use this to store the fixed weekly schedule
        let configSheet = doc.sheetsByTitle['Config'];
        if (!configSheet) {
            console.log('Creating "Config" sheet...');
            configSheet = await doc.addSheet({ title: 'Config' });
        }
        await configSheet.setHeaderRow(['day', 'time', 'type', 'setting_key', 'setting_value']);
        // Seed some data if empty
        const rows = await configSheet.getRows();
        if (rows.length === 0) {
            console.log('Seeding default configuration...');
            await configSheet.addRows([
                // Default Mass Schedule
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
                // Global Settings
                { setting_key: 'acolytes_per_mass', setting_value: '2' },
            ]);
        }
        console.log('✅ Config sheet ready');

        // 3. Setup Schedule Sheet
        let scheduleSheet = doc.sheetsByTitle['Schedule'];
        if (!scheduleSheet) {
            console.log('Creating "Schedule" sheet...');
            scheduleSheet = await doc.addSheet({ title: 'Schedule' });
        }
        await scheduleSheet.setHeaderRow(['id', 'date', 'time', 'is_central_mass', 'assigned_acolyte_id', 'assigned_acolyte_name', 'attendance_status']);
        console.log('✅ Schedule sheet ready');

        console.log('🎉 Database initialization complete!');

    } catch (error) {
        console.error('❌ Error initializing sheets:', error);
    }
}

setupSheets();
