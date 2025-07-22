// backend/src/models/Terrain.ts
// Definice terénů a jejich vlastností

export interface TerrainType {
  id: number;
  name: 'forest' | 'mountain' | 'river' | 'plains' | 'lake';
  isOccupiable: boolean; // false pro vodu, true pro zbytek
  color: string;
  displayName: string;
  description: string;
}

export const TERRAINS: Record<string, TerrainType> = {
  plains: { 
    id: 1, 
    name: 'plains', 
    isOccupiable: true, 
    color: '#DAA520',
    displayName: 'Pláně',
    description: 'Úrodná půda ideální pro zemědělství a osídlení'
  },
  forest: { 
    id: 2, 
    name: 'forest', 
    isOccupiable: true, 
    color: '#228B22',
    displayName: 'Les',
    description: 'Hustý les poskytující dřevo a ochranu'
  },
  mountain: { 
    id: 3, 
    name: 'mountain', 
    isOccupiable: true, 
    color: '#8B7355',
    displayName: 'Hory',
    description: 'Vysoké hory s kamennými zdroji'
  },
  river: { 
    id: 4, 
    name: 'river', 
    isOccupiable: false, 
    color: '#4682B4',
    displayName: 'Řeka',
    description: 'Řeka poskytující vodu a obchodní cestu'
  },
  lake: { 
    id: 5, 
    name: 'lake', 
    isOccupiable: false, 
    color: '#1E90FF',
    displayName: 'Jezero',
    description: 'Jezero s čistou vodou a rybami'
  },
};

// Interface pro dlaždici mapy
export interface MapTile {
  id?: number;
  worldId: number;
  x: number;
  y: number;
  terrainType: 'plains' | 'forest' | 'mountain' | 'river' | 'lake';
  ownerId?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

// Interface pro generátor mapy
export interface MapGeneratorOptions {
  width: number;
  height: number;
  seed?: number;
  terrainPercentages?: {
    plains: number;    // default: 60%
    forest: number;    // default: 15%
    mountain: number;  // default: 10%
    river: number;     // default: 10%
    lake: number;      // default: 5%
  };
}

// Výsledek generování mapy
export interface GeneratedMap {
  tiles: MapTile[];
  stats: {
    [key: string]: number;
  };
  generationTimeMs: number;
  seed: number;
}

// Utility funkce pro práci s terénem
export class TerrainUtils {
  static getTerrainByName(name: string): TerrainType | undefined {
    return TERRAINS[name];
  }

  static getOccupiableTerrains(): TerrainType[] {
    return Object.values(TERRAINS).filter(terrain => terrain.isOccupiable);
  }

  static getWaterTerrains(): TerrainType[] {
    return Object.values(TERRAINS).filter(terrain => !terrain.isOccupiable);
  }

  static isWaterTerrain(terrainName: string): boolean {
    const terrain = TERRAINS[terrainName];
    return terrain ? !terrain.isOccupiable : false;
  }

  static getRandomSeed(): number {
    return Math.floor(Math.random() * 1000000);
  }
}