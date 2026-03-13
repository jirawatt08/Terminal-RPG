import React, { createContext, useContext, ReactNode } from 'react';
import { useLog as useLogHook } from '../hooks/useLog';

type LogContextType = ReturnType<typeof useLogHook>;

const LogContext = createContext<LogContextType | null>(null);

export function LogProvider({ children }: { children: ReactNode }) {
    const log = useLogHook();
    return (
        <LogContext.Provider value={log}>
            {children}
        </LogContext.Provider>
    );
}

export function useLog() {
    const context = useContext(LogContext);
    if (!context) throw new Error('useLog must be used within a LogProvider');
    return context;
}
