import React, { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { 
    auth, 
    signInWithGoogle, 
    logout as firebaseLogout, 
    savePlayerData, 
    getPlayerData, 
    isFirebaseConfigured 
} from '../services/firebase';
import { Player } from '../types';

interface UseFirebaseSyncProps {
    player: Player;
    setPlayer: React.Dispatch<React.SetStateAction<Player>>;
    addLog: (text: string, type?: any) => void;
}

export function useFirebaseSync({ player, setPlayer, addLog }: UseFirebaseSyncProps) {
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
    
    const playerRef = useRef<Player>(player);
    const lastSavedRef = useRef<string>("");

    // Keep playerRef in sync for callbacks and intervals
    useEffect(() => {
        playerRef.current = player;
    }, [player]);

    useEffect(() => {
        if (!isFirebaseConfigured) {
            addLog('Cloud features disabled: Firebase not configured.', 'info');
            return;
        }
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const cloudData = await getPlayerData(user.uid);
                    if (cloudData) {
                        let repairedData = { ...cloudData };
                        let needsSave = false;

                        if (isNaN(repairedData.rebornPoints as number)) {
                            repairedData.rebornPoints = 0;
                            needsSave = true;
                            addLog('[REPAIR] Invalid Reborn Points detected and reset to 0.', 'warning');
                        }

                        // Explicit Upgrade Reset (Requested by user in previous version)
                        const baseUpgrades = {
                            atkBonus: 0, hpBonus: 0, expBonus: 0, goldBonus: 0, statBonus: 0, pointBonus: 0
                        };
                        repairedData.rebornUpgrades = baseUpgrades;
                        needsSave = true;
                        addLog('[SYSTEM] Reborn upgrades have been reset as requested.', 'info');

                        setPlayer(prev => ({
                            ...prev,
                            ...repairedData,
                            uid: user.uid,
                            displayName: user.displayName || 'Player',
                            photoURL: user.photoURL || ''
                        }));

                        if (needsSave) {
                            savePlayerData(user.uid, repairedData);
                        }

                        lastSavedRef.current = JSON.stringify(repairedData);
                        setLastSaveTime(new Date());
                        addLog(`[SYSTEM] Connection established. Welcome back, ${user.displayName}.`, 'success');
                    } else {
                        const initialData = {
                            ...playerRef.current,
                            uid: user.uid,
                            displayName: user.displayName || 'Player',
                            photoURL: user.photoURL || ''
                        };
                        await savePlayerData(user.uid, initialData);
                        setPlayer(initialData);
                        lastSavedRef.current = JSON.stringify(initialData);
                        setLastSaveTime(new Date());
                        addLog(`[SYSTEM] New profile created for ${user.displayName}.`, 'success');
                    }
                } catch (error) {
                    addLog('[SYSTEM] Failed to synchronize cloud data.', 'error');
                    console.error(error);
                }
            } else {
                setPlayer(prev => ({
                    ...prev,
                    uid: undefined,
                    displayName: undefined,
                    photoURL: undefined
                }));
                addLog('[SYSTEM] Session terminated. Offline mode active.', 'info');
            }
        });
        return () => unsubscribe();
    }, [addLog, setPlayer]);

    // Auto-save: Every 5 minutes
    useEffect(() => {
        const interval = setInterval(() => {
            if (playerRef.current.uid) {
                const currentData = JSON.stringify(playerRef.current);
                if (currentData !== lastSavedRef.current) {
                    savePlayerData(playerRef.current.uid, playerRef.current);
                    lastSavedRef.current = currentData;
                    setLastSaveTime(new Date());
                    console.log('[SYSTEM] Auto-save triggered.');
                }
            }
        }, 300000);
        return () => clearInterval(interval);
    }, []);

    const login = async () => {
        if (isLoggingIn) return;
        setIsLoggingIn(true);
        try {
            await signInWithGoogle();
            setShowLoginModal(false);
        } catch (error: any) {
            if (error.message.includes('cancelled')) {
                addLog(error.message, 'warning');
            } else {
                addLog(error.message || 'Login failed.', 'error');
            }
        } finally {
            setIsLoggingIn(false);
        }
    };

    const logout = async () => {
        try {
            await firebaseLogout();
            setShowLoginModal(false);
        } catch (error) {
            addLog('Logout failed.', 'error');
        }
    };

    const manualSave = async () => {
        if (!playerRef.current.uid) {
            addLog('Cannot save: Not logged in.', 'error');
            return;
        }
        try {
            await savePlayerData(playerRef.current.uid, playerRef.current);
            lastSavedRef.current = JSON.stringify(playerRef.current);
            setLastSaveTime(new Date());
            addLog('[SYSTEM] Manual save successful. Data pushed to cloud.', 'success');
        } catch (error) {
            addLog('[SYSTEM] Manual save failed.', 'error');
        }
    };

    return {
        isLoggingIn,
        showLoginModal,
        setShowLoginModal,
        lastSaveTime,
        login,
        logout,
        manualSave
    };
}
