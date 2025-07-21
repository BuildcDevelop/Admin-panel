// src/components/AdminWorldsPage.tsx
import React, { useState, useEffect } from 'react';
import './AdminWorldsPage.css';

interface World {
  id: number;
  name: string;
  slug: string;
  status: 'preparing' | 'active' | 'paused' | 'ended';
  currentPlayers: number;
  maxPlayers: number;
  createdAt: string;
  settings: {
    speed: number;
    unitSpeed: number;
    barbarianSpawnChance: number;
    maxPlayers: number;
  };
}

interface CreateWorldForm {
  name: string;
  speed: number;
  unitSpeed: number;
  barbarianSpawnChance: number;
  maxPlayers: number;
}

const AdminWorldsPage: React.FC = () => {
  const [worlds, setWorlds] = useState<World[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState<CreateWorldForm>({
    name: '',
    speed: 1.0,
    unitSpeed: 1.0,
    barbarianSpawnChance: 100,
    maxPlayers: 500
  });

  // Načítání světů při spuštění
  useEffect(() => {
    fetchWorlds();
  }, []);

  const fetchWorlds = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/admin/worlds');
      const data = await response.json();
      setWorlds(data.worlds || []);
    } catch (err) {
      setError('Chyba při načítání světů');
      console.error('Error fetching worlds:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorld = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createForm.name.trim()) {
      setError('Název světa je povinný');
      return;
    }

    try {
      setCreateLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:3001/api/admin/worlds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: createForm.name,
          settings: {
            speed: createForm.speed,
            unitSpeed: createForm.unitSpeed,
            barbarianSpawnChance: createForm.barbarianSpawnChance,
            maxPlayers: createForm.maxPlayers
          }
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(data.message);
        setShowCreateForm(false);
        setCreateForm({
          name: '',
          speed: 1.0,
          unitSpeed: 1.0,
          barbarianSpawnChance: 100,
          maxPlayers: 500
        });
        
        // Aktualizace seznamu světů
        fetchWorlds();
      } else {
        setError(data.error || 'Chyba při vytváření světa');
      }
    } catch (err) {
      setError('Chyba při vytváření světa');
      console.error('Error creating world:', err);
    } finally {
      setCreateLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktivní';
      case 'preparing': return 'Příprava';
      case 'paused': return 'Pozastavený';
      case 'ended': return 'Ukončený';
      default: return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'active': return 'admin-worlds__status--active';
      case 'preparing': return 'admin-worlds__status--preparing';
      case 'paused': return 'admin-worlds__status--paused';
      case 'ended': return 'admin-worlds__status--ended';
      default: return '';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('cs-CZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="admin-worlds">
      <div className="admin-worlds__overlay"></div>
      <div className="admin-worlds__pattern"></div>
      
      <div className="admin-worlds__container">
        {/* Header */}
        <div className="admin-worlds__header">
          <h1 className="admin-worlds__title">
            <span style={{fontSize: '2rem'}}>🌍</span>
            Správa Herních Světů
          </h1>
          <p className="admin-worlds__subtitle">
            Vytvářejte a spravujte herní světy pro Verven
          </p>
        </div>

        {/* Error/Success messages */}
        {error && (
          <div className="admin-worlds__message admin-worlds__message--error">
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}
        
        {success && (
          <div className="admin-worlds__message admin-worlds__message--success">
            {success}
            <button onClick={() => setSuccess(null)}>×</button>
          </div>
        )}

        {/* Create World Button */}
        <div className="admin-worlds__actions">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="admin-worlds__create-btn"
          >
            <span style={{fontSize: '1.25rem'}}>➕</span>
            Vytvořit Nový Svět
          </button>
        </div>

        {/* Create World Form */}
        {showCreateForm && (
          <div className="admin-worlds__create-form">
            <h3 className="admin-worlds__form-title">Vytvořit Nový Svět</h3>
            
            <form onSubmit={handleCreateWorld}>
              <div className="admin-worlds__form-group">
                <label htmlFor="worldName">Název světa</label>
                <input
                  id="worldName"
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                  placeholder="Například: Severní Království"
                  required
                />
              </div>

              <div className="admin-worlds__form-row">
                <div className="admin-worlds__form-group">
                  <label htmlFor="speed">Rychlost hry</label>
                  <select
                    id="speed"
                    value={createForm.speed}
                    onChange={(e) => setCreateForm({...createForm, speed: Number(e.target.value)})}
                  >
                    <option value={0.5}>0.5x (Pomalá)</option>
                    <option value={1.0}>1.0x (Normální)</option>
                    <option value={2.0}>2.0x (Rychlá)</option>
                    <option value={5.0}>5.0x (Velmi rychlá)</option>
                  </select>
                </div>

                <div className="admin-worlds__form-group">
                  <label htmlFor="unitSpeed">Rychlost jednotek</label>
                  <select
                    id="unitSpeed"
                    value={createForm.unitSpeed}
                    onChange={(e) => setCreateForm({...createForm, unitSpeed: Number(e.target.value)})}
                  >
                    <option value={0.5}>0.5x (Pomalá)</option>
                    <option value={1.0}>1.0x (Normální)</option>
                    <option value={2.0}>2.0x (Rychlá)</option>
                  </select>
                </div>
              </div>

              <div className="admin-worlds__form-row">
                <div className="admin-worlds__form-group">
                  <label htmlFor="barbarianChance">Šance na barbary (%)</label>
                  <input
                    id="barbarianChance"
                    type="number"
                    min="0"
                    max="100"
                    value={createForm.barbarianSpawnChance}
                    onChange={(e) => setCreateForm({...createForm, barbarianSpawnChance: Number(e.target.value)})}
                  />
                </div>

                <div className="admin-worlds__form-group">
                  <label htmlFor="maxPlayers">Maximum hráčů</label>
                  <select
                    id="maxPlayers"
                    value={createForm.maxPlayers}
                    onChange={(e) => setCreateForm({...createForm, maxPlayers: Number(e.target.value)})}
                  >
                    <option value={100}>100 hráčů</option>
                    <option value={500}>500 hráčů</option>
                    <option value={1000}>1000 hráčů</option>
                    <option value={2000}>2000 hráčů</option>
                  </select>
                </div>
              </div>

              <div className="admin-worlds__form-actions">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="admin-worlds__btn admin-worlds__btn--secondary"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="admin-worlds__btn admin-worlds__btn--primary"
                >
                  {createLoading ? 'Vytváří se...' : 'Vytvořit Svět'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Worlds List */}
        <div className="admin-worlds__list">
          <h2 className="admin-worlds__list-title">Existující Světy</h2>
          
          {loading ? (
            <div className="admin-worlds__loading">
              Načítání světů...
            </div>
          ) : worlds.length === 0 ? (
            <div className="admin-worlds__empty">
              <span style={{fontSize: '3rem', opacity: 0.3}}>🌍</span>
              <p>Zatím nebyly vytvořeny žádné světy</p>
            </div>
          ) : (
            <div className="admin-worlds__grid">
              {worlds.map((world) => (
                <div key={world.id} className="admin-worlds__card">
                  <div className="admin-worlds__card-header">
                    <h3 className="admin-worlds__card-title">{world.name}</h3>
                    <span className={`admin-worlds__status ${getStatusClass(world.status)}`}>
                      {getStatusText(world.status)}
                    </span>
                  </div>
                  
                  <div className="admin-worlds__card-info">
                    <div className="admin-worlds__info-item">
                      <span style={{fontSize: '1rem'}}>👥</span>
                      <span>{world.currentPlayers} / {world.maxPlayers} hráčů</span>
                    </div>
                    
                    <div className="admin-worlds__info-item">
                      <span style={{fontSize: '1rem'}}>🕐</span>
                      <span>Vytvořen: {formatDate(world.createdAt)}</span>
                    </div>
                    
                    <div className="admin-worlds__info-item">
                      <span style={{fontSize: '1rem'}}>⚙️</span>
                      <span>Rychlost: {world.settings.speed}x</span>
                    </div>
                  </div>
                  
                  <div className="admin-worlds__card-actions">
                    <button className="admin-worlds__card-btn">
                      Upravit
                    </button>
                    <button className="admin-worlds__card-btn admin-worlds__card-btn--danger">
                      Smazat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminWorldsPage;