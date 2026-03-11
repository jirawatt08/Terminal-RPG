import React, { useState } from 'react';
import { Home } from 'lucide-react';
import { BlacksmithTab } from './Village/BlacksmithTab';
import { MerchantTab } from './Village/MerchantTab';
import { AlchemistTab } from './Village/AlchemistTab';
import { QuestBoardTab } from './Village/QuestBoardTab';

export const VillagePanel: React.FC = () => {
    const [villageTab, setVillageTab] = useState<'BLACKSMITH' | 'MERCHANT' | 'ALCHEMIST' | 'QUEST_BOARD'>('BLACKSMITH');

    return (
        <div className="flex-1 p-6 overflow-y-auto flex flex-col bg-[#050505] scrollbar-thin scrollbar-thumb-[#00ff00]/10">
            <div className="flex items-center gap-3 mb-6 border-b border-[#00ff00]/20 pb-4">
                <Home className="text-yellow-600" size={20} />
                <h2 className="text-lg font-bold text-yellow-600 tracking-[0.2em] uppercase">Sector_Village</h2>
            </div>

            <div className="flex gap-1 mb-8 bg-[#00ff00]/5 p-1 rounded-sm border border-[#00ff00]/10">
                {(['BLACKSMITH', 'MERCHANT', 'ALCHEMIST', 'QUEST_BOARD'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setVillageTab(tab)}
                        className={`flex-1 py-2 text-[10px] font-bold transition-all uppercase tracking-widest ${villageTab === tab ? 'bg-yellow-600/20 text-yellow-600 border border-yellow-600/30' : 'text-[#00ff00]/40 hover:text-[#00ff00]/60 border border-transparent'}`}
                    >
                        {tab.replace('_', ' ')}
                    </button>
                ))}
            </div>

            <div className="flex-1">
                {villageTab === 'BLACKSMITH' && <BlacksmithTab />}
                {villageTab === 'MERCHANT' && <MerchantTab />}
                {villageTab === 'ALCHEMIST' && <AlchemistTab />}
                {villageTab === 'QUEST_BOARD' && <QuestBoardTab />}
            </div>
        </div>
    );
};
