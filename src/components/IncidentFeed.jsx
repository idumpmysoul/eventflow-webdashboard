import React from 'react';
import { 
    ShieldExclamationIcon, 
    UsersIcon, 
    WrenchScrewdriverIcon, 
    QuestionMarkCircleIcon,
    ClockIcon,
    MapPinIcon
} from '@heroicons/react/24/outline';

const categoryConfig = {
    'SECURITY': { icon: ShieldExclamationIcon, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500' },
    'CROWD': { icon: UsersIcon, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500' },
    'FACILITY': { icon: WrenchScrewdriverIcon, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500' },
    'OTHER': { icon: QuestionMarkCircleIcon, color: 'text-slate-400', bg: 'bg-slate-700/50', border: 'border-slate-600' }
};

const timeAgo = (date) => {
    if (!date) return "Just now";
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString();
};

const IncidentFeed = ({ reports, onIncidentSelect, aiInsights = [] }) => {
    if (!reports || reports.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-slate-500">
                <ShieldExclamationIcon className="w-12 h-12 mb-2 opacity-20" />
                <p className="text-sm">No incidents reported</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 pb-4">
            {reports.map((report) => {
                const config = categoryConfig[report.category] || categoryConfig.OTHER;
                const Icon = config.icon;
                // Find AI summary for this report
                const insight = Array.isArray(aiInsights)
                  ? aiInsights.find(i => i.reportId === report.id)
                  : null;
                let parsed = null;
                let raw = insight?.aiPayload?.insight || '';
                if (insight) {
                  try {
                    if (raw.startsWith('```json')) raw = raw.replace(/```json|```/g, '').trim();
                    parsed = JSON.parse(raw);
                  } catch { parsed = null; }
                }
                return (
                    <div 
                        key={report.id}
                        onClick={() => {
                            if (typeof onIncidentSelect === 'function') {
                                console.log('IncidentFeed: report clicked', report);
                                onIncidentSelect(report);
                            }
                        }}
                        className={`relative bg-gray-100 dark:bg-slate-900 rounded-xl p-4 border border-gray-200 dark:border-slate-800 hover:bg-gray-200 dark:hover:bg-slate-800 transition-all cursor-pointer group overflow-hidden`}
                    >
                        {/* Severity Indicator Strip */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.bg.replace('/10', '')}`}></div>

                        <div className="flex justify-between mb-2 pl-2">
                            <div className="flex gap-2">
                                <span className={`p-1.5 rounded-md ${config.bg} ${config.color}`}>
                                    <Icon className="w-4 h-4" />
                                </span>
                                <span className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide">{report.category}</span>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase ${
                                report.status === 'RESOLVED' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/20' : 
                                report.status === 'IN_PROGRESS' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20' : 
                                'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/20'
                            }`}>
                                {report.status?.replace('_', ' ')}
                            </span>
                        </div>

                        <p className="text-sm text-black dark:text-slate-200 font-medium mb-3 pl-2 line-clamp-2 group-hover:text-black dark:group-hover:text-white transition-colors">
                            {report.description}
                        </p>

                        {/* AI Summary (only brief) */}
                        {parsed && (
                          <div className="mb-2 pl-2 text-xs bg-indigo-100 dark:bg-indigo-900/10 rounded-lg p-2">
                            <div><span className="font-bold text-indigo-700 dark:text-indigo-300">Severity:</span> <span className="text-red-600 dark:text-red-400">{parsed.severity}</span></div>
                            <div><span className="font-bold text-indigo-700 dark:text-indigo-300">Ringkasan:</span> <span className="text-indigo-900 dark:text-indigo-100">{parsed.summary}</span></div>
                            {parsed.actions && (
                              <div>
                                <span className="font-bold text-indigo-700 dark:text-indigo-300">Tindakan:</span>
                                {parsed.actions.participant && <span className="text-indigo-900 dark:text-indigo-100 ml-1">Peserta: {parsed.actions.participant}</span>}
                                {parsed.actions.organizer && <span className="text-indigo-900 dark:text-indigo-100 ml-2">Penyelenggara: {parsed.actions.organizer}</span>}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex justify-between text-xs text-gray-500 dark:text-slate-500 pl-2 mt-auto">
                            <div className="flex gap-3">
                                <span className="flex gap-1 text-black dark:text-white">
                                    <UsersIcon className="w-3 h-3" /> {report.reporterName || report.reporter?.name || 'Unknown'}
                                </span>
                                {report.mediaUrls && report.mediaUrls.length > 0 && (
                                    <span className="text-indigo-600 dark:text-indigo-400 flex gap-1">
                                        <MapPinIcon className="w-3 h-3" /> Media
                                    </span>
                                )}
                            </div>
                            <span className="flex gap-1">
                                <ClockIcon className="w-3 h-3" /> {timeAgo(report.createdAt)}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default IncidentFeed;
