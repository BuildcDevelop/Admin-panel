// Admin-panel/backend/src/services/mapGenerator.ts
// Služba pro generování herní mapy s algoritmy pro tvorbu přirozeného terénu

import { MapTile, TerrainUtils, MapGeneratorOptions, GeneratedMap } from '../models/Terrain';

// Simple noise implementace pro generování přirozeného terénu
class SimpleNoise {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed;
  }

  // Jednoduchý hash pro seed
  public hash(x: number, y: number): number {
    let h = this.seed + x * 374761393 + y * 668265263;
    h = (h ^ (h >> 13)) * 1274126177;
    return (h ^ (h >> 16)) / 2147483648.0;
  }

  // Interpolated noise
  noise(x: number, y: number): number {
    const intX = Math.floor(x);
    const intY = Math.floor(y);
    const fracX = x - intX;
    const fracY = y - intY;

    const a = this.hash(intX, intY);
    const b = this.hash(intX + 1, intY);
    const c = this.hash(intX, intY + 1);
    const d = this.hash(intX + 1, intY + 1);

    const i1 = this.interpolate(a, b, fracX);
    const i2 = this.interpolate(c, d, fracX);

    return this.interpolate(i1, i2, fracY);
  }

  private interpolate(a: number, b: number, x: number): number {
    const ft = x * Math.PI;
    const f = (1 - Math.cos(ft)) * 0.5;
    return a * (1 - f) + b * f;
  }

  // Fractal noise pro komplexnější terén
  fractalNoise(x: number, y: number, octaves: number): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      value += this.noise(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }

    return value / maxValue;
  }
}

class MapGenerator {
  private width: number;
  private height: number;
  private seed: number;
  private noise: SimpleNoise;

  constructor(options: MapGeneratorOptions) {
    this.width = options.width;
    this.height = options.height;
    this.seed = options.seed || TerrainUtils.getRandomSeed();
    this.noise = new SimpleNoise(this.seed);
  }

