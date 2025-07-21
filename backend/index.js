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
    
    // Zkontroluj, zda lze svět editovat (pouze aktivní světy)
    if (updates.settings && world.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Lze editovat nastavení pouze u aktivních světů'
      });
    }
    
    const oldName = world.name;
    
    // Validace nastavení pokud jsou poskytnuty
    if (updates.settings) {
      const { settings } = updates;
      
      if (settings.speed && (settings.speed < 0.1 || settings.speed > 10)) {
        return res.status(400).json({
          success: false,
          error: 'Rychlost hry musí být mezi 0.1 a 10'
        });
      }
      
      if (settings.unitSpeed && (settings.unitSpeed < 0.1 || settings.unitSpeed > 5)) {
        return res.status(400).json({
          success: false,
          error: 'Rychlost jednotek musí být mezi 0.1 a 5'
        });
      }
      
      if (settings.barbarianSpawnChance && (settings.barbarianSpawnChance < 0 || settings.barbarianSpawnChance > 100)) {
        return res.status(400).json({
          success: false,
          error: 'Šance na barbary musí být mezi 0 a 100'
        });
      }
      
      if (settings.maxPlayers && settings.maxPlayers < world.currentPlayers) {
        return res.status(400).json({
          success: false,
          error: `Maximum hráčů nemůže být menší než současný počet hráčů (${world.currentPlayers})`
        });
      }
    }
    
    // Aplikuj změny
    if (updates.name) world.name = updates.name.trim();
    if (updates.status) world.status = updates.status;
    if (updates.settings) {
      world.settings = { ...world.settings, ...updates.settings };
      world.maxPlayers = world.settings.maxPlayers;
    }
    
    world.updatedAt = new Date().toISOString();
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

// NOVÉ ENDPOINTY PRO EDITACI SVĚTŮ

// Pozastavení světa
app.put('/api/admin/worlds/:id/pause', (req, res) => {
  try {
    const worldId = parseInt(req.params.id);
    const data = loadWorlds();
    
    const worldIndex = data.worlds.findIndex(w => w.id === worldId);
    if (worldIndex === -1) {
      console.log(`❌ Pokus o pozastavení neexistujícího světa (ID: ${worldId})`);
      return res.status(404).json({
        success: false,
        error: 'Svět nenalezen'
      });
    }
    
    const world = data.worlds[worldIndex];
    
    if (world.status !== 'active') {
      console.log(`❌ Pokus o pozastavení neaktivního světa: ${world.name} (status: ${world.status})`);
      return res.status(400).json({
        success: false,
        error: 'Lze pozastavit pouze aktivní světy'
      });
    }
    
    world.status = 'paused';
    world.pausedAt = new Date().toISOString();
    data.worlds[worldIndex] = world;
    
    if (saveWorlds(data)) {
      console.log(`⏸️ Svět pozastaven: ${world.name} (ID: ${worldId})`);
      res.json({
        success: true,
        message: `Svět "${world.name}" byl pozastaven. Hráčům se zobrazí informační zpráva.`,
        world: world
      });
    } else {
      throw new Error('Chyba při ukládání do souboru');
    }
  } catch (error) {
    console.error('❌ Chyba při pozastavování světa:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba při pozastavování světa'
    });
  }
});

// Obnovení světa
app.put('/api/admin/worlds/:id/resume', (req, res) => {
  try {
    const worldId = parseInt(req.params.id);
    const data = loadWorlds();
    
    const worldIndex = data.worlds.findIndex(w => w.id === worldId);
    if (worldIndex === -1) {
      console.log(`❌ Pokus o obnovení neexistujícího světa (ID: ${worldId})`);
      return res.status(404).json({
        success: false,
        error: 'Svět nenalezen'
      });
    }
    
    const world = data.worlds[worldIndex];
    
    if (world.status !== 'paused') {
      console.log(`❌ Pokus o obnovení nepozastaveného světa: ${world.name} (status: ${world.status})`);
      return res.status(400).json({
        success: false,
        error: 'Lze obnovit pouze pozastavené světy'
      });
    }
    
    world.status = 'active';
    world.resumedAt = new Date().toISOString();
    data.worlds[worldIndex] = world;
    
    if (saveWorlds(data)) {
      console.log(`▶️ Svět obnoven: ${world.name} (ID: ${worldId})`);
      res.json({
        success: true,
        message: `Svět "${world.name}" byl obnoven a je opět aktivní.`,
        world: world
      });
    } else {
      throw new Error('Chyba při ukládání do souboru');
    }
  } catch (error) {
    console.error('❌ Chyba při obnovování světa:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba při obnovování světa'
    });
  }
});

