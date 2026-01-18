/**
 * Single Project API Route
 * GET: Fetch single project
 * PATCH: Update project
 * DELETE: Delete project (owner only)
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

        const project = await prisma.projectItem.findUnique({
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

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Get file attachments
        const attachments = await prisma.fileUpload.findMany({
            where: {
                entityType: 'project',
                entityId: parseInt(id),
            },
        });

        return NextResponse.json({ ...project, attachments });
    } catch (error) {
        console.error('Failed to fetch project:', error);
        return NextResponse.json(
            { error: 'Failed to fetch project' },
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

        const existingProject = await prisma.projectItem.findUnique({
            where: { id: parseInt(id) },
        });

        if (!existingProject) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const isOwner = existingProject.userId === userId;
        if (!isOwner && !isIT) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        let updateData: Record<string, unknown> = {};

        if (isIT && !isOwner) {
            // Admin: only status update
            if (body.status) {
                updateData.status = body.status;

                // If completing, add result attachments if provided
                if (body.status === 'COMPLETED') {
                    if (body.resultType) updateData.resultType = body.resultType;
                    if (body.resultValue) updateData.resultValue = body.resultValue;
                    if (body.resultName) updateData.resultName = body.resultName;
                }

                await prisma.notification.create({
                    data: {
                        userId: existingProject.userId,
                        type: 'project_status',
                        title: 'Status Project Diperbarui',
                        message: `Request project "${existingProject.title}" Anda sekarang berstatus: ${body.status}`,
                        referenceId: parseInt(id),
                    },
                });
            }
        } else {
            // Owner: full update
            updateData = {
                title: body.title,
                description: body.description,
                fileOrLink: body.fileOrLink,
                deadline: body.deadline ? new Date(body.deadline) : null,
            };
        }

        const project = await prisma.projectItem.update({
            where: { id: parseInt(id) },
            data: updateData,
        });

        // Log edit action
        await prisma.log.create({
            data: {
                userId: userId,
                type: isIT && !isOwner ? 'project_status_update' : 'project_edit',
                description: isIT && !isOwner
                    ? `Admin updated project "${existingProject.title}" status to "${body.status}"`
                    : `User edited project "${existingProject.title}"`,
                status: 'SUCCESS',
                ip: 'system',
            },
        });

        return NextResponse.json(project);
    } catch (error) {
        console.error('Failed to update project:', error);
        return NextResponse.json(
            { error: 'Failed to update project' },
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

        const existingProject = await prisma.projectItem.findUnique({
            where: { id: parseInt(id) },
        });

        if (!existingProject) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Allow owner OR IT admin to delete
        if (existingProject.userId !== userId && !isIT) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Delete related events
        await prisma.event.deleteMany({
            where: {
                eventType: 'deadline_project',
                referenceId: parseInt(id),
            },
        });

        // Delete related files
        await prisma.fileUpload.deleteMany({
            where: {
                entityType: 'project',
                entityId: parseInt(id),
            },
        });

        await prisma.projectItem.delete({
            where: { id: parseInt(id) },
        });

        // Log delete action
        await prisma.log.create({
            data: {
                userId: userId,
                type: 'project_delete',
                description: `${isIT && existingProject.userId !== userId ? 'Admin' : 'User'} deleted project "${existingProject.title}"`,
                status: 'SUCCESS',
                ip: 'system',
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete project:', error);
        return NextResponse.json(
            { error: 'Failed to delete project' },
            { status: 500 }
        );
    }
}
