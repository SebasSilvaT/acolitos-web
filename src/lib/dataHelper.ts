
import { getSheetByTitle } from './googleSheets';

export async function clearScheduleRange(startDate: string, endDate: string): Promise<void> {
    const sheet = await getSheetByTitle('Schedule');
    const rows = await sheet.getRows();

    // Identify rows to delete
    // We iterate in reverse to avoid index shifting issues when deleting
    for (let i = rows.length - 1; i >= 0; i--) {
        const row = rows[i] as any;
        const rowDate = row.date;

        if (rowDate >= startDate && rowDate <= endDate) {
            await row.delete();
        }
    }
}
