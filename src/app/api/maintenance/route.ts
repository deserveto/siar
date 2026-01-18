/**
 * Maintenance Issues API Route
 * GET: Fetch maintenance issues (filtered by role)
 * POST: Create new maintenance issue
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        const isIT = session.user.role === 'IT';

        // IT users see all, regular users see only their own
        const issues = await prisma.maintenanceIssue.findMany({
            where: isIT ? {} : { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        nama_lengkap: true,
                        email: true,
                        divisi: true,
                        cabang: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(issues);
    } catch (error) {
        console.error('Failed to fetch maintenance issues:', error);
        return NextResponse.json(
            { error: 'Failed to fetch maintenance issues' },
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

        const body = await request.json();
        const { kategori, otherKategori, jenis_masalah, deskripsi, deadline } = body;

        // Validation
        if (!kategori || !jenis_masalah || !deskripsi) {
            return NextResponse.json(
                { error: 'Kategori, jenis masalah, dan deskripsi wajib diisi' },
                { status: 400 }
            );
        }

        const issue = await prisma.maintenanceIssue.create({
            data: {
                kategori: kategori === 'Other' ? 'Other' : kategori,
                otherKategori: kategori === 'Other' ? otherKategori : null,
                jenis_masalah,
                deskripsi,
                deadline: deadline ? new Date(deadline) : null,
                userId: parseInt(session.user.id),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        nama_lengkap: true,
                        email: true,
                    },
                },
            },
        });

        // Create calendar event if deadline is set
        if (deadline) {
            await prisma.event.create({
                data: {
                    date: new Date(deadline),
                    title: `Deadline: ${jenis_masalah}`,
                    description: `Deadline maintenance: ${jenis_masalah}`,
                    color: 'orange',
                    eventType: 'deadline_maintenance',
                    referenceId: issue.id,
                    userId: parseInt(session.user.id),
                },
            });
        }

        // Log the action
        await prisma.log.create({
            data: {
                userId: parseInt(session.user.id),
                type: 'CREATE',
                description: `Created maintenance issue: ${jenis_masalah}`,
                status: 'SUCCESS',
                ip: request.headers.get('x-forwarded-for') || '0.0.0.0',
            },
        });

        return NextResponse.json(issue, { status: 201 });
    } catch (error) {
        console.error('Failed to create maintenance issue:', error);
        return NextResponse.json(
            { error: 'Failed to create maintenance issue' },
            { status: 500 }
        );
    }
}
