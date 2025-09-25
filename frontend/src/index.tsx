import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { Web3Provider } from './contexts/Web3Context';
import { GameProvider } from './contexts/GameContext';
import './styles/index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <Web3Provider>
          <GameProvider>
            <App />
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#16213e',
                  color: '#fff',
                  fontFamily: 'Press Start 2P',
                  fontSize: '8px',
                  border: '2px solid #0f3460',
                },
              }}
            />
          </GameProvider>
        </Web3Provider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);