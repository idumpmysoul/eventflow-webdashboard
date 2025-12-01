import React, { useState } from 'react';
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

const SpotSidebar = ({ spots, onDelete, onUpdate, onClose, onAddRequest }) => {
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', description: '', type: 'OTHER' });

    const startEdit = (spot) => {
        setEditingId(spot.id);
        setEditForm({ name: spot.name, description: spot.description || '', type: spot.type });
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
        <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full shadow-xl animate-slideInRight z-30">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <MapPinIcon className="w-5 h-5 text-green-500" />
                    Important Spots
                </h3>
                <button onClick={onClose} className="text-slate-400 hover:text-white">
                    <XMarkIcon className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-lg text-xs text-green-200 mb-4">
                    <p className="font-bold mb-1">How to add:</p>
                    Click the button below and then click anywhere on the map to place a new spot.
                </div>
                
                <button onClick={onAddRequest} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg text-sm font-bold transition-colors">
                    <PlusIcon className="w-4 h-4" /> Add New Spot
                </button>

                {spots.length === 0 ? (
                    <div className="text-center text-slate-500 py-8">
                        No spots created yet.
                    </div>
                ) : (
                    spots.map((spot) => (
                        <div key={spot.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 hover:border-slate-600 transition-all">
                            {editingId === spot.id ? (
                                <div className="space-y-3">
                                    <input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none" />
                                    <textarea value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none" rows="2" placeholder="Description..."></textarea>
                                    <select value={editForm.type} onChange={(e) => setEditForm({...editForm, type: e.target.value})} className="w-full bg-slate-950 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none">
                                        {SPOT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                    <div className="flex justify-end gap-2 mt-2">
                                        <button onClick={cancelEdit} className="p-1 text-slate-400 hover:text-white"><XMarkIcon className="w-4 h-4" /></button>
                                        <button onClick={saveEdit} className="p-1 text-green-400 hover:text-green-300"><CheckIcon className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-slate-200 truncate max-w-[120px]" title={spot.name}>
                                            {spot.name}
                                        </span>
                                        <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded text-slate-400">{spot.type}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => startEdit(spot)} className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-700 rounded transition-colors" title="Edit"><PencilSquareIcon className="w-4 h-4" /></button>
                                        <button onClick={() => onDelete(spot.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors" title="Delete"><TrashIcon className="w-4 h-4" /></button>
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

export default SpotSidebar;
