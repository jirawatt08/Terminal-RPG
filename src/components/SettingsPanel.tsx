import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useCombatContext } from '../context/CombatContext';
import { Save, Download, Upload, X, LogOut, Trash2, Settings, Cloud } from 'lucide-react';

export const SettingsPanel: React.FC = () => {
    const { 
        player, setPlayer, actions: playerActions 
    } = usePlayer();
    const { 
        actions: combatActions 
    } = useCombatContext();

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleExport = () => {
        playerActions.exportSave();
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            playerActions.importSave(content);
        };
        reader.readAsText(file);
        // Reset input
        e.target.value = '';
    };

    const toggleReduceUi = () => {
        setPlayer((prev: any) => ({
            ...prev,
            settings: { ...prev.settings, reduceUi: !prev.settings.reduceUi }
        }));
    };

    const cycleBarMode = () => {
        setPlayer((prev: any) => {
            const current = prev.settings.barMode;
            const next = current === 'bar' ? 'number' : current === 'number' ? 'percent' : 'bar';
            return {
                ...prev,
                settings: { ...prev.settings, barMode: next }
            };
        });
    };

    return (
        <div className="flex-1 flex flex-col bg-black overflow-hidden border border-[#00ff00]/20 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center p-4 border-b border-[#00ff00]/20 bg-[#00ff00]/5">
                <h2 className="text-sm font-bold tracking-[0.3em] text-[#00ff00] uppercase flex items-center gap-2">
                    <Settings size={16} /> System_Configuration
                </h2>
                <button 
                    onClick={combatActions.stopAction}
                    className="text-[#00ff00]/40 hover:text-red-500 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-[#00ff00]/10">
                {/* Interface Settings */}
                <section className="space-y-4">
                    <h3 className="text-xs font-bold text-[#00ff00]/60 uppercase tracking-widest border-l-2 border-[#00ff00]/40 pl-2">Interface_Params</h3>
                    <div className="space-y-4 p-4 border border-[#00ff00]/10 rounded-sm">
                        <div className="flex justify-between items-center">
                            <div className="text-xs uppercase font-bold text-[#00ff00]/80">Status Bar Display</div>
                            <button
                                onClick={cycleBarMode}
                                className="px-4 py-1 border border-[#00ff00] text-[#00ff00] bg-[#00ff00]/10 text-[10px] font-bold transition-colors uppercase"
                            >
                                {player.settings.barMode}
                            </button>
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="text-xs uppercase font-bold text-[#00ff00]/80">Minimalist UI</div>
                            <button
                                onClick={toggleReduceUi}
                                className={`px-4 py-1 border text-[10px] font-bold transition-colors uppercase ${player.settings.reduceUi ? 'border-[#00ff00] text-[#00ff00] bg-[#00ff00]/10' : 'border-gray-600 text-gray-500 hover:border-gray-400'}`}
                            >
                                {player.settings.reduceUi ? 'ON' : 'OFF'}
                            </button>
                        </div>
                    </div>
                </section>

                {/* Data Persistence */}
                <section className="space-y-4">
                    <h3 className="text-xs font-bold text-[#00ff00]/60 uppercase tracking-widest border-l-2 border-[#00ff00]/40 pl-2">Data_Persistence</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button 
                            onClick={playerActions.manualSave}
                            className="flex items-center justify-between p-4 border border-[#00ff00]/30 bg-[#00ff00]/2 hover:bg-[#00ff00]/10 transition-all group"
                        >
                            <div className="text-left">
                                <div className="text-xs font-bold uppercase group-hover:text-[#00ff00]">Cloud_Sync</div>
                                <div className="text-[10px] text-[#00ff00]/40 uppercase">Update remote profile</div>
                            </div>
                            <Cloud size={18} className="text-[#00ff00]/40 group-hover:text-[#00ff00]" />
                        </button>
                        
                        <button 
                            onClick={playerActions.saveToLocal}
                            className="flex items-center justify-between p-4 border border-cyan-500/30 bg-cyan-500/2 hover:bg-cyan-500/10 transition-all group"
                        >
                            <div className="text-left">
                                <div className="text-xs font-bold uppercase group-hover:text-cyan-400">Local_Cache</div>
                                <div className="text-[10px] text-cyan-500/40 uppercase">Save to browser storage</div>
                            </div>
                            <Save size={18} className="text-cyan-500/40 group-hover:text-cyan-400" />
                        </button>

                        <button 
                            onClick={handleExport}
                            className="flex items-center justify-between p-4 border border-yellow-500/30 bg-yellow-500/2 hover:bg-yellow-500/10 transition-all group"
                        >
                            <div className="text-left">
                                <div className="text-xs font-bold uppercase group-hover:text-yellow-400">Export_Log</div>
                                <div className="text-[10px] text-yellow-500/40 uppercase">Download .json backup</div>
                            </div>
                            <Download size={18} className="text-yellow-500/40 group-hover:text-yellow-400" />
                        </button>

                        <button 
                            onClick={handleImportClick}
                            className="flex items-center justify-between p-4 border border-purple-500/30 bg-purple-500/2 hover:bg-purple-500/10 transition-all group cursor-pointer"
                        >
                            <div className="text-left">
                                <div className="text-xs font-bold uppercase group-hover:text-purple-400">Import_Log</div>
                                <div className="text-[10px] text-purple-500/40 uppercase">Upload .json backup</div>
                            </div>
                            <Upload size={18} className="text-purple-500/40 group-hover:text-purple-400" />
                            <input type="file" ref={fileInputRef} accept=".json" onChange={handleFileChange} className="hidden" />
                        </button>
                    </div>
                </section>

                {/* Account Security */}
                <section className="space-y-4">
                    <h3 className="text-xs font-bold text-red-500/60 uppercase tracking-widest border-l-2 border-red-500/40 pl-2">Security_Sector</h3>
                    <div className="space-y-4">
                        <button 
                            onClick={playerActions.logout}
                            className="w-full flex items-center justify-between p-4 border border-red-500/30 bg-red-500/2 hover:bg-red-500/10 transition-all group"
                        >
                            <div className="text-left">
                                <div className="text-xs font-bold uppercase group-hover:text-red-400">Terminate_Session</div>
                                <div className="text-[10px] text-red-500/40 uppercase">Logout from profile</div>
                            </div>
                            <LogOut size={18} className="text-red-500/40 group-hover:text-red-400" />
                        </button>

                        <button 
                            className="w-full flex items-center justify-between p-4 border border-gray-800 bg-gray-900/10 opacity-30 cursor-not-allowed group"
                            disabled
                        >
                            <div className="text-left">
                                <div className="text-xs font-bold uppercase">Wipe_Instance</div>
                                <div className="text-[10px] text-gray-600 uppercase">Delete all local and remote data</div>
                            </div>
                            <Trash2 size={18} className="text-gray-700" />
                        </button>
                    </div>
                </section>
            </div>

            <div className="p-4 bg-[#00ff00]/5 border-t border-[#00ff00]/20 text-[10px] text-center text-[#00ff00]/30 uppercase tracking-[0.5em]">
                Terminal OS v3.0 // Ready_
            </div>
        </div>
    );
};
