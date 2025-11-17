
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

                setParticipants(response.data || response);
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

    const statusColor = {
        'Active': 'emerald',
        'Idle': 'amber',
        'Disconnected': 'rose',
    };
    
    return (
        <div className="p-6 h-full flex flex-col">
            {usingMockData && <MockDataBanner />}
            <Title className='text-2xl m-auto'>Event Participants</Title>
            <Card className="mt-6 flex-grow bg-card dark:bg-dark-card rounded-xl">
                    {loading ? (
                    <div className="w-full h-full flex items-center justify-center">
                        <Text>Loading participant data...</Text>
                    </div>
                    ) : (
                    <div className="h-full overflow-y-auto">
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableHeaderCell>Name</TableHeaderCell>
                                    <TableHeaderCell>User ID</TableHeaderCell>
                                    <TableHeaderCell>Entry Time</TableHeaderCell>
                                    <TableHeaderCell>Status</TableHeaderCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {participants.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell>
                                            <Text>{item.id}</Text>
                                        </TableCell>
                                        <TableCell>
                                            <Text>{item.entryTime ? new Date(item.entryTime).toLocaleString() : 'N/A'}</Text>
                                        </TableCell>
                                        <TableCell>
                                            <Badge color={statusColor[item.status] || 'slate'}>{item.status || 'Unknown'}</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    )}
            </Card>
        </div>
    );
};

export default ParticipantsPage;
