import React, { useState, useEffect } from 'react';
import { 
    TrashIcon, 
    MapPinIcon, 
    PencilSquareIcon,
    CheckIcon,
    XMarkIcon,
    PlusIcon
} from '@heroicons/react/24/outline';
import { SpotType } from '../types';

const SPOT_TYPES = Object.keys(SpotType);

const SpotSidebar = ({ spots, onDelete, onUpdate, onClose, onAddRequest, isAddingSpot }) => {
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', description: '', type: 'OTHER', customType: '' });

    const startEdit = (spot) => {
        setEditingId(spot.id);
        setEditForm({
            name: spot.name,
            description: spot.description || '',
            type: spot.type,
            customType: spot.customType || ''
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
    };

    const saveEdit = () => {
        if (editingId) {
            onUpdate(editingId, editForm);
            cancelEdit();
        }
    };
    
    return (
        <div className="w-80 bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-800 flex flex-col h-full shadow-xl animate-slideInRight z-30">
            <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                <h3 className="font-bold text-black dark:text-white flex items-center gap-2">
                    <MapPinIcon className="w-5 h-5 text-green-500" />
                    Important Spots
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                
                <button 
                    onClick={onAddRequest}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2 border rounded-lg text-sm font-bold transition-colors ${
                        isAddingSpot 
                        ? 'bg-red-100 dark:bg-red-500/10 hover:bg-red-200 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/50' 
                        : 'bg-green-100 dark:bg-green-500/10 hover:bg-green-200 dark:hover:bg-green-500/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/50'
                    }`}
                >
                    {isAddingSpot ? <XMarkIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />}
                    {isAddingSpot ? 'Cancel Adding' : 'Add New Spot'}
                </button>
                
                <div className="border-t border-gray-200 dark:border-slate-800 my-4" />

                {spots.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-slate-500 py-8">
                        No spots created yet.
                    </div>
                ) : (
                    spots.map((spot) => (
                        <div key={spot.id} className="bg-gray-100 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-lg p-3 hover:border-gray-300 dark:hover:border-slate-600 transition-all">
                            {editingId === spot.id ? (
                                <div className="space-y-3">
                                    <input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-600 rounded px-2 py-1 text-sm text-black dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none" />
                                    <textarea value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-600 rounded px-2 py-1 text-sm text-black dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none" rows="2" placeholder="Description..."></textarea>
                                    <select value={editForm.type} onChange={(e) => setEditForm({...editForm, type: e.target.value})} className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-600 rounded px-2 py-1 text-sm text-black dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none">
                                        {SPOT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                    {editForm.type === 'OTHER' && (
                                        <input
                                            type="text"
                                            value={editForm.customType}
                                            onChange={e => setEditForm({...editForm, customType: e.target.value})}
                                            className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-600 rounded px-2 py-1 text-sm text-black dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                            placeholder="Custom type (e.g. Command Post)"
                                        />
                                    )}
                                    <div className="flex justify-end gap-2 mt-2">
                                        <button onClick={cancelEdit} className="p-1 text-slate-400 hover:text-white"><XMarkIcon className="w-4 h-4" /></button>
                                        <button onClick={saveEdit} className="p-1 text-green-400 hover:text-green-300"><CheckIcon className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <span className="text-sm font-medium text-black dark:text-slate-200 truncate" title={spot.name}>
                                            {spot.name}
                                        </span>
                                        <span className="text-xs bg-gray-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-gray-500 dark:text-slate-400 flex-shrink-0">{spot.type}</span>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <button onClick={() => startEdit(spot)} className="p-1.5 text-gray-400 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-200 dark:hover:bg-slate-700 rounded transition-colors" title="Edit"><PencilSquareIcon className="w-4 h-4" /></button>
                                        <button onClick={() => onDelete(spot.id)} className="p-1.5 text-gray-400 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-200 dark:hover:bg-slate-700 rounded transition-colors" title="Delete"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-slate-800">
                <button onClick={onClose} className="w-full py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg">Close Manager</button>
            </div>
        </div>
    );
};

export default SpotSidebar;