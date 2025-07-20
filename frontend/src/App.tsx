// src/App.tsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [apiStatus, setApiStatus] = useState('Connecting to API...');
  const [worlds, setWorlds] = useState([]);

  useEffect(() => {
    // Test spojení s backend API
    axios.get('http://localhost:3001/api/health')
      .then(response => {
        setApiStatus(`✅ API OK: ${response.data.message}`);
        
        // Načíst seznam světů
        return axios.get('http://localhost:3001/api/admin/worlds');
      })
      .then(response => {
        setWorlds(response.data.worlds);
      })
      .catch(error => {
        setApiStatus(`❌ API Error: ${error.message}`);
        console.error('API connection failed:', error);
      });
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <header style={{ 
        backgroundColor: '#2563eb', 
        color: 'white', 
        padding: '1rem 2rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
          🎮 Game Admin Panel
        </h1>
      </header>

      {/* Main Content */}
      <div style={{ display: 'flex' }}>
        {/* Sidebar */}
        <nav style={{ 
          width: '250px', 
          backgroundColor: 'white', 
          minHeight: 'calc(100vh - 80px)',
          padding: '1.5rem',
          boxShadow: '2px 0 4px rgba(0,0,0,0.1)'
        }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ marginBottom: '0.5rem' }}>
              <a href="#" style={{ 
                display: 'block', 
                padding: '0.75rem', 
                textDecoration: 'none', 
                color: '#374151',
                borderRadius: '0.375rem',
                backgroundColor: '#e5e7eb'
              }}>
                📊 Dashboard
              </a>
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <a href="#" style={{ 
                display: 'block', 
                padding: '0.75rem', 
                textDecoration: 'none', 
                color: '#374151',
                borderRadius: '0.375rem'
              }}>
                🌍 Světy
              </a>
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <a href="#" style={{ 
                display: 'block', 
                padding: '0.75rem', 
                textDecoration: 'none', 
                color: '#374151',
                borderRadius: '0.375rem'
              }}>
                👥 Hráči
              </a>
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <a href="#" style={{ 
                display: 'block', 
                padding: '0.75rem', 
                textDecoration: 'none', 
                color: '#374151',
                borderRadius: '0.375rem'
              }}>
                🎫 Support
              </a>
            </li>
          </ul>
        </nav>

        {/* Main Content Area */}
        <main style={{ flex: 1, padding: '2rem' }}>
          {/* API Status */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: '1rem', 
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <strong>API Status:</strong> {apiStatus}
          </div>

          {/* Worlds Section */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: '1.5rem', 
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>
                🌍 Herní světy
              </h2>
              <button style={{
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontWeight: '500'
              }}>
                ➕ Vytvořit nový svět
              </button>
            </div>

            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#f9fafb', 
              borderRadius: '0.375rem',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              {worlds.length === 0 
                ? 'Žádné světy zatím neexistují. Vytvořte první svět!' 
                : `Nalezeno ${worlds.length} světů`
              }
            </div>

            {/* Quick Stats */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginTop: '1.5rem'
            }}>
              <div style={{ 
                backgroundColor: '#dbeafe', 
                padding: '1rem', 
                borderRadius: '0.375rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1d4ed8' }}>
                  0
                </div>
                <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                  Aktivní světy
                </div>
              </div>
              
              <div style={{ 
                backgroundColor: '#dcfce7', 
                padding: '1rem', 
                borderRadius: '0.375rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a' }}>
                  0
                </div>
                <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                  Celkem hráčů
                </div>
              </div>
              
              <div style={{ 
                backgroundColor: '#fef3c7', 
                padding: '1rem', 
                borderRadius: '0.375rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#d97706' }}>
                  0
                </div>
                <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                  Otevřené tickety
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ 
            marginTop: '1.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem'
          }}>
            <button style={{
              backgroundColor: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🌍</div>
              <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Vytvořit svět</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Nastavit nový herní svět s vlastními parametry
              </div>
            </button>

            <button style={{
              backgroundColor: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>👥</div>
              <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Spravovat hráče</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Moderace, bany a správa uživatelských účtů
              </div>
            </button>

            <button style={{
              backgroundColor: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📊</div>
              <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Statistiky</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Přehledy výkonnosti a herní analytika
              </div>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;