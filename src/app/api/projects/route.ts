/**
 * Projects API Route
 * GET: Fetch projects (filtered by role)
 * POST: Create new project
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

        const projects = await prisma.projectItem.findMany({
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

        return NextResponse.json(projects);
    } catch (error) {
        console.error('Failed to fetch projects:', error);
        return NextResponse.json(
            { error: 'Failed to fetch projects' },
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
        const { title, description, fileOrLink, deadline } = body;

        if (!title || !description) {
            return NextResponse.json(
                { error: 'Title dan deskripsi wajib diisi' },
                { status: 400 }
            );
        }

        const project = await prisma.projectItem.create({
            data: {
                title,
                description,
                fileOrLink: fileOrLink || null,
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
                    title: `Deadline: ${title}`,
                    description: `Deadline project: ${title}`,
                    color: 'purple',
                    eventType: 'deadline_project',
                    referenceId: project.id,
                    userId: parseInt(session.user.id),
                },
            });
        }

        // Log the action
        await prisma.log.create({
            data: {
                userId: parseInt(session.user.id),
                type: 'CREATE',
                description: `Created project: ${title}`,
                status: 'SUCCESS',
                ip: request.headers.get('x-forwarded-for') || '0.0.0.0',
            },
        });

        return NextResponse.json(project, { status: 201 });
    } catch (error) {
        console.error('Failed to create project:', error);
        return NextResponse.json(
            { error: 'Failed to create project' },
            { status: 500 }
        );
    }
}
