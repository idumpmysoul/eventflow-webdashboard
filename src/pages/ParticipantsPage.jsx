
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import * as mockApi from '../services/mockApi.js';
import MockDataBanner from '../components/MockDataBanner.jsx';
import socket from '../services/socket.js';
import {
    Card,
    Table,
    TableHead,
    TableRow,
    TableHeaderCell,
    TableBody,
    TableCell,
    Text,
    Title,
    Badge,
} from '@tremor/react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNotifier } from '../contexts/NotificationContext.jsx';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const MOCK_DATA_TIMEOUT = 5000;

const ParticipantsPage = () => {
    const { selectedEventId } = useAuth();
    const navigate = useNavigate();
    const { notify } = useNotifier();
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [usingMockData, setUsingMockData] = useState(false);
    const [updatingAttendance, setUpdatingAttendance] = useState({});

    const dataLoadedRef = useRef(false);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => { isMountedRef.current = false; };
    }, []);

    useEffect(() => {
        if (!selectedEventId) {
            navigate('/events');
            return;
        }

        dataLoadedRef.current = false;

        const loadMockData = async () => {
            if (dataLoadedRef.current || !isMountedRef.current) return;
            dataLoadedRef.current = true;
            console.warn("Falling back to mock participant data.");
            setUsingMockData(true);
            try {
                const mockParticipants = await mockApi.getParticipants();
                if (isMountedRef.current) setParticipants(mockParticipants);
            } catch (mockErr) {
                if (isMountedRef.current) setError("Live data failed and mock data could not be loaded.");
            } finally {
                if (isMountedRef.current) setLoading(false);
            }
        };
        
        const timeoutId = setTimeout(loadMockData, MOCK_DATA_TIMEOUT);

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            setUsingMockData(false);
            try {
                const response = await api.getEventParticipants(selectedEventId);
                
                if (dataLoadedRef.current || !isMountedRef.current) return;
                clearTimeout(timeoutId);
                dataLoadedRef.current = true;

                setParticipants(response);
                setLoading(false);
            } catch (err) {
                if (dataLoadedRef.current || !isMountedRef.current) return;
                clearTimeout(timeoutId);
                console.error("Failed to fetch participants:", err);
                setError(err.message);
                loadMockData();
            }
        };
        fetchData();
        return () => clearTimeout(timeoutId);
    }, [selectedEventId, navigate]);

    // Socket.IO listener for real-time attendance updates
    useEffect(() => {
        if (!selectedEventId) return;

        // Listen for attendance updates from backend (auto check-in)
        const handleAttendanceUpdate = (payload) => {
            if (payload.eventId === selectedEventId) {
                console.log('[Socket] Attendance updated:', payload);
                setParticipants(prev => 
                    prev.map(p => 
                        (p.userId === payload.userId || p.user?.id === payload.userId)
                            ? { 
                                ...p, 
                                attendanceStatus: payload.attendanceStatus,
                                checkInTime: payload.checkInTime 
                            }
                            : p
                    )
                );
                // Optional: Show notification
                if (payload.attendanceStatus === 'PRESENT') {
                    notify(`${payload.userName || 'Participant'} auto checked-in!`, 'success');
                }
            }
        };

        socket.on('attendanceUpdate', handleAttendanceUpdate);

        return () => {
            socket.off('attendanceUpdate', handleAttendanceUpdate);
        };
    }, [selectedEventId, notify]);

    // Sort so ORGANIZER/admin always at the top
    const sortedParticipants = [...participants].sort((a, b) => {
        const aRole = (a.user?.role || a.role || '').toLowerCase();
        const bRole = (b.user?.role || b.role || '').toLowerCase();
        if (aRole === 'organizer' && bRole !== 'organizer') return -1;
        if (aRole !== 'organizer' && bRole === 'organizer') return 1;
        return 0;
    });

    // Handler untuk update attendance status manual
    const handleAttendanceChange = async (userId, newStatus) => {
        setUpdatingAttendance(prev => ({ ...prev, [userId]: true }));
        try {
            await api.updateParticipantAttendance(selectedEventId, userId, newStatus);
            // Update local state
            setParticipants(prev => 
                prev.map(p => 
                    (p.userId === userId || p.user?.id === userId) 
                        ? { ...p, attendanceStatus: newStatus, checkInTime: newStatus === 'PRESENT' ? new Date() : p.checkInTime }
                        : p
                )
            );
            notify(`Attendance updated to ${newStatus}`, 'info');
        } catch (err) {
            notify(`Failed to update attendance: ${err.message}`, 'alert');
        } finally {
            setUpdatingAttendance(prev => ({ ...prev, [userId]: false }));
        }
    };


    return (
        <div className="p-6 h-full flex flex-col bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-200">
            {usingMockData && <MockDataBanner />}
            <Title className="text-2xl mb-6 text-black dark:text-white">Event Participants</Title>
            <Card className="flex-grow bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden p-0">
                    {loading ? (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-slate-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mr-3"></div>
                        Loading...
                    </div>
                    ) : (
                    <div className="h-full overflow-y-auto custom-scrollbar">
                        <Table>
                            <TableHead>
                                <TableRow className="border-b border-gray-200 dark:border-slate-800">
                                    <TableHeaderCell className="text-gray-500 dark:text-slate-400">Name</TableHeaderCell>
                                    <TableHeaderCell className="text-gray-500 dark:text-slate-400">Email</TableHeaderCell>
                                    <TableHeaderCell className="text-gray-500 dark:text-slate-400">Phone</TableHeaderCell>
                                    <TableHeaderCell className="text-gray-500 dark:text-slate-400">Joined At</TableHeaderCell>
                                    <TableHeaderCell className="text-gray-500 dark:text-slate-400">Check-in</TableHeaderCell>
                                    <TableHeaderCell className="text-gray-500 dark:text-slate-400">Attendance</TableHeaderCell>
                                    <TableHeaderCell className="text-gray-500 dark:text-slate-400">Status</TableHeaderCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sortedParticipants.map((item) => {
                                    // Handle both mock structure (direct) and real structure (nested user)
                                    const userId = item.userId || item.user?.id;
                                    const name = item.user?.name || item.name || 'Unknown';
                                    const email = item.user?.email || item.email || '-';
                                    const phone = item.user?.phoneNumber || '-';
                                    const avatarUrl = item.user?.avatarUrl || null;
                                    const joinedAt = item.joinedAt ? new Date(item.joinedAt).toLocaleString('id-ID', { 
                                        dateStyle: 'short', 
                                        timeStyle: 'short' 
                                    }) : '-';
                                    const checkInTime = item.checkInTime ? new Date(item.checkInTime).toLocaleString('id-ID', { 
                                        dateStyle: 'short', 
                                        timeStyle: 'short' 
                                    }) : '-';
                                    const attendanceStatus = item.attendanceStatus || 'PENDING';
                                    const isUpdating = updatingAttendance[userId];

                                    return (
                                        <TableRow key={item.id || item.userId} className="hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors">
                                            <TableCell className="text-black dark:text-white font-medium">
                                                <div className="flex items-center gap-3">
                                                    {avatarUrl ? (
                                                        <img 
                                                            src={avatarUrl} 
                                                            alt={name} 
                                                            className="w-8 h-8 rounded-full object-cover border-2 border-indigo-500"
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                                                <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                    {name}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-gray-500 dark:text-slate-400">{email}</TableCell>
                                            <TableCell className="text-gray-500 dark:text-slate-400">{phone}</TableCell>
                                            <TableCell className="text-gray-500 dark:text-slate-400">{joinedAt}</TableCell>
                                            <TableCell className="text-gray-500 dark:text-slate-400">
                                                <span className="text-xs">{checkInTime}</span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="relative inline-block">
                                                    <select
                                                        value={attendanceStatus}
                                                        onChange={(e) => handleAttendanceChange(userId, e.target.value)}
                                                        disabled={isUpdating}
                                                        className={`appearance-none px-3 py-1.5 pr-8 rounded-md text-xs font-semibold border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                                                            attendanceStatus === 'PENDING' 
                                                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700' 
                                                                : attendanceStatus === 'PRESENT'
                                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700'
                                                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700'
                                                        }`}
                                                    >
                                                        <option value="PENDING">PENDING</option>
                                                        <option value="PRESENT">PRESENT</option>
                                                        <option value="ABSENT">ABSENT</option>
                                                    </select>
                                                    <ChevronDownIcon className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-current" />
                                                    {isUpdating && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 rounded-md">
                                                            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge color={item.isActive !== false ? 'emerald' : 'rose'} className="rounded-md">
                                                    {item.isActive !== false ? 'Active' : 'Left'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                    )}
            </Card>
        </div>
    );
};

export default ParticipantsPage;
