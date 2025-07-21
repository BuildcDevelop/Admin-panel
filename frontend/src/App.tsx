// src/App.tsx s React Router
import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import AdminWorldsPage from './components/AdminWorldsPage';

// Dashboard Component
function Dashboard() {
  const [apiStatus, setApiStatus] = useState('Connecting to API...');
  const [apiConnected, setApiConnected] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Test spojení s backend API
    axios.get('http://localhost:3001/api/health')
      .then(response => {
        setApiStatus(`✅ API OK: ${response.data.message}`);
        setApiConnected(true);
      })
      .catch(error => {
        setApiStatus(`❌ API Error: ${error.message}`);
        setApiConnected(false);
        console.error('API connection failed:', error);
      });
  }, []);

  return (
    <main style={{ flex: 1, padding: '2rem' }}>
      {/* API Status */}
      <div style={{ 
        backgroundColor: apiConnected ? '#dcfce7' : '#fecaca', 
        padding: '1rem', 
        borderRadius: '0.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: `2px solid ${apiConnected ? '#16a34a' : '#dc2626'}`
      }}>
        <strong>API Status:</strong> {apiStatus}
        {!apiConnected && (
          <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#dc2626' }}>
            <strong>Řešení:</strong> Ujistěte se, že backend server běží na portu 3001
            <br />
            <code style={{ 
              backgroundColor: '#f3f4f6', 
              padding: '0.25rem 0.5rem', 
              borderRadius: '0.25rem',
              fontFamily: 'monospace'
            }}>
              node index.js
            </code>
          </div>
        )}
      </div>

      {/* Welcome Dashboard */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '2rem', 
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{ 
          margin: '0 0 1rem 0', 
          fontSize: '1.75rem', 
          fontWeight: 'bold',
          color: '#111827'
        }}>
          🏰 Vítejte v Admin Panelu
        </h2>
        <p style={{ 
          color: '#6b7280', 
          marginBottom: '1.5rem',
          fontSize: '1rem',
          lineHeight: '1.6'
        }}>
          Spravujte herní světy pro vaši webovou hru inspirovanou Divokými Kmeny. 
          Vytvářejte nové světy, nastavujte parametry a sledujte statistiky.
        </p>
        
        {apiConnected ? (
          <div style={{ 
            backgroundColor: '#f0fdf4', 
            border: '1px solid #22c55e',
            borderRadius: '0.5rem',
            padding: '1rem'
          }}>
            <p style={{ 
              margin: 0, 
              color: '#15803d', 
              fontWeight: '500'
            }}>
              ✅ Připojení k API je funkční! Můžete začít spravovat světy.
            </p>
          </div>
        ) : (
          <div style={{ 
            backgroundColor: '#fef2f2', 
            border: '1px solid #ef4444',
            borderRadius: '0.5rem',
            padding: '1rem'
          }}>
            <p style={{ 
              margin: 0, 
              color: '#dc2626', 
              fontWeight: '500'
            }}>
              ❌ Nelze se připojit k API. Zkontrolujte, zda backend server běží.
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1rem'
      }}>
        <button 
          onClick={() => navigate('/admin/worlds')}
          disabled={!apiConnected}
          style={{
            backgroundColor: 'white',
            border: '2px solid #e5e7eb',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            cursor: apiConnected ? 'pointer' : 'not-allowed',
            textAlign: 'left',
            transition: 'all 0.2s',
            opacity: apiConnected ? 1 : 0.6
          }}
          onMouseOver={(e) => {
            if (apiConnected) {
              e.currentTarget.style.borderColor = '#16a34a';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌍</div>
          <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', fontSize: '1.1rem' }}>
            Spravovat Světy
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Vytvářejte a konfigurujte herní světy s vlastními parametry
          </div>
        </button>

        <div style={{
          backgroundColor: 'white',
          border: '2px solid #e5e7eb',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          opacity: 0.6
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
          <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', fontSize: '1.1rem' }}>
            Spravovat Hráče
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Moderace, bany a správa uživatelských účtů (brzy dostupné)
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          border: '2px solid #e5e7eb',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          opacity: 0.6
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
          <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', fontSize: '1.1rem' }}>
            Statistiky & Analytics
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Přehledy výkonnosti a herní analytika (brzy dostupné)
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div style={{ 
        marginTop: '2rem',
        textAlign: 'center',
        color: '#6b7280',
        fontSize: '0.875rem'
      }}>
        <p style={{ margin: 0 }}>
          Build 0.1.0 • Backend API: localhost:3001 • Frontend: React + TypeScript
        </p>
      </div>
    </main>
  );
}

// Layout with Sidebar
function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

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
          🎮 Game Admin Panel - Verven
        </h1>
      </header>

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
              <button 
                onClick={() => navigate('/')}
                style={{ 
                  width: '100%',
                  display: 'block', 
                  padding: '0.75rem', 
                  textDecoration: 'none', 
                  color: '#374151',
                  borderRadius: '0.375rem',
                  backgroundColor: location.pathname === '/' ? '#e5e7eb' : 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                📊 Dashboard
              </button>
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <button 
                onClick={() => navigate('/admin/worlds')}
                style={{ 
                  width: '100%',
                  display: 'block', 
                  padding: '0.75rem', 
                  textDecoration: 'none', 
                  color: '#374151',
                  borderRadius: '0.375rem',
                  backgroundColor: location.pathname === '/admin/worlds' ? '#e5e7eb' : 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                🌍 Světy
              </button>
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <button style={{ 
                width: '100%',
                display: 'block', 
                padding: '0.75rem', 
                textDecoration: 'none', 
                color: '#9ca3af',
                borderRadius: '0.375rem',
                border: 'none',
                textAlign: 'left',
                cursor: 'not-allowed'
              }}
              disabled
              >
                👥 Hráči (brzy)
              </button>
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <button style={{ 
                width: '100%',
                display: 'block', 
                padding: '0.75rem', 
                textDecoration: 'none', 
                color: '#9ca3af',
                borderRadius: '0.375rem',
                border: 'none',
                textAlign: 'left',
                cursor: 'not-allowed'
              }}
              disabled
              >
                🎫 Support (brzy)
              </button>
            </li>
          </ul>
        </nav>

        {children}
      </div>
    </div>
  );
}

// Main App with Router
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <Layout>
            <Dashboard />
          </Layout>
        } />
        <Route path="/admin/worlds" element={
          <Layout>
            <AdminWorldsPage />
          </Layout>
        } />
      </Routes>
    </Router>
  );
}

export default App;