  async generateMap(worldId: number): Promise<GeneratedMap> {
    const startTime = performance.now();
    
    console.log(`🌍 Generování mapy ${this.width}x${this.height} se seedem ${this.seed}`);
    
    // Inicializace základní mapy s pláněmi
    const tiles: MapTile[] = [];
    
    // Krok 1: Vytvoření základního terénu pomocí Perlin noise
    const terrainMap = this.generateBaseTerrain();
    
    // Krok 2: Přidání řek
    this.addRivers(terrainMap);
    
    // Krok 3: Přidání jezer
    this.addLakes(terrainMap);
    
    // Krok 4: Přidání lesů ve shlucích
    this.addForestClusters(terrainMap);
    
    // Krok 5: Přidání horských pásem
    this.addMountainRanges(terrainMap);
    
    // Krok 6: Vyhlazení terénu
    this.smoothTerrain(terrainMap, 2);

    // Konverze 2D pole na MapTile[]
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        tiles.push({
          worldId,
          x,
          y,
          terrainType: terrainMap[y][x]
        });
      }
    }

    // Výpočet statistik
    const stats = this.calculateStats(tiles);
    const generationTimeMs = Math.round(performance.now() - startTime);

    console.log(`✅ Mapa vygenerována za ${generationTimeMs}ms`);
    console.log(`📊 Statistiky:`, stats);

    return {
      tiles,
      stats,
      generationTimeMs,
      seed: this.seed
    };
  }

  private generateBaseTerrain(): ('plains' | 'forest' | 'mountain' | 'river' | 'lake')[][] {
    const terrain: ('plains' | 'forest' | 'mountain' | 'river' | 'lake')[][] = [];
    
    // Inicializace s pláněmi
    for (let y = 0; y < this.height; y++) {
      terrain[y] = [];
      for (let x = 0; x < this.width; x++) {
        terrain[y][x] = 'plains';
      }
    }
    
    return terrain;
  }

  private addRivers(terrain: ('plains' | 'forest' | 'mountain' | 'river' | 'lake')[][]) {
    const numRivers = Math.floor(Math.min(this.width, this.height) / 200) + 2;
    
    for (let r = 0; r < numRivers; r++) {
      // Náhodný začátek řeky z kraje mapy
      let x: number, y: number;
      let dx: number, dy: number;
      
      const side = Math.floor(this.noise.hash(r, 100) * 4);
      
      switch (side) {
        case 0: // Shora
          x = Math.floor(this.noise.hash(r, 101) * this.width);
          y = 0;
          dx = 0;
          dy = 1;
          break;
        case 1: // Zprava
          x = this.width - 1;
          y = Math.floor(this.noise.hash(r, 102) * this.height);
          dx = -1;
          dy = 0;
          break;
        case 2: // Zezdola
          x = Math.floor(this.noise.hash(r, 103) * this.width);
          y = this.height - 1;
          dx = 0;
          dy = -1;
          break;
        default: // Zleva
          x = 0;
          y = Math.floor(this.noise.hash(r, 104) * this.height);
          dx = 1;
          dy = 0;
          break;
      }
      
      // Kreslení řeky
      const maxLength = Math.min(this.width, this.height) * 0.8;
      let length = 0;
      
      while (length < maxLength && x >= 0 && x < this.width && y >= 0 && y < this.height) {
        terrain[y][x] = 'river';
        
        // Přidání náhodnosti do směru
        const noiseValue = this.noise.noise(x * 0.1, y * 0.1);
        
        if (noiseValue > 0.3) {
          // Zatočení doleva
          const newDx = -dy;
          const newDy = dx;
          dx = newDx;
          dy = newDy;
        } else if (noiseValue < -0.3) {
          // Zatočení doprava
          const newDx = dy;
          const newDy = -dx;
          dx = newDx;
          dy = newDy;
        }
        
        x += dx;
        y += dy;
        length++;
      }
    }
  }

  private addLakes(terrain: ('plains' | 'forest' | 'mountain' | 'river' | 'lake')[][]) {
    const numLakes = Math.floor((this.width * this.height) / 50000) + 3;
    
    for (let l = 0; l < numLakes; l++) {
      const centerX = Math.floor(this.noise.hash(l, 200) * (this.width - 20)) + 10;
      const centerY = Math.floor(this.noise.hash(l, 201) * (this.height - 20)) + 10;
      const radius = Math.floor(this.noise.hash(l, 202) * 8) + 3;
      
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const x = centerX + dx;
          const y = centerY + dy;
          
          if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            const distance = Math.sqrt(dx * dx + dy * dy);
            const noiseValue = this.noise.noise(x * 0.2, y * 0.2);
            
            if (distance <= radius * (0.7 + noiseValue * 0.3)) {
              terrain[y][x] = 'lake';
            }
          }
        }
      }
    }
  }

  private addForestClusters(terrain: ('plains' | 'forest' | 'mountain' | 'river' | 'lake')[][]) {
    const numClusters = Math.floor((this.width * this.height) / 30000) + 5;
    
    for (let c = 0; c < numClusters; c++) {
      const centerX = Math.floor(this.noise.hash(c, 300) * this.width);
      const centerY = Math.floor(this.noise.hash(c, 301) * this.height);
      const radius = Math.floor(this.noise.hash(c, 302) * 20) + 10;
      
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const x = centerX + dx;
          const y = centerY + dy;
          
          if (x >= 0 && x < this.width && y >= 0 && y < this.height && 
              terrain[y][x] === 'plains') {
            
            const distance = Math.sqrt(dx * dx + dy * dy);
            const noiseValue = this.noise.noise(x * 0.15, y * 0.15);
            
            if (distance <= radius * (0.6 + noiseValue * 0.4)) {
              terrain[y][x] = 'forest';
            }
          }
        }
      }
    }
  }

  private addMountainRanges(terrain: ('plains' | 'forest' | 'mountain' | 'river' | 'lake')[][]) {
    const numRanges = Math.floor(Math.min(this.width, this.height) / 300) + 2;
    
    for (let r = 0; r < numRanges; r++) {
      // Náhodný začátek horského pásma
      let x = Math.floor(this.noise.hash(r, 400) * this.width);
      let y = Math.floor(this.noise.hash(r, 401) * this.height);
      
      // Náhodný směr
      let dx = Math.floor(this.noise.hash(r, 402) * 3) - 1; // -1, 0, 1
      let dy = Math.floor(this.noise.hash(r, 403) * 3) - 1;
      
      if (dx === 0 && dy === 0) {
        dx = 1; // Zajistit, že se pásmo pohybuje
      }
      
      const length = Math.floor(this.noise.hash(r, 404) * 50) + 30;
      const width = Math.floor(this.noise.hash(r, 405) * 6) + 3;
      
      for (let i = 0; i < length; i++) {
        for (let w = -width; w <= width; w++) {
          const mountainX = x + w * (dy === 0 ? 1 : 0) + w * (dx === 0 ? 0 : Math.sign(dx));
          const mountainY = y + w * (dx === 0 ? 1 : 0) + w * (dy === 0 ? 0 : Math.sign(dy));
          
          if (mountainX >= 0 && mountainX < this.width && 
              mountainY >= 0 && mountainY < this.height &&
              terrain[mountainY][mountainX] !== 'river' && 
              terrain[mountainY][mountainX] !== 'lake') {
            
            const distanceFromCenter = Math.abs(w);
            const noiseValue = this.noise.noise(mountainX * 0.1, mountainY * 0.1);
            
            if (distanceFromCenter <= width * (0.7 + noiseValue * 0.3)) {
              terrain[mountainY][mountainX] = 'mountain';
            }
          }
        }
        
        // Postupný posun pásma
        x += dx;
        y += dy;
        
        // Občasná změna směru
        if (i % 10 === 0) {
          const newDirection = this.noise.hash(r * 100 + i, 406);
          if (newDirection > 0.7) {
            dx = Math.floor(newDirection * 3) - 1;
          } else if (newDirection < 0.3) {
            dy = Math.floor(newDirection * 3) - 1;
          }
        }
        
        // Zajistit, že zůstane na mapě
        if (x < 5 || x > this.width - 5) dx = -dx;
        if (y < 5 || y > this.height - 5) dy = -dy;
      }
    }
  }

  private smoothTerrain(terrain: ('plains' | 'forest' | 'mountain' | 'river' | 'lake')[][], passes: number) {
    for (let pass = 0; pass < passes; pass++) {
      const newTerrain = terrain.map(row => [...row]);
      
      for (let y = 1; y < this.height - 1; y++) {
        for (let x = 1; x < this.width - 1; x++) {
          // Zjistit nejčastější terén v okolí
          const neighbors: { [key: string]: number } = {};
          
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const neighborTerrain = terrain[y + dy][x + dx];
              neighbors[neighborTerrain] = (neighbors[neighborTerrain] || 0) + 1;
            }
          }
          
          // Najít nejčastější terén
          let mostCommon = terrain[y][x];
          let maxCount = 0;
          
          for (const [terrainType, count] of Object.entries(neighbors)) {
            if (count > maxCount) {
              maxCount = count;
              mostCommon = terrainType as any;
            }
          }
          
          // Vyhlazování pouze pro plains a forest
          if ((terrain[y][x] === 'plains' || terrain[y][x] === 'forest') &&
              maxCount >= 6) {
            newTerrain[y][x] = mostCommon;
          }
        }
      }
      
      // Kopírování zpět
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          terrain[y][x] = newTerrain[y][x];
        }
      }
    }
  }

  private calculateStats(tiles: MapTile[]): { [key: string]: number } {
    const stats: { [key: string]: number } = {};
    const total = tiles.length;
    
    for (const tile of tiles) {
      stats[tile.terrainType] = (stats[tile.terrainType] || 0) + 1;
    }
    
    // Převést na procenta
    for (const terrain in stats) {
      stats[terrain] = Math.round((stats[terrain] / total) * 1000) / 10; // 1 desetinné místo
    }
    
    return stats;
  }
}

export default MapGenerator;