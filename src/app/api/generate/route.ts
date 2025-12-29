

import { NextResponse } from 'next/server';
import { getUsers, getMassConfig, saveSchedule, clearAllSchedule } from '@/lib/data';
import { User, MassConfig, ScheduleEntry } from '@/lib/types';
import { format, getDay, addDays, parseISO } from 'date-fns';

// Helper to map date-fns day index (0=Sunday) to English day names matching Config/limitations
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { startDate, weeklyCount, centralMassMode, centralMassTime } = body;

        // Validation/Defaults
        const countWeekly = weeklyCount || 2;

        let start = new Date();
        if (startDate) {
            start = parseISO(startDate);
        } else {
            // If not provided, calculate next Monday default
            const today = new Date();
            start = new Date(today);
            start.setDate(today.getDate() + (1 + 7 - today.getDay()) % 7);
            if (today.getDay() === 1) start.setDate(today.getDate() + 7);
        }

        // 1. Fetch Data
        const [users, config] = await Promise.all([
            getUsers(),
            getMassConfig()
        ]);

        const activeAcolytes = users.filter(u => u.isActive && u.role === 'acolyte');

        // Prepare Random or Manual Central Mass Time for Sunday
        let actualCentralTime = centralMassTime;
        if (centralMassMode === 'random' || !actualCentralTime) {
            const options = ['10:00', '12:00', '18:00'];
            actualCentralTime = options[Math.floor(Math.random() * options.length)];
        }

        const newSchedule: Omit<ScheduleEntry, 'id' | 'attendance'>[] = [];

        // 2. Collect all weekday masses (Mon-Sat) first for equitable distribution
        const weekdayMasses: Array<{ date: string; dayName: string; time: string }> = [];

        for (let i = 0; i < 7; i++) {
            const date = addDays(start, i);
            const dayIndex = getDay(date); // 0=Sun, 1=Mon...
            const dayName = dayNames[dayIndex];
            const dateStr = format(date, 'yyyy-MM-dd');

            if (dayIndex !== 0) { // Not Sunday
                const massesForDay = config.filter(c => c.dayOfWeek === dayName);
                massesForDay.forEach(mass => {
                    weekdayMasses.push({
                        date: dateStr,
                        dayName: dayName,
                        time: mass.time
                    });
                });
            }
        }

        // 3. Distribute acolytes equitably across all weekday masses
        console.log(`[Generate] Total weekday masses: ${weekdayMasses.length}`);
        console.log(`[Generate] Active Acolytes: ${activeAcolytes.length}`);

        if (weekdayMasses.length > 0) {
            // Shuffle acolytes for randomness
            const shuffledAcolytes = [...activeAcolytes].sort(() => 0.5 - Math.random());

            // Round-robin distribution: each acolyte gets assigned to masses in sequence
            shuffledAcolytes.forEach((acolyte, acolyteIndex) => {
                // Each acolyte will be assigned to masses in a round-robin fashion
                // Start at different positions to ensure fair distribution
                const startMassIndex = acolyteIndex % weekdayMasses.length;

                // Assign this acolyte to one mass (or we could assign to multiple if needed)
                // For equitable distribution, we assign each acolyte to exactly one mass
                const targetMass = weekdayMasses[startMassIndex];

                // Check if acolyte has limitation for this day-time
                const limitationKey = `${targetMass.dayName}-${targetMass.time}`;

                if (!acolyte.limitations.includes(limitationKey)) {
                    newSchedule.push({
                        date: targetMass.date,
                        time: targetMass.time,
                        isCentralMass: false,
                        assignedAcolyteId: acolyte.id,
                    });
                } else {
                    // If acolyte has limitation, try to find another mass
                    let foundAlternative = false;
                    for (let offset = 1; offset < weekdayMasses.length && !foundAlternative; offset++) {
                        const altIndex = (startMassIndex + offset) % weekdayMasses.length;
                        const altMass = weekdayMasses[altIndex];
                        const altLimitationKey = `${altMass.dayName}-${altMass.time}`;

                        if (!acolyte.limitations.includes(altLimitationKey)) {
                            newSchedule.push({
                                date: altMass.date,
                                time: altMass.time,
                                isCentralMass: false,
                                assignedAcolyteId: acolyte.id,
                            });
                            foundAlternative = true;
                        }
                    }

                    if (!foundAlternative) {
                        console.warn(`[Generate] Could not assign ${acolyte.name} to any weekday mass due to limitations`);
                    }
                }
            });
        }

        // 4. Handle Sunday separately
        const sundayDate = addDays(start, 6); // Sunday is the 7th day
        const sundayDateStr = format(sundayDate, 'yyyy-MM-dd');
        const sundayMasses = config.filter(c => c.dayOfWeek === 'Sunday');

        console.log(`[Generate] Sunday Processing for ${sundayDateStr}`);
        console.log(`[Generate] Active Acolytes: ${activeAcolytes.length}`);

        // 1. Identify Central Mass entry vs Normal Masses
        const nonCentralMasses = sundayMasses.filter(m => m.time !== actualCentralTime);
        const centralMass = sundayMasses.find(m => m.time === actualCentralTime);

        console.log(`[Generate] Central Mass Time: ${actualCentralTime}`);
        console.log(`[Generate] Non-Central Masses: ${nonCentralMasses.map(m => m.time).join(', ')}`);

        // 2. Add Central Mass Entry (No Acolytes assigned, placeholder ID)
        if (centralMass) {
            newSchedule.push({
                date: sundayDateStr,
                time: centralMass.time,
                isCentralMass: true,
                assignedAcolyteId: 'CENTRAL_MASS_HOLDER', // Placeholder for UI to recognize it's a central mass
            });
        } else {
            console.warn(`[Generate] Warning: Central mass time ${actualCentralTime} not found in config for Sunday.`);
        }

        // 3. Distribute Acolytes for remaining Sunday masses (Equitably)
        if (nonCentralMasses.length > 0) {
            const massCount = nonCentralMasses.length;

            // Shuffle ALL active acolytes for the day
            const sundayDeck = [...activeAcolytes].sort(() => 0.5 - Math.random());

            // Distribute in round-robin fashion
            sundayDeck.forEach((acolyte, index) => {
                // Determine which mass gets this acolyte
                const massIndex = index % massCount;
                const targetMass = nonCentralMasses[massIndex];

                newSchedule.push({
                    date: sundayDateStr,
                    time: targetMass.time,
                    isCentralMass: false,
                    assignedAcolyteId: acolyte.id,
                });
            });

        } else {
            console.warn('[Generate] No non-central masses found for Sunday.');
        }

        // 4. Save
        // First, clear existing entries for this week to avoid duplicates
        const endDate = addDays(start, 6);
        const startStr = format(start, 'yyyy-MM-dd');
        const endStr = format(endDate, 'yyyy-MM-dd');
        console.log(`[Generate] Clearing ALL existing schedule`);
        await clearAllSchedule();

        await saveSchedule(newSchedule);

        return NextResponse.json({ success: true, count: newSchedule.length });

    } catch (error) {
        console.error('Error generating schedule:', error);
        return NextResponse.json({ error: 'Failed to generate' }, { status: 500 });
    }
}

