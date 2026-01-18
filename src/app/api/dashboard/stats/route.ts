/**
 * Dashboard Stats API Route
 * GET: Fetch real-time dashboard statistics
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

        const userId = parseInt(session.user.id);
        const isIT = session.user.role === 'IT';

        // Get current date info
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());

        // Maintenance stats
        const maintenanceStats = await prisma.maintenanceIssue.groupBy({
            by: ['status'],
            _count: { id: true },
            where: isIT ? {} : { userId },
        });

        const maintenanceTotal = maintenanceStats.reduce((acc, stat) => acc + stat._count.id, 0);
        const maintenancePending = maintenanceStats.find(s => s.status === 'PENDING')?._count.id || 0;
        const maintenanceInProgress = maintenanceStats.find(s => s.status === 'IN_PROGRESS')?._count.id || 0;
        const maintenanceResolved = maintenanceStats.find(s => s.status === 'RESOLVED')?._count.id || 0;
        const maintenanceRejected = maintenanceStats.find(s => s.status === 'REJECTED')?._count.id || 0;

        // Project stats
        const projectStats = await prisma.projectItem.groupBy({
            by: ['status'],
            _count: { id: true },
            where: isIT ? {} : { userId },
        });

        const projectTotal = projectStats.reduce((acc, stat) => acc + stat._count.id, 0);
        const projectPending = projectStats.find(s => s.status === 'PENDING')?._count.id || 0;
        const projectInProgress = projectStats.find(s => s.status === 'IN_PROGRESS')?._count.id || 0;
        const projectCompleted = projectStats.find(s => s.status === 'COMPLETED')?._count.id || 0;
        const projectRejected = projectStats.find(s => s.status === 'REJECTED')?._count.id || 0;

        // Event count this month
        const eventCount = await prisma.event.count({
            where: {
                date: { gte: startOfMonth },
            },
        });

        // Logs this week (IT only)
        let logsThisWeek = 0;
        if (isIT) {
            logsThisWeek = await prisma.log.count({
                where: {
                    timestamp: { gte: startOfWeek },
                },
            });
        }

        // User count (IT only)
        let userCount = 0;
        if (isIT) {
            userCount = await prisma.user.count();
        }

        // Unread notifications
        const unreadNotifications = await prisma.notification.count({
            where: {
                userId,
                isRead: false,
            },
        });

        return NextResponse.json({
            maintenance: {
                total: maintenanceTotal,
                pending: maintenancePending,
                inProgress: maintenanceInProgress,
                resolved: maintenanceResolved,
                rejected: maintenanceRejected,
            },
            projects: {
                total: projectTotal,
                pending: projectPending,
                inProgress: projectInProgress,
                completed: projectCompleted,
                rejected: projectRejected,
            },
            events: eventCount,
            logs: logsThisWeek,
            users: userCount,
            notifications: unreadNotifications,
        });
    } catch (error) {
        console.error('Failed to fetch stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stats' },
            { status: 500 }
        );
    }
}
