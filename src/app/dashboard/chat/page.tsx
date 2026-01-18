'use client';

/**
 * SIAR Chat Module
 * Staff: Chat with admin about projects/maintenance
 * Admin: Chat with any user
 */

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import {
    MessageSquare,
    Send,
    Loader2,
    User,
    Search,
    Wrench,
    FolderKanban,
    X,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '@/lib/motion-variants';

interface Contact {
    id: number;
    nama_lengkap: string;
    email: string;
    divisi: string;
    role: string;
    lastMessage: string | null;
    lastMessageTime: string | null;
    unreadCount: number;
    profile_picture?: string | null;
}

interface Message {
    id: number;
    senderId: number;
    receiverId: number;
    content: string;
    subjectType: string | null;
    subjectId: number | null;
    isRead: boolean;
    createdAt: string;
    subjectTitle?: string | null;
    sender: {
        id: number;
        nama_lengkap: string;
    };
}

interface Subject {
    id: number;
    title: string;
    type: 'maintenance' | 'project';
}

export default function ChatPage() {
    const { data: session } = useSession();
    const { toast } = useToast();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isIT = session?.user?.role === 'IT';
    const userId = session?.user?.id ? parseInt(session.user.id) : 0;

    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Subject attachment
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

    useEffect(() => {
        fetchContacts();
        fetchSubjects();
    }, []);

    useEffect(() => {
        if (selectedContact) {
            fetchMessages(selectedContact.id);
            const interval = setInterval(() => fetchMessages(selectedContact.id), 5000);
            return () => clearInterval(interval);
        }
    }, [selectedContact]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchContacts = async () => {
        try {
            const res = await fetch('/api/chat');
            if (res.ok) {
                const data = await res.json();
                setContacts(data);
            }
        } catch (error) {
            console.error('Failed to fetch contacts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMessages = async (contactId: number) => {
        try {
            const res = await fetch(`/api/chat?contactId=${contactId}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    };

    const fetchSubjects = async () => {
        try {
            // Fetch user's maintenance and projects
            const [maintenanceRes, projectsRes] = await Promise.all([
                fetch('/api/maintenance'),
                fetch('/api/projects'),
            ]);

            const subjectsList: Subject[] = [];

            if (maintenanceRes.ok) {
                const maintenance = await maintenanceRes.json();
                maintenance.forEach((m: { id: number; jenis_masalah: string }) => {
                    subjectsList.push({ id: m.id, title: m.jenis_masalah, type: 'maintenance' });
                });
            }

            if (projectsRes.ok) {
                const projects = await projectsRes.json();
                projects.forEach((p: { id: number; title: string }) => {
                    subjectsList.push({ id: p.id, title: p.title, type: 'project' });
                });
            }

            setSubjects(subjectsList);
        } catch (error) {
            console.error('Failed to fetch subjects:', error);
        }
    };

    const handleSendMessage = async () => {
        if (!selectedContact || !newMessage.trim()) return;

        setIsSending(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    receiverId: selectedContact.id,
                    content: newMessage,
                    subjectType: selectedSubject?.type,
                    subjectId: selectedSubject?.id,
                }),
            });

            if (res.ok) {
                setNewMessage('');
                setSelectedSubject(null);
                fetchMessages(selectedContact.id);
                fetchContacts();
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Gagal mengirim pesan',
                variant: 'destructive',
            });
        } finally {
            setIsSending(false);
        }
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const filteredContacts = contacts.filter(c =>
        c.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="h-[calc(100vh-8rem)]">
            <motion.div variants={fadeInUp} className="flex items-center gap-2 mb-6">
                <MessageSquare className="w-6 h-6 accent-text" />
                <h1 className="text-2xl font-bold">Chat</h1>
                <span className="text-muted-foreground ml-2">
                    {isIT ? 'Komunikasi dengan Staff' : 'Komunikasi dengan Admin IT'}
                </span>
            </motion.div>

            <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-3 h-[calc(100%-3rem)] gap-4">
                {/* Contact List */}
                <Card className="bg-background/50 backdrop-blur border-border/50 overflow-hidden animate-slideUp">
                    <CardHeader className="pb-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari kontak..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 overflow-y-auto max-h-[calc(100%-4rem)]">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                            </div>
                        ) : filteredContacts.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                {isIT ? 'Belum ada staff yang bisa dihubungi' : 'Belum ada admin yang bisa dihubungi'}
                            </div>
                        ) : (
                            filteredContacts.map((contact) => (
                                <button
                                    key={contact.id}
                                    onClick={() => setSelectedContact(contact)}
                                    className={`w-full p-4 flex items-start gap-3 hover:bg-accent/50 transition-colors text-left border-b border-border/30 ${selectedContact?.id === contact.id ? 'bg-accent/50' : ''
                                        }`}
                                >
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={contact.profile_picture || undefined} />
                                        <AvatarFallback
                                            className="text-white text-sm"
                                            style={{ background: 'var(--accent-primary)' }}
                                        >
                                            {getInitials(contact.nama_lengkap)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="font-medium truncate flex items-center gap-1">
                                                {contact.nama_lengkap}
                                                {contact.role === 'IT' && (
                                                    <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/30">
                                                        Admin
                                                    </span>
                                                )}
                                            </p>
                                            {contact.unreadCount > 0 && (
                                                <span className="ml-2 w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
                                                    {contact.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">{contact.divisi}</p>
                                        {contact.lastMessage && (
                                            <p className="text-sm text-muted-foreground truncate mt-1">
                                                {contact.lastMessage}
                                            </p>
                                        )}
                                    </div>
                                </button>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Chat Window */}
                <Card className="md:col-span-2 bg-background/50 backdrop-blur border-border/50 flex flex-col overflow-hidden">
                    {selectedContact ? (
                        <>
                            {/* Chat Header */}
                            <CardHeader className="border-b border-border/30 pb-4">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={selectedContact.profile_picture || undefined} />
                                        <AvatarFallback
                                            className="text-white"
                                            style={{ background: 'var(--accent-primary)' }}
                                        >
                                            {getInitials(selectedContact.nama_lengkap)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <CardTitle className="text-lg">{selectedContact.nama_lengkap}</CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            {selectedContact.divisi} • {selectedContact.email}
                                        </p>
                                    </div>
                                </div>
                            </CardHeader>

                            {/* Messages */}
                            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        Belum ada pesan. Mulai percakapan!
                                    </div>
                                ) : (
                                    messages.map((message) => {
                                        const isMe = message.senderId === userId;
                                        return (
                                            <div
                                                key={message.id}
                                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[70%] rounded-lg p-3 ${isMe
                                                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                                                        : 'bg-accent/50'
                                                        }`}
                                                >
                                                    {message.subjectType && (
                                                        <div className={`text-xs mb-1 flex items-center gap-1 ${isMe ? 'text-white/70' : 'text-muted-foreground'
                                                            }`}>
                                                            {message.subjectType === 'maintenance' ? (
                                                                <Wrench className="w-3 h-3" />
                                                            ) : (
                                                                <FolderKanban className="w-3 h-3" />
                                                            )}
                                                            <span>
                                                                Terkait: {message.subjectTitle || message.subjectType}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                                    <p className={`text-[10px] mt-1 ${isMe ? 'text-white/60' : 'text-muted-foreground'
                                                        }`}>
                                                        {formatDistanceToNow(new Date(message.createdAt), {
                                                            addSuffix: true,
                                                            locale: id,
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </CardContent>

                            {/* Input Area */}
                            <div className="p-4 border-t border-border/30">
                                {/* Subject Attachment */}
                                {selectedSubject && (
                                    <div className="mb-2 p-2 rounded-lg bg-accent/50 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm">
                                            {selectedSubject.type === 'maintenance' ? (
                                                <Wrench className="w-4 h-4 text-orange-500" />
                                            ) : (
                                                <FolderKanban className="w-4 h-4 text-purple-500" />
                                            )}
                                            <span className="truncate">{selectedSubject.title}</span>
                                        </div>
                                        <button
                                            onClick={() => setSelectedSubject(null)}
                                            className="text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    {/* Subject Selector */}
                                    <Select
                                        value={selectedSubject ? `${selectedSubject.type}-${selectedSubject.id}` : 'none'}
                                        onValueChange={(value: string) => {
                                            if (value && value !== 'none') {
                                                const [type, id] = value.split('-');
                                                const subject = subjects.find(s => s.type === type && s.id === parseInt(id));
                                                setSelectedSubject(subject || null);
                                            } else {
                                                setSelectedSubject(null);
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="w-12 h-10 p-0 justify-center">
                                            <User className="w-4 h-4" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Tanpa Subjek</SelectItem>
                                            {subjects.map((subject) => (
                                                <SelectItem key={`${subject.type}-${subject.id}`} value={`${subject.type}-${subject.id}`}>
                                                    <div className="flex items-center gap-2">
                                                        {subject.type === 'maintenance' ? (
                                                            <Wrench className="w-3 h-3 text-orange-500" />
                                                        ) : (
                                                            <FolderKanban className="w-3 h-3 text-purple-500" />
                                                        )}
                                                        <span className="truncate">{subject.title}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Input
                                        placeholder="Ketik pesan..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        className="flex-1"
                                    />
                                    <Button
                                        variant="neon"
                                        size="icon"
                                        onClick={handleSendMessage}
                                        disabled={isSending || !newMessage.trim()}
                                    >
                                        {isSending ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Send className="w-4 h-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground">
                            <div className="text-center">
                                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Pilih kontak untuk memulai chat</p>
                            </div>
                        </div>
                    )}
                </Card>
            </motion.div>
        </motion.div>
    );
}
