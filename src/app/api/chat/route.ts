/**
 * Chat/Messages API Route
 * GET: Fetch conversations
 * POST: Send message
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

        const { searchParams } = new URL(request.url);
        const contactId = searchParams.get('contactId');

        if (contactId) {
            // Fetch messages with specific contact
            const messages = await prisma.message.findMany({
                where: {
                    OR: [
                        { senderId: userId, receiverId: parseInt(contactId) },
                        { senderId: parseInt(contactId), receiverId: userId },
                    ],
                },
                orderBy: { createdAt: 'asc' },
                include: {
                    sender: {
                        select: { id: true, nama_lengkap: true, profile_picture: true },
                    },
                },
            });

            // Mark messages as read
            await prisma.message.updateMany({
                where: {
                    senderId: parseInt(contactId),
                    receiverId: userId,
                    isRead: false,
                },
                data: { isRead: true },
            });



            // Enrich messages with subject details
            const messagesWithDetails = await Promise.all(messages.map(async (msg) => {
                let subjectTitle = null;

                if (msg.subjectType === 'maintenance' && msg.subjectId) {
                    const issue = await prisma.maintenanceIssue.findUnique({
                        where: { id: msg.subjectId },
                        select: { jenis_masalah: true }
                    });
                    subjectTitle = issue?.jenis_masalah;
                } else if (msg.subjectType === 'project' && msg.subjectId) {
                    const project = await prisma.projectItem.findUnique({
                        where: { id: msg.subjectId },
                        select: { title: true }
                    });
                    subjectTitle = project?.title;
                }

                return {
                    ...msg,
                    subjectTitle
                };
            }));

            return NextResponse.json(messagesWithDetails);
        } else {
            // Fetch conversation list


            // Fetch conversation list - allow chatting with anyone
            const contacts = await prisma.user.findMany({
                where: {
                    NOT: { id: userId },
                },
                select: {
                    id: true,
                    nama_lengkap: true,
                    email: true,
                    divisi: true,
                    role: true,
                    profile_picture: true,
                },
            });

            // Get last message and unread count for each contact
            const contactsWithMeta = await Promise.all(
                contacts.map(async (contact) => {
                    const lastMessage = await prisma.message.findFirst({
                        where: {
                            OR: [
                                { senderId: userId, receiverId: contact.id },
                                { senderId: contact.id, receiverId: userId },
                            ],
                        },
                        orderBy: { createdAt: 'desc' },
                    });

                    const unreadCount = await prisma.message.count({
                        where: {
                            senderId: contact.id,
                            receiverId: userId,
                            isRead: false,
                        },
                    });

                    return {
                        ...contact,
                        lastMessage: lastMessage?.content || null,
                        lastMessageTime: lastMessage?.createdAt || null,
                        unreadCount,
                    };
                })
            );

            // Sort by role (IT first) then last message time
            contactsWithMeta.sort((a: any, b: any) => {
                // Prioritize IT role
                if (a.role === 'IT' && b.role !== 'IT') return -1;
                if (a.role !== 'IT' && b.role === 'IT') return 1;

                // Then sort by last message time
                if (!a.lastMessageTime && !b.lastMessageTime) return 0;
                if (!a.lastMessageTime) return 1;
                if (!b.lastMessageTime) return -1;
                return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
            });

            return NextResponse.json(contactsWithMeta);
        }
    } catch (error) {
        console.error('Failed to fetch messages:', error);
        return NextResponse.json(
            { error: 'Failed to fetch messages' },
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
        const { receiverId, content, subjectType, subjectId } = body;

        if (!receiverId || !content) {
            return NextResponse.json(
                { error: 'Penerima dan pesan wajib diisi' },
                { status: 400 }
            );
        }

        const message = await prisma.message.create({
            data: {
                senderId: parseInt(session.user.id),
                receiverId: parseInt(receiverId),
                content,
                subjectType: subjectType || null,
                subjectId: subjectId ? parseInt(subjectId) : null,
            },
            include: {
                sender: {
                    select: { id: true, nama_lengkap: true, profile_picture: true },
                },
            },
        });

        // Create notification for receiver
        await prisma.notification.create({
            data: {
                userId: parseInt(receiverId),
                type: 'chat',
                title: 'Pesan Baru',
                message: `${session.user.name} mengirim pesan: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
                referenceId: message.id,
            },
        });

        return NextResponse.json(message, { status: 201 });
    } catch (error) {
        console.error('Failed to send message:', error);
        return NextResponse.json(
            { error: 'Failed to send message' },
            { status: 500 }
        );
    }
}
