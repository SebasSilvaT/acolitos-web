'use client';

import { useState, useEffect } from 'react';
import { User, ScheduleEntry } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, User as UserIcon, CheckCircle, Clock } from 'lucide-react';

export default function MySchedulePage() {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch users to populate the selection list
        fetch('/api/users')
            .then(res => res.json())
            .then(data => {
                setUsers(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleLogin = (userId: string) => {
        const user = users.find(u => u.id === userId);
        if (user) {
            setSelectedUser(user);
            setLoading(true);
            fetch('/api/schedule')
                .then(res => res.json())
                .then((data: ScheduleEntry[]) => {
                    // Filter for this user and future dates
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    const mySchedule = data.filter(entry => {
                        if (!entry.date || !entry.time) return false;
                        const d = new Date(entry.date + 'T' + entry.time);
                        if (isNaN(d.getTime())) return false;
                        return entry.assignedAcolyteId === user.id && d >= today;
                    });
                    setSchedule(mySchedule);
                    setLoading(false);
                });
        }
    };

    if (loading && !selectedUser) return <div className="p-8 text-center bg-gray-50 min-h-screen flex items-center justify-center">Cargando...</div>;

    if (!selectedUser) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md">
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-indigo-100 rounded-full text-indigo-600">
                            <UserIcon size={32} />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">Bienvenido Acólito</h1>
                    <p className="text-center text-gray-500 mb-6">Selecciona tu nombre para ver tus turnos</p>

                    <div className="space-y-4">
                        {users.filter(u => u.isActive && u.role === 'acolyte').map(user => (
                            <button
                                key={user.id}
                                onClick={() => handleLogin(user.id)}
                                className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-indigo-50 hover:border-indigo-200 transition-colors flex items-center justify-between group"
                            >
                                <span className="font-medium text-gray-700 group-hover:text-indigo-700">{user.name}</span>
                                <span className="text-gray-300 group-hover:text-indigo-400">→</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-indigo-600 text-white p-4 shadow-md sticky top-0 z-10">
                <div className="max-w-md mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="font-bold text-lg">Mis Turnos</h1>
                        <p className="text-indigo-200 text-sm">Hola, {selectedUser.name}</p>
                    </div>
                    <button onClick={() => setSelectedUser(null)} className="text-xs bg-indigo-500 hover:bg-indigo-400 px-3 py-1 rounded">
                        Salir
                    </button>
                </div>
            </header>

            <main className="max-w-md mx-auto p-4 space-y-4">
                {loading ? (
                    <div className="text-center py-8">Cargando horarios...</div>
                ) : schedule.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-100 p-8 shadow-sm">
                        <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                        <p>No tienes turnos próximos asignados.</p>
                    </div>
                ) : (
                    schedule.map(entry => {
                        const date = new Date(entry.date + 'T' + entry.time);
                        return (
                            <div key={entry.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-indigo-500">
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-4">
                                        <div className="bg-indigo-50 text-indigo-700 rounded-lg p-2 text-center min-w-[3.5rem] flex flex-col justify-center">
                                            <span className="text-xs font-bold uppercase">{format(date, 'MMM', { locale: es })}</span>
                                            <span className="text-xl font-bold">{format(date, 'd')}</span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                                {format(date, 'EEEE', { locale: es })}
                                                {entry.isCentralMass && <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded uppercase tracking-wider">Misa Central</span>}
                                            </h3>
                                            <div className="flex items-center text-gray-600 mt-1">
                                                <Clock size={16} className="mr-1.5" />
                                                {format(date, 'h:mm a', { locale: es })}
                                            </div>
                                        </div>
                                    </div>
                                    {entry.attendance === 'present' && (
                                        <CheckCircle className="text-green-500" size={20} />
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </main>
        </div>
    );
}
