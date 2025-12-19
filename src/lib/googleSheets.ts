import { GoogleSpreadsheet } from 'google-spreadsheet';

// Config variables should be loaded from environment variables
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!SPREADSHEET_ID || !GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    console.warn("Google Sheets credentials are missing from environment variables.");
}

// @ts-ignore - v3 constructor takes only ID
export const doc = new GoogleSpreadsheet(SPREADSHEET_ID);

export const loadDoc = async () => {
    try {
        await doc.useServiceAccountAuth({
            client_email: GOOGLE_CLIENT_EMAIL!,
            private_key: GOOGLE_PRIVATE_KEY!,
        });
        await doc.loadInfo();
        return doc;
    } catch (error) {
        console.error("Error loading Google Spreadsheet:", error);
        throw new Error("Failed to connect to Google Sheets");
    }
};

export const getSheetByTitle = async (title: string) => {
    await loadDoc();
    const sheet = doc.sheetsByTitle[title];
    if (!sheet) {
        throw new Error(`Sheet with title "${title}" not found`);
    }
    return sheet;
};
