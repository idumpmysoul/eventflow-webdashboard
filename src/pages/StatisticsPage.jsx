
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import * as mockApi from '../services/mockApi.js';
import MockDataBanner from '../components/MockDataBanner.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    PieChart,
    Pie
} from 'recharts';
import { ArrowTrendingUpIcon, UserGroupIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

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
                if (isMountedRef.current) setError("Live data failed.");
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
                setReports(data);
                setLoading(false);
            } catch (err) {
                if (dataLoadedRef.current || !isMountedRef.current) return;
                clearTimeout(timeoutId);
                loadMockData();
            }
        };
        fetchData();
        return () => clearTimeout(timeoutId);
    }, [selectedEventId, navigate]);

    const stats = useMemo(() => {
        if (!reports.length) return null;

        // 1. Reports over time (simulated buckets)
        const timeData = reports.reduce((acc, r) => {
            const hour = new Date(r.createdAt).getHours();
            const label = `${hour}:00`;
            const existing = acc.find(a => a.time === label);
            if (existing) existing.count++;
            else acc.push({ time: label, count: 1 });
            return acc;
        }, []).sort((a, b) => parseInt(a.time) - parseInt(b.time));

        // 2. By Category
        const catCounts = reports.reduce((acc, r) => {
            acc[r.category] = (acc[r.category] || 0) + 1;
            return acc;
        }, {});
        const categoryData = Object.entries(catCounts).map(([name, value]) => ({ name, value }));

        // 3. By Status
        const statusCounts = reports.reduce((acc, r) => {
            acc[r.status] = (acc[r.status] || 0) + 1;
            return acc;
        }, {});
        const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name: name.replace('_', ' '), value }));

        return { timeData, categoryData, statusData, total: reports.length };
    }, [reports]);

    const COLORS = ['#6366f1', '#ec4899', '#eab308', '#22c55e'];
    
    return (
        <div className="p-6 md:p-8 h-full overflow-y-auto bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-200">
            {usingMockData && <MockDataBanner/>}
            
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-black dark:text-white">Analytics Overview</h1>
                <p className="text-gray-500 dark:text-slate-400">Real-time insights into event safety and participation.</p>
            </header>

            {loading ? (
                <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div></div>
            ) : !stats ? (
                <div className="text-center text-gray-400 dark:text-slate-500">No data available yet.</div>
            ) : (
                <div className="space-y-6">
                    {/* Top KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-xl relative overflow-hidden">
                            <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
                                <ArrowTrendingUpIcon className="w-24 h-24 text-indigo-500" />
                            </div>
                            <div className="text-gray-500 dark:text-slate-400 text-sm font-medium uppercase mb-1">Total Incidents</div>
                            <div className="text-4xl font-bold text-black dark:text-white">{stats.total}</div>
                            <div className="text-green-600 dark:text-green-400 text-sm mt-2 flex items-center gap-1">
                                <span className="bg-green-500/20 px-1.5 py-0.5 rounded">+12%</span> vs last hour
                            </div>
                        </div>
                         <div className="bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-xl relative overflow-hidden">
                             <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
                                <ShieldCheckIcon className="w-24 h-24 text-emerald-500" />
                            </div>
                            <div className="text-gray-500 dark:text-slate-400 text-sm font-medium uppercase mb-1">Resolution Rate</div>
                            <div className="text-4xl font-bold text-black dark:text-white">
                                {Math.round((reports.filter(r => r.status === 'RESOLVED').length / stats.total) * 100) || 0}%
                            </div>
                            <div className="text-gray-400 dark:text-slate-500 text-sm mt-2">
                                {reports.filter(r => r.status === 'RESOLVED').length} resolved issues
                            </div>
                        </div>
                        <div className="bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-xl relative overflow-hidden">
                            <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
                                <UserGroupIcon className="w-24 h-24 text-blue-500" />
                            </div>
                            <div className="text-gray-500 dark:text-slate-400 text-sm font-medium uppercase mb-1">Top Category</div>
                            <div className="text-4xl font-bold text-black dark:text-white truncate">
                                {stats.categoryData.sort((a,b) => b.value - a.value)[0]?.name || 'N/A'}
                            </div>
                            <div className="text-gray-400 dark:text-slate-500 text-sm mt-2">Most frequent report type</div>
                        </div>
                    </div>

                    {/* Main Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Incident Trend Area Chart */}
                        <div className="bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-xl">
                            <h3 className="text-lg font-bold text-black dark:text-white mb-6">Incident Reporting Trend</h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats.timeData}>
                                        <defs>
                                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" dark:stroke="#334155" vertical={false} />
                                        <XAxis dataKey="time" stroke="#64748b" dark:stroke="#94a3b8" tick={{fontSize: 12}} />
                                        <YAxis stroke="#64748b" dark:stroke="#94a3b8" tick={{fontSize: 12}} />
                                        <Tooltip 
                                            contentStyle={{backgroundColor: '#fff', color: '#000', borderColor: '#e5e7eb'}} 
                                            itemStyle={{color: '#000'}}
                                            wrapperStyle={{backgroundColor: 'var(--tw-bg-opacity,1)'}}
                                        />
                                        <Area type="monotone" dataKey="count" stroke="#6366f1" fillOpacity={1} fill="url(#colorCount)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Category Bar Chart */}
                        <div className="bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-xl">
                            <h3 className="text-lg font-bold text-black dark:text-white mb-6">Reports by Category</h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.categoryData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" dark:stroke="#334155" horizontal={false} />
                                        <XAxis type="number" stroke="#64748b" dark:stroke="#94a3b8" />
                                        <YAxis dataKey="name" type="category" width={100} stroke="#94a3b8" />
                                        <Tooltip cursor={{fill: '#334155', opacity: 0.2}} contentStyle={{backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff'}} />
                                        <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]}>
                                            {stats.categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatisticsPage;
