'use client';

/**
 * SIAR Notifications Component with Routing
 * Shows notification dropdown in header with click-to-route functionality
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
    Bell,
    CheckCheck,
    Loader2,
    Wrench,
    FolderKanban,
    MessageSquare,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    referenceId: number | null;
    createdAt: string;
}

export function Notifications() {
    const { data: session } = useSession();
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (session?.user) {
            fetchNotifications();
            // Poll for new notifications every 30 seconds
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [session]);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    const markAsRead = async (id: number) => {
        try {
            await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
            fetchNotifications();
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const markAllAsRead = async () => {
        setIsLoading(true);
        try {
            await fetch('/api/notifications', { method: 'POST' });
            fetchNotifications();
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read first
        if (!notification.isRead) {
            await markAsRead(notification.id);
        }

        setIsOpen(false);

        // Route based on notification type
        switch (notification.type) {
            case 'maintenance_status':
                router.push('/dashboard/maintenance');
                break;
            case 'project_status':
                router.push('/dashboard/projects');
                break;
            case 'chat':
            case 'new_message':
                router.push('/dashboard/chat');
                break;
            default:
                // Default to dashboard
                router.push('/dashboard');
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'maintenance_status':
                return <Wrench className="w-4 h-4 text-orange-500" />;
            case 'project_status':
                return <FolderKanban className="w-4 h-4 text-purple-500" />;
            case 'chat':
            case 'new_message':
                return <MessageSquare className="w-4 h-4 text-blue-500" />;
            default:
                return <Bell className="w-4 h-4 text-gray-500" />;
        }
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative transition-all duration-200 hover:scale-110"
                >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-80 p-0 backdrop-blur-xl bg-background/60 border-white/10 shadow-2xl overflow-hidden"
                align="end"
                forceMount
            >
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                    <h3 className="font-semibold">Notifikasi</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                markAllAsRead();
                            }}
                            disabled={isLoading}
                            className="text-xs h-8 ml-auto transition-all duration-200 hover:bg-white/10"
                        >
                            {isLoading ? (
                                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            ) : (
                                <CheckCheck className="w-3 h-3 mr-1" />
                            )}
                            Tandai dibaca
                        </Button>
                    )}
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>Tidak ada notifikasi</p>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`p-4 cursor-pointer border-b border-white/5 last:border-0 hover:bg-white/10 transition-colors flex gap-3 items-start focus:bg-white/10 ${!notification.isRead ? 'bg-accent/10' : ''
                                    }`}
                            >
                                <div className="mt-1">
                                    {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm ${!notification.isRead ? 'font-medium' : ''}`}>
                                        {notification.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                        {notification.message}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                        {formatDistanceToNow(new Date(notification.createdAt), {
                                            addSuffix: true,
                                            locale: id,
                                        })}
                                    </p>
                                </div>
                                {!notification.isRead && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 self-start" />
                                )}
                            </DropdownMenuItem>
                        ))
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
