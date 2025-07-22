// backend/src/services/mapGenerator.ts
// Hlavní logika pro generování herních map

import { MapTile, GeneratedMap, MapGeneratorOptions, TerrainUtils } from '../models/Terrain.js';

export class MapGenerator {
  private width: number;
  private height: number;
  private seed: number;
  private random: SeededRandom;
  private terrainPercentages: Required<MapGeneratorOptions>['terrainPercentages'];

  constructor(options: MapGeneratorOptions) {
    this.width = options.width;
    this.height = options.height;
    this.seed = options.seed || TerrainUtils.getRandomSeed();
    this.random = new SeededRandom(this.seed);
    
    // Výchozí procentuální rozdělení terénů
    this.terrainPercentages = {
      plains: 60,
      forest: 15,
      mountain: 10,
      river: 10,
      lake: 5,
      ...options.terrainPercentages
    };
  }

  /**
   * Hlavní metoda pro generování mapy
   */
  public async generateMap(worldId: number): Promise<GeneratedMap> {
    const startTime = performance.now();
    
    console.log(`🌍 Generování mapy ${this.width}x${this.height} pro svět ${worldId}, seed: ${this.seed}`);

    // 1. Vytvoření základní mřížky
    const grid = this.createBaseGrid();

    // 2. Generování základního terénu pomocí Perlin Noise
    const noiseMap = this.generatePerlinNoise(this.width, this.height);
    
    // 3. Aplikace základních terénů (pláně + hory)
    this.applyBaseTerrains(grid, noiseMap);
    
    // 4. Generování lesů jako shluků
    this.generateForestClusters(grid);
    
    // 5. Generování hor jako shluků
    this.generateMountainClusters(grid);
    
    // 6. Generování řek
    this.generateRivers(grid);
    
    // 7. Generování jezer
    this.generateLakes(grid);

    // 8. Konverze na MapTile objekty
    const tiles = this.gridToMapTiles(grid, worldId);
    
    // 9. Statistiky
    const stats = this.calculateStats(tiles);
    
    const endTime = performance.now();
    const generationTimeMs = Math.round(endTime - startTime);

    console.log(`✅ Mapa vygenerována za ${generationTimeMs}ms`);
    console.log(`📊 Statistiky:`, stats);

    return {
      tiles,
      stats,
      generationTimeMs,
      seed: this.seed
    };
  }

  /**
   * Vytvoření základní prázdné mřížky
   */
  private createBaseGrid(): string[][] {
    const grid: string[][] = [];
    for (let y = 0; y < this.height; y++) {
      grid[y] = [];
      for (let x = 0; x < this.width; x++) {
        grid[y][x] = 'plains'; // Výchozí terén
      }
    }
    return grid;
  }

  /**
   * Generování Perlin Noise pro přirozeně vypadající terén
   */
  private generatePerlinNoise(width: number, height: number): number[][] {
    const noise: number[][] = [];
    const scale = 0.05; // Škála pro velikost "vln"
    
    for (let y = 0; y < height; y++) {
      noise[y] = [];
      for (let x = 0; x < width; x++) {
        // Jednoduchá implementace Perlin-like noise
        const value = this.noise(x * scale, y * scale) * 0.5 + 0.5; // Normalizace na 0-1
        noise[y][x] = value;
      }
    }
    return noise;
  }

  /**
   * Jednoduchá noise funkce (zjednodušený Perlin noise)
   */
  private noise(x: number, y: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return (n - Math.floor(n)) * 2 - 1; // Výsledek mezi -1 a 1
  }

  /**
   * Aplikace základních terénů na základě noise mapy
   */
  private applyBaseTerrains(grid: string[][], noiseMap: number[][]): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const noiseValue = noiseMap[y][x];
        
