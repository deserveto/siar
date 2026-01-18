/**
 * User Registration API Route
 * POST /api/auth/register
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

interface RegisterBody {
    nomor_id: string;
    nama_lengkap: string;
    email: string;
    password: string;
    divisi: string;
    cabang: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: RegisterBody = await request.json();

        // Validate required fields
        const requiredFields = ['nomor_id', 'nama_lengkap', 'email', 'password', 'divisi', 'cabang'];
        for (const field of requiredFields) {
            if (!body[field as keyof RegisterBody]) {
                return NextResponse.json(
                    { error: `Field ${field} wajib diisi` },
                    { status: 400 }
                );
            }
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: body.email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'Email sudah terdaftar' },
                { status: 400 }
            );
        }

        // Check if nomor_id already exists
        const existingNomorId = await prisma.user.findFirst({
            where: { nomor_id: body.nomor_id },
        });

        if (existingNomorId) {
            return NextResponse.json(
                { error: 'Nomor ID sudah terdaftar' },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(body.password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                nomor_id: body.nomor_id,
                nama_lengkap: body.nama_lengkap,
                email: body.email,
                password: hashedPassword,
                divisi: body.divisi,
                cabang: body.cabang,
                role: 'NON_IT', // Default role for new users
            },
        });

        // Log registration
        await prisma.log.create({
            data: {
                userId: user.id,
                type: 'REGISTER',
                description: `User ${user.nama_lengkap} registered`,
                status: 'SUCCESS',
                ip: request.headers.get('x-forwarded-for') || '0.0.0.0',
            },
        });

        return NextResponse.json(
            {
                message: 'Registrasi berhasil',
                user: {
                    id: user.id,
                    email: user.email,
                    nama_lengkap: user.nama_lengkap,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Terjadi kesalahan saat registrasi' },
            { status: 500 }
        );
    }
}
