// frontend/src/components/WorldPage.tsx
// Vylepšená komponenta pro zobrazení interaktivní herní mapy

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './WorldPage.css';

interface MapTile {
  x: number;
  y: number;
  terrainType: 'plains' | 'forest' | 'mountain' | 'river' | 'lake';
  color: string;
}

interface WorldData {
  id: number;
  name: string;
  mapSize: {
    width: number;
    height: number;
  };
  seed: number;
}

interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

const TERRAIN_NAMES = {
  plains: 'Pláně',
  forest: 'Les',
  mountain: 'Hory',
  river: 'Řeka',
  lake: 'Jezero'
};

export default function WorldPage(): JSX.Element {
  const { worldSlug } = useParams<{ worldSlug: string }>();
  const navigate = useNavigate();

  // Stav komponenty
  const [world, setWorld] = useState<WorldData | null>(null);
  const [tiles, setTiles] = useState<MapTile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Viewport a navigace
  const [viewport, setViewport] = useState<Viewport>({
    x: 0,
    y: 0,
    width: 50,
    height: 50,
    scale: 1
  });

  // Hover stav pro zobrazení detailů dlaždice
  const [hoveredTile, setHoveredTile] = useState<MapTile | null>(null);
  const [mousePosition, setMousePosition] = useState<{x: number, y: number}>({x: 0, y: 0});

  // Drag & pan stav
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{x: number, y: number}>({x: 0, y: 0});
  const [dragOffset, setDragOffset] = useState<{x: number, y: number}>({x: 0, y: 0});

  // Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapGridRef = useRef<HTMLDivElement>(null);

  // Výpočet velikosti viewportu na základě velikosti kontejneru
  const updateViewportSize = useCallback(() => {
    if (mapContainerRef.current) {
      const rect = mapContainerRef.current.getBoundingClientRect();
      const tileSize = 20 * viewport.scale;
      const newWidth = Math.ceil(rect.width / tileSize) + 20; // Buffer 10 dlaždic na každou stranu
      const newHeight = Math.ceil(rect.height / tileSize) + 20;
      
      setViewport(prev => ({
        ...prev,
        width: Math.min(newWidth, world?.mapSize.width || 1000),
        height: Math.min(newHeight, world?.mapSize.height || 1000)
      }));
    }
  }, [viewport.scale, world?.mapSize]);

  // Načtení dat světa
  const loadWorldData = useCallback(async () => {
    if (!worldSlug) return;
    
    try {
      setLoading(true);
      setError(null);

      // Získání informací o světě
      const worldResponse = await fetch(`http://localhost:3001/api/worlds/${worldSlug}`);
      if (!worldResponse.ok) {
        throw new Error('Svět nebyl nalezen');
      }
      
      const worldData = await worldResponse.json();
      if (!worldData.success) {
        throw new Error(worldData.error || 'Chyba při načítání světa');
      }

      // Pro nyní použijeme mock data, dokud nebude implementována mapa v databázi
      const mockWorld: WorldData = {
        id: worldData.world.id,
        name: worldData.world.name,
        mapSize: { width: 1000, height: 1000 },
        seed: 123456
      };
      
      setWorld(mockWorld);

    } catch (err) {
      console.error('Chyba při načítání světa:', err);
      setError(err instanceof Error ? err.message : 'Neznámá chyba');
    } finally {
      setLoading(false);
    }
  }, [worldSlug]);

  // Načtení dlaždic pro aktuální viewport
  const loadTilesForViewport = useCallback(async () => {
    if (!world) return;

    try {
      // Dočasné mock data pro testování
      // V reálné implementaci by se volalo: `/api/admin/world/${world.id}/map`
      const mockTiles: MapTile[] = [];
      
      for (let y = viewport.y; y < viewport.y + viewport.height && y < world.mapSize.height; y++) {
        for (let x = viewport.x; x < viewport.x + viewport.width && x < world.mapSize.width; x++) {
          // Jednoduchý generátor pro testování
          const noise = Math.sin(x * 0.1) * Math.cos(y * 0.1);
          let terrainType: MapTile['terrainType'];
          let color: string;

          if (noise > 0.5) {
            terrainType = 'forest';
            color = '#228B22';
          } else if (noise > 0.2) {
            terrainType = 'mountain';
            color = '#8B7355';
          } else if (noise < -0.5) {
            terrainType = 'lake';
            color = '#1E90FF';
          } else if (Math.abs(x % 50 - 25) < 2 && Math.random() > 0.7) {
            terrainType = 'river';
            color = '#4682B4';
          } else {
            terrainType = 'plains';
            color = '#DAA520';
          }

          mockTiles.push({ x, y, terrainType, color });
        }
      }

      setTiles(mockTiles);

    } catch (err) {
      console.error('Chyba při načítání dlaždic:', err);
    }
  }, [world, viewport]);

  // Použít efekty
  useEffect(() => {
    loadWorldData();
  }, [loadWorldData]);

  useEffect(() => {
    if (world) {
      updateViewportSize();
    }
  }, [world, updateViewportSize]);

  useEffect(() => {
    loadTilesForViewport();
  }, [loadTilesForViewport]);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => updateViewportSize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateViewportSize]);

  // Drag & pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragOffset({ x: viewport.x, y: viewport.y });
  }, [viewport]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });

    if (isDragging && world) {
      const deltaX = (dragStart.x - e.clientX) / (20 * viewport.scale);
      const deltaY = (dragStart.y - e.clientY) / (20 * viewport.scale);
      
      const newX = Math.max(0, Math.min(
        world.mapSize.width - viewport.width,
        Math.round(dragOffset.x + deltaX)
      ));
      const newY = Math.max(0, Math.min(
        world.mapSize.height - viewport.height,
        Math.round(dragOffset.y + deltaY)
      ));

      setViewport(prev => ({ ...prev, x: newX, y: newY }));
    }
  }, [isDragging, dragStart, dragOffset, viewport.scale, world, viewport.width, viewport.height]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Zoom handler
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.5, Math.min(3, viewport.scale * zoomFactor));
    
    setViewport(prev => ({
      ...prev,
      scale: newScale
    }));
  }, [viewport.scale]);

  // Hover handlers pro dlaždice
  const handleTileHover = useCallback((tile: MapTile) => {
    setHoveredTile(tile);
  }, []);

  const handleTileLeave = useCallback(() => {
    setHoveredTile(null);
  }, []);

  // Virtualizované vykreslování dlaždic
  const renderedTiles = useMemo(() => {
    const tileSize = 20 * viewport.scale;
    
    return tiles.map(tile => (
      <div
        key={`${tile.x}-${tile.y}`}
        className="map-tile"
        style={{
          position: 'absolute',
          left: `${(tile.x - viewport.x) * tileSize}px`,
          top: `${(tile.y - viewport.y) * tileSize}px`,
          width: `${tileSize}px`,
          height: `${tileSize}px`,
          backgroundColor: tile.color,
          borderRight: `1px solid rgba(0,0,0,0.1)`,
          borderBottom: `1px solid rgba(0,0,0,0.1)`
        }}
        onMouseEnter={() => handleTileHover(tile)}
        onMouseLeave={handleTileLeave}
      />
    ));
  }, [tiles, viewport, handleTileHover, handleTileLeave]);

  // Minimap
  const renderMinimap = () => {
    if (!world) return null;

    const minimapScale = 150 / Math.max(world.mapSize.width, world.mapSize.height);
    const minimapWidth = world.mapSize.width * minimapScale;
    const minimapHeight = world.mapSize.height * minimapScale;
    
    return (
      <div className="minimap">
        <div 
          className="minimap-container"
          style={{
            width: `${minimapWidth}px`,
            height: `${minimapHeight}px`
          }}
        >
          <div className="minimap-background" />
          <div 
            className="minimap-viewport"
            style={{
              left: `${viewport.x * minimapScale}px`,
              top: `${viewport.y * minimapScale}px`,
              width: `${viewport.width * minimapScale}px`,
              height: `${viewport.height * minimapScale}px`
            }}
          />
        </div>
      </div>
    );
  };

  // Loading a error states
  if (loading) {
    return (
      <div className="world-page world-page--loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Načítání světa...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="world-page world-page--error">
        <div className="error-message">
          <h2>❌ Chyba</h2>
          <p>{error}</p>
          <button 
            onClick={() => navigate('/admin/worlds')}
            className="back-button"
          >
            ← Zpět na seznam světů
          </button>
        </div>
      </div>
    );
  }

  if (!world) {
    return (
      <div className="world-page world-page--not-found">
        <div className="not-found-message">
          <h2>🌍 Svět nenalezen</h2>
          <button 
            onClick={() => navigate('/admin/worlds')}
            className="back-button"
          >
            ← Zpět na seznam světů
          </button>
        </div>
      </div>
    );
  }

  // Hlavní render
  return (
    <div className="world-page">
      {/* Header s informacemi o světě */}
      <div className="world-header">
        <div className="world-info">
          <h1 className="world-title">🌍 {world.name}</h1>
          <div className="world-stats">
            <span>Velikost: {world.mapSize.width}×{world.mapSize.height}</span>
            <span>Zoom: {Math.round(viewport.scale * 100)}%</span>
            <span>Pozice: [{viewport.x}, {viewport.y}]</span>
          </div>
        </div>
        
        <button 
          onClick={() => navigate('/admin/worlds')}
          className="back-button"
        >
          ← Zpět
        </button>
      </div>

      {/* Hlavní mapový kontejner */}
      <div 
        ref={mapContainerRef}
        className={`map-container ${isDragging ? 'map-container--dragging' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div ref={mapGridRef} className="map-grid">
          {renderedTiles}
        </div>

        {/* Minimap */}
        {renderMinimap()}

        {/* Koordináty při hover */}
        {hoveredTile && (
          <div 
            className="coordinates-display"
            style={{
              left: `${mousePosition.x + 15}px`,
              top: `${mousePosition.y - 50}px`
            }}
          >
            <strong>X: {hoveredTile.x}, Y: {hoveredTile.y}</strong>
            <div>{TERRAIN_NAMES[hoveredTile.terrainType]}</div>
          </div>
        )}
      </div>

      {/* Ovládací prvky */}
      <div className="map-controls">
        <button 
          className="zoom-button"
          onClick={() => setViewport(prev => ({ 
            ...prev, 
            scale: Math.min(3, prev.scale * 1.2) 
          }))}
        >
          🔍+
        </button>
        <button 
          className="zoom-button"
          onClick={() => setViewport(prev => ({ 
            ...prev, 
            scale: Math.max(0.5, prev.scale / 1.2) 
          }))}
        >
          🔍-
        </button>
        <button 
          className="center-button"
          onClick={() => setViewport(prev => ({ 
            ...prev, 
            x: Math.floor(world.mapSize.width / 2 - prev.width / 2),
            y: Math.floor(world.mapSize.height / 2 - prev.height / 2)
          }))}
        >
          🎯 Střed
        </button>
      </div>
    </div>
  );
}