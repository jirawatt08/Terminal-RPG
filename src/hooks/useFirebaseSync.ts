import React, { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { 
    auth, 
    signInWithGoogle, 
    logout as firebaseLogout, 
    savePlayerData, 
    getPlayerData, 
    isFirebaseConfigured,
    saveRebornRecord
} from '../services/firebase';
import { Player, LogType, RebornHistoryEntry } from '../types';

interface UseFirebaseSyncProps {
    player: Player;
    setPlayer: React.Dispatch<React.SetStateAction<Player>>;
    addLog: (text: string, type?: LogType) => void;
}

const findBestRun = (history: RebornHistoryEntry[]) =>
    [...history].sort((a, b) => b.stage !== a.stage ? b.stage - a.stage : b.level - a.level)[0];

export function useFirebaseSync({ player, setPlayer, addLog }: UseFirebaseSyncProps) {
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
    
    const playerRef = useRef<Player>(player);
    const lastSavedRef = useRef<string>("");

    // Load local save on initial mount
    useEffect(() => {
        const localSave = localStorage.getItem('terminal_rpg_save');
        if (localSave && !auth.currentUser) {
            try {
                const parsed = JSON.parse(localSave);
                // Don't overwrite if we have a user from auth (handled by onAuthStateChanged)
                setPlayer(prev => ({ ...prev, ...parsed, uid: undefined }));
                addLog('[SYSTEM] Local save restored.', 'success');
            } catch (e) {
                console.error("Failed to parse local save", e);
            }
        }
    }, []);

    // Keep playerRef in sync for callbacks and intervals
    useEffect(() => {
        playerRef.current = player;
    }, [player]);

    // Auto-save: Every 30 seconds
    useEffect(() => {
        const interval = setInterval(async () => {
            const currentData = JSON.stringify({
                ...playerRef.current,
                uid: playerRef.current.uid, 
                displayName: playerRef.current.displayName,
                photoURL: playerRef.current.photoURL
            });

            if (currentData !== lastSavedRef.current) {
                // Always save locally as a backup
                localStorage.setItem('terminal_rpg_save', currentData);
                
                // Save to cloud if logged in
                if (playerRef.current.uid && isFirebaseConfigured) {
                    try {
                        await savePlayerData(playerRef.current.uid, playerRef.current);
                        setLastSaveTime(new Date());
                        console.log('[SYSTEM] Cloud auto-save triggered.');
                    } catch (error) {
                        console.error('[SYSTEM] Cloud auto-save failed:', error);
                    }
                } else if (!playerRef.current.uid) {
                    setLastSaveTime(new Date());
                    console.log('[SYSTEM] Local auto-save triggered.');
                }
                lastSavedRef.current = currentData;
            }
        }, 30000); 
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!isFirebaseConfigured) {
            addLog('Cloud features disabled: Firebase not configured.', 'info');
            return;
        }
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const localHistory = playerRef.current.rebornHistory || [];
                    const cloudData = await getPlayerData(user.uid);
                    
                    if (cloudData) {
                        let repairedData = { ...cloudData };
                        let needsSave = false;

                        if (isNaN(repairedData.rebornPoints as number)) {
                            repairedData.rebornPoints = 0;
                            needsSave = true;
                            addLog('[REPAIR] Invalid Reborn Points detected and reset to 0.', 'warning');
                        }

                        // Merge histories to find the absolute best run across both local and cloud
                        const cloudHistory = repairedData.rebornHistory || [];
                        const bestRun = findBestRun([...localHistory, ...cloudHistory]);

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

                        // Sync best run to global records
                        if (bestRun) {
                            saveRebornRecord({
                                ...bestRun,
                                uid: user.uid,
                                displayName: user.displayName || 'Player',
                                photoURL: user.photoURL || ''
                            });
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
                        
                        // For a new user, sync their best local run immediately
                        if (localHistory.length > 0) {
                            const bestLocalRun = findBestRun(localHistory);
                            saveRebornRecord({
                                ...bestLocalRun,
                                uid: user.uid,
                                displayName: user.displayName || 'Player',
                                photoURL: user.photoURL || ''
                            });
                        }

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

    const login = async () => {
        if (isLoggingIn) return;
        setIsLoggingIn(true);
        try {
            await signInWithGoogle();
            setShowLoginModal(false);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Login failed.';
            if (message.includes('cancelled')) {
                addLog(message, 'warning');
            } else {
                addLog(message, 'error');
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
        const currentData = JSON.stringify({
            ...playerRef.current,
            uid: playerRef.current.uid, 
            displayName: playerRef.current.displayName,
            photoURL: playerRef.current.photoURL
        });
        
        // Always save locally
        localStorage.setItem('terminal_rpg_save', currentData);
        lastSavedRef.current = currentData;

        if (!playerRef.current.uid) {
            setLastSaveTime(new Date());
            addLog('[SYSTEM] Local manual save successful.', 'success');
            return;
        }

        try {
            await savePlayerData(playerRef.current.uid, playerRef.current);
            setLastSaveTime(new Date());
            addLog('[SYSTEM] Manual save successful. Data pushed to cloud.', 'success');
        } catch (error) {
            addLog('[SYSTEM] Manual save failed.', 'error');
        }
    };

    const saveToLocal = () => {
        const currentData = JSON.stringify({
            ...playerRef.current,
            uid: playerRef.current.uid, 
            displayName: playerRef.current.displayName,
            photoURL: playerRef.current.photoURL
        });
        
        localStorage.setItem('terminal_rpg_save', currentData);
        lastSavedRef.current = currentData;
        setLastSaveTime(new Date());
        addLog('[SYSTEM] Manual local save successful.', 'success');
    };

    const exportSave = () => {
        const dataStr = JSON.stringify({
            ...playerRef.current,
            uid: undefined,
            displayName: undefined,
            photoURL: undefined
        }, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `terminal_rpg_save_${new Date().toISOString().slice(0,10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        addLog('[SYSTEM] Save file exported successfully.', 'success');
    };

    const importSave = (jsonStr: string) => {
        try {
            const parsed = JSON.parse(jsonStr);
            // Basic validation: Check if it has essential player fields
            if (typeof parsed.level !== 'number' || typeof parsed.stats !== 'object') {
                throw new Error("Invalid save file format.");
            }

            // Prepare the new player data (preserve current auth if exists)
            const newData = {
                ...parsed,
                uid: playerRef.current.uid,
                displayName: playerRef.current.displayName,
                photoURL: playerRef.current.photoURL
            };

            setPlayer(newData);
            
            // Persist immediately
            localStorage.setItem('terminal_rpg_save', JSON.stringify(newData));
            if (newData.uid && isFirebaseConfigured) {
                savePlayerData(newData.uid, newData);
            }
            
            lastSavedRef.current = JSON.stringify(newData);
            setLastSaveTime(new Date());
            addLog('[SYSTEM] Save file imported successfully.', 'success');
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : 'Unknown error during import.';
            addLog(`[SYSTEM] Import failed: ${message}`, 'error');
            console.error("Import error:", e);
        }
    };

    return {
        isLoggingIn,
        showLoginModal,
        setShowLoginModal,
        lastSaveTime,
        login,
        logout,
        manualSave,
        saveToLocal,
        exportSave,
        importSave
    };
}
