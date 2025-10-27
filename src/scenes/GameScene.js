class GameScene extends Phaser.Scene {
    constructor() { super("GameScene"); }

    init(data) {
        this.player1Index = data.player1Index ?? 0;
        this.player2Index = data.player2Index ?? 1;
        this.mode = data.mode ?? "versus";
        this.selectedMap = data.map ?? "Mapa 1";
    }

    // Energy helpers: support a shared pool in cooperative mode
    getEnergy(player) {
        if (this.mode === 'cooperativo') return (this.sharedEnergy != null) ? this.sharedEnergy : 0;
        return player.energy || 0;
    }

    setEnergyFor(player, value) {
        const v = Math.max(0, Math.min(this.maxEN || 500, value));
        if (this.mode === 'cooperativo') this.sharedEnergy = v;
        else player.energy = v;
    }

    changeEnergyFor(player, delta) {
        const cur = this.getEnergy(player);
        this.setEnergyFor(player, cur + delta);
    }

    // Create invisible platforms/ground for a given map name
    createMapPlatforms(mapName, width, height) {
        // Instead of creating bodies directly here, store platform data and build from it.
        if (!this._platformData) this._platformData = [];
        this._platformData.length = 0; // clear

        if (mapName === 'Mapa 1') {
                    // Create a slight slope by splitting the ground into two segments with different Y

                    // Left ground (a bit higher) - nudged slightly down for better fit
                    this._platformData.push({ x: Math.round(width * 0.20), y: Math.round(height * 0.890), w: Math.round(width * 0.56), h: 40 });
                    // Right ground (a bit lower) to create inclination (keep as-is)
                    this._platformData.push({ x: Math.round(width * 0.72), y: Math.round(height * 0.92), w: Math.round(width * 0.56), h: 40 });

                    // Platforms near the left player: slight adjustments
                    // left-most near player (a bit lower than before)
                    this._platformData.push({ x: Math.round(width * 0.15), y: Math.round(height * 0.65), w: 160, h: 24 });
                    // platform above player: it was too high, move it down a bit (closer to ground)
                    this._platformData.push({ x: Math.round(width * 0.32), y: Math.round(height * 0.48), w: 160, h: 24 });

                    // Middle platform: move a bit to the left and keep it short
                    this._platformData.push({ x: Math.round(width * 0.58), y: Math.round(height * 0.850), w: 580, h: 90 });

                    // New small platform between the two players: higher than the red one but below the top flying platforms
                    this._platformData.push({ x: Math.round(width * 0.56), y: Math.round(height * 0.50), w: 120, h: 24 });

                    // Note: removed the far-right platform and the boat internal platform as requested
                } else {
                    this._platformData.push({ x: Math.round(width / 2), y: Math.round(height - 30), w: Math.round(width), h: 40 });
                }

                // Build the actual game objects from the data
                this.buildPlatformsFromData();
            }

            // Create static bodies and visuals from this._platformData
            buildPlatformsFromData() {
                // destroy previous groundGroup if present
                if (this.groundGroup) {
                    try {
                        this.groundGroup.clear(true, true);
                    } catch (e) { /* ignore */ }
                }
                this.groundGroup = this.physics.add.staticGroup();
                this._platformObjects = [];

                if (!this._platformData) this._platformData = [];

                this._platformData.forEach((pd, idx) => {
                    const rect = this.add.rectangle(pd.x, pd.y, pd.w, pd.h, 0x000000, 0).setOrigin(0.5);
                    this.physics.add.existing(rect, true);
                    this.groundGroup.add(rect);
                    this._platformObjects.push({ gobj: rect, data: pd });
                });

                // refresh player colliders if players exist
                try {
                    if (this._playerColliders && this._playerColliders.length) {
                        this._playerColliders.forEach(c => { try { this.physics.world.removeCollider(c); } catch (e) {} });
                    }
                    this._playerColliders = [];
                    if (this.players && this.players[0] && this.players[0].sprite) this._playerColliders.push(this.physics.add.collider(this.players[0].sprite, this.groundGroup));
                    if (this.players && this.players[1] && this.players[1].sprite) this._playerColliders.push(this.physics.add.collider(this.players[1].sprite, this.groundGroup));
                } catch (e) { /* ignore collider refresh errors */ }

                // If debug overlay is active, redraw (debug disabled in gameplay)
            }

            create() {
                const { width, height } = this.scale;
                // Fullscreen on start
                this.scale.startFullscreen();

                // Background map image (if selected) - always try to show it: if not loaded, load it at runtime
                if (this.selectedMap === 'Mapa 1') {
                    const addBgIfReady = (key = 'map1') => {
                        if (!this.textures.exists(key)) return false;
                        const bg = this.add.image(0, 0, key);
                        // store reference so we can nudge it live
                        this._bgImage = bg;
                        if (this._bgYOffset === undefined) this._bgYOffset = 48; // default nudge down so art sits correctly
                        // Prefer a cover-style scale (no distortion) so the image fills the screen.
                        // Then bottom-align the image so ground/art lines up with the bottom of the viewport.
                        try {
                            const imgW = bg.width || bg.texture ? bg.texture.source[0].width : null;
                            const imgH = bg.height || bg.texture ? bg.texture.source[0].height : null;
                            // Phaser stores textures differently depending on load path; fallback if unavailable
                            const texture = this.textures.get(key);
                            const source = texture && texture.source && texture.source[0] ? texture.source[0] : null;
                            const realW = (imgW && imgW > 0) ? imgW : (source ? source.width : null);
                            const realH = (imgH && imgH > 0) ? imgH : (source ? source.height : null);

                            if (realW && realH) {
                                const scale = Math.max(width / realW, height / realH); // cover
                                bg.setScale(scale);
                                // bottom-center origin so the bottom of the image matches the bottom of the viewport
                                bg.setOrigin(0.5, 1);
                                bg.x = width / 2;
                                bg.y = height + (this._bgYOffset || 0); // bottom aligned with offset
                            } else {
                                // fallback: fill the viewport (may stretch)
                                bg.setDisplaySize(width, height);
                                bg.setOrigin(0.5, 0.5);
                                bg.x = width / 2; bg.y = height / 2 + (this._bgYOffset || 0);
                            }
                        } catch (e) {
                            // final fallback: stretch to fit
                            try { bg.setDisplaySize(width, height); bg.setOrigin(0.5, 0.5); bg.x = width / 2; bg.y = height / 2; } catch (ee) { /* ignore */ }
                        }
                        bg.setScrollFactor(0).setDepth(-10);
                        return true;
                    };

                    // If texture already exists (preloaded), add immediately
                    if (!addBgIfReady('map1')) {
                        // Try to load map1 at runtime. We'll attempt relative path first, then absolute on one retry.
                        this._map1InGameRetry = false;
                        // once the file finishes loading, add the background
                        this.load.once('filecomplete-image-map1', () => { addBgIfReady('map1'); }, this);
                        // handle load errors: retry once with absolute path
                        this.load.once('loaderror', (file) => {
                            try {
                                if (file && file.key === 'map1' && !this._map1InGameRetry) {
                                    this._map1InGameRetry = true;
                                    this.load.image('map1', '/mapas/mapaprov.png');
                                    // ensure we add when this second attempt completes
                                    this.load.once('filecomplete-image-map1', () => { addBgIfReady('map1'); }, this);
                                    this.load.start();
                                }
                            } catch (e) { /* ignore */ }
                        }, this);
                        // start the loader for the first attempt
                        this.load.image('map1', 'mapas/mapaprov.png');
                        this.load.start();
                    }
                }

                // Debug controls: allow nudging background vertically with [ and ] keys
                // show current offset on screen
                this.input.keyboard.on('keydown-OPEN_BRACKET', () => {
                    this._bgYOffset = (this._bgYOffset || 0) - 8;
                    if (this._bgImage) this._bgImage.y = this._bgImage.y - 8;
                    if (this._bgOffsetText) this._bgOffsetText.setText(`bg offset: ${this._bgYOffset}`);
                });
                this.input.keyboard.on('keydown-CLOSE_BRACKET', () => {
                    this._bgYOffset = (this._bgYOffset || 0) + 8;
                    if (this._bgImage) this._bgImage.y = this._bgImage.y + 8;
                    if (this._bgOffsetText) this._bgOffsetText.setText(`bg offset: ${this._bgYOffset}`);
                });
                // fallback key names for some browsers
                this.input.keyboard.on('keydown-[', () => { this.input.keyboard.emit('keydown-OPEN_BRACKET'); });
                this.input.keyboard.on('keydown-]', () => { this.input.keyboard.emit('keydown-CLOSE_BRACKET'); });

                this._bgOffsetText = this.add.text(10, 10, `bg offset: ${this._bgYOffset || 0}`, { font: '16px Arial', color: '#ffffff' }).setDepth(1000).setScrollFactor(0);

                // Platform debug tools removed for gameplay stability
                this._debugMode = false;
                this._selectedPlatformIndex = 0;
                // NOTE: editing and visualizing platforms at runtime has been disabled.

                // Create invisible ground and platforms depending on selected map
                this.groundGroup = this.physics.add.staticGroup();
                this.createMapPlatforms(this.selectedMap, width, height);

                // Platform debug showing removed to prevent accidental runtime edits during gameplay

                // Players array with state
                this.players = [];

                // Create character sprites based on selected indices (player1Index, player2Index)
                const getTextureKeyForChar = (idx) => {
                    switch (idx) {
                        case 1: return 'sofia_caminar'; // Sofía
                        case 3: return 'pj4_quieta';    // Mario (pj4)
                        default: return `char${idx}_idle`; // otros (placeholders si no existen)
                    }
                };
                const p1KeyBase = getTextureKeyForChar(this.player1Index);
                const p2KeyBase = getTextureKeyForChar(this.player2Index);
                const validP1Key = this.textures.exists(p1KeyBase) ? p1KeyBase : (this.textures.exists('sofia_caminar') ? 'sofia_caminar' : p1KeyBase);
                const validP2Key = this.textures.exists(p2KeyBase) ? p2KeyBase : (this.textures.exists('sofia_caminar') ? 'sofia_caminar' : p2KeyBase);
                const p1Sprite = this.physics.add.sprite(200, height - 150, validP1Key).setCollideWorldBounds(true);
                const p2Sprite = this.physics.add.sprite(width - 200, height - 150, validP2Key).setCollideWorldBounds(true);

                [p1Sprite, p2Sprite].forEach(s => {
                    s.setBounce(0.05);
                    // force display size to 64x64 (sprites are 64x64 tiles)
                    try { s.setDisplaySize(64, 64); } catch (e) { /* ignore if not supported */ }
                    // adjust body size for 64x64 frames
                    if (s.body && s.body.setSize) s.body.setSize(40, 56).setOffset(12, 8);
                    // start idle animation if exists - play the anim only if it's intended to animate; otherwise show first frame
                    const animKey = `${s.texture.key}`;
                    // Do NOT autoplay the idle animation on spawn. Show the first frame only.
                    // Animations will be started by the update loop when input/actions occur.
                    try { s.setFrame(0); } catch (e) { /* ignore */ }
                });

                // Cambios: vida 1000, energía 500, contador de golpes y flag de daño
                this.players.push({
                    sprite: p1Sprite, health: 1000, energy: 500, blocking: false,
                    secondHealth: 500, // coop: secondary life pool (half)
                    immobilized: false,
                    chargingShot: false,
                    chargeAmount: 0,
                    lastShot: 0, lastPunch: 0, shotCD: 400, punchCD: 350, padIndex: 0,
                    hitCount: 0, beingHit: false, hitTimer: 0,
                    specialBuffer: [],
                    specialActive: false,
                    specialTimer: 0,
                    transformed: false,
                    transformTimer: 0,
                    transformBuffer: [],
                    transformActive: false,
                    explosionBuffer: [],
                    explosionPending: false,
                    explosionTimer: 0,
                    franchescaEnergyBuffer: [],
                    franchescaEnergyActive: false,
                    franchescaEnergyTimer: 0,
                    sofiaLaserBuffer: [],
                    sofiaTeleportBuffer: [],
                    sofiaMeteorBuffer: [],
                    franchescaJumpBuffer: [],
                    franchescaJumpPending: false,
                    franchescaJumpTimer: 0,
                    // propiedades para la habilidad de robo de Franchesca (iniciales)
                    franchescaLaserBuffer: [],
                    franchescaStolenAbility: null,       // { name, cost, source, timer }
                    franchescaStolenTimer: 0,
                    stolenAbilities: {},                  // { abilityName: true }
                    stolenAbilitiesTimers: {},            // { abilityName: timestamp }
           
                    franchescaUseBuffer: []               // buffer para usar habilidad robada (L,L,X)
                });

                this.players.push({
                    sprite: p2Sprite, health: 1000, energy: 500, blocking: false,
                    secondHealth: 500,
                    immobilized: false,
                    chargingShot: false,
                    chargeAmount: 0,
                    lastShot: 0, lastPunch: 0, shotCD: 400, punchCD: 350, padIndex: 1,
                    hitCount: 0, beingHit: false, hitTimer: 0,
                    specialBuffer: [], // Para secuencia de botones
                    specialActive: false,
                    specialTimer: 0,
                    transformed: false,
                    transformTimer: 0,
                    transformBuffer: [],
                    transformActive: false,
                    explosionBuffer: [],
                    explosionPending: false,
                    explosionTimer: 0,
                    franchescaEnergyBuffer: [],
                    franchescaEnergyActive: false,
                    franchescaEnergyTimer: 0,
                    sofiaLaserBuffer: [],
                    sofiaTeleportBuffer: [],
                    sofiaMeteorBuffer: [],
                    franchescaJumpBuffer: [],
                    franchescaJumpPending: false,
                    franchescaJumpTimer: 0,
                    // propiedades para la habilidad de robo de Franchesca (iniciales)
                    franchescaLaserBuffer: [],
                    franchescaStolenAbility: null,
                    franchescaStolenTimer: 0,
                    stolenAbilities: {},
                    stolenAbilitiesTimers: {},
                    franchescaUseBuffer: []
                });

                // Colliders
            // Colliders: players with groundGroup (invisible platforms)
            this.physics.add.collider(this.players[0].sprite, this.groundGroup);
            // If coop mode, share the same sprite between players and create reticle
            if (this.mode === 'cooperativo') {
                // Make player2 reference the same sprite as player1
                this.players[1].sprite = this.players[0].sprite;
                // Create a reticle that orbits around the single player
                try {
                    if (this.textures.exists('target')) {
                        this.reticle = this.add.image(this.players[0].sprite.x, this.players[0].sprite.y + 48, 'target');
                    } else {
                        this.reticle = this.add.circle(this.players[0].sprite.x, this.players[0].sprite.y + 48, 8, 0xffff00);
                    }
                    this.physics.add.existing(this.reticle);
                    if (this.reticle.body) this.reticle.body.setAllowGravity(false);
                } catch (e) { /* ignore */ }
            } else {
                this.physics.add.collider(this.players[1].sprite, this.groundGroup);
            }

                // Projectiles group
                this.projectiles = this.physics.add.group();

                // Projectile -> players overlap
                this.physics.add.overlap(
                    this.projectiles,
                    this.players[0].sprite,
                    (a, b) => this.handleProjectilePlayerOverlap(a, b, 0)
                );
                this.physics.add.overlap(
                    this.projectiles,
                    this.players[1].sprite,
                    (a, b) => this.handleProjectilePlayerOverlap(a, b, 1)
                );

                // Barras más largas
                const barY = 30;
                const barLength = 400;
                this.hpBars = [
                    this.add.rectangle(150, barY, barLength, 18, 0xff0000).setOrigin(0, 0.5),
                    this.add.rectangle(this.scale.width - 150, barY, barLength, 18, 0xff0000).setOrigin(1, 0.5)
                ];
                this.enBars = [
                    this.add.rectangle(150, barY + 28, barLength, 12, 0x00ccff).setOrigin(0, 0.5),
                    this.add.rectangle(this.scale.width - 150, barY + 28, barLength, 12, 0x00ccff).setOrigin(1, 0.5)
                ];

                // If cooperative mode: hide right-side player bars and add a small secondary HP bar below the main bar
                if (this.mode === 'cooperativo') {
                    try {
                        if (this.hpBars[1]) this.hpBars[1].setVisible(false);
                        if (this.enBars[1]) this.enBars[1].setVisible(false);
                    } catch (e) {}
                    // small secondary HP bar under main player 1 bars (half-life representation)
                    const smallWidth = barLength / 2;
                    this.smallHPBar = this.add.rectangle(150, barY + 46, smallWidth, 10, 0xff8800).setOrigin(0, 0.5);
                    this.smallHPBar.max = smallWidth;
                    // initialize shared energy pool for coop
                    this.maxEN = 500;
                    this.sharedEnergy = this.maxEN;
                }

                // Keyboard controls
                this.keysP1 = this.input.keyboard.addKeys({
                    up: "W", left: "A", right: "D", down: "S",
                    hit: "X", block: "C", charge: "V", shoot: "B"
                });
                this.keysP2 = this.input.keyboard.addKeys({
                    up: "UP", left: "LEFT", right: "RIGHT", down: "DOWN",
                    hit: "K", block: "L", charge: "O", shoot: "P"
                });

                // Gamepad connect listener: initialize flags
                this.input.gamepad.on('connected', pad => {
                    pad._leftPressed = pad._rightPressed = false;
                    pad._aPressed = pad._bPressed = false;
                    pad._lastButtons = [];
                });

            // small camera shake on hit
            // background color removed to allow map background to show
            }

            onProjectileHit(proj, hitPlayerIndex) {
                // soporte para proyectiles variados; usa proj.damage / proj.piercing
                if (!proj || !proj.active || !proj.texture) return;
                const key = proj.texture.key;
                if (key !== 'tex_bullet') return; // si luego agregas tex_fire o similares, agrega aquí
                const shooter = proj.shooter;
                if (shooter === hitPlayerIndex) return;
                const target = this.players[hitPlayerIndex];
                if (!target) { if (!proj.piercing) proj.destroy(); return; }

                const damage = (proj.damage != null) ? proj.damage : 20;

                // In cooperative mode, avoid damaging the shared player (friendly fire)
                if (this.mode === 'cooperativo') {
                    const shooterSprite = this.players[proj.shooter] && this.players[proj.shooter].sprite;
                    const hitSprite = target && target.sprite;
                    if (shooterSprite && hitSprite && shooterSprite === hitSprite) {
                        // friendly projectile - ignore
                        if (!proj.piercing) proj.destroy();
                        return;
                    }
                }

                // Delegate damage handling to central helper (handles secondary HP in coop)
                this.applyDamageToPlayer(hitPlayerIndex, damage);

                if (!proj.piercing) proj.destroy();
            }

        handleProjectilePlayerOverlap(a, b, hitPlayerIndex) {
                // Detecta cuál es la bala y cuál el jugador
                let proj;
                if (a && a.texture && a.texture.key === 'tex_bullet') {
                    proj = a;
                } else if (b && b.texture && b.texture.key === 'tex_bullet') {
                    proj = b;
                } else {
                    return; // Ninguno es proyectil, no hacer nada
                }
                this.onProjectileHit(proj, hitPlayerIndex);
            }

            // Central damage application helper. Handles cooperative secondary HP, immobilization and visual flags.
            applyDamageToPlayer(targetIndex, damage) {
                const target = this.players[targetIndex];
                if (!target) return;

                // In cooperative mode we prefer draining main health first, then secondary pool
                if (this.mode === 'cooperativo') {
                    if (target.health > 0) {
                        // subtract from main health
                        const prev = target.health;
                        target.health = Math.max(0, target.health - damage);
                        target.beingHit = true;
                        target.hitTimer = this.time.now + 300;
                        // if main just reached 0, set immobilized flag
                        if (prev > 0 && target.health === 0) {
                            target.immobilized = true;
                            // provide small feedback
                            this.cameras.main.flash(160, 255, 120, 120);
                        }
                    } else {
                        // drain secondary pool
                        target.secondHealth = Math.max(0, (target.secondHealth || 0) - damage);
                        target.beingHit = true;
                        target.hitTimer = this.time.now + 300;
                    }
                } else {
                    // normal mode: direct to main health
                    target.health = Math.max(0, target.health - damage);
                    target.beingHit = true;
                    target.hitTimer = this.time.now + 300;
                }
            }

            update(time) {
                for (let i = 0; i < 2; i++) {
                    // Si está siendo golpeado, verifica si ya terminó el stun
                    if (this.players[i].beingHit && time > this.players[i].hitTimer) {
                        this.players[i].beingHit = false;
                    }
                    // Daño constante por bloqueo si corresponde
                    const p = this.players[i];
                    if (p.blockingDamageEnd && time < p.blockingDamageEnd) {
                        const dt = this.game.loop.delta / 1000;
                        p.health = Math.max(0, p.health - (p.blockingDamagePerSecond || 0) * dt);
                    } else {
                        p.blockingDamageEnd = null;
                        p.blockingDamagePerSecond = 0;
                    }
                    this.updatePlayerInput(i, time);
                }

                // Check for game over (any player's health reaches 0) with a short cooldown so it can fire every match
                const now = time || this.time.now;
                if (now > (this._gameOverCooldownUntil || 0)) {
                    if (this.mode === 'cooperativo') {
                        // in coop we use the secondary pool: game over only when secondary pool depleted
                        const p0 = this.players[0];
                        if (p0 && (p0.secondHealth || 0) <= 0) {
                            this._gameOverCooldownUntil = now + 1000;
                            // treat player 1 as loser for payload; in coop both lose
                            try {
                                this.scene.launch('GameOver', {
                                winnerIndex: -1,
                                winnerChar: (this.player1Index || 0),
                                player1Index: this.player1Index,
                                player2Index: this.player2Index,
                                mode: this.mode
                                });
                            } catch (e) { console.warn('Failed to launch GameOver scene (coop):', e); }
                            try { this.scene.stop(); } catch (e) { console.warn('Failed to stop current scene after launching GameOver (coop):', e); }
                        }
                    } else {
                        if (this.players[0].health <= 0 || this.players[1].health <= 0) {
                            const loser = (this.players[0].health <= 0) ? 0 : 1;
                            const winner = 1 - loser;
                            // set cooldown 1s to avoid double-trigger
                            this._gameOverCooldownUntil = now + 1000;
                            // launch GameOver and stop this scene
                            try {
                                this.scene.launch('GameOver', {
                                winnerIndex: winner,
                                winnerChar: (winner === 0) ? this.player1Index : this.player2Index,
                                player1Index: this.player1Index,
                                player2Index: this.player2Index,
                                mode: this.mode
                                });
                            } catch (e) { console.warn('Failed to launch GameOver scene:', e); }
                            try { this.scene.stop(); } catch (e) { console.warn('Failed to stop current scene after launching GameOver:', e); }
                        }
                    }
                }

                // Barras ajustadas a vida/energía máxima
            const maxHP = 1000, maxEN = this.maxEN || 500, barLength = 400;
            this.hpBars[0].width = Math.max(0, (this.players[0].health / maxHP) * barLength);
            // energy bar: use shared pool in coop, otherwise per-player
            const en0 = (this.mode === 'cooperativo') ? (this.sharedEnergy || 0) : this.players[0].energy;
            this.enBars[0].width = Math.max(0, (en0 / maxEN) * barLength);
                if (this.mode === 'cooperativo') {
                    // hide/disable right bars and update small secondary HP bar
                    try {
                        if (this.hpBars[1]) this.hpBars[1].setVisible(false);
                        if (this.enBars[1]) this.enBars[1].setVisible(false);
                        const sec = this.players[0].secondHealth || 0;
                        const maxSec = 500; // second pool max
                        if (this.smallHPBar) this.smallHPBar.width = Math.max(0, (sec / maxSec) * this.smallHPBar.max);
                    } catch (e) { /* ignore UI errors */ }
                } else {
                    this.hpBars[1].width = Math.max(0, (this.players[1].health / maxHP) * barLength);
                    this.enBars[1].width = Math.max(0, (this.players[1].energy / maxEN) * barLength);
                }

                this.projectiles.children.iterate(proj => {
                    if (!proj) return;
                    if (proj.x < -50 || proj.x > this.scale.width + 50) proj.destroy();
                });

                // Manejo expiraciones de robos y la habilidad robada
                for (let i = 0; i < 2; i++) {
                    const p = this.players[i];
                    if (!p) continue;

                    // 1) Si este jugador tenía una habilidad robada (es ladrón), expirar su habilidad robada
                        if (p.franchescaStolenAbility && time > p.franchescaStolenAbility.timer) {
                        p.franchescaStolenAbility = null;
                        p.franchescaStolenTimer = 0;
                        // opcional: feedback - restaurar colores originales
                        if (p.sprite && p.sprite.clearTint) p.sprite.clearTint();
                        this.cameras.main.flash(120, 200, 255, 200);
                    }

                    // 2) Revisar habilidades específicas robadas del jugador (si le robaron)
                    for (const abilityName in p.stolenAbilitiesTimers) {
                        if (p.stolenAbilitiesTimers[abilityName] && time > p.stolenAbilitiesTimers[abilityName]) {
                            delete p.stolenAbilities[abilityName];
                            delete p.stolenAbilitiesTimers[abilityName];
                            // si ya no tiene habilidades robadas, restaurar tint
                            if (p.sprite && Object.keys(p.stolenAbilities).length === 0) {
                                // Restaurar colores originales
                                if (p.sprite.clearTint) p.sprite.clearTint();
                                this.cameras.main.flash(120, 255, 255, 255);
                            }
                        }
                    }
                }
            }

            updatePlayerInput(i, time) {
                const player = this.players[i];
                const sprite = player.sprite;
                if (!sprite || !sprite.body) return;

                // Character index for animation keys
                const charIndex = (i === 0) ? this.player1Index : this.player2Index;

                // Si está siendo golpeado, reproducir animación de 'hurt' y no permitir acciones
                if (player.beingHit) {
                    sprite.setVelocityX(0);
                    sprite.setTint(0xff4444); // Color de daño
                    const hurtKey = `char${charIndex}_hurt`;
                    if (this.anims.exists(hurtKey) && sprite.anims.currentAnim?.key !== hurtKey) {
                        sprite.play(hurtKey, false);
                    }
                    return;
                } else {
                    // limpiar tint cuando no está siendo golpeado
                    if (sprite.clearTint) sprite.clearTint();
                }

                const pad = getPad(player.padIndex, this);

                // CO-OP: player index 1 does not move the shared character; they control the reticle and shooting
                // If the main player is immobilized (secondary HP depleted state), they can't move or charge
                if (this.mode === 'cooperativo' && player.immobilized && i === 0) {
                    try { sprite.setVelocityX(0); } catch (e) {}
                    player.chargingShot = false;
                    player.chargeAmount = 0;
                    return;
                }
                if (this.mode === 'cooperativo' && i === 1) {
                    // P2 solo puede disparar cargado con botón X (botón 2 del gamepad Xbox), no quick ni teclado
                    if (!this.reticle) return;
                    const shooter = this.players[0];
                    const coopPlayer = player;
                    const dead = 0.15; const maxDist = 300;
                    if (pad && pad.connected) {
                        const ax = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
                        const ay = (pad.axes.length > 1) ? pad.axes[1].getValue() : 0;
                        if (Math.abs(ax) > dead || Math.abs(ay) > dead) {
                            this.reticle.x = shooter.sprite.x + ax * maxDist;
                            this.reticle.y = shooter.sprite.y + ay * maxDist;
                        }
                        if (!pad._lastButtons) pad._lastButtons = [];
                        const btn = pad.buttons;
                        // Solo permitir cargar/disparar con botón X (2) del gamepad
                        const chargeHeld = (btn[2] && btn[2].pressed);
                        const chargeReleased = ((!btn[2] || !btn[2].pressed) && pad._lastButtons[2]);
                        pad._lastButtons = btn.map(b => !!b.pressed);
                        // Solo permitir disparo cargado si ambos están lejos y ambos están pulsando su botón de bloquear/cargar
                        let canCharge = false;
                        if (chargeHeld && this.getEnergy(coopPlayer) > 0) {
                            const p1 = this.players[0];
                            const p2 = this.players[1];
                            const dist = Phaser.Math.Distance.Between(p1.sprite.x, p1.sprite.y, p2.sprite.x, p2.sprite.y);
                            const chargeDistance = 140;
                            // Ambos deben estar lejos
                            if (dist > chargeDistance) {
                                // Ambos deben estar pulsando su botón de bloquear/cargar (solo gamepad, no teclado)
                                const p1Pad = getPad(p1.padIndex, this);
                                const p2Pad = getPad(p2.padIndex, this);
                                const p1Block = p1Pad && p1Pad.connected && p1Pad.buttons[0] && p1Pad.buttons[0].pressed;
                                const p2Block = p2Pad && p2Pad.connected && p2Pad.buttons[0] && p2Pad.buttons[0].pressed;
                                if (p1Block && p2Block) {
                                    canCharge = true;
                                }
                            }
                        }
                        if (canCharge) {
                            if (!coopPlayer.chargingShot) { coopPlayer.chargingShot = true; coopPlayer.chargeAmount = 0; coopPlayer.chargeStart = time; }
                            const dt = this.game.loop.delta / 1000;
                            const energyRate = 160;
                            const consume = Math.min(this.getEnergy(coopPlayer), energyRate * dt);
                            this.changeEnergyFor(coopPlayer, -consume);
                            coopPlayer.chargeAmount = (coopPlayer.chargeAmount || 0) + consume;
                            try { if (this.reticle) this.reticle.setScale(1 + Math.min(1.2, coopPlayer.chargeAmount / 240)); } catch (e) {}
                        } else {
                            coopPlayer.chargingShot = false;
                            coopPlayer.chargeAmount = 0;
                        }
                        if (chargeReleased && coopPlayer.chargingShot) {
                            const baseDamage = 20;
                            const steps = Math.floor((coopPlayer.chargeAmount || 0) / 25);
                            const damage = baseDamage + (steps * 3);
                            coopPlayer.chargingShot = false; coopPlayer.chargeAmount = 0; coopPlayer.chargeStart = 0;
                            try { if (this.reticle) this.reticle.setScale(1); } catch (e) {}
                            if ((time - shooter.lastShot) > shooter.shotCD) {
                                shooter.lastShot = time;
                                this.spawnProjectile(0, damage);
                            }
                        }
                    } else {
                        // Solo permitir mover la retícula con teclado, pero NO disparar ni cargar con teclado
                        if (this.keysP2.left.isDown) this.reticle.x -= 4;
                        if (this.keysP2.right.isDown) this.reticle.x += 4;
                        if (this.keysP2.up.isDown) this.reticle.y -= 4;
                        if (this.keysP2.down.isDown) this.reticle.y += 4;
                        // Nunca permitir cargar/disparar con teclado
                        coopPlayer.chargingShot = false;
                        coopPlayer.chargeAmount = 0;
                    }
                    // P2 no puede disparar de ninguna otra forma
                    return;
                }

                let left = false, right = false, up = false, punch = false, blockOrCharge = false, shoot = false;

                if (pad && pad.connected) {
                    const axisX = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
                    const axisY = (pad.axes.length > 1) ? pad.axes[1].getValue() : 0;
                    left = axisX < -0.3;
                    right = axisX > 0.3;
                    // Jump when pushing the left stick up beyond a threshold
                    up = axisY < -0.6;
                    if (!pad._lastButtons) pad._lastButtons = [];
                    const btn = pad.buttons;
                    // Gamepad mapping changes:
                    // A (btn 0) => Block/Charge
                    // B (btn 1) => Shoot
                    // X (btn 2) => Punch
                    if (btn[2] && btn[2].pressed && !pad._lastButtons[2]) punch = true; // X stays punch
                    // En modo cooperativo, P1 no puede disparar
                    if (!(this.mode === 'cooperativo' && i === 0)) {
                        if (btn[1] && btn[1].pressed && !pad._lastButtons[1]) shoot = true; // B becomes shoot
                    }
                    blockOrCharge = btn[0] && btn[0].pressed; // A becomes block/charge
                    pad._lastButtons = btn.map(b => !!b.pressed);
                }

                // Keyboard fallback
                if (i === 0) {
                    left = left || this.keysP1.left.isDown;
                    right = right || this.keysP1.right.isDown;
                    if (Phaser.Input.Keyboard.JustDown(this.keysP1.up)) up = true;
                    if (Phaser.Input.Keyboard.JustDown(this.keysP1.hit)) punch = true;
                    blockOrCharge = blockOrCharge || this.keysP1.block.isDown; // Usar solo C para bloquear/cargar
                    // En modo cooperativo, P1 no puede disparar
                    if (!(this.mode === 'cooperativo' && i === 0)) {
                        if (Phaser.Input.Keyboard.JustDown(this.keysP1.shoot)) shoot = true;
                    }
                } else {
                    left = left || this.keysP2.left.isDown;
                    right = right || this.keysP2.right.isDown;
                    if (Phaser.Input.Keyboard.JustDown(this.keysP2.up)) up = true;
                    if (Phaser.Input.Keyboard.JustDown(this.keysP2.hit)) punch = true;
                    blockOrCharge = blockOrCharge || this.keysP2.block.isDown; // Usar solo L para bloquear/cargar
                    // En modo cooperativo, P2 no puede disparar con teclado
                    if (!(this.mode === 'cooperativo' && i === 1)) {
                        if (Phaser.Input.Keyboard.JustDown(this.keysP2.shoot)) shoot = true;
                    }
                }

                // --- NUEVO: Si está bloqueando o cargando, no puede hacer nada más ---
                // Determinar si está cerca del enemigo (para bloquear) o lejos (para cargar)
                const other = this.players[1 - i];
                const dist = Phaser.Math.Distance.Between(sprite.x, sprite.y, other.sprite.x, other.sprite.y);
                const chargeDistance = 140; // Si está a más de 140px, puede cargar

                if (blockOrCharge) {
                    const charIndexLocal = charIndex;
                    if (dist > chargeDistance) {
                        // Cargar energía (lejos)
                        player.blocking = false;
                        sprite.setTint(0x2222cc); // Color para cargar
                        // En modo cooperativo, solo cargar si ambos bloquean y ambos están lejos (solo con gamepad)
                        let canCharge = true;
                        if (this.mode === 'cooperativo') {
                            const p1 = this.players[0];
                            const p2 = this.players[1];
                            const dist = Phaser.Math.Distance.Between(p1.sprite.x, p1.sprite.y, p2.sprite.x, p2.sprite.y);
                            const chargeDistance = 140;
                            // Ambos deben estar lejos
                            if (dist > chargeDistance) {
                                // Ambos deben estar pulsando su botón de bloquear/cargar (solo gamepad, no teclado)
                                const p1Pad = getPad(p1.padIndex, this);
                                const p2Pad = getPad(p2.padIndex, this);
                                const p1Block = p1Pad && p1Pad.connected && p1Pad.buttons[0] && p1Pad.buttons[0].pressed;
                                const p2Block = p2Pad && p2Pad.connected && p2Pad.buttons[0] && p2Pad.buttons[0].pressed;
                                canCharge = p1Block && p2Block;
                            } else {
                                canCharge = false;
                            }
                        }
                        if (canCharge) {
                            this.changeEnergyFor(player, 2.0); // Carga más rápida
                        }
                        // intentar usar la textura específica de carga y mostrar frame 1
                        const chargeKey = `char${charIndexLocal}_charge`;
                        if (this.textures.exists(chargeKey)) {
                            try { sprite.setTexture(chargeKey); sprite.setFrame(1); } catch (e) { /* ignore */ }
                        } else {
                            try {
                                if (sprite.anims && sprite.anims.isPlaying) sprite.anims.stop();
                                // Sofía: no usar el spritesheet de caminar para cargar; mantener frame 0
                                if (charIndexLocal === 1) sprite.setFrame(0); else sprite.setFrame(1);
                            } catch (e) { /* ignore if no frame present */ }
                        }
                    } else {
                        // Bloquear (cerca)
                        player.blocking = true;
                        sprite.setTint(0x336633); // Color para bloquear
                        // intentar usar la textura específica de bloqueo y mostrar frame 1
                        const blockKey = `char${charIndexLocal}_block`;
                        if (this.textures.exists(blockKey)) {
                            try { sprite.setTexture(blockKey); sprite.setFrame(1); } catch (e) { /* ignore */ }
                        } else {
                            try {
                                if (sprite.anims && sprite.anims.isPlaying) sprite.anims.stop();
                                // Sofía: no usar el spritesheet de caminar para bloquear; mantener frame 0
                                if (charIndexLocal === 1) sprite.setFrame(0); else sprite.setFrame(1);
                            } catch (e) { /* ignore if no frame present */ }
                        }
                    }
                    // No puede moverse, saltar, disparar ni pegar
                    sprite.setVelocityX(0);
                    return;
                    } else {
                    player.blocking = false;
                    // restaurar colores originales y textura/frame por defecto
                    if (sprite.clearTint) sprite.clearTint();
                    const idleKey = `char${charIndex}_idle`;
                    if (this.textures.exists(idleKey)) {
                        try { sprite.setTexture(idleKey); sprite.setFrame(0); } catch (e) { /* ignore */ }
                    } else {
                        try { sprite.setFrame(0); } catch (e) { /* ignore */ }
                    }
                }

            // Movimiento solo si NO está bloqueando/cargando
                const speed = 220;
                if (left) { sprite.setVelocityX(-speed); sprite.flipX = true; }
                else if (right) { sprite.setVelocityX(speed); sprite.flipX = false; }
                else { sprite.setVelocityX(0); }

            // Saltar
                if (up && sprite.body.onFloor()) sprite.setVelocityY(-560);

            // Pequeña recarga pasiva
                this.changeEnergyFor(player, 0.05);

                // Puñetazo: 50 de daño
                if (punch && (time - player.lastPunch) > player.punchCD) {
                    player.lastPunch = time;
                    // lock punch animation visibility for 450ms so it's noticeable
                    player._lockedAction = 'punch';
                    player.actionLockUntil = time + 450;
                    this.doPunch(i);
                }

                // Disparo: 20 de daño, 100 energía
            if (shoot && (time - player.lastShot) > player.shotCD && this.getEnergy(player) >= 100) {
                    // En modo cooperativo, si P2 está cargando, prevenir que P1 dispare manualmente
                    if (!(this.mode === 'cooperativo' && this.players[1] && this.players[1].chargingShot)) {
                        player.lastShot = time;
                this.changeEnergyFor(player, -100);
                        // lock shoot animation visibility for 600ms so it's noticeable
                        player._lockedAction = 'shoot';
                        player.actionLockUntil = time + 600;
                        this.spawnProjectile(i);
                    } else {
                        // opcional: feedback mínimo (sin consumir energía ni disparar)
                        try { this.cameras.main.flash(80, 120, 120, 120); } catch (e) {}
                    }
                }

                // Animations: determine current action and play appropriate animation
            // Character index mapping (the chosen character index is in this.player1Index/2Index)
            let action = 'idle';
                if (player.blocking) action = 'block';
                else if (shoot) action = 'shoot';
                else if (punch) action = 'punch';
                else if (left || right) action = 'walk';
                else if (up && !sprite.body.onFloor()) action = 'jump';
                // Build anim key
                // If an action was locked (punch/shoot), respect it until timeout
                if (player.actionLockUntil && time < player.actionLockUntil) {
                    action = player._lockedAction || action;
                } else {
                    player._lockedAction = null;
                    player.actionLockUntil = 0;
                }

                const animKey = `char${charIndex}_${action}`;

                // Idle should be static: show first frame only instead of looping animation
                if (action === 'idle') {
                    if (sprite.anims && sprite.anims.isPlaying) sprite.anims.stop();
                    const idleKey = `char${charIndex}_idle`;
                    if (this.textures.exists(idleKey)) {
                        try { sprite.setTexture(idleKey); sprite.setFrame(0); } catch (e) { /* ignore */ }
                    } else {
                        try { sprite.setFrame(0); } catch (e) { /* ignore if frame not present */ }
                    }
                } else {
                    // Para Sofía (charIndex 1): usar solo el spritesheet de caminar para movimiento;
                    // en otras acciones, mantener pose base (frame 0) y no usar frames de caminar.
                    if (charIndex === 1) {
                        if (action === 'walk' && this.anims.exists('char1_walk')) {
                            try { sprite.anims.play('char1_walk', true); } catch (e) { /* ignore */ }
                        } else {
                            if (sprite.anims && sprite.anims.isPlaying) sprite.anims.stop();
                            try { sprite.setFrame(0); } catch (e) { /* ignore */ }
                        }
                    } else {
                        // Genérico para otros personajes
                        // Force texture to the action key if available (covers single-frame and spritesheet cases)
                        if (this.textures.exists(animKey)) {
                            try { sprite.setTexture(animKey); } catch (e) { /* ignore */ }
                        }

                        if (this.anims.exists(animKey)) {
                            // If punch/shoot is locked (we just triggered it), restart the anim so its full frames play
                            if ((action === 'punch' || action === 'shoot') && player.actionLockUntil && time < player.actionLockUntil) {
                                try { sprite.anims.play(animKey, false); } catch (e) { /* ignore */ }
                            } else {
                                // Normal behavior: don't restart if already playing
                                try { sprite.anims.play(animKey, true); } catch (e) { /* ignore */ }
                            }
                        } else {
                            // If no animation exists, try to show an action frame
                            try {
                                if (action === 'punch' || action === 'shoot') sprite.setFrame(1);
                                else sprite.setFrame(0);
                            } catch (e) { /* ignore if frames missing */ }
                        }
                    }
                }

                this.handleCharlesSpecial(i, time);
                this.handleCharlesTransform(i, time);
                this.handleCharlesExplosion(i, time);
                this.handleSofiaLaser(i, time);
                this.handleSofiaTeleport(i, time);
                this.handleSofiaMeteor(i, time);
                this.handleFranchescaEnergy(i, time);
                this.handleFranchescaJumpSlash(i, time);
                this.handleFranchescaSteal(i, time);
                // Permitir usar habilidad robada (L,L,X) si existe
                this.handleFranchescaUseStolen(i, time);
        
            // Habilidades de Mario
            this.handleMarioBeam(i, time);
            this.handleMarioSmash(i, time);
            this.handleMarioExplosion(i, time);
            }

            spawnProjectile(i) {
                // legacy signature: spawnProjectile(i) -> now supports optional damage via spawnProjectile(i, damage)
                const args = Array.prototype.slice.call(arguments);
                const explicitDamage = (args.length > 1) ? args[1] : null;
                const shooter = this.players[i];
                if (!shooter || !shooter.sprite) return;
                const sx = shooter.sprite.x + (shooter.sprite.flipX ? -30 : 30);
                const sy = shooter.sprite.y - 10;

                const proj = this.physics.add.sprite(sx, sy, this.textures.exists('tex_bullet') ? 'tex_bullet' : 'tex_bullet');
            proj.shooter = i;
            if (explicitDamage != null) proj.damage = explicitDamage;

                // Ensure shoot animation plays immediately for feedback
                const shooterChar = (i === 0) ? this.player1Index : this.player2Index;
                const shootKey = `char${shooterChar}_shoot`;
                if (this.anims.exists(shootKey)) {
                    try { shooter.sprite.anims.play(shootKey, true); } catch (e) { }
                } else if (this.textures.exists(shootKey)) {
                    try { shooter.sprite.setTexture(shootKey); shooter.sprite.setFrame(0); } catch (e) { }
                }

                this.projectiles.add(proj);
                proj.body.setAllowGravity(false);

                // If cooperative mode and reticle exists, fire toward the reticle position
                if (this.mode === 'cooperativo' && this.reticle) {
                    const angle = Phaser.Math.Angle.Between(sx, sy, this.reticle.x, this.reticle.y);
                    const speed = 600;
                    const vx = Math.cos(angle) * speed;
                    const vy = Math.sin(angle) * speed;
                    if (proj && proj.body) proj.body.setVelocity(vx, vy);
                    proj.rotation = angle;
                } else {
                    const velocity = shooter.sprite.flipX ? -450 : 450;
                    if (proj && proj.body) proj.body.setVelocityX(velocity);
                }

                this.time.delayedCall(2200, () => {
                    if (proj && proj.active) proj.destroy();
                });
            }

            doPunch(i) {
                // In cooperative mode we don't allow PvP punches
                if (this.mode === 'cooperativo') return;
                const attacker = this.players[i];
                const target = this.players[1 - i];
                const dist = Phaser.Math.Distance.Between(attacker.sprite.x, attacker.sprite.y, target.sprite.x, target.sprite.y);

                // Solo cuenta como golpe si el objetivo NO está siendo golpeado
                if (dist < 90 && !target.beingHit) {
                    // Si Charles está transformado
                    const isCharlesTrans = attacker.transformed && ((i === 0 && this.player1Index === 0) || (i === 1 && this.player2Index === 0));
                    if (!target.blocking) {
                        attacker.hitCount = (attacker.hitCount || 0) + 1;
                        // Daño aumentado si está transformado
                        const damage = isCharlesTrans ? 80 : 50;
                        target.health = Math.max(0, target.health - damage);

                        // Cada 3er golpe: golpe fuerte (solo si NO está bloqueando)
                        if (attacker.hitCount % 3 === 0) {
                            const dir = (target.sprite.x > attacker.sprite.x) ? 1 : -1;
                            const horizontal = 1800 * dir;
                            const vertical = -250;
                            target.sprite.setVelocity(horizontal, vertical);
                        }
                    } else {
                        // Si Charles está transformado y el objetivo bloquea, recibe daño constante por 1.5s
                        if (isCharlesTrans) {
                            // Aplica daño constante por 1.5 segundos (25 por segundo)
                            const now = this.time.now;
                            if (!target.blockingDamageEnd || now > target.blockingDamageEnd) {
                                target.blockingDamageEnd = now + 1500;
                            }
                            target.blockingDamagePerSecond = 25;
                        } else {
                            attacker.hitCount = 0;
                        }
                    }

                    // Marcar como siendo golpeado (stun)
                    target.beingHit = true;
                    target.hitTimer = this.time.now + 400;
                    const dir = (target.sprite.x > attacker.sprite.x) ? 1 : -1;
                    attacker.sprite.setVelocityX(120 * dir);
                    // Play punch animation immediately
                    const attChar = (i === 0) ? this.player1Index : this.player2Index;
                    const atkPunchKey = `char${attChar}_punch`;
                    if (this.anims.exists(atkPunchKey)) {
                        try { attacker.sprite.anims.play(atkPunchKey, true); } catch (e) { }
                    } else if (this.textures.exists(atkPunchKey)) {
                        try { attacker.sprite.setTexture(atkPunchKey); attacker.sprite.setFrame(0); } catch (e) { }
                    }
                }
            }

        handleCharlesSpecial(i, time) {
                if (this.mode === 'cooperativo') return; // disable PvP specials in coop
                const player = this.players[i];
                const sprite = player.sprite;
                // Solo Charles (índice 0 en el selector de personaje)
                if ((i === 0 && this.player1Index !== 0) || (i === 1 && this.player2Index !== 0)) return;

                // Si ya está activa la habilidad, aplicar daño continuo
                if (player.specialActive) {
                    if (time < player.specialTimer) {
                        // Daño continuo: 30 por segundo (cada frame)
                        const target = this.players[1 - i];
                        if (!target.blocking) {
                            const dt = this.game.loop.delta / 1000;
                            target.health = Math.max(0, target.health - 30 * dt);
                        }
                    } else {
                        player.specialActive = false;
                    }
                    return;
                }

                // Detectar secuencia: IZQ, DER, GOLPE (en menos de 1s entre cada uno)
                // Solo si tiene suficiente energía (150)
                if (player.energy < 150) {
                    player.specialBuffer = [];
                    return;
                }

                // Detectar teclas o gamepad
                let input = null;
                // Teclado
                if (i === 0) {
                    if (Phaser.Input.Keyboard.JustDown(this.keysP1.left)) input = "L";
                    if (Phaser.Input.Keyboard.JustDown(this.keysP1.right)) input = "R";
                    if (Phaser.Input.Keyboard.JustDown(this.keysP1.hit)) input = "X";
                } else {
                    if (Phaser.Input.Keyboard.JustDown(this.keysP2.left)) input = "L";
                    if (Phaser.Input.Keyboard.JustDown(this.keysP2.right)) input = "R";
                    if (Phaser.Input.Keyboard.JustDown(this.keysP2.hit)) input = "X";
                }
                // Gamepad
                const pad = getPad(player.padIndex, this);
                if (pad && pad.connected) {
                    const axisX = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
                    if (axisX < -0.7 && !pad._specialLeft) { input = "L"; pad._specialLeft = true; }
                    if (axisX > 0.7 && !pad._specialRight) { input = "R"; pad._specialRight = true; }
                    if (axisX > -0.7 && axisX < 0.7) { pad._specialLeft = pad._specialRight = false; }
                    if (pad.buttons[2] && pad.buttons[2].pressed && !pad._specialHit) { input = "X"; pad._specialHit = true; }
                    if (!(pad.buttons[2] && pad.buttons[2].pressed)) pad._specialHit = false;
                }

                // Buffer de secuencia
                if (input) {
                    const now = time;
                    if (player.specialBuffer.length === 0 || (now - (player.specialBuffer[player.specialBuffer.length - 1].t)) < 1000) {
                        player.specialBuffer.push({ k: input, t: now });
                        if (player.specialBuffer.length > 3) player.specialBuffer.shift();
                    } else {
                        player.specialBuffer = [{ k: input, t: now }];
                    }
                }

                // Verificar secuencia
                if (
                    player.specialBuffer.length === 3 &&
                    player.specialBuffer[0].k === "L" &&
                    player.specialBuffer[1].k === "R" &&
                    player.specialBuffer[2].k === "X"
                ) {
                    const target = this.players[1 - i];
                    const normalPunchDist = 90;
                    const specialDist = 180; // Un poco más de alcance que el golpe normal
                    const dist = Phaser.Math.Distance.Between(sprite.x, sprite.y, target.sprite.x, target.sprite.y);

                    if (dist <= specialDist && !target.blocking) {
                        // Gasta energía y activa la habilidad
                        player.energy = Math.max(0, player.energy - 150);
                        player.specialActive = true;
                        player.specialTimer = time + 3000; // 3 segundos de daño continuo

                        // Daño instantáneo y retroceso fuerte (pero no exagerado)
                        target.health = Math.max(0, target.health - 65);
                        const dir = (target.sprite.x > sprite.x) ? 1 : -1;
                        target.sprite.setVelocity(600 * dir, -120); // Empuje fuerte pero no extremo
                    } else if (dist > specialDist) {
                        // Si está lejos, Charles se lanza hacia el rival (dash fuerte)
                        const dir = (target.sprite.x > sprite.x) ? 1 : -1;
                        sprite.setVelocityX(900 * dir); // Dash rápido
                        // No activa la habilidad hasta estar cerca y repetir la secuencia
                    }
                    // Limpiar buffer siempre
                    player.specialBuffer = [];
                }
            }

        handleCharlesTransform(i, time) {
                const player = this.players[i];
                const sprite = player.sprite;
                // Solo Charles (índice 0 en el selector de personaje)
                if ((i === 0 && this.player1Index !== 0) || (i === 1 && this.player2Index !== 0)) return;

                // Si ya está transformado, controlar duración y efectos
                if (player.transformed) {
                    sprite.setTint(0xffcc00); // Color de transformación
                    player.blocking = false; // No puede bloquear
                        if (time > player.transformTimer) {
                        player.transformed = false;
                        if (sprite.clearTint) sprite.clearTint(); // Restaurar colores originales
                    }
                    return;
                }

                // Detectar secuencia: DERECHA, IZQ, GOLPE (en menos de 1s entre cada uno)
                if (this.getEnergy(player) < 300) {
                    player.transformBuffer = [];
                    return;
                }

                let input = null;
                // Teclado
                if (i === 0) {
                    if (Phaser.Input.Keyboard.JustDown(this.keysP1.right)) input = "R";
                    if (Phaser.Input.Keyboard.JustDown(this.keysP1.left)) input = "L";
                    if (Phaser.Input.Keyboard.JustDown(this.keysP1.hit)) input = "X";
                } else {
                    if (Phaser.Input.Keyboard.JustDown(this.keysP2.right)) input = "R";
                    if (Phaser.Input.Keyboard.JustDown(this.keysP2.left)) input = "L";
                    if (Phaser.Input.Keyboard.JustDown(this.keysP2.hit)) input = "X";
                }
                // Gamepad
                const pad = getPad(player.padIndex, this);
                if (pad && pad.connected) {
                    const axisX = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
                    if (axisX > 0.7 && !pad._transRight) { input = "R"; pad._transRight = true; }
                    if (axisX < -0.7 && !pad._transLeft) { input = "L"; pad._transLeft = true; }
                    if (axisX > -0.7 && axisX < 0.7) { pad._transRight = false; pad._transLeft = false; }
                    // Botón de golpe (X, index 2)
                    if (pad.buttons[2] && pad.buttons[2].pressed && !pad._transHit) { input = "X"; pad._transHit = true; }
                    if (!(pad.buttons[2] && pad.buttons[2].pressed)) pad._transHit = false;
                }

                // Buffer de secuencia
                if (input) {
                    const now = time;
                    if (player.transformBuffer.length === 0 || (now - (player.transformBuffer[player.transformBuffer.length - 1].t)) < 1000) {
                        player.transformBuffer.push({ k: input, t: now });
                        if (player.transformBuffer.length > 3) player.transformBuffer.shift();
                    } else {
                        player.transformBuffer = [{ k: input, t: now }];
                    }
                }

                // Verificar secuencia
                if (
                    player.transformBuffer.length === 3 &&
                    player.transformBuffer[0].k === "R" &&
                    player.transformBuffer[1].k === "L" &&
                    player.transformBuffer[2].k === "X"
                ) {
                    // Activar transformación
                    this.changeEnergyFor(player, -300);
                    player.transformed = true;
                    player.transformTimer = time + 8000; // Dura 8 segundos (ajusta si quieres)
                    player.transformBuffer = [];
                    // reproducir animación especial golpe-fuego si existe
                    const charIdx = (i === 0) ? this.player1Index : this.player2Index;
                    const key = `char${charIdx}_punch_fire`;
                    if (this.anims.exists(key)) {
                        try { sprite.anims.play(key, false); } catch (e) { /* ignore */ }
                    } else if (this.textures.exists(key)) {
                        try { sprite.setTexture(key); sprite.setFrame(0); } catch (e) { }
                    }
                }
            }

        handleCharlesExplosion(i, time) {
                if (this.mode === 'cooperativo') return; // disable PvP explosion in coop
                const player = this.players[i];
                const sprite = player.sprite;
                // Solo Charles (índice 0 en el selector de personaje)
                if ((i === 0 && this.player1Index !== 0) || (i === 1 && this.player2Index !== 0)) return;

                // Si la explosión está pendiente, verifica si debe explotar
                if (player.explosionPending && time > player.explosionTimer) {
                    player.explosionPending = false;
                    const target = this.players[1 - i];
                    this.cameras.main.flash(200, 255, 180, 0);

                    if (!target.blocking) {
                        target.health = Math.max(0, target.health - 90);
                        target.sprite.setVelocityY(-400);
                    } else {
                        target.health = Math.max(0, target.health - 30);
                        target.sprite.setVelocityY(-120);
                    }
                    return;
                }

                // Detectar secuencia: DERECHA, DERECHA, GOLPE (en menos de 1s entre cada uno)
                if (this.getEnergy(player) < 180) {
                    player.explosionBuffer = [];
                    return;
                }

                let input = null;
                // Teclado
                if (i === 0) {
                    if (Phaser.Input.Keyboard.JustDown(this.keysP1.right)) input = "R";
                    if (Phaser.Input.Keyboard.JustDown(this.keysP1.hit)) input = "X";
                } else {
                    if (Phaser.Input.Keyboard.JustDown(this.keysP2.right)) input = "R";
                    if (Phaser.Input.Keyboard.JustDown(this.keysP2.hit)) input = "X";
                }
                // Gamepad
                const pad = getPad(player.padIndex, this);
                if (pad && pad.connected) {
                    const axisX = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
                    if (axisX > 0.7 && !pad._explRight) { input = "R"; pad._explRight = true; }
                    if (axisX > -0.7 && axisX < 0.7) pad._explRight = false;
                    if (pad.buttons[2] && pad.buttons[2].pressed && !pad._explHit) { input = "X"; pad._explHit = true; }
                    if (!(pad.buttons[2] && pad.buttons[2].pressed)) pad._explHit = false;
                }

                // Buffer de secuencia
                if (input) {
                    const now = time;
                    if (player.explosionBuffer.length === 0 || (now - (player.explosionBuffer[player.explosionBuffer.length - 1].t)) < 1000) {
                        player.explosionBuffer.push({ k: input, t: now });
                        if (player.explosionBuffer.length > 3) player.explosionBuffer.shift();
                    } else {
                        player.explosionBuffer = [{ k: input, t: now }];
                    }
                }

                // Verificar secuencia
                if (
                    player.explosionBuffer.length === 3 &&
                    player.explosionBuffer[0].k === "R" &&
                    player.explosionBuffer[1].k === "R" &&
                    player.explosionBuffer[2].k === "X"
                ) {
                    this.changeEnergyFor(player, -180);
                    player.explosionPending = true;
                    player.explosionTimer = time + 1500; // 1.5 segundos después
                    player.explosionBuffer = [];
                    // reproducir animación de patada en Charles (kick)
                    const charIdx2 = (i === 0) ? this.player1Index : this.player2Index;
                    const kickKey = `char${charIdx2}_kick`;
                    if (this.anims.exists(kickKey)) {
                        try { sprite.anims.play(kickKey, false); } catch (e) { }
                    } else if (this.textures.exists(kickKey)) {
                        try { sprite.setTexture(kickKey); sprite.setFrame(0); } catch (e) { }
                    }
                }
            }

        handleSofiaLaser(i, time) {
                if (this.mode === 'cooperativo') return; // disable PvP Sofia laser in coop
                const player = this.players[i];
                const sprite = player.sprite;

                // Solo Sofía (índice 1 en el selector de personaje)
                if ((i === 0 && this.player1Index !== 1) || (i === 1 && this.player2Index !== 1)) return;

                if (!player.sofiaLaserBuffer) player.sofiaLaserBuffer = [];
                if (this.getEnergy(player) < 100) {
                    player.sofiaLaserBuffer = [];
                    return;
                }

                let input = null;
                // Teclado
                if (i === 0) {
                    if (Phaser.Input.Keyboard.JustDown(this.keysP1.left)) input = "L";
                    if (Phaser.Input.Keyboard.JustDown(this.keysP1.right)) input = "R";
                    if (Phaser.Input.Keyboard.JustDown(this.keysP1.hit)) input = "X";
                } else {
                    if (Phaser.Input.Keyboard.JustDown(this.keysP2.left)) input = "L";
                    if (Phaser.Input.Keyboard.JustDown(this.keysP2.right)) input = "R";
                    if (Phaser.Input.Keyboard.JustDown(this.keysP2.hit)) input = "X";
                }
                // Gamepad
                const pad = getPad(player.padIndex, this);
                if (pad && pad.connected) {
                    const axisX = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
                    if (axisX < -0.7 && !pad._sofiaLeft) { input = "L"; pad._sofiaLeft = true; }
                    if (axisX > 0.7 && !pad._sofiaRight) { input = "R"; pad._sofiaRight = true; }
                    if (axisX > -0.7 && axisX < 0.7) { pad._sofiaLeft = pad._sofiaRight = false; }
                    if (pad.buttons[2] && pad.buttons[2].pressed && !pad._sofiaHit) { input = "X"; pad._sofiaHit = true; }
                    if (!(pad.buttons[2] && pad.buttons[2].pressed)) pad._sofiaHit = false;
                }

                if (input) {
                    const now = time;
                    if (player.sofiaLaserBuffer.length === 0 || (now - (player.sofiaLaserBuffer[player.sofiaLaserBuffer.length - 1].t)) < 1000) {
                        player.sofiaLaserBuffer.push({ k: input, t: now });
                        if (player.sofiaLaserBuffer.length > 3) player.sofiaLaserBuffer.shift();
                    } else {
                        player.sofiaLaserBuffer = [{ k: input, t: now }];
                    }
                }

                // Verifica la secuencia
                if (
                    player.sofiaLaserBuffer.length === 3 &&
                    player.sofiaLaserBuffer[0].k === "L" &&
                    player.sofiaLaserBuffer[1].k === "R" &&
                    player.sofiaLaserBuffer[2].k === "X"
                ) {
                    // Gasta energía y dispara el láser
                    this.changeEnergyFor(player, -100);
                    const target = this.players[1 - i];

                    // Efecto visual: línea láser
                    const laser = this.add.line(
                        0, 0,
                        sprite.x, sprite.y,
                        target.sprite.x, target.sprite.y,
                        0x00ffff
                    ).setOrigin(0, 0).setLineWidth(6);

                    this.time.delayedCall(180, () => { if (laser && laser.scene) laser.destroy(); });

                    // Daño y atrae al enemigo hacia Sofía
                    if (!target.blocking) {
                        target.health = Math.max(0, target.health - 10);

                        // Teletransporta al enemigo cerca de Sofía
                        const offset = 60;
                        let newX = sprite.x;
                        if (target.sprite.x < sprite.x) {
                            newX = sprite.x - offset;
                        } else {
                            newX = sprite.x + offset;
                        }
                        target.sprite.x = newX;
                        target.sprite.y = sprite.y;
                        target.sprite.setVelocity(0, 0);
                    }

                    player.sofiaLaserBuffer = [];
                }
            }

        handleSofiaTeleport(i, time) {
                if (this.mode === 'cooperativo') return; // disable PvP Sofia teleport in coop
                const player = this.players[i];
                const sprite = player.sprite;

                // Solo Sofía (índice 1 en el selector de personaje)
                if ((i === 0 && this.player1Index !== 1) || (i === 1 && this.player2Index !== 1)) return;

                if (!player.sofiaTeleportBuffer) player.sofiaTeleportBuffer = [];
                if (player.energy < 100) {
                    player.sofiaTeleportBuffer = [];
                    return;
                }

                let input = null;
                // Teclado
                if (i === 0) {
                    if (Phaser.Input.Keyboard.JustDown(this.keysP1.right)) input = "R";
                    if (Phaser.Input.Keyboard.JustDown(this.keysP1.left)) input = "L";
                    if (Phaser.Input.Keyboard.JustDown(this.keysP1.hit)) input = "X";
                } else {
                    if (Phaser.Input.Keyboard.JustDown(this.keysP2.right)) input = "R";
                    if (Phaser.Input.Keyboard.JustDown(this.keysP2.left)) input = "L";
                    if (Phaser.Input.Keyboard.JustDown(this.keysP2.hit)) input = "X";
                }
                // Gamepad
                const pad = getPad(player.padIndex, this);
                if (pad && pad.connected) {
                    const axisX = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
                    if (axisX > 0.7 && !pad._sofiaTRight) { input = "R"; pad._sofiaTRight = true; }
                    if (axisX < -0.7 && !pad._sofiaTLeft) { input = "L"; pad._sofiaTLeft = true; }
                    if (axisX > -0.7 && axisX < 0.7) { pad._sofiaTLeft = pad._sofiaTRight = false; }
                    if (pad.buttons[2] && pad.buttons[2].pressed && !pad._sofiaTHit) { input = "X"; pad._sofiaTHit = true; }
                    if (!(pad.buttons[2] && pad.buttons[2].pressed)) pad._sofiaTHit = false;
                }

                if (input) {
                    const now = time;
                    if (player.sofiaTeleportBuffer.length === 0 || (now - (player.sofiaTeleportBuffer[player.sofiaTeleportBuffer.length - 1].t)) < 1000) {
                        player.sofiaTeleportBuffer.push({ k: input, t: now });
                        if (player.sofiaTeleportBuffer.length > 3) player.sofiaTeleportBuffer.shift();
                    } else {
                        player.sofiaTeleportBuffer = [{ k: input, t: now }];
                    }
                }

                // Verifica la secuencia
                if (
                    player.sofiaTeleportBuffer.length === 3 &&
                    player.sofiaTeleportBuffer[0].k === "R" &&
                    player.sofiaTeleportBuffer[1].k === "L" &&
                    player.sofiaTeleportBuffer[2].k === "X"
                ) {
                    // Gasta energía y teletransporta
                    this.changeEnergyFor(player, -100);
                    const target = this.players[1 - i];

                    // Teletransporta a un lado del enemigo
                    const offset = 60;
                    let newX = target.sprite.x;
                    if (sprite.x < target.sprite.x) {
                        newX = target.sprite.x - offset;
                    } else {
                        newX = target.sprite.x + offset;
                    }
                    sprite.x = newX;
                    sprite.y = target.sprite.y;
                    sprite.setVelocity(0, 0);

                    // Daño si el enemigo no está bloqueando
                    if (!target.blocking) {
                        target.health = Math.max(0, target.health - 30);
                    }

                    // Efecto visual simple (flash)
                    this.cameras.main.flash(120, 0, 255, 255);

                    player.sofiaTeleportBuffer = [];
                }
            }

        handleSofiaMeteor(i, time) {
                if (this.mode === 'cooperativo') return; // disable PvP Sofia meteor in coop
                const player = this.players[i];
                const sprite = player.sprite;

                // Solo Sofía (índice 1 en el selector de personaje)
                if ((i === 0 && this.player1Index !== 1) || (i === 1 && this.player2Index !== 1)) return;

                if (!player.sofiaMeteorBuffer) player.sofiaMeteorBuffer = [];
                if (this.getEnergy(player) < 250) {
                    player.sofiaMeteorBuffer = [];
                    return;
                }

                let input = null;
                // Teclado
                if (i === 0) {
                    if (Phaser.Input.Keyboard.JustDown(this.keysP1.right)) input = "R";
                    if (Phaser.Input.Keyboard.JustDown(this.keysP1.hit)) input = "X";
                } else {
                    if (Phaser.Input.Keyboard.JustDown(this.keysP2.right)) input = "R";
                    if (Phaser.Input.Keyboard.JustDown(this.keysP2.hit)) input = "X";
                }
                // Gamepad
                const pad = getPad(player.padIndex, this);
                if (pad && pad.connected) {
                    const axisX = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
                    if (axisX > 0.7 && !pad._sofiaMRight) { input = "R"; pad._sofiaMRight = true; }
                    if (axisX > -0.7 && axisX < 0.7) pad._sofiaMRight = false;
                    if (pad.buttons[2] && pad.buttons[2].pressed && !pad._sofiaMHit) { input = "X"; pad._sofiaMHit = true; }
                    if (!(pad.buttons[2] && pad.buttons[2].pressed)) pad._sofiaMHit = false;
                }

                if (input) {
                    const now = time;
                    if (player.sofiaMeteorBuffer.length === 0 || (now - (player.sofiaMeteorBuffer[player.sofiaMeteorBuffer.length - 1].t)) < 1000) {
                        player.sofiaMeteorBuffer.push({ k: input, t: now });
                        if (player.sofiaMeteorBuffer.length > 3) player.sofiaMeteorBuffer.shift();
                    } else {
                        player.sofiaMeteorBuffer = [{ k: input, t: now }];
                    }
                }

                // Verifica la secuencia
                if (
                    player.sofiaMeteorBuffer.length === 3 &&
                    player.sofiaMeteorBuffer[0].k === "R" &&
                    player.sofiaMeteorBuffer[1].k === "R" &&
                    player.sofiaMeteorBuffer[2].k === "X"
                ) {
                    // Gasta energía y lanza el meteorito
                    this.changeEnergyFor(player, -250);
                    const target = this.players[1 - i];

                    // Efecto visual: círculo rojo descendiendo (meteorito)
                    const meteor = this.add.circle(target.sprite.x, target.sprite.y - 400, 38, 0xff3300).setDepth(10);
                    this.tweens.add({
                        targets: meteor,
                        y: target.sprite.y,
                        duration: 500,
                        ease: 'Quad.easeIn',
                        onComplete: () => {
                            // Daño si el enemigo no está bloqueando
                            if (!target.blocking) {
                                target.health = Math.max(0, target.health - 150);
                                target.sprite.setVelocityY(-500);
                            }
                            // Efecto de impacto
                            this.cameras.main.shake(200, 0.03);
                            meteor.destroy();
                        }
                    });

                    player.sofiaMeteorBuffer = [];
                }
            }
        }

        handleSofiaRobo(i, time) {
            if (this.mode === 'cooperativo') return; // disable PvP Sofia robo in coop
            const player = this.players[i];
            const sprite = player.sprite;
            if ((i === 0 && this.player1Index !== 1) || (i === 1 && this.player2Index !== 1)) return;
            // check two buffers: laser and teleport sequences to detect L,L,X or R,R,X
            let roboTriggered = false;
            function check(buf) { return buf && buf.length === 3 && ((buf[0].k === 'L' && buf[1].k === 'L' && buf[2].k === 'X') || (buf[0].k === 'R' && buf[1].k === 'R' && buf[2].k === 'X')); }
            if (check(player.sofiaLaserBuffer) || check(player.sofiaTeleportBuffer) || check(player.sofiaMeteorBuffer)) roboTriggered = true;
            if (roboTriggered) {
                const charIdx = (i === 0) ? this.player1Index : this.player2Index;
                const roboKey = `char${charIdx}_robo`;
                if (this.anims.exists(roboKey)) {
                    try { sprite.anims.play(roboKey, false); } catch (e) { }
                } else if (this.textures.exists(roboKey)) {
                    try { sprite.setTexture(roboKey); sprite.setFrame(0); } catch (e) { }
                }
                // clear buffers
                if (player.sofiaLaserBuffer) player.sofiaLaserBuffer = [];
                if (player.sofiaTeleportBuffer) player.sofiaTeleportBuffer = [];
            }
        }

        handleFranchescaEnergy(i, time) {
            if (this.mode === 'cooperativo') return; // disable PvP Franchesca energy attacks in coop
            const player = this.players[i];
            const sprite = player.sprite;

                // Solo Franchesca (índice 2 en el selector de personaje)
                if ((i === 0 && this.player1Index !== 2) || (i === 1 && this.player2Index !== 2)) return;

                // Detectar si el botón de golpear está pulsado
                let punchHeld = false;
                // Teclado
                if (i === 0) punchHeld = this.keysP1.hit.isDown;
                else punchHeld = this.keysP2.hit.isDown;
                // Gamepad
                const pad = getPad(player.padIndex, this);
                if (pad && pad.connected && pad.buttons[2]) punchHeld = punchHeld || pad.buttons[2].pressed;

                // Si la habilidad está activa, aplica daño constante y consume energía
                if (player.franchescaEnergyActive) {
                    // No puede moverse mientras la habilidad está activa
                    sprite.setVelocityX(0);

                    if (player.energy >= 100 * (this.game.loop.delta / 1000)) {
                        player.energy = Math.max(0, player.energy - 100 * (this.game.loop.delta / 1000));
                        const target = this.players[1 - i];
                        const dist = Phaser.Math.Distance.Between(sprite.x, sprite.y, target.sprite.x, target.sprite.y);
                        // SOLO daña si el enemigo NO está bloqueando
                        if (dist <= 200 && !target.blocking) {
                            const dt = this.game.loop.delta / 1000;
                            target.health = Math.max(0, target.health -   15 * dt);
                        }
                        // Efecto visual: círculo de energía
                        if (!player._energyCircle || !player._energyCircle.scene) {
                            player._energyCircle = this.add.circle(sprite.x, sprite.y, 200, 0xff00cc, 0.13).setDepth(8);
                        } else {
                            player._energyCircle.x = sprite.x;
                            player._energyCircle.y = sprite.y;
                        }

                        // Si suelta el botón, programa desactivación en 0.7s
                        if (!punchHeld) {
                            if (!player.franchescaEnergyDeactivateTime) {
                                player.franchescaEnergyDeactivateTime = time + 700;
                            }
                        } else {
                            player.franchescaEnergyDeactivateTime = null;
                        }

                        // Termina si se queda sin energía o pasa el tiempo de desactivación
                        if (player.energy <= 0 || (player.franchescaEnergyDeactivateTime && time > player.franchescaEnergyDeactivateTime)) {
                            player.franchescaEnergyActive = false;
                            player.franchescaEnergyDeactivateTime = null;
                            if (player._energyCircle && player._energyCircle.scene) player._energyCircle.destroy();
                        }
                    } else {
                        player.franchescaEnergyActive = false;
                        player.franchescaEnergyDeactivateTime = null;
                        if (player._energyCircle && player._energyCircle.scene) player._energyCircle.destroy();
                    }
                    return;
                }

                // Detectar secuencia: IZQ, DER, GOLPE (en menos de 1s entre cada uno)
                if (player.energy < 100) {
                    player.franchescaEnergyBuffer = [];
                    return;
                }

                let input = null;
                // Teclado
                if (i === 0) {
                    if (Phaser.Input.Keyboard.JustDown(this.keysP1.left)) input = "L";
                    if (Phaser.Input.Keyboard.JustDown(this.keysP1.right)) input = "R";
                    if (Phaser.Input.Keyboard.JustDown(this.keysP1.hit)) input = "X";
                } else {
                    if (Phaser.Input.Keyboard.JustDown(this.keysP2.left)) input = "L";
                    if (Phaser.Input.Keyboard.JustDown(this.keysP2.right)) input = "R";
                    if (Phaser.Input.Keyboard.JustDown(this.keysP2.hit)) input = "X";
                }
                // Gamepad
                if (pad && pad.connected) {
                    const axisX = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
                    if (axisX < -0.7 && !pad._franLeft) { input = "L"; pad._franLeft = true; }
                    if (axisX > 0.7 && !pad._franRight) { input = "R"; pad._franRight = true; }
                    if (axisX > -0.7 && axisX < 0.7) { pad._franLeft = pad._franRight = false; }
                    if (pad.buttons[2] && pad.buttons[2].pressed && !pad._franHit) { input = "X"; pad._franHit = true; }
                    if (!(pad.buttons[2] && pad.buttons[2].pressed)) pad._franHit = false;
                }

                if (input) {
                    const now = time;
                    if ( player.franchescaEnergyBuffer.length === 0 || (now - (player.franchescaEnergyBuffer[player.franchescaEnergyBuffer.length - 1].t)) < 1000) {
                        player.franchescaEnergyBuffer.push({ k: input, t: now });
                        if (player.franchescaEnergyBuffer.length > 3) player.franchescaEnergyBuffer.shift();
                    } else {
                        player.franchescaEnergyBuffer = [{ k: input, t: now }];
                    }
                }

                // Verifica la secuencia
                if (
                    player.franchescaEnergyBuffer.length === 3 &&
                    player.franchescaEnergyBuffer[0].k === "L" &&
                    player.franchescaEnergyBuffer[1].k === "R" &&
                    player.franchescaEnergyBuffer[2].k === "X"
                ) {
                    // Activa la habilidad
                    player.franchescaEnergyActive = true;
                    player.franchescaEnergyDeactivateTime = null;
                    player.franchescaEnergyBuffer = [];
                }
        }

        handleFranchescaJumpSlash(i, time) {
            const player = this.players[i];
            const sprite = player.sprite;

       
                // Solo Franchesca (índice 2 en el selector de personaje)
                if ((i === 0 && this.player1Index !== 2) || (i === 1 && this.player2Index !== 2)) return;

                // Si la habilidad está pendiente, no puede moverse ni hacer nada
                if (player.franchescaJumpPending) {
                    sprite.setVelocityX(0);
                    // Espera el timer para el corte
                    if (time > player.franchescaJumpTimer) {
                        player.franchescaJumpPending = false;
                        // Ataque en área
                        const target = this.players[1 - i];
                        const dist = Phaser.Math.Distance.Between(sprite.x, sprite.y, target.sprite.x, target.sprite.y);
                        // Efecto visual: círculo de corte
                        const slashCircle = this.add.circle(sprite.x, sprite.y, 300, 0xff00cc, 0.18).setDepth(9);
                        this.cameras.main.shake(180, 0.02);

                        // Daño si el enemigo no está bloqueando
                        if (dist <= 300 && !target.blocking) {
                            target.health = Math.max(0, target.health - 250);
                        }

                        // Eliminar el círculo después de 0.4s
                        this.time.delayedCall(400, () => {
                            if (slashCircle && slashCircle.scene) slashCircle.destroy();
                        });

                        if (sprite.clearTint) sprite.clearTint(); // Restaurar colores originales
                    }
                    return;
                }

                // Detectar secuencia: DERECHA, IZQUIERDA, GOLPE (en menos de 1s entre cada uno)
                if (player.energy < 250) {
                    player.franchescaJumpBuffer = [];
                    return;
                }

                let input = null;
                // Teclado
                if (i === 0) {
                    if (Phaser.Input.Keyboard.JustDown(this.keysP1.right)) input = "R";
                    if (Phaser.Input.Keyboard.JustDown(this.keysP1.left)) input = "L";
                    if (Phaser.Input.Keyboard.JustDown(this.keysP1.hit)) input = "X";
                } else {
                    if (Phaser.Input.Keyboard.JustDown(this.keysP2.right)) input = "R";
                    if (Phaser.Input.Keyboard.JustDown(this.keysP2.left)) input = "L";
                    if (Phaser.Input.Keyboard.JustDown(this.keysP2.hit)) input = "X";
                }
                // Gamepad
                const pad = getPad(player.padIndex, this);
                if (pad && pad.connected) {
                    const axisX = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
                    if (axisX > 0.7 && !pad._franJumpRight) { input = "R"; pad._franJumpRight = true; }
                    if (axisX < -0.7 && !pad._franJumpLeft) { input = "L"; pad._franJumpLeft = true; }
                    if (axisX > -0.7 && axisX < 0.7) { pad._franJumpLeft = pad._franJumpRight = false; }
                    if (pad.buttons[2] && pad.buttons[2].pressed && !pad._franJumpHit) { input = "X"; pad._franJumpHit = true; }
                    if (!(pad.buttons[2] && pad.buttons[2].pressed)) pad._franJumpHit = false;
                }

                if (input) {
                    const now = time;
                    if (player.franchescaJumpBuffer.length === 0 || (now - (player.franchescaJumpBuffer[player.franchescaJumpBuffer.length - 1].t)) < 1000) {
                        player.franchescaJumpBuffer.push({ k: input, t: now });
                        if (player.franchescaJumpBuffer.length > 3) player.franchescaJumpBuffer.shift();
                    } else {
                        player.franchescaJumpBuffer = [{ k: input, t: now }];
                    }
                }

                // Verifica la secuencia
                if (
                    player.franchescaJumpBuffer.length === 3 &&
                    player.franchescaJumpBuffer[0].k === "R" &&
                    player.franchescaJumpBuffer[1].k === "L" &&
                    player.franchescaJumpBuffer[2].k === "X"
                ) {
                    // Gasta energía y realiza el salto
                    player.energy = Math.max(0, player.energy - 250);
                    player.franchescaJumpPending = true;
                    player.franchescaJumpTimer = time + 700; // 0.7 segundos de salto antes del corte
                    sprite.setVelocityY(-520); // Salto rápido
                    sprite.setTint(0xff99ff); // Color especial durante la habilidad
                    player.franchescaJumpBuffer = [];
                }
            }
        }

        // --- NUEVO: Habilidad de robo de Franchesca (DER, DER, GOLPE) ---
        handleFranchescaSteal(i, time) {
            const player = this.players[i];
            const sprite = player.sprite;
            // Sólo Franchesca (índice 2)
            if ((i === 0 && this.player1Index !== 2) || (i === 1 && this.player2Index !== 2)) return;

                if (!player.franchescaLaserBuffer) player.franchescaLaserBuffer = [];
                if (player.energy < 300) { player.franchescaLaserBuffer = []; return; }

                let input = null;
                // Teclado
                if (i === 0) {
                    if (Phaser.Input.Keyboard.JustDown(this.keysP1.right)) input = "R";
                    if (Phaser.Input.Keyboard.JustDown(this.keysP1.hit)) input = "X";
                } else {
                    if (Phaser.Input.Keyboard.JustDown(this.keysP2.right)) input = "R";
                    if (Phaser.Input.Keyboard.JustDown(this.keysP2.hit)) input = "X";
                }

                // Gamepad
                const pad = getPad(player.padIndex, this);
                if (pad && pad.connected) {
                    const axisX = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
                    if (axisX > 0.7 && !pad._franStealRight) { input = "R"; pad._franStealRight = true; }
                    if (axisX > -0.7 && axisX < 0.7) pad._franStealRight = false;
                    if (pad.buttons[2] && pad.buttons[2].pressed && !pad._franStealHit) { input = "X"; pad._franStealHit = true; }
                    if (!(pad.buttons[2] && pad.buttons[2].pressed)) pad._franStealHit = false;
                }

                if (input) {
                    const now = time;
                    if (player.franchescaLaserBuffer.length === 0 || (now - (player.franchescaLaserBuffer[player.franchescaLaserBuffer.length - 1].t)) < 1000) {
                        player.franchescaLaserBuffer.push({ k: input, t: now });
                        if (player.franchescaLaserBuffer.length > 3) player.franchescaLaserBuffer.shift();
                    } else {
                        player.franchescaLaserBuffer = [{ k: input, t: now }];
                    }
                }

                // Define lista de habilidades robables del objetivo (nombre, coste)
                const target = this.players[1 - i];
                const stealable = [];
                // Charles (0)
                if (this.player1Index === 0 || this.player2Index === 0) { /* not used */ }
                // construir según target character
                const targetCharIndex = (1 - i) === 0 ? this.player1Index : this.player2Index;
                if (targetCharIndex === 0) { // Charles
                    stealable.push({ id: 'charSpecial', cost: 150 });
                    stealable.push({ id: 'charTransform', cost: 300 });
                    stealable.push({ id: 'charExplosion', cost: 180 });
                } else if (targetCharIndex === 1) { // Sofía
                    stealable.push({ id: 'sofiaLaser', cost: 100 });
                    stealable.push({ id: 'sofiaTeleport', cost: 100 });
                    stealable.push({ id: 'sofiaMeteor', cost: 250 });
                } else if (targetCharIndex === 2) { // Franchesca
                    stealable.push({ id: 'franEnergy', cost: 100 });
                    stealable.push({ id: 'franJump', cost: 250 });
                    // do not include steal to avoid recursion
                } else {
                    // por defecto, dejar alguna habilidad genérica
                    stealable.push({ id: 'genericHit', cost: 100 });
                }

                // Secuencia R,R,X -> roba la habilidad (sin laser)
                if (
                    player.franchescaLaserBuffer.length === 3 &&
                    player.franchescaLaserBuffer[0].k === "R" &&
                    player.franchescaLaserBuffer[1].k === "R" &&
                    player.franchescaLaserBuffer[2].k === "X"
                ) {
                    // Si el objetivo está bloqueando, no roba
                    if (target.blocking) {
                        this.cameras.main.flash(120, 80, 80, 80);
                    } else {
                        // seleccionar habilidad aleatoria del objetivo
                        const choice = stealable[Math.floor(Math.random() * stealable.length)];
                        if (choice) {
                            player.energy = Math.max(0, player.energy - 300);
                            // asignar habilidad al ladrón por 30s
                            player.franchescaStolenAbility = { name: choice.id, cost: choice.cost, source: (1 - i), timer: time + 30000 };
                            player.franchescaStolenTimer = player.franchescaStolenAbility.timer;
                            // marcar en el objetivo que perdió esa habilidad (solo esa)
                            target.stolenAbilities = target.stolenAbilities || {};
                            target.stolenAbilitiesTimers = target.stolenAbilitiesTimers || {};
                            target.stolenAbilities[choice.id] = true;
                            target.stolenAbilitiesTimers[choice.id] = time + 30000;

                            // feedback visual
                            if (target.sprite && target.sprite.setTint) target.sprite.setTint(0x444444);
                            if (player.sprite && player.sprite.setTint) player.sprite.setTint(0xffcc88);
                            this.cameras.main.flash(140, 255, 200, 50);
                        }
                    }
                    player.franchescaLaserBuffer = [];
                }
        }

        // NUEVO handler que permite al ladrón usar la habilidad robada con L,L,X
        handleFranchescaUseStolen(i, time) {
            const player = this.players[i];
            if (!player || !player.franchescaStolenAbility) return;
                const sprite = player.sprite;
                const ability = player.franchescaStolenAbility;
                const pad = getPad(player.padIndex, this);

                // Input buffer L,L,X
                let input = null;
                if (i === 0) {
                    if (Phaser.Input.Keyboard.JustDown(this.keysP1.left)) input = "L";
                    if (Phaser.Input.Keyboard.JustDown(this.keysP1.hit)) input = "X";
                } else {
                    if (Phaser.Input.Keyboard.JustDown(this.keysP2.left)) input = "L";
                    if (Phaser.Input.Keyboard.JustDown(this.keysP2.hit)) input = "X";
                }
                if (pad && pad.connected) {
                    const axisX = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
                    if (axisX < -0.7 && !pad._franUseLeft) { input = "L"; pad._franUseLeft = true; }
                    if (axisX > -0.7 && axisX < 0.7) pad._franUseLeft = false;
                    if (pad.buttons[2] && pad.buttons[2].pressed && !pad._franUseHit) { input = "X"; pad._franUseHit = true; }
                    if (!(pad.buttons[2] && pad.buttons[2].pressed)) pad._franUseHit = false;
                }

                if (input) {
                    const now = time;
                    if (player.franchescaUseBuffer.length === 0 || (now - (player.franchescaUseBuffer[player.franchescaUseBuffer.length - 1].t)) < 1000) {
                        player.franchescaUseBuffer.push({ k: input, t: now });
                        if (player.franchescaUseBuffer.length > 3) player.franchescaUseBuffer.shift();
                    } else {
                        player.franchescaUseBuffer = [{ k: input, t: now }];
                    }
                }

                if (
                    player.franchescaUseBuffer.length === 3 &&
                    player.franchescaUseBuffer[0].k === "L" &&
                    player.franchescaUseBuffer[1].k === "L" &&
                    player.franchescaUseBuffer[2].k === "X"
                ) {
                    // usar la habilidad robada (sin consumirla; la misma puede usarse dentro del tiempo)
                    if (player.energy < ability.cost) {
                        // not enough energy: feedback
                        this.cameras.main.flash(120, 80, 80, 80);
                    } else {
                        const target = this.players[1 - i];
                        // ejecutar efectos según ability.name
                        switch (ability.name) {
                            case 'sofiaLaser':
                                player.energy = Math.max(0, player.energy - ability.cost);
                                if (!target.blocking) {
                                    target.health = Math.max(0, target.health - 10);
                                    // atraer
                                    const offset = 60;
                                    target.sprite.x = sprite.x + (target.sprite.x < sprite.x ? -offset : offset);
                                    target.sprite.y = sprite.y;
                                    target.sprite.setVelocity(0, 0);
                                }
                                break;
                            case 'sofiaTeleport':
                                player.energy = Math.max(0, player.energy - ability.cost);
                                // teleport thief near target and damage
                                {
                                    const offset = 60;
                                    sprite.x = target.sprite.x + (sprite.x < target.sprite.x ? -offset : offset);
                                    sprite.y = target.sprite.y;
                                    sprite.setVelocity(0, 0);
                                    if (!target.blocking) target.health = Math.max(0, target.health - 30);
                                }
                                break;
                            case 'sofiaMeteor':
                                player.energy = Math.max(0, player.energy - ability.cost);
                                {
                                    const meteor = this.add.circle(target.sprite.x, target.sprite.y - 400, 38, 0xff3300).setDepth(10);
                                    this.tweens.add({
                                        targets: meteor,
                                        y: target.sprite.y,
                                        duration: 500,
                                        ease: 'Quad.easeIn',
                                        onComplete: () => {
                                            if (!target.blocking) {
                                                target.health = Math.max(0, target.health - 150);
                                                target.sprite.setVelocityY(-500);
                                            }
                                            this.cameras.main.shake(200, 0.03);
                                            meteor.destroy();
                                        }
                                    });
                                }
                                break;
                            case 'charSpecial':
                                player.energy = Math.max(0, player.energy - ability.cost);
                                if (!target.blocking) {
                                    target.health = Math.max(0, target.health - 65);
                                    const dir = (target.sprite.x > sprite.x) ? 1 : -1;
                                    target.sprite.setVelocity(600 * dir, -120);
                                }
                                break;
                            case 'charTransform':
                                player.energy = Math.max(0, player.energy - ability.cost);
                                player.transformed = true;
                                player.transformTimer = time + 8000;
                                break;
                            case 'charExplosion':
                                player.energy = Math.max(0, player.energy - ability.cost);
                                if (!target.blocking) {
                                    target.health = Math.max(0, target.health - 90);
                                    target.sprite.setVelocityY(-400);
                                } else {
                                    target.health = Math.max(0, target.health - Math.floor(DAMAGE * 0.35));
                                    target.sprite.setVelocityY(-120);
                                }
                                break;
                            case 'franEnergy':
                                player.energy = Math.max(0, player.energy - ability.cost);
                                if (!target.blocking) target.health = Math.max(0, target.health - 15);
                                break;
                            case 'franJump':
                                player.energy = Math.max(0, player.energy - ability.cost);
                                if (!target.blocking) target.health = Math.max(0, target.health - 250);
                                break;
                            default:
                                // generic fallback
                                player.energy = Math.max(0, player.energy - ability.cost);
                                if (!target.blocking) target.health = Math.max(0, target.health - Math.floor(ability.cost / 2));
                                break;
                        }
                    }
                    // limpiar buffer de uso
                    player.franchescaUseBuffer = [];
                }
        }

        // NUEVA: Habilidad de Mario - rayo atravesador (IZQ, DER, GOLPE) - ahora láser instantáneo
        handleMarioBeam(i, time) {
            const player = this.players[i];
            const sprite = player.sprite;
            // Mario es índice 3 en el selector de personajes
            if ((i === 0 && this.player1Index !== 3) || (i === 1 && this.player2Index !== 3)) return;

            if (!player.marioBeamBuffer) player.marioBeamBuffer = [];
            if (player.energy < 150) { player.marioBeamBuffer = []; return; }

            let input = null;
            // Teclado
            if (i === 0) {
                if (Phaser.Input.Keyboard.JustDown(this.keysP1.left)) input = "L";
                if (Phaser.Input.Keyboard.JustDown(this.keysP1.right)) input = "R";
                if (Phaser.Input.Keyboard.JustDown(this.keysP1.hit)) input = "X";
            } else {
                if (Phaser.Input.Keyboard.JustDown(this.keysP2.left)) input = "L";
                if (Phaser.Input.Keyboard.JustDown(this.keysP2.right)) input = "R";
                if (Phaser.Input.Keyboard.JustDown(this.keysP2.hit)) input = "X";
            }

            // Gamepad
            const pad = getPad(player.padIndex, this);
            if (pad && pad.connected) {
                const axisX = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
                if (axisX < -0.7 && !pad._marioLeft) { input = "L"; pad._marioLeft = true; }
                if (axisX > 0.7 && !pad._marioRight) { input = "R"; pad._marioRight = true; }
                if (axisX > -0.7 && axisX < 0.7) pad._marioLeft = pad._marioRight = false;
                if (pad.buttons[2] && pad.buttons[2].pressed && !pad._marioHit) { input = "X"; pad._marioHit = true; }
                if (!(pad.buttons[2] && pad.buttons[2].pressed)) pad._marioHit = false;
            }

            if (input) {
                const now = time;
                if (player.marioBeamBuffer.length === 0 || (now - (player.marioBeamBuffer[player.marioBeamBuffer.length - 1].t)) < 1000) {
                    player.marioBeamBuffer.push({ k: input, t: now });
                    if (player.marioBeamBuffer.length > 3) player.marioBeamBuffer.shift();
                } else {
                    player.marioBeamBuffer = [{ k: input, t: now }];
                }
            }

            // Verifica la secuencia L,R,X
            if (
                player.marioBeamBuffer.length === 3 &&
                player.marioBeamBuffer[0].k === "L" &&
                player.marioBeamBuffer[1].k === "R" &&
                player.marioBeamBuffer[2].k === "X"
            ) {
                // Gasta energía
                player.energy = Math.max(0, player.energy - 150);

                // origen del láser
                const sx = sprite.x;
                const sy = sprite.y - 10;

                // direccional: hacia el enemigo actual (pero se extiende mucho para atravesar)
                const target = this.players[1 - i];
                const dx = (target.sprite.x - sx);
                const dy = (target.sprite.y - sy);
                const len = Math.max(1, Math.sqrt(dx * dx + dy * dy));
                const nx = dx / len;
                const ny = dy / len;

                // extremo lejano del láser
                const EXT = 2000;
                const ex = sx + nx * EXT;
                const ey = sy + ny * EXT;

                // dibuja línea láser (visual)
                const laser = this.add.line(0, 0, sx, sy, ex, ey, 0xffcc00).setOrigin(0, 0);
                try { laser.setLineWidth(8); } catch(e){} // no-crash si no disponible
                laser.setDepth(50);

                // helper: distancia punto - segmento
                const pointLineDist = (px, py, x1, y1, x2, y2) => {
                    const A = px - x1;
                    const B = py - y1;
                    const C = x2 - x1;
                    const D = y2 - y1;
                    const dot = A * C + B * D;
                    const len_sq = C * C + D * D;
                    const t = Math.max(0, Math.min(1, len_sq === 0 ? 0 : dot / len_sq));
                    const projx = x1 + t * C;
                    const projy = y1 + t * D;
                    const dx2 = px - projx;
                    const dy2 = py - projy;
                    return Math.sqrt(dx2 * dx2 + dy2 * dy2);
                };

                // daño base y umbral de colisión al láser
                const baseDamage = 100;
                const hitThreshold = 40; // px de ancho efectivo

                // Aplica efecto a todos los jugadores excepto el que dispara (atraviesa)
                for (let j = 0; j < this.players.length; j++) {
                    if (!this.players[j] || !this.players[j].sprite) continue;
                    if (j === i) continue; // no pegarse a sí mismo

                    const pSprite = this.players[j].sprite;
                    const distToLine = pointLineDist(pSprite.x, pSprite.y, sx, sy, ex, ey);
                    if (distToLine <= hitThreshold) {
                        // Está alcanzado por el láser
                        if (!this.players[j].blocking) {
                            this.players[j].health = Math.max(0, this.players[j].health - baseDamage);
                        } else {
                            // si bloquea, daño reducido (misma lógica que proyectiles)
                            this.players[j].health = Math.max(0, this.players[j].health - Math.floor(baseDamage * 0.35));
                        }
                        // stun corto
                        this.players[j].beingHit = true;
                        this.players[j].hitTimer = this.time.now + 300;
                        // un pequeño empuje opcional si no bloquea
                        if (!this.players[j].blocking) {
                            const pushDir = (this.players[j].sprite.x > sprite.x) ? 1 : -1;
                            this.players[j].sprite.setVelocityX(180 * pushDir);
                        } else {
                            this.players[j].sprite.setVelocityX(0);
                        }
                    }
                }

                // cámara y feedback visual
                this.cameras.main.flash(120, 255, 200, 80);
                this.time.delayedCall(160, () => { if (laser && laser.scene) laser.destroy(); });

                // Limpiar buffer
                player.marioBeamBuffer = [];
            }
        }

        handleMarioExplosion(i, time) {
            const player = this.players[i];
            const sprite = player.sprite;
            // Mario es índice 3 en el selector de personajes
            if ((i === 0 && this.player1Index !== 3) || (i === 1 && this.player2Index !== 3)) return;

            if (!player.marioExplBuffer) player.marioExplBuffer = [];
            if (player.energy < 150) { player.marioExplBuffer = []; return; }

            // detectar input (R, L, X)
            let input = null;
            if (i === 0) {
                if (Phaser.Input.Keyboard.JustDown(this.keysP1.right)) input = "R";
                if (Phaser.Input.Keyboard.JustDown(this.keysP1.left)) input = "L";
                if (Phaser.Input.Keyboard.JustDown(this.keysP1.hit)) input = "X";
            } else {
                if (Phaser.Input.Keyboard.JustDown(this.keysP2.right)) input = "R";
                if (Phaser.Input.Keyboard.JustDown(this.keysP2.left)) input = "L";
                if (Phaser.Input.Keyboard.JustDown(this.keysP2.hit)) input = "X";
            }

            const pad = getPad(player.padIndex, this);
            if (pad && pad.connected) {
                const axisX = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
                if (axisX > 0.7 && !pad._marioExplRight) { input = "R"; pad._marioExplRight = true; }
                if (axisX < -0.7 && !pad._marioExplLeft) { input = "L"; pad._marioExplLeft = true; }
                if (axisX > -0.7 && axisX < 0.7) pad._marioExplRight = pad._marioExplLeft = false;
                if (pad.buttons[2] && pad.buttons[2].pressed && !pad._marioExplHit) { input = "X"; pad._marioExplHit = true; }
                if (!(pad.buttons[2] && pad.buttons[2].pressed)) pad._marioExplHit = false;
            }

            if (input) {
                const now = time;
                if (player.marioExplBuffer.length === 0 || (now - (player.marioExplBuffer[player.marioExplBuffer.length - 1].t)) < 1000) {
                    player.marioExplBuffer.push({ k: input, t: now });
                    if (player.marioExplBuffer.length > 3) player.marioExplBuffer.shift();
                } else {
                    player.marioExplBuffer = [{ k: input, t: now }];
                }
            }

            // secuencia R, L, X
            if (
                player.marioExplBuffer.length === 3 &&
                player.marioExplBuffer[0].k === "R" &&
                player.marioExplBuffer[1].k === "L" &&
                player.marioExplBuffer[2].k === "X"
            ) {
                // consumir energía
                player.energy = Math.max(0, player.energy - 150);

                const RADIUS = 200;
                const DAMAGE = 80;

                // visual y feedback
                const explCircle = this.add.circle(sprite.x, sprite.y, RADIUS, 0xff8844, 0.22).setDepth(9);
                this.cameras.main.shake(180, 0.02);
                this.cameras.main.flash(100, 255, 200, 160);

                // aplicar efecto a todos los enemigos (atraviesa)
                for (let j = 0; j < this.players.length; j++) {
                    if (j === i) continue;
                    const target = this.players[j];
                    if (!target || !target.sprite) continue;
                    const d = Phaser.Math.Distance.Between(sprite.x, sprite.y, target.sprite.x, target.sprite.y);
                    if (d <= RADIUS) {
                        // empujar lejos (normalizado)
                        const nx = (target.sprite.x - sprite.x) / Math.max(1, d);
                        const ny = (target.sprite.y - sprite.y) / Math.max(1, d);
                        // fuerza proporcional (más cerca => más empuje)
                        const pushStrength = 300 + (1 - (d / RADIUS)) * 300; // aprox 300..600
                        target.sprite.setVelocity(nx * pushStrength, -200);

                        // daño (reduce si bloquea)
                        if (!target.blocking) {
                            target.health = Math.max(0, target.health - DAMAGE);
                        } else {
                            target.health = Math.max(0, target.health - Math.floor(DAMAGE * 0.35));
                        }

                        // stun corto
                        target.beingHit = true;
                        target.hitTimer = this.time.now + 400;
                    }
                }

                // eliminar visual rápido
                this.time.delayedCall(400, () => { if (explCircle && explCircle.scene) explCircle.destroy(); });

                // limpiar buffer
                player.marioExplBuffer = [];
            }
        }

        // NUEVA: Habilidad de Mario - smash gigante (DER, DER, GOLPE)
        handleMarioSmash(i, time) {
            const player = this.players[i];
            const sprite = player.sprite;
            // Mario es índice 3 en el selector de personajes
            if ((i === 0 && this.player1Index !== 3) || (i === 1 && this.player2Index !== 3)) return;

            if (!player.marioSmashBuffer) player.marioSmashBuffer = [];
            if (player.energy < 250) { player.marioSmashBuffer = []; return; }

            // Detect input
            let input = null;
            if (i === 0) {
                if (Phaser.Input.Keyboard.JustDown(this.keysP1.right)) input = "R";
                if (Phaser.Input.Keyboard.JustDown(this.keysP1.hit)) input = "X";
            } else {
                if (Phaser.Input.Keyboard.JustDown(this.keysP2.right)) input = "R";
                if (Phaser.Input.Keyboard.JustDown(this.keysP2.hit)) input = "X";
            }

            const pad = getPad(player.padIndex, this);
            if (pad && pad.connected) {
                const axisX = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
                if (axisX > 0.7 && !pad._marioSmashRight) { input = "R"; pad._marioSmashRight = true; }
                if (axisX > -0.7 && axisX < 0.7) pad._marioSmashRight = false;
                if (pad.buttons[2] && pad.buttons[2].pressed && !pad._marioSmashHit) { input = "X"; pad._marioSmashHit = true; }
                if (!(pad.buttons[2] && pad.buttons[2].pressed)) pad._marioSmashHit = false;
            }

            if (input) {
                const now = time;
                if (player.marioSmashBuffer.length === 0 || (now - (player.marioSmashBuffer[player.marioSmashBuffer.length - 1].t)) < 1000) {
                    player.marioSmashBuffer.push({ k: input, t: now });
                    if (player.marioSmashBuffer.length > 3) player.marioSmashBuffer.shift();
                } else {
                    player.marioSmashBuffer = [{ k: input, t: now }];
                }
            }

            // Verifica la secuencia R, R, X
            if (
                player.marioSmashBuffer.length === 3 &&
                player.marioSmashBuffer[0].k === "R" &&
                player.marioSmashBuffer[1].k === "R" &&
                player.marioSmashBuffer[2].k === "X"
            ) {
                // Consume energy
                player.energy = Math.max(0, player.energy - 250);

                // Objetivo: el enemigo opuesto
                const target = this.players[1 - i];
                if (!target || !target.sprite) { player.marioSmashBuffer = []; return; }

                // Crear un rectángulo grande arriba del enemigo
                const rectW = Math.min(600, this.scale.width - 40);
                const rectH = 120; // altura del rectángulo que cae
                const rectX = target.sprite.x;
                const rectStartY = target.sprite.y - 600; // empieza bien arriba

                const smash = this.add.rectangle(rectX, rectStartY, rectW, rectH, 0xff4444).setDepth(20).setOrigin(0.5, 0.5);

                // Usar tween para que caiga
                this.tweens.add({
                    targets: smash,
                    y: target.sprite.y,
                    duration: 500,
                    ease: 'Quad.easeIn',
                    onComplete: () => {
                        // Impacto: aplicar daño 180 si no bloquea, o daño reducido si bloquea
                        const DAMAGE = 180;
                        if (!target.blocking) {
                            target.health = Math.max(0, target.health - DAMAGE);
                            target.sprite.setVelocityY(-420);
                        } else {
                            target.health = Math.max(0, target.health - Math.floor(DAMAGE * 0.35));
                            target.sprite.setVelocityY(-120);
                        }
                        // Efecto de cámara
                        this.cameras.main.shake(260, 0.04);
                        this.cameras.main.flash(120, 255, 200, 140);

                        // Pequeña explosión visual
                        const hitFx = this.add.circle(target.sprite.x, target.sprite.y, 80, 0xffaa44, 0.6).setDepth(21);
                        this.time.delayedCall(180, () => { if (hitFx && hitFx.scene) hitFx.destroy(); });

                        // eliminar rect
                        if (smash && smash.scene) smash.destroy();
                    }
                });

                // limpiar buffer
                player.marioSmashBuffer = [];
            }
        }
}