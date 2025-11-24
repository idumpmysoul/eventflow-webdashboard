import { io } from 'socket.io-client';

const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const socket = io(API_ORIGIN, {
    autoConnect: false,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
});

socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
});

socket.on('disconnect', () => {
    console.log('Socket disconnected');
});

socket.on('error', (error) => {
    console.error('Socket error:', error);
});

export default socket;