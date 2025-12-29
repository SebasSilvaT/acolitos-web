'use client';

import { useState, useEffect } from 'react';
import { User, ScheduleEntry } from '@/lib/types';

import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

import { Users, Calendar, Settings as SettingsIcon, RotateCcw } from 'lucide-react';

export default function AdminDashboard() {
    const [users, setUsers] = useState<User[]>([]);
    const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'print'>('dashboard');
    const [showGenerateModal, setShowGenerateModal] = useState(false);

    // User Modal State
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userForm, setUserForm] = useState({ name: '', role: 'acolyte', isActive: true, limitations: [] as string[] });

    const [genParams, setGenParams] = useState({
        startDate: '',
        weeklyCount: 2,
        sundayCount: 0,
        centralMassMode: 'random' as 'random' | 'manual',
        centralMassTime: '12:00'
    });

    useEffect(() => {
        async function fetchData() {
            try {
                const [usersRes, scheduleRes] = await Promise.all([
                    fetch('/api/users'),
                    fetch('/api/schedule')
                ]);

                if (usersRes.ok && scheduleRes.ok) {
                    const usersData = await usersRes.json();
                    const scheduleData = await scheduleRes.json();
                    setUsers(usersData);
                    setSchedule(scheduleData);
                } else {
                    console.error("Failed to fetch data");
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const openGenerateModal = () => {
        // Calculate next monday
        const today = new Date();
        const nextMonday = new Date(today);
        nextMonday.setDate(today.getDate() + (1 + 7 - today.getDay()) % 7);
        if (today.getDay() === 1) nextMonday.setDate(today.getDate() + 7); // If today is Monday, get NEXT Monday

        const activeCount = users.filter(u => u.isActive && u.role === 'acolyte').length;
        const sundayDefault = Math.ceil(activeCount / 4);

        setGenParams({
            startDate: nextMonday.toISOString().split('T')[0],
            weeklyCount: 2,
            sundayCount: sundayDefault,
            centralMassMode: 'random',
            centralMassTime: '12:00'
        });
        setShowGenerateModal(true);
    };

    const handleConfirmGenerate = async () => {
        setLoading(true);
        setShowGenerateModal(false);
        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(genParams)
            });
            const data = await res.json();
            if (res.ok) {
                alert(`Horario generado con éxito! ${data.count} asignaciones creadas.`);
                // Refresh data
                const [usersRes, scheduleRes] = await Promise.all([
                    fetch('/api/users'),
                    fetch('/api/schedule')
                ]);
                if (usersRes.ok && scheduleRes.ok) {
                    setUsers(await usersRes.json());
                    setSchedule(await scheduleRes.json());
                }
            } else {
                alert('Error al generar horario: ' + data.error);
            }
        } catch (error) {
            console.error(error);
            alert('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleAttendance = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'present' ? 'pending' : 'present';

        // Optimistic update
        setSchedule(prev => prev.map(s => s.id === id ? { ...s, attendance: newStatus as any } : s));

        try {
            const res = await fetch('/api/attendance', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus })
            });
            if (!res.ok) {
                throw new Error('Failed to update');
            }
        } catch (error) {
            console.error(error);
            alert("Error al actualizar asistencia");
            // Revert optimistic update
            setSchedule(prev => prev.map(s => s.id === id ? { ...s, attendance: currentStatus as any } : s));
        }
    };

    // USER CRUD HANDLERS
    const handleAddUser = () => {
        setEditingUser(null);
        setUserForm({ name: '', role: 'acolyte', isActive: true, limitations: [] });
        setShowUserModal(true);
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setUserForm({
            name: user.name,
            role: user.role,
            isActive: user.isActive,
            limitations: user.limitations // Already an array
        });
        setShowUserModal(true);
    };

    const toggleLimitation = (dayTime: string) => {
        setUserForm(prev => {
            const isSelected = prev.limitations.includes(dayTime);
            if (isSelected) {
                return { ...prev, limitations: prev.limitations.filter(l => l !== dayTime) };
            } else {
                return { ...prev, limitations: [...prev.limitations, dayTime] };
            }
        });
    };

    const handleSaveUser = async () => {
        setLoading(true);

        try {
            let res;
            if (editingUser) {
                res = await fetch(`/api/users/${editingUser.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userForm)
                });
            } else {
                res = await fetch('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userForm)
                });
            }

            if (res.ok) {
                // Refresh users
                const usersData = await (await fetch('/api/users')).json();
                setUsers(usersData);
                setShowUserModal(false);
            } else {
                alert("Error al guardar usuario");
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión");
        } finally {
            setLoading(false);
        }
    };


    if (loading) return <div className="p-8 text-center">Cargando sistema...</div>;

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            {/* Header / Tabs */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
                        <Calendar className="w-6 h-6" />
                        Gestión de Acólitos
                    </h1>
                    <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`px-4 py-2 text-sm font-medium rounded-mdtransition-colors ${activeTab === 'dashboard' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Dashboard
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'users' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Usuarios
                        </button>
                        <button
                            onClick={() => setActiveTab('print')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'print' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Horario Impresión
                        </button>
                    </nav>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {activeTab === 'dashboard' && (
                    <>
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
                                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-lg text-center cursor-pointer hover:shadow-lg transition-shadow" onClick={openGenerateModal}>
                                    <div className="flex flex-col items-center gap-2">
                                        <RotateCcw size={24} />
                                        <span className="font-semibold">Generar Próximo Mes</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Schedule List (Dashboard View) */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                    <h2 className="font-semibold text-lg">Próximos Horarios</h2>
                                    <span className="text-xs text-gray-400">Esta semana</span>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {schedule.map(entry => {
                                        const acolyte = users.find(u => u.id === entry.assignedAcolyteId);
                                        let dateString = entry.date;
                                        if (entry.time) { dateString += 'T' + entry.time; }
                                        const date = new Date(dateString);
                                        const isValidDate = !isNaN(date.getTime());

                                        if (!isValidDate) return null;

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
                                                    <button
                                                        onClick={() => handleToggleAttendance(entry.id, entry.attendance)}
                                                        className={`text-xs px-2 py-1 rounded-full cursor-pointer transition-colors ${entry.attendance === 'present' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                                    >
                                                        {entry.attendance === 'present' ? 'Asistió' : 'Marcar Asistencia'}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

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
                                </div>
                            </div>
                        </div>
                    </>
                )
                } { /* End Dashboard Tab */}



                {
                    activeTab === 'users' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-gray-800">Directorio de Acólitos</h2>
                                <button onClick={handleAddUser} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
                                    + Agregar Usuario
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-gray-600">
                                    <thead className="bg-gray-50 text-gray-900 uppercase font-bold text-xs">
                                        <tr>
                                            <th className="px-6 py-4">Nombre</th>
                                            <th className="px-6 py-4">Rol</th>
                                            <th className="px-6 py-4">Estado</th>
                                            <th className="px-6 py-4">Limitaciones</th>
                                            <th className="px-6 py-4 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {users.map(user => (
                                            <tr key={user.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {user.isActive ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-xs text-gray-400 max-w-xs truncate">
                                                    {user.limitations.join(', ')}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleEditUser(user)}
                                                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                                                    >
                                                        Editar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                }

                {
                    activeTab === 'print' && (
                        <div className="space-y-8">
                            {/* Weekly Table (Mon-Sat) */}
                            <div className="bg-white p-8 rounded-none shadow-lg border border-gray-300">
                                <div className="bg-indigo-900 text-white p-2 text-center uppercase font-bold mb-4 tracking-widest text-sm">
                                    Semana
                                </div>

                                <div className="grid grid-cols-6 border border-gray-800 text-center">
                                    {/* Headers */}
                                    {['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'].map(day => (
                                        <div key={day} className="bg-indigo-100 border-r border-b border-gray-800 p-2 font-bold text-sm last:border-r-0">
                                            {day}
                                        </div>
                                    ))}

                                    {/* Mass Time Row */}
                                    {['19:00', '19:00', '19:00', '19:00', '19:00', '19:00'].map((time, i) => (
                                        <div key={i} className="bg-indigo-800 text-white text-xs py-1 border-r border-b border-gray-800 last:border-r-0">
                                            7 P.M.
                                        </div>
                                    ))}

                                    {/* Content Cells */}
                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((engDay, i) => {
                                        const dayEntries = schedule.filter(s => {
                                            if (!s.date || !s.time) return false;
                                            const d = new Date(s.date + 'T' + s.time);
                                            if (isNaN(d.getTime())) return false;
                                            return format(d, 'EEEE', { locale: enUS }) === engDay;
                                        });

                                        return (
                                            <div key={engDay} className="border-r border-gray-800 p-2 min-h-[150px] last:border-r-0 text-xs text-gray-900">
                                                {dayEntries.slice(0, 5).map(entry => {
                                                    const acolyte = users.find(u => u.id === entry.assignedAcolyteId);
                                                    return (
                                                        <div key={entry.id} className="mb-1">
                                                            {acolyte?.name || 'Vacante'}
                                                        </div>
                                                    )
                                                })}
                                                {dayEntries.length === 0 && <span className="text-gray-300">-</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Sunday Table */}
                            <div className="bg-white p-8 rounded-none shadow-lg border border-gray-300">
                                <div className="bg-indigo-800 text-white p-2 text-center uppercase font-bold mb-4 tracking-widest text-sm">
                                    Domingo / Misas Dominicales
                                </div>

                                <div className="grid grid-cols-5 border border-gray-800 text-center">
                                    {['8:00', '10:00', '12:00', '18:00', '19:30'].map((time, i) => {
                                        const labels: Record<string, string> = {
                                            '8:00': '8:00 AM',
                                            '10:00': '10:00 AM',
                                            '12:00': '12:00 PM',
                                            '18:00': '6:00 PM',
                                            '19:30': '7:30 PM'
                                        };
                                        return (
                                            <div key={time} className="bg-indigo-50 border-r border-b border-gray-800 p-2 font-bold text-sm last:border-r-0">
                                                {labels[time] || time}
                                                <div className="text-[10px] font-normal text-gray-500">Misa</div>
                                            </div>
                                        )
                                    })}

                                    {['8:00', '10:00', '12:00', '18:00', '19:30'].map((timeKey, i) => {
                                        // Helper to normalize "8:00", "08:00", "8:00:00" -> "08:00"
                                        const normalizeTime = (t: string) => {
                                            if (!t) return '';
                                            const parts = t.trim().split(':');
                                            const h = parts[0].padStart(2, '0');
                                            const m = parts[1] || '00';
                                            return `${h}:${m}`;
                                        };

                                        // Helper to parse dates robustly (yyyy-mm-dd or dd/mm/yyyy)
                                        const parseDate = (dateStr: string, timeStr: string) => {
                                            // 1. Normalize Time (ensure 08:00, not 8:00)
                                            const [h, m] = (timeStr || '00:00').trim().split(':');
                                            const normTime = `${h.padStart(2, '0')}:${(m || '00').padStart(2, '0')}`;

                                            // 2. Try ISO first
                                            let d = new Date(dateStr + 'T' + normTime);
                                            if (!isNaN(d.getTime())) return d;

                                            // 3. Try DD/MM/YYYY
                                            if (dateStr.includes('/')) {
                                                const [day, month, year] = dateStr.split('/');
                                                // Reorder to ISO for constructor
                                                d = new Date(`${year}-${month}-${day}T${normTime}`);
                                                if (!isNaN(d.getTime())) return d;
                                            }

                                            return new Date('Invalid');
                                        };

                                        const sundayEntries = schedule.filter(s => {
                                            if (!s.date || !s.time) return false;
                                            const d = parseDate(s.date, s.time);

                                            if (isNaN(d.getTime())) return false;

                                            // Check day matches Sunday
                                            if (format(d, 'EEEE', { locale: enUS }) !== 'Sunday') return false;

                                            // Check time matches (normalized)
                                            return normalizeTime(s.time) === normalizeTime(timeKey);
                                        });

                                        return (
                                            <div key={timeKey} className="border-r border-gray-800 p-2 min-h-[200px] last:border-r-0 text-xs text-gray-900">
                                                {sundayEntries.map(entry => {
                                                    const acolyte = users.find(u => u.id === entry.assignedAcolyteId);
                                                    if (entry.isCentralMass) {
                                                        return (
                                                            <div key={entry.id} className="mb-1 border-b border-gray-100 pb-1 last:border-0">
                                                                <span className="block text-[10px] text-red-600 font-extrabold uppercase bg-red-50 p-1 rounded">MISA CENTRAL</span>
                                                            </div>
                                                        );
                                                    }
                                                    return (
                                                        <div key={entry.id} className="mb-1 border-b border-gray-100 pb-1 last:border-0">
                                                            {acolyte?.name || 'Vacante'}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>




                            {/* DEBUG SECTION - REMOVE AFTER FIXING */}
                            <div className="bg-red-50 p-4 border border-red-200 rounded text-xs font-mono mt-8">
                                <h4 className="font-bold text-red-600 mb-2">🕵️ DEBUG: Datos Crudos del Domingo</h4>
                                <p className="mb-2 text-gray-600">Esto muestra TODOS los registros que el sistema detecta como "Domingo" o que tienen hora "8:00".</p>
                                <div className="overflow-x-auto bg-white p-2 border">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="p-1">ID (corto)</th>
                                                <th className="p-1">Date String</th>
                                                <th className="p-1">Time String</th>
                                                <th className="p-1">Parsed Day</th>
                                                <th className="p-1">Acólito</th>
                                                <th className="p-1">Raw Date Obj</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {schedule.filter(s => {
                                                if (!s.date) return false;

                                                // Inline Parse for Debug
                                                const [h, m] = (s.time || '00:00').trim().split(':');
                                                const normTime = `${h.padStart(2, '0')}:${(m || '00').padStart(2, '0')}`;

                                                let d = new Date(`${s.date}T${normTime}`);
                                                if (isNaN(d.getTime()) && s.date.includes('/')) {
                                                    const [day, month, year] = s.date.split('/');
                                                    d = new Date(`${year}-${month}-${day}T${normTime}`);
                                                }

                                                const isValidDate = !isNaN(d.getTime());
                                                const isSun = isValidDate && format(d, 'EEEE', { locale: enUS }) === 'Sunday';
                                                const is8am = s.time?.includes('8') || s.time?.includes('08');
                                                return isSun || is8am;
                                            }).slice(0, 20).map(s => {
                                                const [h, m] = (s.time || '00:00').trim().split(':');
                                                const normTime = `${h.padStart(2, '0')}:${(m || '00').padStart(2, '0')}`;

                                                let d = new Date(`${s.date}T${normTime}`);
                                                if (isNaN(d.getTime()) && s.date.includes('/')) {
                                                    const [day, month, year] = s.date.split('/');
                                                    d = new Date(`${year}-${month}-${day}T${normTime}`);
                                                }
                                                const isValidDate = !isNaN(d.getTime());
                                                return (
                                                    <tr key={s.id} className="border-b">
                                                        <td className="p-1 text-gray-400">{s.id.slice(0, 4)}...</td>
                                                        <td className="p-1 font-bold text-blue-600">"{s.date}"</td>
                                                        <td className="p-1 font-bold text-green-600">"{s.time}"</td>
                                                        <td className="p-1">{isValidDate ? format(d, 'EEEE', { locale: enUS }) : 'Fecha Inválida'}</td>
                                                        <td className="p-1">{users.find(u => u.id === s.assignedAcolyteId)?.name}</td>
                                                        <td className="p-1 text-gray-400 text-[10px]">{d.toString()}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )
                }
            </main>

            {/* Generate Modal */}
            {
                showGenerateModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <SettingsIcon className="text-indigo-600" />
                                Configurar Generación
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Semana de Inicio (Lunes)</label>
                                    <input
                                        type="date"
                                        className="w-full border rounded-lg p-2"
                                        value={genParams.startDate}
                                        onChange={e => setGenParams({ ...genParams, startDate: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Acólitos (Lun-Sáb)</label>
                                        <input
                                            type="number"
                                            className="w-full border rounded-lg p-2"
                                            value={genParams.weeklyCount}
                                            onChange={e => setGenParams({ ...genParams, weeklyCount: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>

                                    <div className="border-t border-gray-100 pt-4 mt-2">
                                        <label className="block text-sm font-bold text-gray-800 mb-2">Misa Central (Domingo)</label>

                                        <div className="flex gap-4 mb-3">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="centralMode"
                                                    checked={genParams.centralMassMode === 'random'}
                                                    onChange={() => setGenParams({ ...genParams, centralMassMode: 'random' })}
                                                    className="w-4 h-4 text-indigo-600"
                                                />
                                                <span className="text-sm text-gray-700">Aleatoria</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="centralMode"
                                                    checked={genParams.centralMassMode === 'manual'}
                                                    onChange={() => setGenParams({ ...genParams, centralMassMode: 'manual' })}
                                                    className="w-4 h-4 text-indigo-600"
                                                />
                                                <span className="text-sm text-gray-700">Manual</span>
                                            </label>
                                        </div>

                                        {genParams.centralMassMode === 'manual' && (
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Horario Misa Central</label>
                                                <select
                                                    className="w-full border rounded-lg p-2 text-sm"
                                                    value={genParams.centralMassTime}
                                                    onChange={e => setGenParams({ ...genParams, centralMassTime: e.target.value })}
                                                >
                                                    {['8:00', '10:00', '12:00', '18:00', '19:30'].map(t => (
                                                        <option key={t} value={t}>{t} hrs</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                        {genParams.centralMassMode === 'random' && (
                                            <p className="text-xs text-gray-500 italic">
                                                Se seleccionará automáticamente entre 10:00, 12:00 o 18:00.
                                            </p>
                                        )}
                                        <p className="text-xs text-indigo-600 mt-2 font-medium">
                                            * Acólitos se distribuirán equitativamente (Total/4).
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    onClick={() => setShowGenerateModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirmGenerate}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                                >
                                    Generar Horario
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* User Edit/Add Modal */}
            {
                showUserModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                            <h2 className="text-xl font-bold mb-4">
                                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                                    <input
                                        className="w-full border rounded-lg p-2"
                                        value={userForm.name}
                                        onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                                    <select
                                        className="w-full border rounded-lg p-2"
                                        value={userForm.role}
                                        onChange={e => setUserForm({ ...userForm, role: e.target.value as any })}
                                    >
                                        <option value="acolyte">Acólito</option>
                                        <option value="master">Maestro</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                checked={userForm.isActive}
                                                onChange={() => setUserForm({ ...userForm, isActive: true })}
                                            />
                                            Activo
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                checked={!userForm.isActive}
                                                onChange={() => setUserForm({ ...userForm, isActive: false })}
                                            />
                                            Inactivo
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">Limitaciones - Días que NO puede acolitar</label>

                                    {/* Weekdays Section */}
                                    <div className="mb-4">
                                        <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase">Días Entre Semana (7:00 PM)</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { day: 'Monday', label: 'Lunes' },
                                                { day: 'Tuesday', label: 'Martes' },
                                                { day: 'Wednesday', label: 'Miércoles' },
                                                { day: 'Thursday', label: 'Jueves' },
                                                { day: 'Friday', label: 'Viernes' },
                                                { day: 'Saturday', label: 'Sábado' }
                                            ].map(({ day, label }) => {
                                                const value = `${day}-19:00`;
                                                const isChecked = userForm.limitations.includes(value);
                                                return (
                                                    <label
                                                        key={day}
                                                        className={`flex items-center gap-2 p-2 rounded-lg border-2 cursor-pointer transition-all ${isChecked
                                                                ? 'bg-red-50 border-red-300 text-red-700'
                                                                : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                                            }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={() => toggleLimitation(value)}
                                                            className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                                                        />
                                                        <span className="text-sm font-medium">{label}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Sunday Section */}
                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase">Domingos</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { time: '08:00', label: '8:00 AM' },
                                                { time: '10:00', label: '10:00 AM' },
                                                { time: '12:00', label: '12:00 PM' },
                                                { time: '18:00', label: '6:00 PM' },
                                                { time: '19:30', label: '7:30 PM' }
                                            ].map(({ time, label }) => {
                                                const value = `Sunday-${time}`;
                                                const isChecked = userForm.limitations.includes(value);
                                                return (
                                                    <label
                                                        key={time}
                                                        className={`flex items-center gap-2 p-2 rounded-lg border-2 cursor-pointer transition-all ${isChecked
                                                                ? 'bg-red-50 border-red-300 text-red-700'
                                                                : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                                            }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={() => toggleLimitation(value)}
                                                            className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                                                        />
                                                        <span className="text-sm font-medium">{label}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <p className="text-xs text-gray-500 mt-3 italic">
                                        Marca los días y horarios en los que este acólito NO está disponible
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    onClick={() => setShowUserModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveUser}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                                >
                                    Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    )
}

