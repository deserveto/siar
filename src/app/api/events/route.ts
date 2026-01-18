/**
 * Events API Route
 * GET: Fetch all events (including deadlines)
 * POST: Create new event
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all events
        const events = await prisma.event.findMany({
            orderBy: { date: 'asc' },
            include: {
                user: {
                    select: {
                        id: true,
                        nama_lengkap: true,
                    },
                },
            },
        });

        return NextResponse.json(events);
    } catch (error) {
        console.error('Failed to fetch events:', error);
        return NextResponse.json(
            { error: 'Failed to fetch events' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only IT can create events
        if (session.user.role !== 'IT') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { date, title, description, color } = body;

        if (!date || !title) {
            return NextResponse.json(
                { error: 'Tanggal dan judul wajib diisi' },
                { status: 400 }
            );
        }

        const event = await prisma.event.create({
            data: {
                date: new Date(date),
                title,
                description: description || '',
                color: color || 'blue',
                eventType: 'custom',
                userId: parseInt(session.user.id),
            },
        });

        return NextResponse.json(event, { status: 201 });
    } catch (error) {
        console.error('Failed to create event:', error);
        return NextResponse.json(
            { error: 'Failed to create event' },
            { status: 500 }
        );
    }
}
