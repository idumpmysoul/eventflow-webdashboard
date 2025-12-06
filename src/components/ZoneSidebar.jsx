
import React, { useState } from 'react';
import { 
    TrashIcon, 
    MapPinIcon, 
    SwatchIcon,
    PencilSquareIcon,
    CheckIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

const ZONE_COLORS = [
    { name: 'Red', value: '#ef4444' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Orange', value: '#f97316' },
];

const ZoneSidebar = ({ zones, onDelete, onUpdate, onClose }) => {
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', color: '' });
    const [originalData, setOriginalData] = useState(null);

    const startEdit = (zone) => {
        setEditingId(zone.id);
        const zoneData = { name: zone.name, color: zone.color };
        setEditForm(zoneData);
        setOriginalData(zoneData);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({ name: '', color: '' });
        setOriginalData(null);
    };

    const saveEdit = () => {
        if (editingId && originalData) {
            const dataToSend = {};
            
            // Hanya kirim field yang berubah
            if (editForm.name !== originalData.name) {
                dataToSend.name = editForm.name;
            }
            if (editForm.color !== originalData.color) {
                dataToSend.color = editForm.color;
            }
            
            // Kirim update jika ada perubahan
            if (Object.keys(dataToSend).length > 0) {
                onUpdate(editingId, dataToSend);
            }
            cancelEdit();
        }
    };

    return (
        <div className="w-80 bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-800 flex flex-col h-full shadow-xl animate-slideInRight z-30">
            <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                <h3 className="font-bold text-black dark:text-white flex items-center gap-2">
                    <MapPinIcon className="w-5 h-5 text-indigo-500" />
                    Zone Manager
                </h3>
                <button onClick={onClose} className="text-gray-400 dark:text-slate-400 hover:text-black dark:hover:text-white">
                    <XMarkIcon className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                <div className="bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 p-3 rounded-lg text-xs text-indigo-700 dark:text-indigo-200 mb-4">
                    <p className="font-bold mb-1">How to add:</p>
                    Use the map drawing tool to draw a polygon. It will automatically appear here.
                </div>

                {zones.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-slate-500 py-8">
                        No zones created yet.
                    </div>
                ) : (
                    zones.map((zone) => (
                        <div key={zone.id} className="bg-gray-100 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-lg p-3 hover:border-gray-300 dark:hover:border-slate-600 transition-all">
                            {editingId === zone.id ? (
                                <div className="space-y-3">
                                    <input 
                                        type="text" 
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                        className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-600 rounded px-2 py-1 text-sm text-black dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                    />
                                    <div className="flex gap-2 flex-wrap">
                                        {ZONE_COLORS.map((c) => (
                                            <button
                                                key={c.value}
                                                onClick={() => setEditForm({...editForm, color: c.value})}
                                                className={`w-5 h-5 rounded-full ${editForm.color === c.value ? 'ring-2 ring-black dark:ring-white' : ''}`}
                                                style={{ backgroundColor: c.value }}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex justify-end gap-2 mt-2">
                                        <button onClick={cancelEdit} className="p-1 text-gray-400 dark:text-slate-400 hover:text-black dark:hover:text-white"><XMarkIcon className="w-4 h-4" /></button>
                                        <button onClick={saveEdit} className="p-1 text-green-600 dark:text-green-400 hover:text-green-400 dark:hover:text-green-300"><CheckIcon className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div 
                                            className="w-3 h-3 rounded-full shadow-sm" 
                                            style={{ backgroundColor: zone.color }}
                                        />
                                        <span className="text-sm font-medium text-black dark:text-slate-200 truncate max-w-[120px]" title={zone.name}>
                                            {zone.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button 
                                            onClick={() => startEdit(zone)}
                                            className="p-1.5 text-gray-400 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-200 dark:hover:bg-slate-700 rounded transition-colors"
                                            title="Edit"
                                        >
                                            <PencilSquareIcon className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => onDelete(zone.id)}
                                            className="p-1.5 text-gray-400 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-200 dark:hover:bg-slate-700 rounded transition-colors"
                                            title="Delete"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ZoneSidebar;
