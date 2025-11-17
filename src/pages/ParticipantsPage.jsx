import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
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


const ParticipantsPage = () => {
    const { selectedEventId } = useAuth();
    const navigate = useNavigate();
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!selectedEventId) {
            navigate('/events');
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await api.getEventParticipants(selectedEventId);
                setParticipants(response.data || response);
            } catch (error) {
                console.error("Failed to fetch participants:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedEventId, navigate]);

    const statusColor = {
        'Active': 'emerald',
        'Idle': 'amber',
        'Disconnected': 'rose',
    };
    
    return (
        <div className="p-6 h-full">
            <Title>Event Participants</Title>
            <Card className="mt-6 h-[calc(100%-4.5rem)]">
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
