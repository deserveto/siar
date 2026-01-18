'use client';

/**
 * SIAR Calendar Module
 * Monthly view with events, event popup, and color picker for admins
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    addMonths,
    subMonths,
    isSameMonth,
    isSameDay,
    isToday,
} from 'date-fns';
import { id } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Plus,
    Loader2,
    X,
    Wrench,
    FolderKanban,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, scaleIn } from '@/lib/motion-variants';

interface CalendarEvent {
    id: number;
    date: string;
    title: string;
    description: string;
    color: string;
    eventType: string;
    referenceId: number | null;
    user?: {
        id: number;
        nama_lengkap: string;
    };
}

const colorOptions = [
    { name: 'Biru', value: 'blue', class: 'bg-blue-500' },
    { name: 'Hijau', value: 'green', class: 'bg-green-500' },
    { name: 'Merah', value: 'red', class: 'bg-red-500' },
    { name: 'Ungu', value: 'purple', class: 'bg-purple-500' },
    { name: 'Orange', value: 'orange', class: 'bg-orange-500' },
    { name: 'Cyan', value: 'cyan', class: 'bg-cyan-500' },
    { name: 'Pink', value: 'pink', class: 'bg-pink-500' },
    { name: 'Kuning', value: 'yellow', class: 'bg-yellow-500' },
];

const eventTypeConfig: Record<string, { icon: React.ElementType; label: string }> = {
    custom: { icon: CalendarIcon, label: 'Event' },
    deadline_maintenance: { icon: Wrench, label: 'Deadline Maintenance' },
    deadline_project: { icon: FolderKanban, label: 'Deadline Project' },
};

export default function CalendarPage() {
    const { data: session } = useSession();
    const { toast } = useToast();
    const isIT = session?.user?.role === 'IT';

    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: '',
        description: '',
        color: 'blue',
    });

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    // Generate calendar days
    const days: Date[] = [];
    let day = startDate;
    while (day <= endDate) {
        days.push(day);
        day = addDays(day, 1);
    }

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await fetch('/api/events');
            if (res.ok) {
                const data = await res.json();
                setEvents(data);
            }
        } catch (error) {
            console.error('Failed to fetch events:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getEventsForDay = (date: Date) => {
        return events.filter((event) => isSameDay(new Date(event.date), date));
    };

    const handleEventClick = (event: CalendarEvent) => {
        setSelectedEvent(event);
        setIsEventModalOpen(true);
    };

    const handleAddEvent = async () => {
        if (!selectedDate || !newEvent.title) return;

        setIsSubmitting(true);

        try {
            const res = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: format(selectedDate, 'yyyy-MM-dd'),
                    title: newEvent.title,
                    description: newEvent.description,
                    color: newEvent.color,
                }),
            });

            if (res.ok) {
                toast({
                    title: 'Event Ditambahkan',
                    description: `Event "${newEvent.title}" berhasil ditambahkan.`,
                    variant: 'success',
                });
                setNewEvent({ title: '', description: '', color: 'blue' });
                setIsAddModalOpen(false);
                fetchEvents();
            } else {
                const data = await res.json();
                throw new Error(data.error);
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Gagal menambah event',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteEvent = async (id: number) => {
        try {
            const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast({
                    title: 'Berhasil',
                    description: 'Event berhasil dihapus',
                    variant: 'success',
                });
                setIsEventModalOpen(false);
                fetchEvents();
            }
        } catch (error) {
            console.error('Failed to delete event:', error);
        }
    };

    const getColorClass = (color: string) => {
        return colorOptions.find((c) => c.value === color)?.class || 'bg-blue-500';
    };

    return (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
            {/* Page Header */}
            <motion.div variants={fadeInUp}>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <CalendarIcon className="w-6 h-6 accent-text" />
                    Calendar
                </h1>
                <p className="text-muted-foreground">
                    Lihat dan kelola jadwal kegiatan serta deadline
                </p>
            </motion.div>

            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin accent-text" />
                </div>
            ) : (
                <motion.div variants={fadeInUp} initial="initial" animate="animate" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Calendar Grid */}
                    <Card className="lg:col-span-2 bg-background/50 backdrop-blur border-border/50">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>
                                    {format(currentMonth, 'MMMM yyyy', { locale: id })}
                                </CardTitle>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
                                        Hari Ini
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Day headers */}
                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((d) => (
                                    <div key={d} className="text-center text-sm font-medium text-muted-foreground py-2">
                                        {d}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar days */}
                            <div className="grid grid-cols-7 gap-1">
                                {days.map((date, idx) => {
                                    const dayEvents = getEventsForDay(date);
                                    const isCurrentMonth = isSameMonth(date, currentMonth);
                                    const isSelected = selectedDate && isSameDay(date, selectedDate);

                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => setSelectedDate(date)}
                                            className={`
                        relative min-h-[80px] p-1 rounded-lg border transition-all text-left cursor-pointer
                        ${isCurrentMonth ? 'bg-background/30' : 'bg-background/10 opacity-50'}
                        ${isSelected ? 'border-green-500 ring-1 ring-green-500' : 'border-border/30'}
                        ${isToday(date) ? 'bg-green-500/10' : ''}
                        hover:border-green-500/50
                      `}
                                        >
                                            <span
                                                className={`
                          inline-flex items-center justify-center w-6 h-6 rounded-full text-sm
                          ${isToday(date) ? 'bg-green-500 text-white font-bold' : ''}
                        `}
                                            >
                                                {format(date, 'd')}
                                            </span>

                                            <div className="mt-1 space-y-0.5">
                                                {dayEvents.slice(0, 2).map((event) => (
                                                    <div
                                                        key={event.id}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEventClick(event);
                                                        }}
                                                        className={`
                              w-full text-left text-[10px] px-1 py-0.5 rounded truncate text-white cursor-pointer
                              ${getColorClass(event.color)} hover:opacity-80 transition-opacity
                            `}
                                                    >
                                                        {event.title}
                                                    </div>
                                                ))}
                                                {dayEvents.length > 2 && (
                                                    <div className="text-[10px] text-muted-foreground px-1">
                                                        +{dayEvents.length - 2} lagi
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Selected Date Events */}
                        <Card className="bg-background/50 backdrop-blur border-border/50">
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    {selectedDate
                                        ? format(selectedDate, 'EEEE, d MMMM yyyy', { locale: id })
                                        : 'Pilih Tanggal'}
                                </CardTitle>
                                <CardDescription>
                                    {selectedDate
                                        ? `${getEventsForDay(selectedDate).length} event`
                                        : 'Klik tanggal untuk melihat detail'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {selectedDate ? (
                                    <div className="space-y-2">
                                        {getEventsForDay(selectedDate).length > 0 ? (
                                            getEventsForDay(selectedDate).map((event) => (
                                                <button
                                                    key={event.id}
                                                    onClick={() => handleEventClick(event)}
                                                    className="w-full p-3 rounded-lg bg-background/50 border border-border/50 hover:border-green-500/50 transition-all text-left"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-3 h-3 rounded-full ${getColorClass(event.color)}`} />
                                                        <span className="font-medium flex-1 truncate">{event.title}</span>
                                                    </div>
                                                    {event.eventType !== 'custom' && (
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {eventTypeConfig[event.eventType]?.label || 'Event'}
                                                        </p>
                                                    )}
                                                </button>
                                            ))
                                        ) : (
                                            <p className="text-sm text-muted-foreground text-center py-4">
                                                Tidak ada event pada tanggal ini
                                            </p>
                                        )}

                                        {/* Add Event Button (IT only) */}
                                        {isIT && (
                                            <Button
                                                variant="outline"
                                                className="w-full mt-4"
                                                onClick={() => setIsAddModalOpen(true)}
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                Tambah Event
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        Pilih tanggal pada kalender
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Legend */}
                        <Card className="bg-background/50 backdrop-blur border-border/50">
                            <CardHeader>
                                <CardTitle className="text-lg">Legenda</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Wrench className="w-4 h-4 text-orange-500" />
                                        <span className="text-sm">Deadline Maintenance</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FolderKanban className="w-4 h-4 text-purple-500" />
                                        <span className="text-sm">Deadline Project</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CalendarIcon className="w-4 h-4 text-blue-500" />
                                        <span className="text-sm">Event Umum</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </motion.div>
            )}

            {/* Event Detail Modal */}
            <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Detail Event</DialogTitle>
                        <DialogDescription>Informasi lengkap event</DialogDescription>
                    </DialogHeader>

                    {selectedEvent && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-4 h-4 rounded-full ${getColorClass(selectedEvent.color)}`} />
                                <h3 className="text-lg font-medium">{selectedEvent.title}</h3>
                            </div>

                            <div>
                                <Label className="text-muted-foreground">Tanggal</Label>
                                <p className="font-medium">
                                    {format(new Date(selectedEvent.date), 'EEEE, d MMMM yyyy', { locale: id })}
                                </p>
                            </div>

                            <div>
                                <Label className="text-muted-foreground">Tipe</Label>
                                <p className="font-medium flex items-center gap-2">
                                    {(() => {
                                        const config = eventTypeConfig[selectedEvent.eventType];
                                        const Icon = config?.icon || CalendarIcon;
                                        return (
                                            <>
                                                <Icon className="w-4 h-4" />
                                                {config?.label || 'Event'}
                                            </>
                                        );
                                    })()}
                                </p>
                            </div>

                            {selectedEvent.description && (
                                <div>
                                    <Label className="text-muted-foreground">Deskripsi</Label>
                                    <p className="whitespace-pre-wrap">{selectedEvent.description}</p>
                                </div>
                            )}

                            {selectedEvent.user && (
                                <div>
                                    <Label className="text-muted-foreground">Dibuat Oleh</Label>
                                    <p className="font-medium">{selectedEvent.user.nama_lengkap}</p>
                                </div>
                            )}

                            {isIT && selectedEvent.eventType === 'custom' && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                                >
                                    Hapus Event
                                </Button>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Add Event Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tambah Event Baru</DialogTitle>
                        <DialogDescription>
                            {selectedDate
                                ? `Event untuk ${format(selectedDate, 'd MMMM yyyy', { locale: id })}`
                                : 'Pilih tanggal terlebih dahulu'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Judul Event</Label>
                            <Input
                                placeholder="Contoh: Rapat Divisi"
                                value={newEvent.title}
                                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Deskripsi (Opsional)</Label>
                            <textarea
                                placeholder="Deskripsi event..."
                                value={newEvent.description}
                                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                rows={3}
                                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Warna</Label>
                            <div className="flex gap-2 flex-wrap">
                                {colorOptions.map((color) => (
                                    <button
                                        key={color.value}
                                        type="button"
                                        onClick={() => setNewEvent({ ...newEvent, color: color.value })}
                                        className={`
                      w-8 h-8 rounded-full ${color.class} transition-all
                      ${newEvent.color === color.value ? 'ring-2 ring-offset-2 ring-foreground' : ''}
                      hover:scale-110
                    `}
                                        title={color.name}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-4">
                            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                                Batal
                            </Button>
                            <Button
                                variant="neon"
                                onClick={handleAddEvent}
                                disabled={isSubmitting || !newEvent.title}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Tambah Event
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}
