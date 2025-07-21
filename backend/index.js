const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const WORLDS_FILE = path.join(__dirname, 'worlds.json');

const loadWorlds = () => {
  try {
    if (!fs.existsSync(WORLDS_FILE)) {
      const initialData = { worlds: [] };
      fs.writeFileSync(WORLDS_FILE, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    const data = fs.readFileSync(WORLDS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Chyba při načítání světů:', error);
    return { worlds: [] };
  }
};

const saveWorlds = (data) => {
  try {
    fs.writeFileSync(WORLDS_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Chyba při ukládání světů:', error);
    return false;
  }
};

const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

// API Routes
app.get('/api/health', (req, res) => {
  console.log('✅ Health check - API je funkční');
  res.json({ 
    message: 'Backend server běží úspěšně!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/api/admin/worlds', (req, res) => {
  try {
    const data = loadWorlds();
    console.log(`📋 Načteno ${data.worlds.length} světů`);
    res.json({
      success: true,
      worlds: data.worlds,
      count: data.worlds.length
    });
  } catch (error) {
    console.error('❌ Chyba při načítání světů:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba při načítání světů'
    });
  }
});

app.get('/api/admin/worlds/:id', (req, res) => {
  try {
    const worldId = parseInt(req.params.id);
    const data = loadWorlds();
    const world = data.worlds.find(w => w.id === worldId);
    
    if (!world) {
      console.log(`❌ Svět s ID ${worldId} nenalezen`);
      return res.status(404).json({
        success: false,
        error: 'Svět nenalezen'
      });
    }
    
    console.log(`📖 Detail světa: ${world.name}`);
    res.json({
      success: true,
      world: world
    });
  } catch (error) {
    console.error('❌ Chyba při načítání světa:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba při načítání světa'
    });
  }
});

app.post('/api/admin/worlds', (req, res) => {
  try {
    const { name, settings } = req.body;
    
    if (!name || !name.trim()) {
      console.log('❌ Pokus o vytvoření světa bez názvu');
      return res.status(400).json({
        success: false,
        error: 'Název světa je povinný'
      });
    }
    
    const data = loadWorlds();
    
    const existingWorld = data.worlds.find(w => 
      w.name.toLowerCase() === name.trim().toLowerCase()
    );
    
    if (existingWorld) {
      console.log(`❌ Svět s názvem "${name}" již existuje`);
      return res.status(400).json({
        success: false,
        error: 'Svět s tímto názvem již existuje'
      });
    }
    
    const newWorld = {
      id: data.worlds.length > 0 ? Math.max(...data.worlds.map(w => w.id)) + 1 : 1,
      name: name.trim(),
      slug: generateSlug(name.trim()),
      status: 'preparing',
      currentPlayers: 0,
      maxPlayers: settings?.maxPlayers || 500,
      createdAt: new Date().toISOString(),
      settings: {
        speed: settings?.speed || 1.0,
        unitSpeed: settings?.unitSpeed || 1.0,
        barbarianSpawnChance: settings?.barbarianSpawnChance || 100,
        maxPlayers: settings?.maxPlayers || 500
      }
    };
    
    data.worlds.push(newWorld);
    
    if (saveWorlds(data)) {
      console.log(`✅ Vytvořen nový svět: ${newWorld.name} (ID: ${newWorld.id})`);
      console.log(`   📊 Nastavení: rychlost ${newWorld.settings.speed}x, max hráčů ${newWorld.maxPlayers}`);
      
      res.status(201).json({
        success: true,
        message: `Svět "${newWorld.name}" byl úspěšně vytvořen`,
        world: newWorld
      });
    } else {
      throw new Error('Chyba při ukládání do souboru');
    }
    
  } catch (error) {
    console.error('❌ Chyba při vytváření světa:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba při vytváření světa'
    });
  }
});

app.delete('/api/admin/worlds/:id', (req, res) => {
  try {
    const worldId = parseInt(req.params.id);
    const data = loadWorlds();
    
    const worldIndex = data.worlds.findIndex(w => w.id === worldId);
    
    if (worldIndex === -1) {
      console.log(`❌ Pokus o smazání neexistujícího světa (ID: ${worldId})`);
      return res.status(404).json({
        success: false,
        error: 'Svět nenalezen'
      });
    }
    
    const deletedWorld = data.worlds[worldIndex];
    data.worlds.splice(worldIndex, 1);
    
    if (saveWorlds(data)) {
      console.log(`🗑️ Smazán svět: ${deletedWorld.name} (ID: ${worldId})`);
      console.log(`   📊 Měl ${deletedWorld.currentPlayers} hráčů, status: ${deletedWorld.status}`);
      
      res.json({
        success: true,
        message: `Svět "${deletedWorld.name}" byl úspěšně smazán`,
        deletedWorld: deletedWorld
      });
    } else {
      throw new Error('Chyba při ukládání do souboru');
    }
    
  } catch (error) {
    console.error('❌ Chyba při mazání světa:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba při mazání světa'
    });
  }
});

app.put('/api/admin/worlds/:id', (req, res) => {
  try {
    const worldId = parseInt(req.params.id);
    const updates = req.body;
    const data = loadWorlds();
    
    const worldIndex = data.worlds.findIndex(w => w.id === worldId);
    
    if (worldIndex === -1) {
      console.log(`❌ Pokus o úpravu neexistujícího světa (ID: ${worldId})`);
      return res.status(404).json({
        success: false,
        error: 'Svět nenalezen'
      });
    }
    
    const world = data.worlds[worldIndex];
    const oldName = world.name;
    
    if (updates.name) world.name = updates.name.trim();
    if (updates.status) world.status = updates.status;
    if (updates.settings) {
      world.settings = { ...world.settings, ...updates.settings };
      world.maxPlayers = world.settings.maxPlayers;
    }
    
    data.worlds[worldIndex] = world;
    
    if (saveWorlds(data)) {
      console.log(`✏️ Upraven svět: ${oldName} → ${world.name} (ID: ${worldId})`);
      
      res.json({
        success: true,
        message: `Svět "${world.name}" byl úspěšně upraven`,
        world: world
      });
    } else {
      throw new Error('Chyba při ukládání do souboru');
    }
    
  } catch (error) {
    console.error('❌ Chyba při úpravě světa:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba při úpravě světa'
    });
  }
});

app.use((err, req, res, next) => {
  console.error('💥 Neočekávaná chyba:', err);
  res.status(500).json({
    success: false,
    error: 'Vnitřní chyba serveru'
  });
});

app.use('*', (req, res) => {
  console.log(`❓ Neznámý endpoint: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: 'Endpoint nenalezen'
  });
});

app.listen(PORT, () => {
  console.log('');
  console.log('🎮====================================🎮');
  console.log('   VERVEN GAME ADMIN SERVER');
  console.log('🎮====================================🎮');
  console.log('');
  console.log(`🚀 Server běží na: http://localhost:${PORT}`);
  console.log(`📁 Data soubor: ${WORLDS_FILE}`);
  console.log('');
  console.log('📡 Dostupné API endpoints:');
  console.log('   GET    /api/health              - Health check');
  console.log('   GET    /api/admin/worlds        - Seznam světů');
  console.log('   GET    /api/admin/worlds/:id    - Detail světa');
  console.log('   POST   /api/admin/worlds        - Vytvořit svět');
  console.log('   PUT    /api/admin/worlds/:id    - Upravit svět');
  console.log('   DELETE /api/admin/worlds/:id    - Smazat svět');
  console.log('');
  console.log('💡 Pro zastavení serveru stiskněte Ctrl+C');
  console.log('');
  
  const data = loadWorlds();
  if (data.worlds.length > 0) {
    console.log(`📊 Načteno ${data.worlds.length} existujících světů`);
  } else {
    console.log('📭 Zatím žádné světy nevytvořeny');
  }
  console.log('');
});