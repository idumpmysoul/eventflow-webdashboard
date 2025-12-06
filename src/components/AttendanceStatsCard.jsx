import React, { useEffect, useState } from 'react';
import { Card, Title, Text } from '@tremor/react';
import { 
    UserGroupIcon, 
    CheckCircleIcon, 
    XCircleIcon, 
    ClockIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';
import socket from '../services/socket';

const AttendanceStatsCard = ({ eventId }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const calculateStatsManually = (participants) => {
        const totalParticipants = participants.length;
        const present = participants.filter(p => p.attendanceStatus === 'PRESENT').length;
        const absent = participants.filter(p => p.attendanceStatus === 'ABSENT').length;
        const pending = participants.filter(p => !p.attendanceStatus || p.attendanceStatus === 'PENDING').length;
        const attendanceRate = totalParticipants > 0
            ? ((present / totalParticipants) * 100).toFixed(2)
            : '0.00';

        return {
            totalParticipants,
            present,
            absent,
            pending,
            attendanceRate: parseFloat(attendanceRate)
        };
    };

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Try backend endpoint first
            try {
                const response = await api.getAttendanceStatistics(eventId);
                console.log('[AttendanceStatsCard] Using backend endpoint:', response);
                
                setStats({
                    totalParticipants: response.totalParticipants,
                    present: response.present,
                    absent: response.absent,
                    pending: response.pending,
                    attendanceRate: parseFloat(response.attendanceRate)
                });
            } catch (backendError) {
                // Fallback: Calculate manually from participants list
                console.warn('[AttendanceStatsCard] Backend endpoint failed, using fallback calculation:', backendError.message);
                const participants = await api.getEventParticipants(eventId);
                const calculatedStats = calculateStatsManually(participants);
                console.log('[AttendanceStatsCard] Using fallback calculation:', calculatedStats);
                setStats(calculatedStats);
            }
        } catch (error) {
            console.error('[AttendanceStatsCard] Failed to fetch:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!eventId) return;
        fetchStats();
    }, [eventId]);

    // Socket listener for real-time attendance updates
    useEffect(() => {
        if (!eventId) return;

        const handleAttendanceUpdate = (payload) => {
            if (payload.eventId === eventId) {
                console.log('[AttendanceStatsCard] Socket attendance update:', payload);
                // Refresh stats when attendance changes
                fetchStats();
            }
        };

        socket.on('attendanceUpdate', handleAttendanceUpdate);

        return () => {
            socket.off('attendanceUpdate', handleAttendanceUpdate);
        };
    }, [eventId]);

    if (loading) {
        return (
            <Card className="bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl">
                <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl">
                <Text className="text-center text-red-500 dark:text-red-400">
                    Error: {error}
                </Text>
            </Card>
        );
    }

    if (!stats) {
        return (
            <Card className="bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl">
                <Text className="text-center text-gray-500 dark:text-slate-400">
                    No attendance data available
                </Text>
            </Card>
        );
    }

    const statItems = [
        {
            icon: UserGroupIcon,
            label: 'Total Participants',
            value: stats.totalParticipants,
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-100 dark:bg-blue-900/30'
        },
        {
            icon: CheckCircleIcon,
            label: 'Present',
            value: stats.present,
            color: 'text-green-600 dark:text-green-400',
            bgColor: 'bg-green-100 dark:bg-green-900/30'
        },
        {
            icon: XCircleIcon,
            label: 'Absent',
            value: stats.absent,
            color: 'text-red-600 dark:text-red-400',
            bgColor: 'bg-red-100 dark:bg-red-900/30'
        },
        {
            icon: ClockIcon,
            label: 'Pending',
            value: stats.pending,
            color: 'text-gray-600 dark:text-gray-400',
            bgColor: 'bg-gray-100 dark:bg-gray-900/30'
        }
    ];

    return (
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl shadow-sm">
            <div className="mb-2 pb-2 border-b border-gray-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                    <div>
                        <Title className="text-base font-bold text-black dark:text-white mb-0.5">
                            Attendance Overview
                        </Title>
                        <div className="flex items-baseline gap-1.5">
                            <Text className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                                {stats.attendanceRate}%
                            </Text>
                            <Text className="text-xs text-gray-500 dark:text-slate-400">
                                attendance rate
                            </Text>
                        </div>
                    </div>
                    <button
                        onClick={fetchStats}
                        disabled={loading}
                        className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                        title="Refresh attendance stats"
                    >
                        <ArrowPathIcon className={`w-4 h-4 text-gray-600 dark:text-slate-400 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
                {statItems.map((item, index) => (
                    <div
                        key={index}
                        className={`${item.bgColor} rounded-lg p-2.5`}
                    >
                        <div className="flex items-center gap-1.5 mb-1">
                            <item.icon className={`w-4 h-4 ${item.color}`} />
                            <Text className="text-[10px] font-medium text-gray-600 dark:text-slate-400">
                                {item.label}
                            </Text>
                        </div>
                        <Text className={`text-xl font-bold ${item.color}`}>
                            {item.value}
                        </Text>
                    </div>
                ))}
            </div>

            {/* Progress bar */}
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1">
                    <Text className="text-[10px] text-gray-600 dark:text-slate-400">Progress</Text>
                    <Text className="text-[10px] font-semibold text-gray-700 dark:text-slate-300">
                        {stats.present} / {stats.totalParticipants}
                    </Text>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${stats.attendanceRate}%` }}
                    />
                </div>
            </div>
        </Card>
    );
};

export default AttendanceStatsCard;
