
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables manually
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    console.warn("⚠️ .env.local not found at " + envPath);
}

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
// Handle newlines in private key
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY
    ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

async function setup() {
    if (!SPREADSHEET_ID || !GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
        console.error('❌ Missing credentials in .env.local');
        console.log('ID:', SPREADSHEET_ID ? 'OK' : 'MISSING');
        console.log('EMAIL:', GOOGLE_CLIENT_EMAIL ? 'OK' : 'MISSING');
        console.log('KEY:', GOOGLE_PRIVATE_KEY ? 'OK' : 'MISSING');
        process.exit(1);
    }

    console.log('Connecting to Google Sheets...');

    try {
        // Dynamic import for ESM packages
        const { GoogleSpreadsheet } = await import('google-spreadsheet');
        const { JWT } = await import('google-auth-library');

        const jwt = new JWT({
            email: GOOGLE_CLIENT_EMAIL,
            key: GOOGLE_PRIVATE_KEY,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const doc = new GoogleSpreadsheet(SPREADSHEET_ID, jwt);
        await doc.loadInfo();
        console.log(`✅ Connected to sheet: ${doc.title}`);

        // 1. Users Sheet
        let usersSheet = doc.sheetsByTitle['Users'];
        if (!usersSheet) {
            console.log('Creating "Users" sheet...');
            usersSheet = await doc.addSheet({ title: 'Users' });
        }
        await usersSheet.setHeaderRow(['id', 'name', 'role', 'active', 'limitations']);
        console.log('✅ Users sheet ready');

        // 2. Config Sheet (Mass Schedule)
        let configSheet = doc.sheetsByTitle['Config'];
        if (!configSheet) {
            console.log('Creating "Config" sheet...');
            configSheet = await doc.addSheet({ title: 'Config' });
        }
        await configSheet.setHeaderRow(['day', 'time', 'type', 'setting_key', 'setting_value']);

        const rows = await configSheet.getRows();
        if (rows.length === 0) {
            console.log('Seeding default configuration...');
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
        console.log('✅ Config sheet ready');

        // 3. Schedule Sheet
        let scheduleSheet = doc.sheetsByTitle['Schedule'];
        if (!scheduleSheet) {
            console.log('Creating "Schedule" sheet...');
            scheduleSheet = await doc.addSheet({ title: 'Schedule' });
        }
        await scheduleSheet.setHeaderRow(['id', 'date', 'time', 'is_central_mass', 'assigned_acolyte_id', 'assigned_acolyte_name', 'attendance_status']);
        console.log('✅ Schedule sheet ready');

        console.log('🎉 Database setup complete!');

    } catch (error) {
        console.error('❌ Error during setup:', error);
        if (error.response) {
            console.error('API Error:', error.response.data);
        }
    }
}

setup();