        // Vysoké hodnoty = hory, nízké = pláně
        if (noiseValue > 0.7) {
          grid[y][x] = 'mountain';
        } else {
          grid[y][x] = 'plains';
        }
      }
    }
  }

  /**
   * Generování lesních shluků
   */
  private generateForestClusters(grid: string[][]): void {
    const targetForestTiles = Math.floor((this.width * this.height * this.terrainPercentages.forest) / 100);
    let forestTilesPlaced = 0;

    // Počet shluků lesů
    const numClusters = Math.floor(targetForestTiles / 20); // Průměrně 20 dlaždic na shluk

    for (let cluster = 0; cluster < numClusters && forestTilesPlaced < targetForestTiles; cluster++) {
      // Náhodná pozice pro střed shluku
      const centerX = Math.floor(this.random.next() * this.width);
      const centerY = Math.floor(this.random.next() * this.height);

      // Velikost shluku (3-7 polí od centra)
      const clusterSize = 3 + Math.floor(this.random.next() * 5);
      
      forestTilesPlaced += this.generateCluster(grid, centerX, centerY, clusterSize, 'forest', 'plains');
    }
  }

  /**
   * Generování horských shluků
   */
  private generateMountainClusters(grid: string[][]): void {
    const targetMountainTiles = Math.floor((this.width * this.height * this.terrainPercentages.mountain) / 100);
    let mountainTilesPlaced = 0;

    const numClusters = Math.floor(targetMountainTiles / 15); // Průměrně 15 dlaždic na shluk

    for (let cluster = 0; cluster < numClusters && mountainTilesPlaced < targetMountainTiles; cluster++) {
      const centerX = Math.floor(this.random.next() * this.width);
      const centerY = Math.floor(this.random.next() * this.height);
      const clusterSize = 2 + Math.floor(this.random.next() * 6);
      
      mountainTilesPlaced += this.generateCluster(grid, centerX, centerY, clusterSize, 'mountain', 'plains');
    }
  }

  /**
   * Univerzální funkce pro generování shluků
   */
  private generateCluster(
    grid: string[][], 
    centerX: number, 
    centerY: number, 
    maxRadius: number, 
    terrainType: string,
    replaceType: string
  ): number {
    let tilesPlaced = 0;
    
    // Random walk algoritmus pro přirozený tvar shluku
    const positions: Array<{x: number, y: number}> = [{x: centerX, y: centerY}];
    const visited = new Set<string>();
    
    while (positions.length > 0 && tilesPlaced < maxRadius * maxRadius) {
      const pos = positions.shift()!;
      const key = `${pos.x},${pos.y}`;
      
      if (visited.has(key)) continue;
      visited.add(key);
      
      // Zkontroluj hranice
      if (pos.x < 0 || pos.x >= this.width || pos.y < 0 || pos.y >= this.height) continue;
      
      // Vzdálenost od centra
      const distance = Math.sqrt((pos.x - centerX) ** 2 + (pos.y - centerY) ** 2);
      if (distance > maxRadius) continue;
      
      // Umísti terén jen pokud je na správném místě
      if (grid[pos.y][pos.x] === replaceType) {
        grid[pos.y][pos.x] = terrainType;
        tilesPlaced++;
        
        // Přidej sousední pozice s pravděpodobností
        const directions = [
          {x: pos.x + 1, y: pos.y},
          {x: pos.x - 1, y: pos.y},
          {x: pos.x, y: pos.y + 1},
          {x: pos.x, y: pos.y - 1}
        ];
        
        for (const dir of directions) {
          if (this.random.next() < 0.6) { // 60% šance na rozšíření
            positions.push(dir);
          }
        }
      }
    }
    
    return tilesPlaced;
  }

  /**
   * Generování řek
   */
  private generateRivers(grid: string[][]): void {
    const targetRiverTiles = Math.floor((this.width * this.height * this.terrainPercentages.river) / 100);
    const numRivers = Math.max(1, Math.floor(targetRiverTiles / 50)); // Několik dlouhých řek
    
    for (let river = 0; river < numRivers; river++) {
      this.generateSingleRiver(grid, Math.floor(targetRiverTiles / numRivers));
    }
  }

  /**
   * Generování jedné řeky
   */
  private generateSingleRiver(grid: string[][], maxLength: number): void {
    // Začni na náhodném okraji mapy
    const startSide = Math.floor(this.random.next() * 4);
    let x: number, y: number;
    
    switch (startSide) {
      case 0: // Horní okraj
        x = Math.floor(this.random.next() * this.width);
        y = 0;
        break;
      case 1: // Pravý okraj
        x = this.width - 1;
        y = Math.floor(this.random.next() * this.height);
        break;
      case 2: // Dolní okraj
        x = Math.floor(this.random.next() * this.width);
        y = this.height - 1;
        break;
      default: // Levý okraj
        x = 0;
        y = Math.floor(this.random.next() * this.height);
    }
    
    // Směr řeky - obecně směrem k středu mapy s náhodností
    let length = 0;
    const path: Array<{x: number, y: number}> = [];
    
    while (length < maxLength) {
      if (x < 0 || x >= this.width || y < 0 || y >= this.height) break;
      
      path.push({x, y});
      grid[y][x] = 'river';
      length++;
      
      // Výběr dalšího směru - preferuj směr k středu s náhodností
      const centerX = this.width / 2;
      const centerY = this.height / 2;
      
      const directions = [
        {x: x + 1, y, bias: x < centerX ? 1.5 : 0.5},
        {x: x - 1, y, bias: x > centerX ? 1.5 : 0.5},
        {x, y: y + 1, bias: y < centerY ? 1.5 : 0.5},
        {x, y: y - 1, bias: y > centerY ? 1.5 : 0.5}
      ];
      
      // Vážený výběr směru
      const totalWeight = directions.reduce((sum, dir) => sum + dir.bias, 0);
      let random = this.random.next() * totalWeight;
      
      let selectedDirection = directions[0];
      for (const dir of directions) {
        random -= dir.bias;
        if (random <= 0) {
          selectedDirection = dir;
          break;
        }
      }
      
      x = selectedDirection.x;
      y = selectedDirection.y;
    }
  }

  /**
   * Generování jezer
   */
  private generateLakes(grid: string[][]): void {
    const targetLakeTiles = Math.floor((this.width * this.height * this.terrainPercentages.lake) / 100);
    const numLakes = Math.max(1, Math.floor(targetLakeTiles / 8)); // Menší jezera
    
    let lakeTilesPlaced = 0;
    
    for (let lake = 0; lake < numLakes && lakeTilesPlaced < targetLakeTiles; lake++) {
      const centerX = Math.floor(this.random.next() * this.width);
      const centerY = Math.floor(this.random.next() * this.height);
      const lakeSize = 2 + Math.floor(this.random.next() * 4); // 2-5 dlaždic
      
      lakeTilesPlaced += this.generateCluster(grid, centerX, centerY, lakeSize, 'lake', 'plains');
    }
  }

  /**
   * Převod mřížky na MapTile objekty
   */
  private gridToMapTiles(grid: string[][], worldId: number): MapTile[] {
    const tiles: MapTile[] = [];
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        tiles.push({
          worldId,
          x,
          y,
          terrainType: grid[y][x] as MapTile['terrainType']
        });
      }
    }
    
    return tiles;
  }

  /**
   * Výpočet statistik mapy
   */
  private calculateStats(tiles: MapTile[]): Record<string, number> {
    const stats: Record<string, number> = {};
    
    for (const tile of tiles) {
      stats[tile.terrainType] = (stats[tile.terrainType] || 0) + 1;
    }
    
    // Převod na procenta
    const total = tiles.length;
    for (const terrainType in stats) {
      stats[terrainType + '_percent'] = Math.round((stats[terrainType] / total) * 100);
    }
    
    return stats;
  }
}

/**
 * Seeded Random generátor pro reprodukovatelné výsledky
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }

  public next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
}