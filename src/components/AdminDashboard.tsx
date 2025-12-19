'use client';

import { useState, useEffect } from 'react';
import { User, ScheduleEntry } from '@/lib/types';
import { getUsers, getSchedule } from '@/lib/mockData';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Users, Calendar, Settings as SettingsIcon, RotateCcw } from 'lucide-react';

export default function AdminDashboard() {
    const [users, setUsers] = useState<User[]>([]);
    const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([getUsers(), getSchedule()]).then(([usersData, scheduleData]) => {
            setUsers(usersData);
            setSchedule(scheduleData);
            setLoading(false);
        });
    }, []);

    const handleGenerate = () => {
        alert("Generando horarios... (Lógica en construcción)");
    };

    if (loading) return <div className="p-8 text-center">Cargando sistema...</div>;

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
                        <Calendar className="w-6 h-6" />
                        Gestión de Acólitos
                    </h1>
                    <div className="text-sm text-gray-500">Administrador</div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
                                <Users size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Acólitos Activos</p>
                                <p className="text-2xl font-bold">{users.filter(u => u.isActive && u.role === 'acolyte').length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Misas Programadas</p>
                                <p className="text-2xl font-bold">{schedule.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-lg text-center cursor-pointer hover:shadow-lg transition-shadow" onClick={handleGenerate}>
                            <div className="flex flex-col items-center gap-2">
                                <RotateCcw size={24} />
                                <span className="font-semibold">Generar Próximo Mes</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Schedule List */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="font-semibold text-lg">Próximos Horarios</h2>
                            <span className="text-xs text-gray-400">Esta semana</span>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {schedule.map(entry => {
                                const acolyte = users.find(u => u.id === entry.assignedAcolyteId);
                                const date = new Date(entry.date + 'T' + entry.time);
                                return (
                                    <div key={entry.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="text-center w-16">
                                                <div className="text-xs uppercase font-bold text-gray-500">{format(date, 'MMM', { locale: es })}</div>
                                                <div className="text-xl font-bold text-gray-800">{format(date, 'd')}</div>
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">
                                                    {format(date, 'EEEE h:mm a', { locale: es })}
                                                    {entry.isCentralMass && <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Central</span>}
                                                </div>
                                                <div className="text-sm text-gray-500">Asignado: {acolyte?.name || 'Vacante'}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-xs px-2 py-1 rounded-full ${entry.attendance === 'present' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {entry.attendance === 'present' ? 'Asistió' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Config / Quick Actions */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <SettingsIcon size={20} />
                            Configuración Rápida
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Acólitos por Misa</span>
                                <input type="number" className="w-16 border rounded p-1 text-center" defaultValue={2} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Rotación Central</span>
                                <select className="border rounded p-1 text-sm">
                                    <option>10:00 AM</option>
                                    <option>12:00 PM</option>
                                    <option>6:00 PM</option>
                                </select>
                            </div>
                        </div>
                    </div>

                </div>

            </main>
        </div>
    );
}
