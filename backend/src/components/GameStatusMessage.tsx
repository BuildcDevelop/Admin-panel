// src/components/GameStatusMessage.tsx
// Komponenta pro zobrazení zprávy o statusu světa na herní stránce

import React, { useState, useEffect } from 'react';

interface GameStatusMessageProps {
  worldSlug: string;
}

interface WorldStatus {
  success: boolean;
  status: 'active' | 'preparing' | 'paused' | 'ended' | 'not_found';
  name: string;
  slug: string;
  message: string;
  canPlay: boolean;
  displayMessage?: string;
  stats?: {
    currentPlayers: number;
    maxPlayers: number;
    occupancy: number;
  };
}

const GameStatusMessage: React.FC<GameStatusMessageProps> = ({ worldSlug }) => {
  const [worldStatus, setWorldStatus] = useState<WorldStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkWorldStatus = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/world/${worldSlug}/status`);
        const data = await response.json();
        setWorldStatus(data);
      } catch (error) {
        console.error('Chyba při kontrole statusu světa:', error);
        setWorldStatus({
          success: false,
          status: 'not_found',
          name: 'Neznámý svět',
          slug: worldSlug,
          message: 'Nepodařilo se načíst status světa',
          canPlay: false
        });
      } finally {
        setLoading(false);
      }
    };

    checkWorldStatus();
    
    // Kontroluj status každých 30 sekund
    const interval = setInterval(checkWorldStatus, 30000);
    
    return () => clearInterval(interval);
  }, [worldSlug]);

  if (loading) {
    return (
      <div className="game-status-loading">
        <div className="spinner"></div>
        <p>Kontrola statusu světa...</p>
      </div>
    );
  }

  if (!worldStatus || !worldStatus.success) {
    return (
      <div className="game-status-error">
        <h2>❌ Chyba</h2>
        <p>Nepodařilo se načíst informace o světě.</p>
      </div>
    );
  }

  // Pokud je svět aktivní, nezobrazuj nic (hra může běžet normálně)
  if (worldStatus.canPlay) {
    return null;
  }

  // Zobraz zprávu podle statusu
  return (
    <div className={`game-status-message game-status-message--${worldStatus.status}`}>
      <div className="game-status-content">
        {worldStatus.status === 'preparing' && (
          <>
            <h2>🚧 Svět se připravuje</h2>
            <p>{worldStatus.message}</p>
            <div className="game-status-icon">⏳</div>
          </>
        )}
        
        {worldStatus.status === 'paused' && (
          <>
            <h2>⏸️ Svět pozastaven</h2>
            <p>{worldStatus.displayMessage || worldStatus.message}</p>
            <div className="game-status-details">
              <p>Pracujeme na opravě technických problémů.</p>
              <p>Stránka se automaticky obnoví, až bude svět opět dostupný.</p>
            </div>
          </>
        )}
        
        {worldStatus.status === 'ended' && (
          <>
            <h2>🏁 Svět ukončen</h2>
            <p>{worldStatus.displayMessage || worldStatus.message}</p>
            <div className="game-status-actions">
              <button onClick={() => window.location.href = '/'}>
                Zobrazit dostupné světy
              </button>
            </div>
          </>
        )}
      </div>
      
      <style jsx>{`
        .game-status-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 200px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 12px;
          margin: 2rem;
          padding: 2rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f0f0f0;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .game-status-error {
          background: linear-gradient(135deg, #e74c3c, #c0392b);
          color: white;
          padding: 2rem;
          margin: 2rem;
          border-radius: 12px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
        }
        
        .game-status-message {
          margin: 2rem;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          animation: slideIn 0.5s ease-out;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .game-status-message--preparing {
          background: linear-gradient(135deg, #f39c12, #e67e22);
          color: white;
        }
        
        .game-status-message--paused {
          background: linear-gradient(135deg, #95a5a6, #7f8c8d);
          color: white;
        }
        
        .game-status-message--ended {
          background: linear-gradient(135deg, #34495e, #2c3e50);
          color: white;
        }
        
        .game-status-content {
          padding: 2rem;
          text-align: center;
          position: relative;
        }
        
        .game-status-content h2 {
          font-size: 1.8rem;
          margin: 0 0 1rem 0;
          font-weight: 600;
        }
        
        .game-status-content p {
          font-size: 1.1rem;
          margin: 0.5rem 0;
          line-height: 1.6;
        }
        
        .game-status-icon {
          font-size: 3rem;
          margin: 1rem 0;
          opacity: 0.8;
        }
        
        .game-status-details {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          padding: 1rem;
          margin: 1rem 0;
        }
        
        .game-status-details p {
          font-size: 0.95rem;
          margin: 0.25rem 0;
        }
        
        .game-status-actions {
          margin-top: 2rem;
        }
        
        .game-status-actions button {
          background: rgba(255, 255, 255, 0.2);
          border: 2px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .game-status-actions button:hover {
          background: rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 255, 255, 0.5);
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
};

export default GameStatusMessage;