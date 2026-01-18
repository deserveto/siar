/**
 * File Upload API Route
 * POST: Upload file for maintenance/project/chat
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const entityType = formData.get('entityType') as string;
        const entityId = formData.get('entityId') as string;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (!entityType || !entityId) {
            return NextResponse.json(
                { error: 'Entity type and ID are required' },
                { status: 400 }
            );
        }

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', entityType);
        await mkdir(uploadsDir, { recursive: true });

        // Generate unique filename
        const timestamp = Date.now();
        const ext = path.extname(file.name);
        const baseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `${entityId}_${timestamp}_${baseName}${ext}`;
        const filePath = path.join(uploadsDir, fileName);

        // Write file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        // Save to database
        const fileRecord = await prisma.fileUpload.create({
            data: {
                entityType,
                entityId: parseInt(entityId),
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                filePath: `/uploads/${entityType}/${fileName}`,
                uploadedById: parseInt(session.user.id),
            },
        });

        return NextResponse.json(fileRecord, { status: 201 });
    } catch (error) {
        console.error('Failed to upload file:', error);
        return NextResponse.json(
            { error: 'Failed to upload file' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const entityType = searchParams.get('entityType');
        const entityId = searchParams.get('entityId');

        if (!entityType || !entityId) {
            return NextResponse.json(
                { error: 'Entity type and ID are required' },
                { status: 400 }
            );
        }

        const files = await prisma.fileUpload.findMany({
            where: {
                entityType,
                entityId: parseInt(entityId),
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(files);
    } catch (error) {
        console.error('Failed to fetch files:', error);
        return NextResponse.json(
            { error: 'Failed to fetch files' },
            { status: 500 }
        );
    }
}