// Public API pro hráče - kontrola statusu světa
app.get('/api/world/:slug/status', (req, res) => {
  try {
    const worldSlug = req.params.slug;
    const data = loadWorlds();
    
    const world = data.worlds.find(w => w.slug === worldSlug);
    
    if (!world) {
      return res.status(404).json({
        success: false,
        error: 'Svět nebyl nalezen',
        status: 'not_found'
      });
    }
    
    const response = {
      success: true,
      status: world.status,
      name: world.name,
      slug: world.slug
    };
    
    switch (world.status) {
      case 'active':
        response.message = 'Svět je aktivní a připraven ke hře!';
        response.canPlay = true;
        response.stats = {
          currentPlayers: world.currentPlayers,
          maxPlayers: world.maxPlayers,
          occupancy: Math.round((world.currentPlayers / world.maxPlayers) * 100)
        };
        break;
        
      case 'preparing':
        response.message = 'Svět se připravuje. Brzy bude spuštěn!';
        response.canPlay = false;
        break;
        
      case 'paused':
        response.message = 'Svět byl z technických důvodů pozastaven.';
        response.canPlay = false;
        response.displayMessage = 'Omlouváme se za dočasné problémy. Svět bude brzy obnoven.';
        break;
        
      case 'ended':
        response.message = 'Tento svět byl ukončen.';
        response.canPlay = false;
        response.displayMessage = 'Děkujeme za účast! Podívejte se na ostatní aktivní světy.';
        break;
        
      default:
        response.message = 'Neznámý status světa.';
        response.canPlay = false;
    }
    
    res.json(response);
  } catch (error) {
    console.error('❌ Chyba při kontrole statusu světa:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba při kontrole statusu světa'
    });
  }
});

// Public API pro seznam dostupných světů
app.get('/api/worlds/public', (req, res) => {
  try {
    const data = loadWorlds();
    
    const publicWorlds = data.worlds
      .filter(world => world.status === 'active' || world.status === 'preparing')
      .map(world => ({
        id: world.id,
        name: world.name,
        slug: world.slug,
        status: world.status,
        currentPlayers: world.currentPlayers,
        maxPlayers: world.maxPlayers,
        settings: {
          speed: world.settings.speed,
          unitSpeed: world.settings.unitSpeed
        },
        occupancy: Math.round((world.currentPlayers / world.maxPlayers) * 100)
      }));
    
    res.json({
      success: true,
      worlds: publicWorlds,
      total: publicWorlds.length
    });
  } catch (error) {
    console.error('❌ Chyba při načítání veřejných světů:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba při načítání světů'
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
  console.log('   GET    /api/health                  - Health check');
  console.log('   GET    /api/admin/worlds            - Seznam světů');
  console.log('   GET    /api/admin/worlds/:id        - Detail světa');
  console.log('   POST   /api/admin/worlds            - Vytvořit svět');
  console.log('   PUT    /api/admin/worlds/:id        - Upravit svět');
  console.log('   PUT    /api/admin/worlds/:id/pause  - Pozastavit svět');
  console.log('   PUT    /api/admin/worlds/:id/resume - Obnovit svět');
  console.log('   DELETE /api/admin/worlds/:id        - Smazat svět');
  console.log('   GET    /api/world/:slug/status      - Status světa (public)');
  console.log('   GET    /api/worlds/public           - Veřejné světy');
  console.log('');
  console.log('💡 Pro zastavení serveru stiskněte Ctrl+C');
  console.log('');
  
  // Načti existující světy nebo vytvoř testovací aktivní svět
  const data = loadWorlds();
  if (data.worlds.length > 0) {
    console.log(`📊 Načteno ${data.worlds.length} existujících světů`);
    
    // Zobraz stav světů
    data.worlds.forEach(world => {
      const statusEmoji = {
        'active': '🟢',
        'preparing': '🟡', 
        'paused': '⏸️',
        'ended': '🔴'
      };
      console.log(`   ${statusEmoji[world.status] || '❓'} ${world.name} (${world.status})`);
    });
  } else {
    console.log('📭 Zatím žádné světy nevytvořeny');
    console.log('💡 Tip: Vytvořte nový svět přes admin panel a změňte jeho status na "active" pro testování editace');
  }
  console.log('');
});