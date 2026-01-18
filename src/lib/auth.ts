/**
 * NextAuth Configuration for SIAR Dashboard
 * Credentials Provider with MySQL/Prisma backend
 */

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

// Extend the built-in session types
declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            email: string;
            name: string;
            role: string;
            divisi: string;
            cabang: string;
            nomor_id: string;
        };
    }

    interface User {
        id: string;
        email: string;
        name: string;
        role: string;
        divisi: string;
        cabang: string;
        nomor_id: string;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        role: string;
        divisi: string;
        cabang: string;
        nomor_id: string;
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Email dan password harus diisi');
                }

                // Find user by email
                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });

                if (!user) {
                    throw new Error('Email tidak terdaftar');
                }

                // Verify password
                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isPasswordValid) {
                    throw new Error('Password salah');
                }

                // Log successful login
                await prisma.log.create({
                    data: {
                        userId: user.id,
                        type: 'LOGIN',
                        description: `User ${user.nama_lengkap} logged in`,
                        status: 'SUCCESS',
                        ip: '0.0.0.0', // Will be updated with actual IP in middleware
                    },
                });

                return {
                    id: String(user.id),
                    email: user.email,
                    name: user.nama_lengkap,
                    role: user.role,
                    divisi: user.divisi,
                    cabang: user.cabang,
                    nomor_id: user.nomor_id,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.divisi = user.divisi;
                token.cabang = user.cabang;
                token.nomor_id = user.nomor_id;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.role = token.role;
                session.user.divisi = token.divisi;
                session.user.cabang = token.cabang;
                session.user.nomor_id = token.nomor_id;
            }
            return session;
        },
    },
    pages: {
        signIn: '/auth/login',
        error: '/auth/login',
    },
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    secret: process.env.NEXTAUTH_SECRET,
};
