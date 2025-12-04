
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import * as mockApi from '../services/mockApi.js';
import MockDataBanner from '../components/MockDataBanner.jsx';
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

const MOCK_DATA_TIMEOUT = 5000;

const ParticipantsPage = () => {
    const { selectedEventId } = useAuth();
    const navigate = useNavigate();
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [usingMockData, setUsingMockData] = useState(false);

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

    // Sort so ORGANIZER/admin always at the top
    const sortedParticipants = [...participants].sort((a, b) => {
        const aRole = (a.user?.role || a.role || '').toLowerCase();
        const bRole = (b.user?.role || b.role || '').toLowerCase();
        if (aRole === 'organizer' && bRole !== 'organizer') return -1;
        if (aRole !== 'organizer' && bRole === 'organizer') return 1;
        return 0;
    });

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
                                    <TableHeaderCell className="text-gray-500 dark:text-slate-400">Status</TableHeaderCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sortedParticipants.map((item) => {
                                    // Handle both mock structure (direct) and real structure (nested user)
                                    const name = item.user?.name || item.name || 'Unknown';
                                    const email = item.user?.email || item.email || '-';
                                    const phone = item.user?.phoneNumber || '-';
                                    const joinedAt = item.joinedAt ? new Date(item.joinedAt).toLocaleString() : '-';

                                    return (
                                        <TableRow key={item.id || item.userId} className="hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors">
                                            <TableCell className="text-black dark:text-white font-medium">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                                                        {name.charAt(0)}
                                                    </div>
                                                    {name}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-gray-500 dark:text-slate-400">{email}</TableCell>
                                            <TableCell className="text-gray-500 dark:text-slate-400">{phone}</TableCell>
                                            <TableCell className="text-gray-500 dark:text-slate-400">{joinedAt}</TableCell>
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
