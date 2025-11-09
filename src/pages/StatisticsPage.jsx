import React, { useEffect, useState, useMemo } from 'react';
import { getReports } from '../services/mockApi.js';
import { Card, Title, Text, Grid, Col, BarChart, DonutChart, Metric } from '@tremor/react';

const StatisticsPage = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const data = await getReports();
                setReports(data);
            } catch (error) {
                console.error("Failed to fetch reports for stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const { categoryData, statusData, totalReports } = useMemo(() => {
        if (!reports.length) {
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
            <Title>Incident Statistics</Title>

            {loading ? (
                <div className="mt-6"><Text>Loading statistics...</Text></div>
            ) : (
                 <Grid numItemsLg={3} className="gap-6 mt-6">
                    <Col numColSpanLg={2}>
                        <Card>
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
                        <Card>
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
                         <Card>
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