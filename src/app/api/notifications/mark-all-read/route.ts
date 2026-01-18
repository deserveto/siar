/**
 * Mark All Notifications as Read API Route
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await prisma.notification.updateMany({
            where: {
                userId: parseInt(session.user.id),
                isRead: false,
            },
            data: { isRead: true },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to mark all as read:', error);
        return NextResponse.json(
            { error: 'Failed to mark all as read' },
            { status: 500 }
        );
    }
}
