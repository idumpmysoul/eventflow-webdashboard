import React from 'react';
import { XMarkIcon, MapPinIcon, UserIcon, ClockIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

const OrganizerReportDetailModal = ({ report, aiInsights = [], onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border bg-slate-700 text-slate-300`}>
                {report.status?.replace('_', ' ')}
              </span>
              <span className="text-slate-400 text-sm flex items-center gap-1">
                <ClockIcon className="w-4 h-4" />
                {new Date(report.createdAt).toLocaleString()}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white">{report.category} Incident</h2>
            <p className="text-slate-400 text-sm mt-1">ID: {report.id}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Details */}
            <div className="space-y-6">
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <h3 className="text-indigo-400 font-semibold text-sm uppercase mb-2 flex items-center gap-2">
                  <ChatBubbleLeftRightIcon className="w-4 h-4" /> Description
                </h3>
                <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {report.description}
                </p>
                {/* Show ALL AI payloads raw, not parsed */}
                {aiInsights.length > 0 && (
                  <div className="mt-4 p-3 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
                    <p className="text-xs text-indigo-300 font-bold mb-1">AI Payload</p>
                    {aiInsights.map((insight) => (
                      <div key={insight.id} className="mb-4">
                        <div className="text-xs text-slate-300 mb-1">Model: {insight.meta?.model || 'AI'}</div>
                        <div className="text-sm text-indigo-100 whitespace-pre-line">
                          {(() => {
                            let raw = insight.aiPayload?.insight || '';
                            let parsed = null;
                            try {
                              if (raw.startsWith('```json')) raw = raw.replace(/```json|```/g, '').trim();
                              parsed = JSON.parse(raw);
                            } catch { parsed = null; }
                            if (parsed) {
                              return (
                                <div className="space-y-2">
                                  {Object.entries(parsed).map(([key, value]) => {
                                    // Custom rendering for Actions and Tags
                                    if (key.toLowerCase() === 'actions' && typeof value === 'object' && value !== null) {
                                      return (
                                        <div key={key}>
                                          <span className="font-bold text-indigo-300 capitalize">Actions:</span>
                                          <ul className="ml-4 mt-1 list-disc text-slate-100">
                                            {Object.entries(value).map(([role, action]) => (
                                              <li key={role}><span className="font-semibold text-indigo-200">{role}:</span> {action}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      );
                                    }
                                    if (key.toLowerCase() === 'tags' && Array.isArray(value)) {
                                      return (
                                        <div key={key}>
                                          <span className="font-bold text-indigo-300 capitalize">Tags:</span>
                                          <span className="text-slate-100 ml-2">{value.join(', ')}</span>
                                        </div>
                                      );
                                    }
                                    // Default rendering
                                    return (
                                      <div key={key}>
                                        <span className="font-bold text-indigo-300 capitalize">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span>
                                        <span className="text-slate-100 ml-2">{typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            }
                            return <pre className="text-xs text-indigo-100 bg-slate-900/40 p-2 rounded whitespace-pre-wrap break-words">{raw}</pre>;
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Media Gallery */}
              {report.mediaUrls && report.mediaUrls.length > 0 && (
                <div>
                  <h3 className="text-slate-400 font-semibold text-sm uppercase mb-3">Attached Media</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {report.mediaUrls.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noreferrer" className="block relative aspect-video rounded-lg overflow-hidden group">
                        <img src={url} alt="Evidence" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Right Column: Location & Reporter */}
            <div className="space-y-6">
              <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700">
                <h4 className="text-slate-500 text-xs uppercase font-bold mb-2 flex items-center gap-2">
                  <MapPinIcon className="w-4 h-4" /> Location
                </h4>
                <p className="text-white font-mono text-sm">
                  Lat: {report.latitude?.toFixed(6)}<br />
                  Lng: {report.longitude?.toFixed(6)}
                </p>
              </div>
              <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700">
                <h4 className="text-slate-500 text-xs uppercase font-bold mb-2 flex items-center gap-2">
                  <UserIcon className="w-4 h-4" /> Reporter
                </h4>
                <p className="text-white font-medium">{report.reporterName || report.reporter?.name || 'Anonymous'}</p>
                <p className="text-slate-400 text-xs">{report.reporter?.email || 'No contact info'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerReportDetailModal;
