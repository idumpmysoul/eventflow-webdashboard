
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import * as mockApi from '../services/mockApi.js';
import MockDataBanner from '../components/MockDataBanner.jsx';
import { Card, Title, Text, Grid, Col, BarChart, DonutChart, Metric } from '@tremor/react';
import { useAuth } from '../contexts/AuthContext.jsx';

const MOCK_DATA_TIMEOUT = 5000;

const StatisticsPage = () => {
    const { selectedEventId } = useAuth();
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
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
            console.warn("Falling back to mock statistics data.");
            setUsingMockData(true);
            try {
                const mockReports = await mockApi.getReports();
                if (isMountedRef.current) setReports(mockReports);
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
                const data = await api.getReports(selectedEventId);
                
                if (dataLoadedRef.current || !isMountedRef.current) return;
                clearTimeout(timeoutId);
                dataLoadedRef.current = true;
                
                setReports(data.data || data);
                setLoading(false);
            } catch (err) {
                if (dataLoadedRef.current || !isMountedRef.current) return;
                clearTimeout(timeoutId);
                console.error("Failed to fetch reports for stats:", err);
                setError(err.message);
                loadMockData();
            }
        };
        fetchData();
        return () => clearTimeout(timeoutId);
    }, [selectedEventId, navigate]);

    const { categoryData, statusData, totalReports } = useMemo(() => {
        if (!reports || !reports.length) {
            return { categoryData: [], statusData: [], totalReports: 0 };
        }
        
        const categoryCounts = reports.reduce((acc, report) => {
            acc[report.category] = (acc[report.category] || 0) + 1;
            return acc;
        }, {});

        const statusCounts = reports.reduce((acc, report) => {
            acc[report.status] = (acc[report.status] || 0) + 1;
            return acc;
        }, {});

        const categoryData = Object.entries(categoryCounts).map(([name, value]) => ({ name, 'Number of Reports': value }));
        const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name: name.replace('_', ' '), value }));
        
        return { categoryData, statusData, totalReports: reports.length };
    }, [reports]);
    
    return (
        <div className="p-6">
            {usingMockData && <MockDataBanner/>}
            <Title className='text-2xl'>Incident Statistics</Title>

            {loading ? (
                <div className="mt-6"><Text>Loading statistics...</Text></div>
            ) : (
                 <Grid numItemsLg={3} className="gap-6 mt-6">
                    <Col numColSpanLg={2}>
                        <Card className='bg-card dark:bg-dark-card'>
                            <Title>Incidents by Category</Title>
                             <BarChart
                                className="mt-6"
                                data={categoryData}
                                index="name"
                                categories={['Number of Reports']}
                                colors={['blue']}
                                yAxisWidth={48}
                            />
                        </Card>
                    </Col>
                    <Col>
                        <Card className='bg-card dark:bg-dark-card'>
                             <Title>Incidents by Status</Title>
                             <DonutChart
                                className="mt-8"
                                data={statusData}
                                category="value"
                                index="name"
                                colors={["yellow", "blue", "emerald", "slate"]}
                            />
                        </Card>
                    </Col>
                    <Col>
                         <Card className='bg-card dark:bg-dark-card'>
                            <Text>Total Incidents Reported</Text>
                            <Metric>{totalReports}</Metric>
                        </Card>
                    </Col>
                </Grid>
            )}
        </div>
    );
};

export default StatisticsPage;
