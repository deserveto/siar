/**
 * Profile API Route
 * GET: Fetch user profile
 * PATCH: Update profile (name)
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

        const user = await prisma.user.findUnique({
            where: { id: parseInt(session.user.id) },
            select: {
                id: true,
                nama_lengkap: true,
                email: true,
                nomor_id: true,
                divisi: true,
                cabang: true,
                role: true,
                profile_picture: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Failed to fetch profile:', error);
        return NextResponse.json(
            { error: 'Failed to fetch profile' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { nama_lengkap, profile_picture } = body;

        // Construct update data
        const updateData: any = {};
        if (nama_lengkap) updateData.nama_lengkap = nama_lengkap;
        if (profile_picture !== undefined) updateData.profile_picture = profile_picture;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'No data to update' }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: parseInt(session.user.id) },
            data: updateData,
            select: {
                id: true,
                nama_lengkap: true,
                email: true,
                nomor_id: true,
                divisi: true,
                cabang: true,
                role: true,
                profile_picture: true,
            },
        });

        // Log the action
        await prisma.log.create({
            data: {
                userId: parseInt(session.user.id),
                type: 'UPDATE',
                description: `User updated their profile name to "${nama_lengkap}"`,
                status: 'SUCCESS',
                ip: 'system',
            },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Failed to update profile:', error);
        return NextResponse.json(
            { error: 'Failed to update profile' },
            { status: 500 }
        );
    }
}
