import { NextResponse } from 'next/server';
import { getUsers, addUser } from '@/lib/data';

export async function GET() {
    try {
        const users = await getUsers();
        return NextResponse.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        if (!body.name || !body.role) {
            return NextResponse.json({ error: 'Name and Role are required' }, { status: 400 });
        }

        const newUser = await addUser({
            name: body.name,
            role: body.role,
            isActive: body.isActive !== false,
            limitations: body.limitations || []
        });

        return NextResponse.json(newUser, { status: 201 });
    } catch (error) {
        console.error('Error adding user:', error);
        return NextResponse.json({ error: 'Failed to add user' }, { status: 500 });
    }
}
