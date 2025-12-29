
import { NextResponse } from 'next/server';
import { updateAttendance } from '@/lib/data';

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, status } = body;

        if (!id || !status) {
            return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
        }

        const success = await updateAttendance(id, status);

        if (success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
        }
    } catch (error) {
        console.error('Error updating attendance:', error);
        return NextResponse.json({ error: 'Failed to update attendance' }, { status: 500 });
    }
}
