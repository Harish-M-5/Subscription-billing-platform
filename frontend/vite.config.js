import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Attaches an error listener to Vite's underlying proxy instance so a
// dropped connection (tab refresh, network blip - routine for a WebSocket
// proxy, not exceptional) gets logged instead of throwing an unhandled
// error that can crash the Vite dev server process itself.
function logProxyErrors(proxy, label) {
  proxy.on('error', (err) => {
    console.error(`[vite proxy:${label}] ${err.message}`);
  });
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        configure: (proxy) => logProxyErrors(proxy, 'api'),
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        configure: (proxy) => logProxyErrors(proxy, 'uploads'),
      },
      // Socket.io's real-time notification channel - `ws: true` is required
      // so Vite proxies the WebSocket upgrade request too, not just plain HTTP.
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
        configure: (proxy) => logProxyErrors(proxy, 'socket.io'),
      },
    },
  },
});
