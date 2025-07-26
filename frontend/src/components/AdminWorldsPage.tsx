// src/components/AdminWorldsPage.tsx

import React, { useState, useEffect } from 'react';
import './AdminWorldsPage.css';
import { useNavigate } from 'react-router-dom'; // ← PŘIDÁNO

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
  worldSize: string; // PŘIDÁNO: pole pro velikost světa
  speed: number;
  unitSpeed: number;
  barbarianSpawnChance: number;
  maxPlayers: number;
}

interface EditWorldForm {
  speed: number;
  unitSpeed: number;
  barbarianSpawnChance: number;
  maxPlayers: number;
}

const AdminWorldsPage: React.FC = () => {
  const navigate = useNavigate(); // ← PŘIDÁNO
  
  const [worlds, setWorlds] = useState<World[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedWorld, setSelectedWorld] = useState<World | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Stavy pro editaci
  const [editingWorld, setEditingWorld] = useState<World | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [showPauseConfirm, setShowPauseConfirm] = useState<number | null>(null);
  const [pauseLoading, setPauseLoading] = useState(false);
  const [showResumeConfirm, setShowResumeConfirm] = useState<number | null>(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [showActivateConfirm, setShowActivateConfirm] = useState<number | null>(null);
  const [activateLoading, setActivateLoading] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState<number | null>(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);
    
  const [createForm, setCreateForm] = useState<CreateWorldForm>({
    name: '',
    worldSize: '500x500', // PŘIDÁNO: výchozí velikost světa
    speed: 1.0,
    unitSpeed: 1.0,
    barbarianSpawnChance: 100,
    maxPlayers: 500
  });

  const [editForm, setEditForm] = useState<EditWorldForm>({
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

  // ← UPRAVENÁ FUNKCE - navigace v témže okně
const handleOpenWorld = (worldSlug: string) => {
  navigate(`/world/${worldSlug}`);
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
      const [width, height] = createForm.worldSize.split('x').map(Number); // PŘIDÁNO: rozdělení velikosti světa
      console.log(`📤 Vytváří se svět "${createForm.name}" s velikostí ${width}x${height}`);
      const response = await fetch('http://localhost:3001/api/admin/world/create', { // PŘIDÁNO: URL pro vytvoření světa
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      body: JSON.stringify({
        name: createForm.name,
        mapSize: {
          width: width,
          height: height
        },
        seed: Math.floor(Math.random() * 1000000), // Volitelné: náhodný seed
        settings: {
          speed: createForm.speed,
          unitSpeed: createForm.unitSpeed,
          barbarianSpawnChance: createForm.barbarianSpawnChance,
          maxPlayers: createForm.maxPlayers
        }
      })
    });

      const data = await response.json();
      console.log('📥 Response z API:', data);

      if (response.ok && data.success) {
        setSuccess(`Svět "${data.world.name}" s mapou ${width}x${height} byl vytvořen úspěšně!`); // PŘIDÁNO: úspěšná zpráva s velikostí mapy
        setShowCreateForm(false);
        setCreateForm({
          name: '',
          worldSize: '500x500', // PŘIDÁNO: reset velikosti světa
          speed: 1.0,
          unitSpeed: 1.0,
          barbarianSpawnChance: 100,
          maxPlayers: 500
        });
        fetchWorlds();
      } else {
        setError(data.error || 'Chyba při vytváření světa');
      }
    } catch (err) {
    console.error('❌ Error creating world:', err);
    setError('Chyba při vytváření světa');
  } finally {
    setCreateLoading(false);
  }
  };

  const handleEditWorld = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorld) return;

    try {
      setEditLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:3001/api/admin/worlds/${editingWorld.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: editForm
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(data.message);
        setEditingWorld(null);
        fetchWorlds();
      } else {
        setError(data.error || 'Chyba při úpravě světa');
      }
    } catch (err) {
      setError('Chyba při úpravě světa');
      console.error('Error updating world:', err);
    } finally {
      setEditLoading(false);
    }
  };

  const handlePauseWorld = async (worldId: number) => {
    try {
      setPauseLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:3001/api/admin/worlds/${worldId}/pause`, {
        method: 'PUT'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(data.message);
        setShowPauseConfirm(null);
        fetchWorlds();
      } else {
        setError(data.error || 'Chyba při pozastavování světa');
      }
    } catch (err) {
      setError('Chyba při pozastavování světa');
      console.error('Error pausing world:', err);
    } finally {
      setPauseLoading(false);
    }
  };

  const handleResumeWorld = async (worldId: number) => {
    try {
      setResumeLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:3001/api/admin/worlds/${worldId}/resume`, {
        method: 'PUT'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(data.message);
        setShowResumeConfirm(null);
        fetchWorlds();
      } else {
        setError(data.error || 'Chyba při obnovování světa');
      }
    } catch (err) {
      setError('Chyba při obnovování světa');
      console.error('Error resuming world:', err);
    } finally {
      setResumeLoading(false);
    }
  };

  const handleActivateWorld = async (worldId: number) => {
    try {
      setActivateLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:3001/api/admin/worlds/${worldId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'active'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(data.message);
        setShowActivateConfirm(null);
        fetchWorlds();
      } else {
        setError(data.error || 'Chyba při aktivaci světa');
      }
    } catch (err) {
      setError('Chyba při aktivaci světa');
      console.error('Error activating world:', err);
    } finally {
      setActivateLoading(false);
    }
  };

  const handleDeactivateWorld = async (worldId: number) => {
    try {
      setDeactivateLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:3001/api/admin/worlds/${worldId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'preparing'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(data.message);
        setShowDeactivateConfirm(null);
        fetchWorlds();
      } else {
        setError(data.error || 'Chyba při deaktivaci světa');
      }
    } catch (err) {
      setError('Chyba při deaktivaci světa');
      console.error('Error deactivating world:', err);
    } finally {
      setDeactivateLoading(false);
    }
  };

  const handleDeleteWorld = async (worldId: number) => {
    try {
      setDeleteLoading(true);
      setError(null);
        
      const response = await fetch(`http://localhost:3001/api/admin/worlds/${worldId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(data.message);
        setShowDeleteConfirm(null);
        fetchWorlds();
      } else {
        setError(data.error || 'Chyba při mazání světa');
      }
    } catch (err) {
      setError('Chyba při mazání světa');
      console.error('Error deleting world:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleShowWorldDetail = async (worldId: number) => {
    try {
      const response = await fetch(`http://localhost:3001/api/admin/worlds/${worldId}`);
      const data = await response.json();
        
      if (response.ok && data.success) {
        setSelectedWorld(data.world);
      } else {
        setError('Chyba při načítání detailu světa');
      }
    } catch (err) {
      setError('Chyba při načítání detailu světa');
      console.error('Error fetching world detail:', err);
    }
  };

  const handleShowEditForm = (world: World) => {
    setEditingWorld(world);
    setEditForm({
      speed: world.settings.speed,
      unitSpeed: world.settings.unitSpeed,
      barbarianSpawnChance: world.settings.barbarianSpawnChance,
      maxPlayers: world.settings.maxPlayers
    });
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

              {/* PŘIDÁNO: Pole pro velikost světa */}
              <div className="admin-worlds__form-group">
                <label htmlFor="worldSize">Velikost světa</label>
                <select
                  id="worldSize"
                  value={createForm.worldSize}
                  onChange={(e) => setCreateForm({...createForm, worldSize: e.target.value})}
                >
                  <option value="100x100">100x100 (Malý)</option>
                  <option value="500x500">500x500 (Střední)</option>
                  <option value="1000x1000">1000x1000 (Velký)</option>
                  <option value="2000x2000">2000x2000 (Obří)</option>
                </select>
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
                    <button
                      className="admin-worlds__card-btn"
                      onClick={() => handleShowWorldDetail(world.id)}
                    >
                      Detail
                    </button>
                    
                    {/* TLAČÍTKO "SVĚT" - naviguje na stránku světa */}
                    <button
                      className="admin-worlds__card-btn admin-worlds__card-btn--world"
                      onClick={() => handleOpenWorld(world.slug)}
                    >
                      🎮 Svět
                    </button>
                    
                    {/* Tlačítko Aktivovat pouze pro světy v přípravě */}
                    {world.status === 'preparing' && (
                      <button
                        className="admin-worlds__card-btn admin-worlds__card-btn--activate"
                        onClick={() => setShowActivateConfirm(world.id)}
                      >
                        Aktivovat
                      </button>
                    )}
                    
                    {/* Tlačítko Editovat pouze pro aktivní světy */}
                    {world.status === 'active' && (
                      <button
                        className="admin-worlds__card-btn admin-worlds__card-btn--edit"
                        onClick={() => handleShowEditForm(world)}
                      >
                        Editovat
                      </button>
                    )}
                    
                    {/* Tlačítko Do přípravy pouze pro aktivní světy */}
                    {world.status === 'active' && (
                      <button
                        className="admin-worlds__card-btn admin-worlds__card-btn--deactivate"
                        onClick={() => setShowDeactivateConfirm(world.id)}
                      >
                        Do přípravy
                      </button>
                    )}
                    
                    {/* Tlačítko Pozastavit pouze pro aktivní světy */}
                    {world.status === 'active' && (
                      <button
                        className="admin-worlds__card-btn admin-worlds__card-btn--pause"
                        onClick={() => setShowPauseConfirm(world.id)}
                      >
                        Pozastavit
                      </button>
                    )}
                    
                    {/* Tlačítko Obnovit pouze pro pozastavené světy */}
                    {world.status === 'paused' && (
                      <button
                        className="admin-worlds__card-btn admin-worlds__card-btn--resume"
                        onClick={() => setShowResumeConfirm(world.id)}
                      >
                        ▶️ Obnovit
                      </button>
                    )}
                    
                    <button
                      className="admin-worlds__card-btn admin-worlds__card-btn--danger"
                      onClick={() => setShowDeleteConfirm(world.id)}
                    >
                      Smazat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit World Modal */}
        {editingWorld && (
          <div className="admin-worlds__modal-overlay">
            <div className="admin-worlds__modal">
              <div className="admin-worlds__modal-header">
                <h3 className="admin-worlds__modal-title">Editovat svět: {editingWorld.name}</h3>
                <button
                  onClick={() => setEditingWorld(null)}
                  className="admin-worlds__modal-close"
                  disabled={editLoading}
                >
                  ×
                </button>
              </div>
              
              <div className="admin-worlds__modal-content">
                <form onSubmit={handleEditWorld}>
                  <div className="admin-worlds__form-row">
                    <div className="admin-worlds__form-group">
                      <label htmlFor="editSpeed">Rychlost hry</label>
                      <select
                        id="editSpeed"
                        value={editForm.speed}
                        onChange={(e) => setEditForm({...editForm, speed: Number(e.target.value)})}
                      >
                        <option value={0.5}>0.5x (Pomalá)</option>
                        <option value={1.0}>1.0x (Normální)</option>
                        <option value={2.0}>2.0x (Rychlá)</option>
                        <option value={5.0}>5.0x (Velmi rychlá)</option>
                      </select>
                    </div>

                    <div className="admin-worlds__form-group">
                      <label htmlFor="editUnitSpeed">Rychlost jednotek</label>
                      <select
                        id="editUnitSpeed"
                        value={editForm.unitSpeed}
                        onChange={(e) => setEditForm({...editForm, unitSpeed: Number(e.target.value)})}
                      >
                        <option value={0.5}>0.5x (Pomalá)</option>
                        <option value={1.0}>1.0x (Normální)</option>
                        <option value={2.0}>2.0x (Rychlá)</option>
                      </select>
                    </div>
                  </div>

                  <div className="admin-worlds__form-row">
                    <div className="admin-worlds__form-group">
                      <label htmlFor="editBarbarianChance">Šance na barbary (%)</label>
                      <input
                        id="editBarbarianChance"
                        type="number"
                        min="0"
                        max="100"
                        value={editForm.barbarianSpawnChance}
                        onChange={(e) => setEditForm({...editForm, barbarianSpawnChance: Number(e.target.value)})}
                      />
                    </div>

                    <div className="admin-worlds__form-group">
                      <label htmlFor="editMaxPlayers">Maximum hráčů</label>
                      <select
                        id="editMaxPlayers"
                        value={editForm.maxPlayers}
                        onChange={(e) => setEditForm({...editForm, maxPlayers: Number(e.target.value)})}
                      >
                        <option value={100}>100 hráčů</option>
                        <option value={500}>500 hráčů</option>
                        <option value={1000}>1000 hráčů</option>
                        <option value={2000}>2000 hráčů</option>
                      </select>
                    </div>
                  </div>

                  <div className="admin-worlds__modal-actions">
                    <button
                      type="button"
                      onClick={() => setEditingWorld(null)}
                      className="admin-worlds__btn admin-worlds__btn--secondary"
                      disabled={editLoading}
                    >
                      Zrušit
                    </button>
                    <button
                      type="submit"
                      className="admin-worlds__btn admin-worlds__btn--primary"
                      disabled={editLoading}
                    >
                      {editLoading ? 'Ukládá se...' : 'Uložit změny'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Activate Confirmation Modal */}
        {showActivateConfirm && (
          <div className="admin-worlds__modal-overlay">
            <div className="admin-worlds__modal">
              <div className="admin-worlds__modal-header">
                <h3 className="admin-worlds__modal-title">Aktivovat svět</h3>
                <button
                  onClick={() => setShowActivateConfirm(null)}
                  className="admin-worlds__modal-close"
                  disabled={activateLoading}
                >
                  ×
                </button>
              </div>
              
              <div className="admin-worlds__modal-content">
                <p className="admin-worlds__modal-text">
                  Opravdu chcete aktivovat svět "{worlds.find(w => w.id === showActivateConfirm)?.name}"?
                  <br /><br />
                  <strong>Svět bude spuštěn a hráči se budou moci připojit.</strong>
                </p>
              </div>
              
              <div className="admin-worlds__modal-actions">
                <button
                  onClick={() => setShowActivateConfirm(null)}
                  className="admin-worlds__btn admin-worlds__btn--secondary"
                  disabled={activateLoading}
                >
                  Zrušit
                </button>
                <button
                  onClick={() => handleActivateWorld(showActivateConfirm)}
                  className="admin-worlds__btn admin-worlds__btn--primary"
                  disabled={activateLoading}
                >
                  {activateLoading ? 'Aktivuje se...' : 'Aktivovat Svět'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Deactivate Confirmation Modal */}
        {showDeactivateConfirm && (
          <div className="admin-worlds__modal-overlay">
            <div className="admin-worlds__modal">
              <div className="admin-worlds__modal-header">
                <h3 className="admin-worlds__modal-title">Přesunout do přípravy</h3>
                <button
                  onClick={() => setShowDeactivateConfirm(null)}
                  className="admin-worlds__modal-close"
                  disabled={deactivateLoading}
                >
                  ×
                </button>
              </div>
              
              <div className="admin-worlds__modal-content">
                <p className="admin-worlds__modal-text">
                  Opravdu chcete přesunout svět "{worlds.find(w => w.id === showDeactivateConfirm)?.name}" zpět do přípravy?
                  <br /><br />
                  <strong>Svět nebude dostupný pro hráče a bude označen jako "Příprava".</strong>
                </p>
              </div>
              
              <div className="admin-worlds__modal-actions">
                <button
                  onClick={() => setShowDeactivateConfirm(null)}
                  className="admin-worlds__btn admin-worlds__btn--secondary"
                  disabled={deactivateLoading}
                >
                  Zrušit
                </button>
                <button
                  onClick={() => handleDeactivateWorld(showDeactivateConfirm)}
                  className="admin-worlds__btn admin-worlds__btn--warning"
                  disabled={deactivateLoading}
                >
                  {deactivateLoading ? 'Přesouvá se...' : 'Do přípravy'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pause Confirmation Modal */}
        {showPauseConfirm && (
          <div className="admin-worlds__modal-overlay">
            <div className="admin-worlds__modal">
              <div className="admin-worlds__modal-header">
                <h3 className="admin-worlds__modal-title">Pozastavit svět</h3>
                <button
                  onClick={() => setShowPauseConfirm(null)}
                  className="admin-worlds__modal-close"
                  disabled={pauseLoading}
                >
                  ×
                </button>
              </div>
              
              <div className="admin-worlds__modal-content">
                <p className="admin-worlds__modal-text">
                  Opravdu chcete pozastavit svět "{worlds.find(w => w.id === showPauseConfirm)?.name}"?
                  <br /><br />
                  <strong>Svět bude pozastaven a hráčům se zobrazí informační zpráva:</strong>
                  <br />
                  <em style={{color: '#a7f3d0'}}>"Svět byl z technických důvodů pozastaven. Brzy bude obnovena hra."</em>
                </p>
              </div>
              
              <div className="admin-worlds__modal-actions">
                <button
                  onClick={() => setShowPauseConfirm(null)}
                  className="admin-worlds__btn admin-worlds__btn--secondary"
                  disabled={pauseLoading}
                >
                  Zrušit
                </button>
                <button
                  onClick={() => handlePauseWorld(showPauseConfirm)}
                  className="admin-worlds__btn admin-worlds__btn--warning"
                  disabled={pauseLoading}
                >
                  {pauseLoading ? 'Pozastavuje se...' : 'Pozastavit Svět'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Resume Confirmation Modal */}
        {showResumeConfirm && (
          <div className="admin-worlds__modal-overlay">
            <div className="admin-worlds__modal">
              <div className="admin-worlds__modal-header">
                <h3 className="admin-worlds__modal-title">Obnovit svět</h3>
                <button
                  onClick={() => setShowResumeConfirm(null)}
                  className="admin-worlds__modal-close"
                  disabled={resumeLoading}
                >
                  ×
                </button>
              </div>
              
              <div className="admin-worlds__modal-content">
                <p className="admin-worlds__modal-text">
                  Opravdu chcete obnovit svět "{worlds.find(w => w.id === showResumeConfirm)?.name}"?
                  <br /><br />
                  <strong>Hra bude obnovena a hráči budou moci pokračovat.</strong>
                </p>
              </div>
              
              <div className="admin-worlds__modal-actions">
                <button
                  onClick={() => setShowResumeConfirm(null)}
                  className="admin-worlds__btn admin-worlds__btn--secondary"
                  disabled={resumeLoading}
                >
                  Zrušit
                </button>
                <button
                  onClick={() => handleResumeWorld(showResumeConfirm)}
                  className="admin-worlds__btn admin-worlds__btn--primary"
                  disabled={resumeLoading}
                >
                  {resumeLoading ? 'Obnovuje se...' : 'Obnovit Svět'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="admin-worlds__modal-overlay">
            <div className="admin-worlds__modal">
              <h3 className="admin-worlds__modal-title">Potvrzení smazání</h3>
              <p className="admin-worlds__modal-text">
                Opravdu chcete smazat svět "{worlds.find(w => w.id === showDeleteConfirm)?.name}"?
                <br />
                <strong>Tato akce je nevratná!</strong>
              </p>
              <div className="admin-worlds__modal-actions">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="admin-worlds__btn admin-worlds__btn--secondary"
                  disabled={deleteLoading}
                >
                  Zrušit
                </button>
                <button
                  onClick={() => handleDeleteWorld(showDeleteConfirm)}
                  className="admin-worlds__btn admin-worlds__btn--danger"
                  disabled={deleteLoading}
                >
                  {deleteLoading ? 'Maže se...' : 'Smazat Svět'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* World Detail Modal */}
        {selectedWorld && (
          <div className="admin-worlds__modal-overlay">
            <div className="admin-worlds__modal admin-worlds__modal--large">
              <div className="admin-worlds__modal-header">
                <h3 className="admin-worlds__modal-title">Detail světa: {selectedWorld.name}</h3>
                <button
                  onClick={() => setSelectedWorld(null)}
                  className="admin-worlds__modal-close"
                >
                  ×
                </button>
              </div>
                
              <div className="admin-worlds__modal-content">
                <div className="admin-worlds__detail-grid">
                  <div className="admin-worlds__detail-section">
                    <h4>Základní informace</h4>
                    <div className="admin-worlds__detail-item">
                      <strong>ID:</strong> {selectedWorld.id}
                    </div>
                    <div className="admin-worlds__detail-item">
                      <strong>Název:</strong> {selectedWorld.name}
                    </div>
                    <div className="admin-worlds__detail-item">
                      <strong>Slug:</strong> {selectedWorld.slug}
                    </div>
                    <div className="admin-worlds__detail-item">
                      <strong>Status:</strong>
                      <span className={`admin-worlds__status ${getStatusClass(selectedWorld.status)}`}>
                        {getStatusText(selectedWorld.status)}
                      </span>
                    </div>
                    <div className="admin-worlds__detail-item">
                      <strong>Vytvořen:</strong> {formatDate(selectedWorld.createdAt)}
                    </div>
                  </div>

                  <div className="admin-worlds__detail-section">
                    <h4>Statistiky</h4>
                    <div className="admin-worlds__detail-item">
                      <strong>Hráči:</strong> {selectedWorld.currentPlayers} / {selectedWorld.maxPlayers}
                    </div>
                    <div className="admin-worlds__detail-item">
                      <strong>Obsazenost:</strong> {((selectedWorld.currentPlayers / selectedWorld.maxPlayers) * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div className="admin-worlds__detail-section">
                    <h4>Herní nastavení</h4>
                    <div className="admin-worlds__detail-item">
                      <strong>Rychlost hry:</strong> {selectedWorld.settings.speed}x
                    </div>
                    <div className="admin-worlds__detail-item">
                      <strong>Rychlost jednotek:</strong> {selectedWorld.settings.unitSpeed}x
                    </div>
                    <div className="admin-worlds__detail-item">
                      <strong>Šance na barbary:</strong> {selectedWorld.settings.barbarianSpawnChance}%
                    </div>
                    <div className="admin-worlds__detail-item">
                      <strong>Maximum hráčů:</strong> {selectedWorld.settings.maxPlayers}
                    </div>
                  </div>
                </div>
              </div>
                
              <div className="admin-worlds__modal-actions">
                <button
                  onClick={() => setSelectedWorld(null)}
                  className="admin-worlds__btn admin-worlds__btn--secondary"
                >
                  Zavřít
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminWorldsPage;