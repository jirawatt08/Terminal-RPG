import React from 'react';
import { Settings, X, Cloud, Save } from 'lucide-react';
import { Player } from '../types';
import { savePlayerData, isFirebaseConfigured } from '../services/firebase';

interface SettingsPanelProps {
    player: Player;
    setPlayer: React.Dispatch<React.SetStateAction<Player>>;
    closeSettings: () => void;
    manualSave: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ player, setPlayer, closeSettings, manualSave }) => {
    const toggleReduceUi = () => {
        setPlayer(prev => ({
            ...prev,
            settings: { ...prev.settings, reduceUi: !prev.settings.reduceUi }
        }));
    };

    const cycleBarMode = () => {
        setPlayer(prev => {
            const current = prev.settings.barMode;
            const next = current === 'bar' ? 'number' : current === 'number' ? 'percent' : 'bar';
            return {
                ...prev,
                settings: { ...prev.settings, barMode: next }
            };
        });
    };

    return (
        <div className="flex flex-col h-full">
            <div className="bg-[#111] border-b border-[#00ff00]/30 p-3 flex justify-between items-center text-[#00ff00]">
                <div className="flex items-center gap-2 font-bold">
                    <Settings size={18} />
                    SYSTEM SETTINGS
                </div>
                <button onClick={closeSettings} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
                    <X size={18} />
                </button>
            </div>

            <div className="flex-1 p-6 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-[#00ff00]/20 scrollbar-track-transparent">
                
                <div className="space-y-4">
                    <h3 className="text-lg font-bold border-b border-gray-800 pb-2 text-gray-300">DISPLAY</h3>
                    
                    <div className="flex items-center justify-between p-3 border border-gray-800 bg-black/50 rounded-sm">
                        <div>
                            <div className="font-bold text-[#00ff00]">Reduce UI World</div>
                            <div className="text-xs text-gray-500">Simplifies the display of attributes, equipment, and character panels.</div>
                        </div>
                        <button
                            onClick={toggleReduceUi}
                            className={`px-4 py-1 border text-xs font-bold transition-colors ${player.settings.reduceUi ? 'border-[#00ff00] text-[#00ff00] bg-[#00ff00]/10' : 'border-gray-600 text-gray-500 hover:border-gray-400'}`}
                        >
                            {player.settings.reduceUi ? 'ON' : 'OFF'}
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-800 bg-black/50 rounded-sm">
                        <div>
                            <div className="font-bold text-[#00ff00]">Bar Display Mode</div>
                            <div className="text-xs text-gray-500">Changes how HP/MP bars are displayed (including monsters).</div>
                        </div>
                        <button
                            onClick={cycleBarMode}
                            className="px-4 py-1 border border-[#00ff00] text-[#00ff00] bg-[#00ff00]/10 text-xs font-bold transition-colors"
                        >
                            {player.settings.barMode.toUpperCase()}
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-bold border-b border-gray-800 pb-2 text-gray-300">GAMEPLAY</h3>
                    
                    <div className="flex items-center justify-between p-3 border border-gray-800 bg-black/50 rounded-sm">
                        <div>
                            <div className="font-bold text-[#00ff00]">Auto-Skill</div>
                            <div className="text-xs text-gray-500">Automatically cast class skill when MP is available.</div>
                        </div>
                        <button
                            onClick={() => setPlayer(p => ({ ...p, autoSkill: !p.autoSkill }))}
                            className={`px-4 py-1 border text-xs font-bold transition-colors ${player.autoSkill ? 'border-[#00ff00] text-[#00ff00] bg-[#00ff00]/10' : 'border-gray-600 text-gray-500 hover:border-gray-400'}`}
                        >
                            {player.autoSkill ? 'ON' : 'OFF'}
                        </button>
                    </div>
                </div>

                {player.uid && isFirebaseConfigured && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold border-b border-gray-800 pb-2 text-gray-300">CLOUD SAVE</h3>
                        
                        <div className="flex items-center justify-between p-3 border border-purple-500/30 bg-purple-500/5 rounded-sm">
                            <div>
                                <div className="font-bold text-purple-400 flex items-center gap-2">
                                    <Cloud size={16} /> Manual Sync
                                </div>
                                <div className="text-xs text-gray-500">Force save your current progress to the cloud.</div>
                            </div>
                            <button
                                onClick={manualSave}
                                className="px-4 py-1 border border-purple-500 text-purple-400 hover:bg-purple-500/20 text-xs font-bold transition-colors flex items-center gap-1"
                            >
                                <Save size={14} /> SAVE
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
