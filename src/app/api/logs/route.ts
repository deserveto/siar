/**
 * Logs API Route
 * GET: Fetch all logs (IT only)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only IT can access logs
        if (session.user.role !== 'IT') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const logs = await prisma.log.findMany({
            orderBy: { timestamp: 'desc' },
            take: 100,
            include: {
                user: {
                    select: {
                        nama_lengkap: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json(logs);
    } catch (error) {
        console.error('Failed to fetch logs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch logs' },
            { status: 500 }
        );
    }
}
