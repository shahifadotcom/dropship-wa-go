// Centralized WhatsApp Bridge endpoints
// Uses dev proxy in Vite for local development

const isBrowser = typeof window !== 'undefined';
const host = isBrowser ? window.location.hostname : '';

// Detect local/dev by common hosts
const isDevHost = host === 'localhost' || host === '127.0.0.1' || host === '';

export const BRIDGE_HTTP = isDevHost ? '/wa' : 'http://161.97.169.64/wa';
// Direct port fallback for environments without Nginx path
export const BRIDGE_HTTP_FALLBACK = 'http://161.97.169.64:3001';

export const BRIDGE_WS = isDevHost ? 'ws://localhost:3001' : 'ws://161.97.169.64:3001';
