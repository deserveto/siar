/**
 * Single Notification API Route
 * PATCH: Mark notification as read
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const notification = await prisma.notification.update({
            where: {
                id: parseInt(id),
                userId: parseInt(session.user.id),
            },
            data: { isRead: true },
        });

        return NextResponse.json(notification);
    } catch (error) {
        console.error('Failed to update notification:', error);
        return NextResponse.json(
            { error: 'Failed to update notification' },
            { status: 500 }
        );
    }
}
