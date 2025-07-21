// src/components/WorldMapPage.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './WorldMapPage.css';

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

interface Province {
  id: string;
  x: number;
  y: number;
  type: 'village' | 'city' | 'fortress' | 'abandoned' | 'barbarian';
  owner: string;
  name: string;
  population: number;
  alliance: string;
}

const WorldMapPage: React.FC = () => {
  const { worldId } = useParams<{ worldId: string }>();
  const navigate = useNavigate();
  
  const [world, setWorld] = useState<World | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Map state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mapPosition, setMapPosition] = useState({ x: -2000, y: -1500 }); // Centered start
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [showProvinceDetail, setShowProvinceDetail] = useState(false);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapContentRef = useRef<HTMLDivElement>(null);
  
  // Map configuration
  const GRID_SIZE = 100; // 100x100 grid
  const CELL_SIZE = 80; // Size of each cell in pixels
  
  // Generate mock provinces for demo
  const generateProvinces = (): Province[] => {
    const provinces: Province[] = [];
    const provinceTypes: Province['type'][] = ['village', 'city', 'fortress', 'abandoned', 'barbarian'];
    const playerNames = ['Hráč1', 'Hráč2', 'Hráč3', 'Barbarian', 'Opuštěno'];
    const alliances = ['Aliance Alpha', 'Aliance Beta', 'Aliance Gamma', '', ''];
    
    // Generate random provinces across the map
    for (let i = 0; i < 200; i++) {
      const x = Math.floor(Math.random() * GRID_SIZE) + 1;
      const y = Math.floor(Math.random() * GRID_SIZE) + 1;
      const type = provinceTypes[Math.floor(Math.random() * provinceTypes.length)];
      
      provinces.push({
        id: `${x}/${y}`,
        x,
        y,
        type,
        owner: type === 'barbarian' ? 'Barbarian' : 
               type === 'abandoned' ? 'Opuštěno' : 
               playerNames[Math.floor(Math.random() * 3)],
        name: `${getProvinceName(type)} [${x}|${y}]`,
        population: Math.floor(Math.random() * 10000) + 500,
        alliance: type === 'barbarian' || type === 'abandoned' ? '' : 
                 alliances[Math.floor(Math.random() * alliances.length)]
      });
    }
    
    return provinces;
  };
  
  const getProvinceName = (type: Province['type']): string => {
    const names = {
      village: ['Vesnice', 'Osada', 'Dvůr', 'Dvorec'],
      city: ['Město', 'Hrad', 'Metropole', 'Citadela'],
      fortress: ['Pevnost', 'Tvrz', 'Bastion', 'Hradba'],
      abandoned: ['Ruiny', 'Trosky', 'Opuštěné'],
      barbarian: ['Barbarská ves', 'Divocký tábor', 'Nomádi']
    };
    
    const typeNames = names[type];
    return typeNames[Math.floor(Math.random() * typeNames.length)];
  };
  
  const [provinces] = useState<Province[]>(generateProvinces());
  
  useEffect(() => {
    fetchWorldDetail();
  }, [worldId]);
  
  const fetchWorldDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/admin/worlds/${worldId}`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        setWorld(data.world);
      } else {
        setError(data.error || 'Svět nebyl nalezen');
      }
    } catch (err) {
      setError('Chyba při načítání světa');
      console.error('Error fetching world detail:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Map drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      const newPosition = {
        x: mapPosition.x + deltaX,
        y: mapPosition.y + deltaY
      };
      
      setMapPosition(newPosition);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };
  
  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };
  
  const handleCellClick = (x: number, y: number) => {
    if (!isDragging) {
      const cellId = `${x}/${y}`;
      setSelectedCell(cellId);
      
      // Check if there's a province at this location
      const province = provinces.find(p => p.x === x && p.y === y);
      if (province) {
        setSelectedProvince(province);
        setShowProvinceDetail(true);
      } else {
        setSelectedProvince(null);
        setShowProvinceDetail(false);
      }
    }
  };
  
  const handleProvinceClick = (province: Province, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDragging) {
      setSelectedProvince(province);
      setSelectedCell(province.id);
      setShowProvinceDetail(true);
    }
  };
  
  const centerMap = () => {
    const newPosition = { x: -2000, y: -1500 };
    setMapPosition(newPosition);
  };
  
  const getProvinceColor = (province: Province): string => {
    switch (province.type) {
      case 'village': return 'rgba(34, 197, 94, 0.8)'; // Green
      case 'city': return 'rgba(59, 130, 246, 0.8)'; // Blue  
      case 'fortress': return 'rgba(147, 51, 234, 0.8)'; // Purple
      case 'abandoned': return 'rgba(107, 114, 128, 0.8)'; // Gray
      case 'barbarian': return 'rgba(239, 68, 68, 0.8)'; // Red
      default: return 'rgba(156, 163, 175, 0.8)';
    }
  };
  
  const getProvinceIcon = (type: Province['type']): string => {
    switch (type) {
      case 'village': return '🏘️';
      case 'city': return '🏰';
      case 'fortress': return '⛪';
      case 'abandoned': return '🏚️';
      case 'barbarian': return '⚔️';
      default: return '📍';
    }
  };
  
  const generateMapGrid = (): JSX.Element[] => {
    const grid = [];
    for (let y = 1; y <= GRID_SIZE; y++) {
      for (let x = 1; x <= GRID_SIZE; x++) {
        const cellId = `${x}/${y}`;
        const isSelected = selectedCell === cellId;
        
        grid.push(
          <div
            key={cellId}
            className={`world-map__grid-cell ${isSelected ? 'world-map__grid-cell--selected' : ''}`}
            onClick={() => handleCellClick(x, y)}
            style={{
              left: x * CELL_SIZE,
              top: y * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE
            }}
          >
            <span className="world-map__grid-coords">{cellId}</span>
          </div>
        );
      }
    }
    return grid;
  };
  
  if (loading) {
    return (
      <div className="world-map__loading">
        <div className="world-map__loading-text">Načítání mapy světa...</div>
      </div>
    );
  }
  
  if (error || !world) {
    return (
      <div className="world-map__error">
        <h2>Chyba při načítání mapy</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/admin/worlds')} className="world-map__btn">
          Zpět na seznam světů
        </button>
      </div>
    );
  }
  
  return (
    <div className="world-map">
      <div className="world-map__overlay"></div>
      <div className="world-map__pattern"></div>
      
      <div className="world-map__container">
        {/* Header */}
        <div className="world-map__header">
          <div className="world-map__header-left">
            <h1 className="world-map__title">
              🗺️ Mapa světa: {world.name}
            </h1>
            <div className="world-map__world-info">
              <span className="world-map__info-item">
                👥 {world.currentPlayers}/{world.maxPlayers} hráčů
              </span>
              <span className="world-map__info-item">
                ⚡ Rychlost: {world.settings.speed}x
              </span>
              <span className="world-map__info-item">
                📍 Provincie: {provinces.length}
              </span>
            </div>
          </div>
          
          <div className="world-map__header-right">
            <button
              onClick={centerMap}
              className="world-map__btn world-map__btn--secondary"
            >
              🎯 Vystředit
            </button>
            <button
              onClick={() => navigate(`/admin/worlds`)}
              className="world-map__btn world-map__btn--secondary"
            >
              📋 Seznam světů
            </button>
            <button
              onClick={() => navigate('/')}
              className="world-map__btn world-map__btn--primary"
            >
              🏠 Dashboard
            </button>
          </div>
        </div>
        
        {/* Map Controls */}
        <div className="world-map__controls">
          <div className="world-map__legend">
            <div className="world-map__legend-item">
              <span className="world-map__legend-icon">🏘️</span>
              <span>Vesnice</span>
            </div>
            <div className="world-map__legend-item">
              <span className="world-map__legend-icon">🏰</span>
              <span>Města</span>
            </div>
            <div className="world-map__legend-item">
              <span className="world-map__legend-icon">⛪</span>
              <span>Pevnosti</span>
            </div>
            <div className="world-map__legend-item">
              <span className="world-map__legend-icon">🏚️</span>
              <span>Opuštěné</span>
            </div>
            <div className="world-map__legend-item">
              <span className="world-map__legend-icon">⚔️</span>
              <span>Barbarii</span>
            </div>
          </div>
        </div>
        
        {/* Map Container */}
        <div 
          ref={mapContainerRef}
          className={`world-map__map-container ${isDragging ? 'world-map__map-container--dragging' : ''}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div 
            ref={mapContentRef}
            className="world-map__map-content"
            style={{
              transform: `translate(${mapPosition.x}px, ${mapPosition.y}px)`,
              width: GRID_SIZE * CELL_SIZE + CELL_SIZE,
              height: GRID_SIZE * CELL_SIZE + CELL_SIZE
            }}
          >
            {/* Grid */}
            <div className="world-map__grid">
              {generateMapGrid()}
            </div>
            
            {/* Provinces */}
            <div className="world-map__provinces">
              {provinces.map((province) => (
                <div
                  key={province.id}
                  className={`world-map__province world-map__province--${province.type}`}
                  style={{
                    left: province.x * CELL_SIZE + CELL_SIZE/4,
                    top: province.y * CELL_SIZE + CELL_SIZE/4,
                    backgroundColor: getProvinceColor(province)
                  }}
                  onClick={(e) => handleProvinceClick(province, e)}
                  title={`${province.name} - ${province.owner}`}
                >
                  <div className="world-map__province-icon">
                    {getProvinceIcon(province.type)}
                  </div>
                  <div className="world-map__province-name">
                    {province.name.split(' ')[0]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Selected Cell Info */}
        {selectedCell && (
          <div className="world-map__selected-info">
            <strong>Vybráno:</strong> {selectedCell}
            {selectedProvince && (
              <span> - {selectedProvince.name}</span>
            )}
          </div>
        )}
        
        {/* Province Detail Modal */}
        {showProvinceDetail && selectedProvince && (
          <div className="world-map__modal-overlay" onClick={() => setShowProvinceDetail(false)}>
            <div className="world-map__modal" onClick={(e) => e.stopPropagation()}>
              <div className="world-map__modal-header">
                <h3 className="world-map__modal-title">
                  {getProvinceIcon(selectedProvince.type)} {selectedProvince.name}
                </h3>
                <button
                  onClick={() => setShowProvinceDetail(false)}
                  className="world-map__modal-close"
                >
                  ×
                </button>
              </div>
              
              <div className="world-map__modal-content">
                <div className="world-map__detail-grid">
                  <div className="world-map__detail-item">
                    <strong>Pozice:</strong> {selectedProvince.x}/{selectedProvince.y}
                  </div>
                  <div className="world-map__detail-item">
                    <strong>Typ:</strong> {selectedProvince.type}
                  </div>
                  <div className="world-map__detail-item">
                    <strong>Vlastník:</strong> {selectedProvince.owner}
                  </div>
                  <div className="world-map__detail-item">
                    <strong>Aliance:</strong> {selectedProvince.alliance || 'Žádná'}
                  </div>
                  <div className="world-map__detail-item">
                    <strong>Populace:</strong> {selectedProvince.population.toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div className="world-map__modal-actions">
                <button
                  onClick={() => setShowProvinceDetail(false)}
                  className="world-map__btn world-map__btn--secondary"
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

export default WorldMapPage;