import React, { createContext, useContext, useState, useCallback } from 'react';
import { nanoid } from 'nanoid';
import Toast from '../components/Toast.jsx';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const notify = useCallback((message, type = 'info', duration = 5000) => {
        const id = nanoid();
        setNotifications(prev => [...prev, { id, message, type, duration }]);
    }, []);

    const dismiss = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    return (
        <NotificationContext.Provider value={{ notify }}>
            {children}
            <div className="fixed top-5 right-5 z-[200] space-y-2">
                {notifications.map(n => (
                    <Toast key={n.id} {...n} onDismiss={() => dismiss(n.id)} />
                ))}
            </div>
        </NotificationContext.Provider>
    );
};

export const useNotifier = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error("useNotifier must be used within a NotificationProvider");
    return context;
};
