import { NextResponse } from 'next/server';
import { getSchedule } from '@/lib/data';

export async function GET() {
    try {
        const schedule = await getSchedule();
        return NextResponse.json(schedule);
    } catch (error) {
        console.error('Error fetching schedule:', error);
        return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
    }
}
