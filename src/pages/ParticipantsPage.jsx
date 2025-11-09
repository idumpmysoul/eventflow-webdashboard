import React, { useEffect, useState } from 'react';
import { getParticipants } from '../services/mockApi.js';
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

const ParticipantsPage = () => {
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const data = await getParticipants();
                setParticipants(data);
            } catch (error) {
                console.error("Failed to fetch participants:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

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
                                            <Text>{new Date(item.entryTime).toLocaleString()}</Text>
                                        </TableCell>
                                        <TableCell>
                                            <Badge color={statusColor[item.status]}>{item.status}</Badge>
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