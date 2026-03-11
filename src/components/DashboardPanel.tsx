import React, { useEffect, useState } from 'react';
import { Trophy, Clock, User, ArrowLeft, Skull, Target, Zap, FileText } from 'lucide-react';
import { getGlobalRecords, isFirebaseConfigured } from '../services/firebase';
import { RebornRecord } from '../types';
import { PATCH_NOTES } from '../constants/patchNotes';

interface DashboardPanelProps {
    onClose: () => void;
    localRecords: RebornRecord[];
    initialView?: 'GLOBAL' | 'LOCAL' | 'PATCHES';
}

export const DashboardPanel: React.FC<DashboardPanelProps> = ({ onClose, localRecords, initialView }) => {
    const [records, setRecords] = useState<RebornRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<'GLOBAL' | 'LOCAL' | 'PATCHES'>(initialView || 'GLOBAL');

    useEffect(() => {
        if (!isFirebaseConfigured) {
            setView('LOCAL');
            setLoading(false);
            return;
        }
        const fetchRecords = async () => {
            try {
                const data = await getGlobalRecords(50);
                setRecords(data as RebornRecord[]);
            } catch (err: any) {
                setError(err.message || "Failed to load records.");
            } finally {
                setLoading(false);
            }
        };
        fetchRecords();
    }, []);

    return (
        <div className="flex flex-col h-full bg-[#050505] text-[#00ff00] font-mono p-4">
            <div className="flex items-center justify-between mb-2 border-b border-[#00ff00]/30 pb-2">
                <h2 className="text-xl font-bold flex items-center gap-2 text-[#00ff00]">
                    <Trophy size={20} className="text-yellow-400" /> DASHBOARD
                </h2>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-[#00ff00] flex items-center gap-1 text-xs"
                >
                    <ArrowLeft size={14} /> BACK
                </button>
            </div>

            <div className="flex gap-1 mb-4 bg-[#00ff00]/5 p-1 rounded-sm">
                <button
                    onClick={() => setView('GLOBAL')}
                    className={`flex-1 py-1.5 text-[9px] font-bold border transition-all ${view === 'GLOBAL' ? 'border-[#00ff00]/40 text-[#00ff00] bg-[#00ff00]/10' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                >
                    GLOBAL RECORDS
                </button>
                <button
                    onClick={() => setView('LOCAL')}
                    className={`flex-1 py-1.5 text-[9px] font-bold border transition-all ${view === 'LOCAL' ? 'border-[#00ff00]/40 text-[#00ff00] bg-[#00ff00]/10' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                >
                    MY HISTORY
                </button>
                <button
                    onClick={() => setView('PATCHES')}
                    className={`flex-1 py-1.5 text-[9px] font-bold border transition-all ${view === 'PATCHES' ? 'border-[#00ff00]/40 text-[#00ff00] bg-[#00ff00]/10' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                >
                    PATCH NOTES
                </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#00ff00]/20 scrollbar-track-transparent pr-2">
                {view === 'PATCHES' ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {PATCH_NOTES.map((note) => (
                            <div key={note.version} className="border border-[#00ff00]/20 bg-[#111] p-4 rounded-sm">
                                <div className="flex justify-between items-center border-b border-[#00ff00]/10 pb-2 mb-3">
                                    <h3 className="text-lg font-bold text-[#00ff00]">{note.version}</h3>
                                    <span className="text-[10px] text-gray-500">{note.date}</span>
                                </div>
                                <ul className="space-y-2">
                                    {note.changes.map((change, i) => (
                                        <li key={i} className="text-xs flex gap-2">
                                            <span className="text-[#00ff00]/40 shrink-0">-</span>
                                            <span className="text-[#00ff00]/80">{change}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                ) : view === 'GLOBAL' ? (
                    !isFirebaseConfigured ? (
                        <div className="text-center text-red-500 mt-10 p-4 border border-red-500/30 bg-red-500/5 rounded-sm">
                            <div className="font-bold mb-2">FIREBASE_NOT_CONFIGURED</div>
                            <div className="text-xs text-gray-500">
                                Global features are unavailable. Switch to <span className="text-white font-bold">MY HISTORY</span> to see your local records.
                            </div>
                        </div>
                    ) : loading ? (
                        <div className="flex items-center justify-center h-32 animate-pulse text-gray-500">
                            FETCHING_GLOBAL_RECORDS...
                        </div>
                    ) : error ? (
                        <div className="text-center text-red-400 mt-10 p-4 border border-red-500/20 bg-red-500/5 rounded-sm text-xs">
                            <div className="font-bold mb-1 uppercase">DATA_LINK_FAILURE</div>
                            {error}
                        </div>
                    ) : records.length === 0 ? (
                        <div className="text-center text-gray-600 mt-10">
                            NO GLOBAL RECORDS FOUND.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {records.map((record, index) => (
                                <DashboardRecord key={record.id} record={record} index={index} />
                            ))}
                        </div>
                    )
                ) : (
                    localRecords.length === 0 ? (
                        <div className="text-center text-gray-600 mt-10">
                            NO LOCAL HISTORY FOUND. EXECUTE REBORN.EXE TO START.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {[...localRecords].reverse().map((record, index) => (
                                <DashboardRecord key={record.id} record={record} index={index} isLocal />
                            ))}
                        </div>
                    )
                )}
            </div>

            <div className="mt-4 pt-2 border-t border-[#00ff00]/10 text-[10px] text-gray-600 text-center italic">
                {view === 'GLOBAL' ? "Global records sync across all players." : "Local history persists on this device."}
            </div>
        </div>
    );
};

const DashboardRecord: React.FC<{ record: RebornRecord, index: number, isLocal?: boolean }> = ({ record, index, isLocal }) => {
    return (
        <div
            className={`border rounded-sm p-3 flex items-center gap-4 transition-colors ${isLocal ? 'border-blue-500/20 bg-blue-500/5 hover:border-blue-500/50' : 'border-[#00ff00]/20 bg-[#111] hover:border-[#00ff00]/50'}`}
        >
            <div className="text-lg font-bold text-gray-600 w-6">
                {index + 1}.
            </div>
            <div className="flex-shrink-0">
                {record.photoURL ? (
                    <img src={record.photoURL} alt="" className="w-10 h-10 rounded-full border border-[#00ff00]/30" referrerPolicy="no-referrer" />
                ) : (
                    <div className="w-10 h-10 rounded-full border border-[#00ff00]/30 flex items-center justify-center bg-gray-800">
                        <User size={20} className="text-gray-500" />
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <span className="font-bold truncate text-sm">
                        {record.displayName} {isLocal && <span className="text-[8px] text-blue-400 border border-blue-400 px-1 ml-1">YOU</span>}
                    </span>
                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                        <Clock size={10} /> {record.timestamp instanceof Date ? record.timestamp.toLocaleDateString() : (record.timestamp?.toDate ? record.timestamp.toDate().toLocaleDateString() : 'RECENT')}
                    </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                    <div className="text-[10px]">
                        <span className="text-gray-500">LV:</span> <span className="text-white">{Math.floor(record.level)}</span>
                    </div>
                    <div className="text-[10px]">
                        <span className="text-gray-500">STAGE:</span> <span className="text-yellow-400">{Math.floor(record.stage)}</span>
                    </div>
                    <div className="text-[10px]">
                        <span className="text-gray-500">GOLD:</span> <span className="text-yellow-600">{Math.floor(record.gold)}</span>
                    </div>
                    <div className="text-[10px]">
                        <span className="text-gray-500">MK:</span> <span className="text-red-400">{Math.floor(record.monstersKilled || 0)}</span>
                    </div>
                    <div className="text-[10px]">
                        <span className="text-gray-500">BK:</span> <span className="text-red-600">{Math.floor(record.bossesKilled || 0)}</span>
                    </div>
                    <div className="text-[10px]">
                        <span className="text-gray-500">REBORN:</span> <span className="text-purple-400">{Math.floor(record.rebornCount)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
