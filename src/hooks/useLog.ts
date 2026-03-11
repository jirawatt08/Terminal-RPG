import { useState, useEffect, useRef, useCallback } from 'react';
import { LogEntry } from '../types';
import { generateId } from '../utils';

export function useLog() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);

    const addLog = useCallback((text: string, type: LogEntry['type'] = 'info') => {
        setLogs(prev => [...prev.slice(-99), { id: generateId(), timestamp: new Date(), text, type }]);
    }, []);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return {
        logs,
        addLog,
        logsEndRef
    };
}
