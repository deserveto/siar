/**
 * Single Maintenance Issue API Route
 * GET: Fetch single issue with details
 * PATCH: Update issue (status for admin, full edit for owner)
 * DELETE: Delete issue (owner only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const issue = await prisma.maintenanceIssue.findUnique({
            where: { id: parseInt(id) },
            include: {
                user: {
                    select: {
                        id: true,
                        nama_lengkap: true,
                        email: true,
                        divisi: true,
                        cabang: true,
                        nomor_id: true,
                    },
                },
            },
        });

        if (!issue) {
            return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
        }

        // Get file attachments
        const attachments = await prisma.fileUpload.findMany({
            where: {
                entityType: 'maintenance',
                entityId: parseInt(id),
            },
        });

        return NextResponse.json({ ...issue, attachments });
    } catch (error) {
        console.error('Failed to fetch maintenance issue:', error);
        return NextResponse.json(
            { error: 'Failed to fetch maintenance issue' },
            { status: 500 }
        );
    }
}

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

        const body = await request.json();
        const userId = parseInt(session.user.id);
        const isIT = session.user.role === 'IT';

        // Get existing issue
        const existingIssue = await prisma.maintenanceIssue.findUnique({
            where: { id: parseInt(id) },
        });

        if (!existingIssue) {
            return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
        }

        // Check permissions
        const isOwner = existingIssue.userId === userId;
        if (!isOwner && !isIT) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Admin can only update status, owner can update everything
        let updateData: Record<string, unknown> = {};

        if (isIT && !isOwner) {
            // Admin: only status update
            if (body.status) {
                updateData.status = body.status;

                // Create notification for the owner
                await prisma.notification.create({
                    data: {
                        userId: existingIssue.userId,
                        type: 'maintenance_status',
                        title: 'Status Maintenance Diperbarui',
                        message: `Laporan "${existingIssue.jenis_masalah}" Anda sekarang berstatus: ${body.status}`,
                        referenceId: parseInt(id),
                    },
                });
            }
        } else {
            // Owner: full update
            updateData = {
                kategori: body.kategori,
                otherKategori: body.kategori === 'Other' ? body.otherKategori : null,
                jenis_masalah: body.jenis_masalah,
                deskripsi: body.deskripsi,
                deadline: body.deadline ? new Date(body.deadline) : null,
            };
        }

        const issue = await prisma.maintenanceIssue.update({
            where: { id: parseInt(id) },
            data: updateData,
        });

        // Log edit action
        await prisma.log.create({
            data: {
                userId: userId,
                type: isIT && !isOwner ? 'maintenance_status_update' : 'maintenance_edit',
                description: isIT && !isOwner
                    ? `Admin updated maintenance "${existingIssue.jenis_masalah}" status to "${body.status}"`
                    : `User edited maintenance "${existingIssue.jenis_masalah}"`,
                status: 'SUCCESS',
                ip: 'system',
            },
        });

        return NextResponse.json(issue);
    } catch (error) {
        console.error('Failed to update maintenance issue:', error);
        return NextResponse.json(
            { error: 'Failed to update maintenance issue' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        const isIT = session.user.role === 'IT';

        // Get existing issue
        const existingIssue = await prisma.maintenanceIssue.findUnique({
            where: { id: parseInt(id) },
        });

        if (!existingIssue) {
            return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
        }

        // Allow owner OR IT admin to delete
        if (existingIssue.userId !== userId && !isIT) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Delete related events
        await prisma.event.deleteMany({
            where: {
                eventType: 'deadline_maintenance',
                referenceId: parseInt(id),
            },
        });

        // Delete related files
        await prisma.fileUpload.deleteMany({
            where: {
                entityType: 'maintenance',
                entityId: parseInt(id),
            },
        });

        // Delete the issue
        await prisma.maintenanceIssue.delete({
            where: { id: parseInt(id) },
        });

        // Log delete action
        await prisma.log.create({
            data: {
                userId: userId,
                type: 'maintenance_delete',
                description: `${isIT && existingIssue.userId !== userId ? 'Admin' : 'User'} deleted maintenance "${existingIssue.jenis_masalah}"`,
                status: 'SUCCESS',
                ip: 'system',
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete maintenance issue:', error);
        return NextResponse.json(
            { error: 'Failed to delete maintenance issue' },
            { status: 500 }
        );
    }
}
