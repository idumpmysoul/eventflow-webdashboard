
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

const IncidentFeed = ({ reports, onIncidentSelect }) => {
    if (!reports || reports.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
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
                
                return (
                    <div 
                        key={report.id}
                        onClick={() => onIncidentSelect(report)}
                        className={`relative bg-slate-900 rounded-xl p-4 border border-slate-800 hover:bg-slate-800 transition-all cursor-pointer group overflow-hidden`}
                    >
                        {/* Severity Indicator Strip */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.bg.replace('/10', '')}`}></div>

                        <div className="flex justify-between items-start mb-2 pl-2">
                            <div className="flex items-center gap-2">
                                <span className={`p-1.5 rounded-md ${config.bg} ${config.color}`}>
                                    <Icon className="w-4 h-4" />
                                </span>
                                <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">{report.category}</span>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase ${
                                report.status === 'RESOLVED' ? 'bg-green-900/30 text-green-400 border border-green-500/20' : 
                                report.status === 'IN_PROGRESS' ? 'bg-blue-900/30 text-blue-400 border border-blue-500/20' : 
                                'bg-yellow-900/30 text-yellow-400 border border-yellow-500/20'
                            }`}>
                                {report.status?.replace('_', ' ')}
                            </span>
                        </div>

                        <p className="text-sm text-slate-200 font-medium mb-3 pl-2 line-clamp-2 group-hover:text-white transition-colors">
                            {report.description}
                        </p>

                        <div className="flex items-center justify-between text-xs text-slate-500 pl-2 mt-auto">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                    <UsersIcon className="w-3 h-3" /> {report.reporterName || report.reporter?.name || 'Unknown'}
                                </span>
                                {report.mediaUrls && report.mediaUrls.length > 0 && (
                                    <span className="text-indigo-400 flex items-center gap-1">
                                        <MapPinIcon className="w-3 h-3" /> Media
                                    </span>
                                )}
                            </div>
                            <span className="flex items-center gap-1">
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
