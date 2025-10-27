// game.js
// ========================
// --- VARIABLES GLOBALES ---
// ========================
let isEnglish = false;

// Utility: safe get pad
function getPad(idx, scene) {
    const pads = scene.input.gamepad.gamepads;
    if (!pads || !pads.length) return null;
    return pads[idx] || null;
}

// ========================
// --- ESCENAS ---
// ========================

// Global error hooks to capture stack traces for runtime errors (helps trace undefined removeAllListeners)
if (typeof window !== 'undefined') {
    window.addEventListener('error', (e) => {
        try {
            console.warn('Global error caught:', e.message, e.filename + ':' + e.lineno + ':' + e.colno);
            if (e.error && e.error.stack) console.warn(e.error.stack);
        } catch (ex) { /* ignore */ }
    });
    window.addEventListener('unhandledrejection', (ev) => {
        try { console.warn('Unhandled promise rejection:', ev.reason && ev.reason.stack ? ev.reason.stack : ev.reason); } catch (ex) { }
    });
}

// --- ESCENA PRELOADER ---
class Preloader extends Phaser.Scene {
    constructor() { super("Preloader"); }
    preload() {
        // Carga de assets para personajes (4 repos)
        this.load.setPath('assets/player');

        const mapping = {
            repo1: {
                walk: 'repo1/caminar-derecha.png', idle: 'repo1/mirar-derecha.png', shoot: 'repo1/disparo-derecha.png',
                punch: 'repo1/golpe-derecha.png', punch_fire: 'repo1/golpe-fuego-derecha.png', kick: 'repo1/patada-derecha.png',
                block: 'repo1/bloqueo-derecha.png', charge: 'repo1/carga-energia-derecha.png',
                hurt: 'repo1/caminar-herido-derecha.png', jump: 'repo1/salto-derecha.png'
            },
            repo2: {
                walk: 'repo2/caminar2-derecha.png', idle: 'repo2/mirar2-derecha.png', shoot: 'repo2/disparo2-derecha.png',
                punch: 'repo2/golpe2-derecha.png', block: 'repo2/bloqueo2-derecha.png', charge: 'repo2/carga-energia2-derecha.png',
                hurt: 'repo2/caminar2-herido-derecha.png', jump: 'repo2/salto2-derecha1.png'
            },
            repo3: {
                walk: 'repo3/caminar3-derecha.png', idle: 'repo3/mirar3-derecha.png', shoot: 'repo3/disparo3-derecha.png',
                punch: 'repo3/golpe3-derecha.png', robo: 'repo3/robo3-derecha.png', block: 'repo3/bloqueo3-derecha.png', charge: 'repo3/carga3-energia-derecha.png',
                hurt: 'repo3/caminar3-herido-derecha.png', jump: 'repo3/salto3-derecha.png'
            },
            repo4: {
                walk: 'repo4/caminar4-derecha.png', idle: 'repo4/mirar4-derecha.png', shoot: 'repo4/disparo4-derecha.png',
                block: 'repo4/bloqueo4-derecha.png', charge: 'repo4/carga4-energia-derecha.png',
                hurt: 'repo4/caminar4-herido-derecha.png', jump: 'repo4/salto4-derecha.png'
            }
        };

        // Cargar todos los assets de personajes como spritesheet de 64x64.
        // El comportamiento esperado: la mayoría de acciones tendrán 2 frames (idle/move/shot),
        // y golpes/patadas tendrán 3 frames. Cargamos todo como spritesheet para simplificar.
        Object.keys(mapping).forEach((repoKey, idx) => {
            const charIndex = idx; // 0..3
            const m = mapping[repoKey];
            for (const action in m) {
                const key = `char${charIndex}_${action}`;
                this.load.spritesheet(key, m[action], { frameWidth: 64, frameHeight: 64 });
            }
        });
        // Guardar mapping para recargas posteriores
        this._mapping = mapping;

    // Cargar imagen del mapa 1 desde public/mapas (servida en la raíz)
    // Nota: coloca tu archivo en public/mapas/mapaprov.png
    // Intentamos la ruta relativa primero (mapas/mapaprov.png). Si falla, reintentamos con la ruta absoluta '/mapas/mapaprov.png'.
    this._map1Retry = false;
    this.load.image('map1', 'mapas/mapaprov.png');
    this.load.on('loaderror', (file) => {
        try {
            if (file && file.key === 'map1' && !this._map1Retry) {
                console.warn('map1 failed to load (relative), retrying with absolute path');
                this._map1Retry = true;
                this.load.image('map1', '/mapas/mapaprov.png');
                this.load.start();
            }
        } catch (e) { /* ignore */ }
    }, this);

        // Otros assets
        this.load.setPath('assets');
        // background.png no existe en este proyecto, omitimos para evitar errores
        // this.load.image('background', 'background.png');
        this.load.image('floor', 'floor.png');
        this.load.setPath('assets/player');
        this.load.image('bullet', 'bullet.png');
        this.load.image('tex_bullet', 'bullet.png');
    }

    
    create() {
        // Las cargas ya se hicieron como spritesheet para acciones multi-frame.
        // Creamos las animaciones y continuamos al menú.
        this.createAnimations();
        // Fallback textures: si faltan algunos assets (target / tex_bullet), créalos con gráficos simples
        try {
            if (!this.textures.exists('target')) {
                const g = this.make.graphics({ x: 0, y: 0, add: false });
                g.fillStyle(0xffff00, 1);
                g.fillCircle(8, 8, 8);
                g.generateTexture('target', 16, 16);
                g.destroy();
            }
            if (!this.textures.exists('tex_bullet')) {
                const g2 = this.make.graphics({ x: 0, y: 0, add: false });
                g2.fillStyle(0xffffff, 1);
                g2.fillRect(0, 0, 6, 6);
                g2.generateTexture('tex_bullet', 6, 6);
                g2.destroy();
            }
        } catch (e) { /* ignore fallback generation errors */ }
        this.scene.start('Menu');
    }

    createAnimations() {
        // Crear animaciones globales por personaje (misma lógica que antes)
        for (let i = 0; i < 4; i++) {
            const actions = ['walk', 'idle', 'shoot', 'punch', 'block', 'charge', 'hurt', 'jump','punch_fire','kick','robo'];
            actions.forEach(act => {
                const key = `char${i}_${act}`;
                if (!this.textures.exists(key)) return; // evita errores si falta
                const tex = this.textures.get(key);
                let frames = [{ key }];

                // desired frame counts per action
                // Default: 2 frames (1..2) for most actions; punches/kicks: 3 frames.
                let desiredCount = 2;
                if (act === 'punch' || act === 'punch_fire' || act === 'kick') desiredCount = 3;
                if (act === 'robo') desiredCount = 2;

                try {
                    // Build frames manually using the texture's frames map to avoid Phaser warnings
                    if (this.textures.exists(key) && tex && tex.frames) {
                        const framesList = [];
                        // prefer numeric frame keys 0..n
                        for (let f = 0; f < desiredCount; f++) {
                            const fk = String(f);
                            if (tex.frames.hasOwnProperty(fk)) {
                                framesList.push({ key, frame: f });
                            } else {
                                // stop if the consecutive frame is missing
                                break;
                            }
                        }
                        if (framesList.length > 0) frames = framesList;
                        else frames = [{ key, frame: 0 }];
                    } else {
                        frames = [{ key, frame: 0 }];
                    }
                } catch (e) {
                    frames = [{ key, frame: 0 }];
                }

                let frameRate = 12;
                if (act === 'walk') frameRate = 6;
                else if (act === 'idle') frameRate = 6;
                else if (act === 'punch' || act === 'shoot' || act === 'punch_fire' || act === 'kick') frameRate = 4; // slow attacks

                const repeat = (act === 'punch' || act === 'shoot' || act === 'jump' || act === 'punch_fire' || act === 'kick' || act === 'robo') ? 0 : -1;

                this.anims.create({ key: `${key}`, frames: frames, frameRate: frameRate, repeat: repeat });
                // Debug log: report frames available and animation parameters
                try {
                    const total = tex && tex.frameTotal ? tex.frameTotal : (tex && tex.frames ? Object.keys(tex.frames).length : 1);
                    const usedFrames = Array.isArray(frames) ? frames.length : 0;
                    console.log(`ANIM CREATED: ${key} desired=${desiredCount} available=${total} used=${usedFrames} fr=${frameRate} rep=${repeat}`);
                } catch (e) { /* ignore logging errors */ }
            });
        }
    }
}


// --- ESCENA MENU ---
class Menu extends Phaser.Scene {
   
    constructor() { super("Menu"); }
    create() {
        const { width } = this.scale;
        this.selectedIndex = 0;
        this.buttons = [];

        this.updateTexts = () => {
            this.title.setText(isEnglish ? "THE FURY OF THE ABYSS" : "LA FURIA DEL ABISMO");
            this.playText.setText(isEnglish ? "PLAY" : "JUGAR");
            this.langText.setText(isEnglish ? "LANGUAGE" : "IDIOMA");
            this.controlsText.setText(isEnglish ? "CONTROLS" : "CONTROLES");
        };

        this.cameras.main.setBackgroundColor(0x001d33);
        this.title = this.add.text(width / 2, 80, isEnglish ? "THE FURY OF THE ABYSS" : "LA FURIA DEL ABISMO", { font: "72px Arial", color: "#00e5ff" }).setOrigin(0.5);

        const buttonWidth = 250, buttonHeight = 70, spacing = 40;
        let startY = 250;

        const playButton = this.add.rectangle(width / 2, startY, buttonWidth, buttonHeight, 0x004466).setInteractive();
        this.playText = this.add.text(width / 2, startY, isEnglish ? "PLAY" : "JUGAR", { font: "28px Arial", color: "#00ffff" }).setOrigin(0.5);
        this.buttons.push({ rect: playButton, callback: () => this.scene.start("ModeSelector") });

        startY += buttonHeight + spacing;
        const langButton = this.add.rectangle(width / 2, startY, buttonWidth, buttonHeight, 0x003355).setInteractive();
        this.langText = this.add.text(width / 2, startY, isEnglish ? "LANGUAGE" : "IDIOMA", { font: "28px Arial", color: "#00ffcc" }).setOrigin(0.5);
        this.buttons.push({ rect: langButton, callback: () => { isEnglish = !isEnglish; this.updateTexts(); } });

        startY += buttonHeight + spacing;
    const controlsButton = this.add.rectangle(width / 2, startY, buttonWidth, buttonHeight, 0x002244).setInteractive();
    this.controlsText = this.add.text(width / 2, startY, isEnglish ? "CONTROLS" : "CONTROLES", { font: "28px Arial", color: "#66ffff" }).setOrigin(0.5);
    this.buttons.push({ rect: controlsButton, callback: () => this.scene.start('ControlsScene') });

        // Marco selector
        this.selector = this.add.rectangle(this.buttons[this.selectedIndex].rect.x, this.buttons[this.selectedIndex].rect.y, buttonWidth + 10, buttonHeight + 10).setStrokeStyle(4, 0xffff00).setOrigin(0.5);

        // Keyboard nav: W/S and Up/Down both move selection
        this.pressedNavTime = 0;
        this.keyUp = this.input.keyboard.addKey('W');
        this.keyDown = this.input.keyboard.addKey('S');
        this.keyUp2 = this.input.keyboard.addKey('UP');
        this.keyDown2 = this.input.keyboard.addKey('DOWN');

        // Confirm keys: player1 SPACE, player2 ENTER
        this.keyConfirmP1 = this.input.keyboard.addKey('SPACE');
        this.keyConfirmP2 = this.input.keyboard.addKey('ENTER');

        // Back keys: SHIFT (P1) and BACKSPACE (P2) - here no action in main menu
        this.keyBackP1 = this.input.keyboard.addKey('SHIFT');
        this.keyBackP2 = this.input.keyboard.addKey('BACKSPACE');

        // set up gamepad connect to init flags
        this.input.gamepad.on('connected', pad => {
            pad._upPressed = pad._downPressed = pad._aPressed = pad._bPressed = false;
        });
    }

    update(time) {
        // keyboard navigation (debounced)
        if (Phaser.Input.Keyboard.JustDown(this.keyUp) || Phaser.Input.Keyboard.JustDown(this.keyUp2)) this.moveSelector(-1);
        if (Phaser.Input.Keyboard.JustDown(this.keyDown) || Phaser.Input.Keyboard.JustDown(this.keyDown2)) this.moveSelector(1);

        // confirm with keyboard
        if (Phaser.Input.Keyboard.JustDown(this.keyConfirmP1) || Phaser.Input.Keyboard.JustDown(this.keyConfirmP2)) {
            this.buttons[this.selectedIndex].callback();
        }

        // gamepad nav & confirm (works for all connected pads)
        const pads = this.input.gamepad.gamepads;
        pads.forEach(pad => {
            if (!pad) return;
            // vertical axis navigation
            const y = (pad.axes.length > 1) ? pad.axes[1].getValue() : 0;
            if (y < -0.6 && !pad._upPressed) { this.moveSelector(-1); pad._upPressed = true; }
            else if (y > 0.6 && !pad._downPressed) { this.moveSelector(1); pad._downPressed = true; }
            else if (y > -0.6 && y < 0.6) { pad._upPressed = pad._downPressed = false; }

            // A to confirm
            const aPressed = pad.buttons[0] && pad.buttons[0].pressed;
            if (aPressed && !pad._aPressed) { this.buttons[this.selectedIndex].callback(); pad._aPressed = true; }
            if (!aPressed) pad._aPressed = false;

            // B/back does nothing in main menu
        });
    }

    moveSelector(dir) {
        if (!this.buttons || this.buttons.length === 0) return;
        this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + dir, 0, this.buttons.length);
        const button = this.buttons[this.selectedIndex];
        if (button && button.rect) { this.selector.x = button.rect.x; this.selector.y = button.rect.y; }
    }
}
// --- ESCENA CONTROLES ---
class ControlsScene extends Phaser.Scene {
    constructor() { super("ControlsScene"); }
    create() {
        const { width, height } = this.scale;
    // Reset runtime flags so GameOver can be triggered repeatedly across matches
    this._gameOverCooldownUntil = 0;
        // Ensure background offset resets to default for a fresh layout
        this._bgYOffset = 48;
        if (this._bgOffsetText) { try { this._bgOffsetText.setText(`bg offset: ${this._bgYOffset}`); } catch (e) {} }
        // If a leftover background image exists on this scene instance, destroy it to avoid duplicates
        if (this._bgImage && this._bgImage.scene) {
            try { this._bgImage.destroy(); } catch (e) {}
            this._bgImage = null;
        }
        this.cameras.main.setBackgroundColor(0x001d33);

        const title = this.add.text(40, 40, isEnglish ? "CONTROLS (GAMEPAD)" : "CONTROLES (MANDO)", { font: "36px Arial", color: "#00ffff" }).setOrigin(0, 0);

        let y = 100;
        const leftX = 40;
        const line = (txt) => {
            this.add.text(leftX, y, txt, { font: "22px Arial", color: "#ffffff", align: 'left' }).setOrigin(0, 0);
            y += 32;
        };

        // Gamepad-only controls (left aligned)
        line(isEnglish ? "Move: Left stick (horizontal)" : "Mover: palanca izquierda (horizontal)");
        line(isEnglish ? "Jump: Push left stick UP" : "Saltar: empujar palanca izquierda HACIA ARRIBA");
        line(isEnglish ? "Punch: X button" : "Golpe: botón X");
        line(isEnglish ? "Block/Charge: A button" : "Bloquear/Cargar: botón A");
        line(isEnglish ? "Shoot: B button" : "Disparar: botón B");
        y += 10;

    // Special notes: Franchesca combos and all characters' abilities
    line(isEnglish ? "Franchesca special (examples):" : "Franchesca - instrucciones especiales:");
    line(isEnglish ? "Right, Right + Punch = Steal" : "Derecha, Derecha + Golpe = Robo (robar habilidad)");
    line(isEnglish ? "Left, Left + Punch = Use stolen ability" : "Izquierda, Izquierda + Golpe = Usar habilidad robada");
    y += 8;

    // Abilities for each character
    line(isEnglish ? "Charles - Abilities:" : "Charles - Habilidades:");
    line(isEnglish ? "1) Left, Right + Punch: Quick dash hit" : "1) Izq, Der + Golpe: Embestida rápida");
    line(isEnglish ? "2) Right, Left + Punch: Shield burst" : "2) Der, Izq + Golpe: Explosión de escudo");
    line(isEnglish ? "3) Right, Right + Punch: Ground slam" : "3) Der, Der + Golpe: Golpe al suelo");
    y += 6;

    line(isEnglish ? "Sofia - Abilities:" : "Sofia - Habilidades:");
    line(isEnglish ? "1) Left, Right + Punch: Swift shot" : "1) Izq, Der + Golpe: Disparo veloz");
    line(isEnglish ? "2) Right, Left + Punch: Energy bubble" : "2) Der, Izq + Golpe: Burbuja energética");
    line(isEnglish ? "3) Right, Right + Punch: Aerial flip" : "3) Der, Der + Golpe: Voltereta aérea");
    y += 6;

    line(isEnglish ? "Franchesca - Abilities:" : "Franchesca - Habilidades:");
    line(isEnglish ? "1) Left, Right + Punch: Steal minor item" : "1) Izq, Der + Golpe: Robar ítem menor");
    line(isEnglish ? "2) Right, Left + Punch: Quick vanish" : "2) Der, Izq + Golpe: Desvanecimiento rápido");
    line(isEnglish ? "3) Right, Right + Punch: Steal major ability" : "3) Der, Der + Golpe: Robar habilidad mayor");
    y += 6;

    line(isEnglish ? "Mario - Abilities:" : "Mario - Habilidades:");
    line(isEnglish ? "1) Left, Right + Punch: Fire dash" : "1) Izq, Der + Golpe: Carrera de fuego");
    line(isEnglish ? "2) Right, Left + Punch: Power throw" : "2) Der, Izq + Golpe: Lanzamiento potente");
    line(isEnglish ? "3) Right, Right + Punch: Spin upper" : "3) Der, Der + Golpe: Giro ascendente");
    y += 12;

        // Botón para volver
        const backBtn = this.add.rectangle(width / 2, height - 70, 220, 60, 0x003355).setInteractive();
        const backTxt = this.add.text(width / 2, height - 70, isEnglish ? "BACK" : "VOLVER", { font: "28px Arial", color: "#00ffff" }).setOrigin(0.5);
    backBtn.on('pointerdown', () => { try { this.scene.start("Menu"); } catch (e) { console.warn('Failed to go back to Menu:', e); } });

        // Tecla ESC para volver
        this.input.keyboard.on('keydown-ESC', () => this.scene.start("Menu"));
        // Enter o Space también vuelven
        this.input.keyboard.on('keydown-ENTER', () => this.scene.start("Menu"));
        this.input.keyboard.on('keydown-SPACE', () => this.scene.start("Menu"));
    }
}


// --- ESCENA MODE SELECTOR ---
class ModeSelector extends Phaser.Scene {
    constructor() { super("ModeSelector"); }
    create() {
        const { width, height } = this.scale;
        this.selectedIndex = 0;
        this.buttons = [];

        this.cameras.main.setBackgroundColor(0x001933);
        const buttonSize = 200, spacing = 100;
        const centerX = width / 2, centerY = height / 2;

        const versusButton = this.add.rectangle(centerX - buttonSize / 2 - spacing / 2, centerY, buttonSize, buttonSize, 0x004466).setInteractive();
        const coopButton = this.add.rectangle(centerX + buttonSize / 2 + spacing / 2, centerY, buttonSize, buttonSize, 0x003366).setInteractive();

        const t1 = this.add.text(versusButton.x, versusButton.y, "VERSUS", { font: "28px Arial", color: "#00ffff" }).setOrigin(0.5);
        const t2 = this.add.text(coopButton.x, coopButton.y, "CO-OP", { font: "28px Arial", color: "#66ffff" }).setOrigin(0.5);

        this.buttons.push({ rect: versusButton, callback: () => this.scene.start("CharacterSelector", { mode: "versus" }) });
        this.buttons.push({ rect: coopButton, callback: () => this.scene.start("CharacterSelector", { mode: "cooperativo" }) });

        this.selector = this.add.rectangle(this.buttons[this.selectedIndex].rect.x, this.buttons[this.selectedIndex].rect.y, buttonSize + 10, buttonSize + 10).setStrokeStyle(4, 0xffff00).setOrigin(0.5);

        // keyboard nav
        this.keyLeft = this.input.keyboard.addKey('A');
        this.keyRight = this.input.keyboard.addKey('D');
        this.keyLeft2 = this.input.keyboard.addKey('LEFT');
        this.keyRight2 = this.input.keyboard.addKey('RIGHT');

        // confirm/back
        this.keyConfirmP1 = this.input.keyboard.addKey('SPACE'); // player1
        this.keyConfirmP2 = this.input.keyboard.addKey('ENTER'); // player2
        this.keyBackP1 = this.input.keyboard.addKey('SHIFT');
        this.keyBackP2 = this.input.keyboard.addKey('BACKSPACE');

        this.input.gamepad.on('connected', pad => {
            pad._leftPressed = pad._rightPressed = false;
            pad._aPressed = pad._bPressed = false;
        });

    versusButton.on('pointerdown', () => { try { this.scene.start("CharacterSelector", { mode: "versus" }); } catch (e) { console.warn('Failed to start CharacterSelector (versus):', e); } });
    coopButton.on('pointerdown', () => { try { this.scene.start("CharacterSelector", { mode: "cooperativo" }); } catch (e) { console.warn('Failed to start CharacterSelector (cooperativo):', e); } });
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.keyLeft) || Phaser.Input.Keyboard.JustDown(this.keyLeft2)) this.moveSelector(-1);
        if (Phaser.Input.Keyboard.JustDown(this.keyRight) || Phaser.Input.Keyboard.JustDown(this.keyRight2)) this.moveSelector(1);
        if (Phaser.Input.Keyboard.JustDown(this.keyConfirmP1) || Phaser.Input.Keyboard.JustDown(this.keyConfirmP2)) {
            const btn = this.buttons && this.buttons[this.selectedIndex];
            if (btn && typeof btn.callback === 'function') btn.callback();
        }
        if (Phaser.Input.Keyboard.JustDown(this.keyBackP1) || Phaser.Input.Keyboard.JustDown(this.keyBackP2)) this.scene.start("Menu");

        const pads = this.input.gamepad.gamepads;
        pads.forEach(pad => {
            if (!pad) return;
            const x = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
            if (x < -0.6 && !pad._leftPressed) { this.moveSelector(-1); pad._leftPressed = true; }
            else if (x > 0.6 && !pad._rightPressed) { this.moveSelector(1); pad._rightPressed = true; }
            else if (x > -0.6 && x < 0.6) { pad._leftPressed = pad._rightPressed = false; }

            // A confirm
            const a = pad.buttons[0] && pad.buttons[0].pressed;
            if (a && !pad._aPressed) {
                const btn = this.buttons && this.buttons[this.selectedIndex];
                if (btn && typeof btn.callback === 'function') { btn.callback(); pad._aPressed = true; }
            }
            if (!a) pad._aPressed = false;

            // B back
            const b = pad.buttons[1] && pad.buttons[1].pressed;
            if (b && !pad._bPressed) { this.scene.start("Menu"); pad._bPressed = true; }
            if (!b) pad._bPressed = false;
        });
    }

    moveSelector(dir) {
        if (!this.buttons || this.buttons.length === 0) return;
        this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + dir, 0, this.buttons.length);
        const b = this.buttons[this.selectedIndex];
        if (b && b.rect) { this.selector.x = b.rect.x; this.selector.y = b.rect.y; }
    }
}

// --- ESCENA CHARACTER SELECTOR ---
class CharacterSelector extends Phaser.Scene {
    constructor() { super("CharacterSelector"); }
    init(data) { this.selectedMode = data.mode || "versus"; }

    create() {
        const { width, height } = this.scale;
        // Ensure we are not in fullscreen mode when showing the GameOver UI.
        // Some browsers/platforms keep the canvas scaled and that causes the map to be mispositioned when
        // restarting while still in fullscreen. Force exit fullscreen here using Phaser and a document fallback.
        try {
            if (this.scale && this.scale.isFullscreen) this.scale.stopFullscreen();
        } catch (e) { /* ignore */ }
        // Fallback: try the DOM fullscreen API (some browsers don't properly toggle via Phaser)
        try {
            const doc = window.document;
            if (doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement) {
                if (doc.exitFullscreen) doc.exitFullscreen();
                else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
                else if (doc.mozCancelFullScreen) doc.mozCancelFullScreen();
                else if (doc.msExitFullscreen) doc.msExitFullscreen();
            }
        } catch (e) { /* ignore */ }
        this.cameras.main.setBackgroundColor(0x001d33);

        this.characters = [
            { name: "Charles", color: 0x006699 },
            { name: "Sofia", color: 0x0099cc },
            { name: "Franchesca", color: 0x660066 },
            { name: "Mario", color: 0x33cccc }
        ];

        // selections default: player1 left, player2 right
        this.playerSelections = [{ index: 0 }, { index: this.characters.length - 1 }];
        this.characterRects = [];

        const rectWidth = 200, rectHeight = 300, spacing = 40;
        const totalWidth = this.characters.length * rectWidth + (this.characters.length - 1) * spacing;
        let startX = (width - totalWidth) / 2 + rectWidth / 2;
        const centerY = height / 2;

        this.characters.forEach((char, i) => {
            const box = this.add.rectangle(startX, centerY, rectWidth, rectHeight, char.color).setStrokeStyle(2, 0x000000).setInteractive();
            const spriteKey = `char${i}_idle`;
            // add character preview sprite (centered a bit above)
            let preview = null;
            if (this.textures.exists(spriteKey)) {
                preview = this.add.sprite(startX, centerY - 20, spriteKey);
                // force display size to 64x64 for preview thumbnails
                preview.setDisplaySize(64, 64);
                // if the texture has multiple frames, show only the first frame for preview
                if (this.anims.exists(spriteKey)) {
                    try { preview.setFrame(0); } catch (e) { /* ignore if frame setting fails */ }
                }
            } else {
                preview = this.add.rectangle(startX, centerY - 20, rectWidth - 40, rectHeight - 120, char.color).setStrokeStyle(1, 0x000000);
            }
            this.add.text(startX, centerY + rectHeight / 2 + 25, char.name, { font: "22px Arial", color: "#00ffff" }).setOrigin(0.5);
            // click assigns to player1 by default and unconfirms player1 (so they must confirm again)
            box.on('pointerdown', (ptr) => {
                this.playerSelections[0].index = i;
                this.unconfirmSelection(0);
                this.updateSelectors();
            });
            this.characterRects.push(box);
            // store preview sprite so we can follow selection
            box.preview = preview;
            startX += rectWidth + spacing;
        });

        // Player frames (player1: yellow, player2: orange)
        this.playerSelectors = [
            this.add.rectangle(this.characterRects[this.playerSelections[0].index].x, centerY, rectWidth + 12, rectHeight + 12).setStrokeStyle(4, 0xffff00).setOrigin(0.5),
            this.add.rectangle(this.characterRects[this.playerSelections[1].index].x, centerY, rectWidth + 12, rectHeight + 12).setStrokeStyle(4, 0xffaa00).setOrigin(0.5)
        ];

        // confirmed flags (both must be true to advance)
        this.confirmed = [false, false];

        // Keyboard controls for selection:
        // Player1 uses A/D and SPACE to confirm
        this.keyLeftP1 = this.input.keyboard.addKey('A');
        this.keyRightP1 = this.input.keyboard.addKey('D');
        this.keyConfirmP1 = this.input.keyboard.addKey('SPACE');

        // Player2 uses LEFT/RIGHT and ENTER to confirm
        this.keyLeftP2 = this.input.keyboard.addKey('LEFT');
        this.keyRightP2 = this.input.keyboard.addKey('RIGHT');
        this.keyConfirmP2 = this.input.keyboard.addKey('ENTER');

        // Back keys
        this.keyBackP1 = this.input.keyboard.addKey('SHIFT');
        this.keyBackP2 = this.input.keyboard.addKey('BACKSPACE');

        // Gamepad flags
        this.input.gamepad.on('connected', pad => {
            pad._leftPressed = pad._rightPressed = false;
            pad._aPressed = pad._bPressed = false;
        });

        // Update selectors initial
        this.updateSelectors();
    }

    // helper: confirm/unconfirm visuals and logic
    confirmSelection(idx) {
        this.confirmed[idx] = true;
        // set stroke to green when confirmed
        if (this.playerSelectors[idx]) this.playerSelectors[idx].setStrokeStyle(4, 0x00ff00);
        // advance only if both confirmed
        if (this.confirmed[0] && this.confirmed[1]) {
            this.scene.start("MapSelector", {
                player1: this.playerSelections[0].index,
                player2: this.playerSelections[1].index,
                mode: this.selectedMode
            });
        }
    }
    unconfirmSelection(idx) {
        this.confirmed[idx] = false;
        // restore original color
        if (this.playerSelectors[idx]) {
            const color = (idx === 0) ? 0xffff00 : 0xffaa00;
            this.playerSelectors[idx].setStrokeStyle(4, color);
        }
    }

    update() {
        // Gamepad navigation for two controllers (index 0 and 1)
        const pads = this.input.gamepad.gamepads;

        // Player1 keyboard nav
        if (Phaser.Input.Keyboard.JustDown(this.keyLeftP1)) { this.playerSelections[0].index = Phaser.Math.Wrap(this.playerSelections[0].index - 1, 0, this.characterRects.length); this.unconfirmSelection(0); this.updateSelectors(); }
        if (Phaser.Input.Keyboard.JustDown(this.keyRightP1)) { this.playerSelections[0].index = Phaser.Math.Wrap(this.playerSelections[0].index + 1, 0, this.characterRects.length); this.unconfirmSelection(0); this.updateSelectors(); }
        // Player2 keyboard nav
        if (Phaser.Input.Keyboard.JustDown(this.keyLeftP2)) { this.playerSelections[1].index = Phaser.Math.Wrap(this.playerSelections[1].index - 1, 0, this.characterRects.length); this.unconfirmSelection(1); this.updateSelectors(); }
        if (Phaser.Input.Keyboard.JustDown(this.keyRightP2)) { this.playerSelections[1].index = Phaser.Math.Wrap(this.playerSelections[1].index + 1, 0, this.characterRects.length); this.unconfirmSelection(1); this.updateSelectors(); }

        // Confirm with keyboard: mark respective player as confirmed; only start when both confirmed
        if (Phaser.Input.Keyboard.JustDown(this.keyConfirmP1)) this.confirmSelection(0);
        if (Phaser.Input.Keyboard.JustDown(this.keyConfirmP2)) this.confirmSelection(1);

        // Back: unconfirm or go back to ModeSelector if both unconfirmed
        if (Phaser.Input.Keyboard.JustDown(this.keyBackP1)) {
            if (this.confirmed[0]) this.unconfirmSelection(0);
            else this.scene.start("ModeSelector");
        }
        if (Phaser.Input.Keyboard.JustDown(this.keyBackP2)) {
            if (this.confirmed[1]) this.unconfirmSelection(1);
            else this.scene.start("ModeSelector");
        }

        // Pads navigation (each pad controls its respective player selection)
        pads.forEach((pad, i) => {
            if (!pad) return;
            const x = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
            const sel = this.playerSelections[i] || this.playerSelections[0];

            if (x < -0.55 && !pad._leftPressed) { sel.index = Phaser.Math.Wrap(sel.index - 1, 0, this.characterRects.length); pad._leftPressed = true; this.unconfirmSelection(i); this.updateSelectors(); }
            else if (x > 0.55 && !pad._rightPressed) { sel.index = Phaser.Math.Wrap(sel.index + 1, 0, this.characterRects.length); pad._rightPressed = true; this.unconfirmSelection(i); this.updateSelectors(); }
            else if (x > -0.55 && x < 0.55) pad._leftPressed = pad._rightPressed = false;

            // A confirm
            const a = pad.buttons[0] && pad.buttons[0].pressed;
            if (a && !pad._aPressed) {
                this.confirmSelection(i);
                pad._aPressed = true;
            }
            if (!a) pad._aPressed = false;

            // B back
            const b = pad.buttons[1] && pad.buttons[1].pressed;
            if (b && !pad._bPressed) {
                if (this.confirmed[i]) this.unconfirmSelection(i);
                else this.scene.start("ModeSelector");
                pad._bPressed = true;
            }
            if (!b) pad._bPressed = false;
        });
    }

    moveSelector(dir) {
        if (!this.buttons || this.buttons.length === 0) return;
        this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + dir, 0, this.buttons.length);
        const b = this.buttons[this.selectedIndex];
        if (b && b.rect) { this.selector.x = b.rect.x; this.selector.y = b.rect.y; }
    }

    // Agrega este método dentro de la clase CharacterSelector
    updateSelectors() {
        // Asegura que los marcos de selección sigan a los personajes seleccionados
        if (this.playerSelectors && this.characterRects) {
            if (this.playerSelectors[0] && this.characterRects[this.playerSelections[0].index]) {
                this.playerSelectors[0].x = this.characterRects[this.playerSelections[0].index].x;
            }
            if (this.playerSelectors[1] && this.characterRects[this.playerSelections[1].index]) {
                this.playerSelectors[1].x = this.characterRects[this.playerSelections[1].index].x;
            }
        }
    }
}

// --- ESCENA MAP SELECTOR ---
class MapSelector extends Phaser.Scene {
    constructor() { super("MapSelector"); }
    init(data) {
        this.player1Index = data.player1;
        this.player2Index = data.player2;
        this.selectedMode = data.mode;
        this.currentMap = 0;
        this.maps = ["Mapa 1", "Mapa 2", "Mapa 3"];
    }

    create() {
        const { width, height } = this.scale;
        this.cameras.main.setBackgroundColor(0x001933);
        this.title = this.add.text(width / 2, 80, isEnglish ? "Select a Map" : "Selecciona un Mapa", { font: "48px Arial", color: "#00ffff" }).setOrigin(0.5);
        this.mapText = this.add.text(width / 2, height / 2, this.maps[this.currentMap], { font: "36px Arial", color: "#66ffff" }).setOrigin(0.5);

        this.prev = this.add.text(width / 2 - 200, height / 2, "<", { font: "64px Arial", color: "#00ffff" }).setInteractive();
        this.next = this.add.text(width / 2 + 200, height / 2, ">", { font: "64px Arial", color: "#00ffff" }).setInteractive();

        this.startButton = this.add.rectangle(width / 2, height / 2 + 150, 200, 70, 0x004466).setInteractive();
        this.startText = this.add.text(width / 2, height / 2 + 150, isEnglish ? "START" : "EMPEZAR", { font: "28px Arial", color: "#00ffff" }).setOrigin(0.5);

        this.prev.on('pointerdown', () => this.changeMap(-1));
        this.next.on('pointerdown', () => this.changeMap(1));
        this.startButton.on('pointerdown', () => {
            try { this.startGame(); } catch (e) { console.warn('startGame() failed:', e); }
        });

        // keyboard nav and confirm/back
        this.keyLeft = this.input.keyboard.addKey('A');
        this.keyRight = this.input.keyboard.addKey('D');
        this.keyLeft2 = this.input.keyboard.addKey('LEFT');
        this.keyRight2 = this.input.keyboard.addKey('RIGHT');

        this.keyConfirmP1 = this.input.keyboard.addKey('SPACE');
        this.keyConfirmP2 = this.input.keyboard.addKey('ENTER');
        this.keyBackP1 = this.input.keyboard.addKey('SHIFT');
        this.keyBackP2 = this.input.keyboard.addKey('BACKSPACE');
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.keyLeft) || Phaser.Input.Keyboard.JustDown(this.keyLeft2)) this.changeMap(-1);
        if (Phaser.Input.Keyboard.JustDown(this.keyRight) || Phaser.Input.Keyboard.JustDown(this.keyRight2)) this.changeMap(1);
        if (Phaser.Input.Keyboard.JustDown(this.keyConfirmP1) || Phaser.Input.Keyboard.JustDown(this.keyConfirmP2)) this.startGame();
        if (Phaser.Input.Keyboard.JustDown(this.keyBackP1) || Phaser.Input.Keyboard.JustDown(this.keyBackP2)) this.scene.start("CharacterSelector", { mode: this.selectedMode });

        const pads = this.input.gamepad.gamepads;
        pads.forEach(pad => {
            if (!pad) return;
            const x = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
            if (x < -0.6 && !pad._leftPressed) { this.changeMap(-1); pad._leftPressed = true; }
            else if (x > 0.6 && !pad._rightPressed) { this.changeMap(1); pad._rightPressed = true; }
            else if (x > -0.6 && x < 0.6) pad._leftPressed = pad._rightPressed = false;

            const a = pad.buttons[0] && pad.buttons[0].pressed;
            if (a && !pad._aPressed) { this.startGame(); pad._aPressed = true; }
            if (!a) pad._aPressed = false;

            const b = pad.buttons[1] && pad.buttons[1].pressed;
            if (b && !pad._bPressed) { this.scene.start("CharacterSelector", { mode: this.selectedMode }); pad._bPressed = true; }
            if (!b) pad._bPressed = false;
        });
    }

    changeMap(dir) {
        this.currentMap = Phaser.Math.Wrap(this.currentMap + dir, 0, this.maps.length);
        this.mapText.setText(this.maps[this.currentMap]);
    }

    startGame() {
        this.scene.start("GameScene", { player1Index: this.player1Index, player2Index: this.player2Index, mode: this.selectedMode, map: this.maps[this.currentMap] });
    }
}

// --- ESCENA GAME ---
class GameScene extends Phaser.Scene {
    constructor() { super("GameScene"); }

    init(data) {
        this.player1Index = data.player1Index ?? 0;
        this.player2Index = data.player2Index ?? 1;
        this.mode = data.mode ?? "versus";
        this.selectedMap = data.map ?? "Mapa 1";
    }

    // Ensure player sprite exists with a live physics body, correct depth and colliders; rebind critical overlaps
    ensurePlayerSpriteValid() {
        try {
            if (!this.players || !this.players[0]) return;
            const p = this.players[0];
            let s = p.sprite;
            const needRecreate = !s || !s.scene || !s.body;
            const width = this.scale.width, height = this.scale.height;
            if (needRecreate) {
                const key = `char${this.player1Index}_idle`;
                const x = (s && s.x) ? s.x : (this._lastPlayerX || 200);
                const y = (s && s.y) ? s.y : (this._lastPlayerY || height - 150);
                try { if (s && s.destroy) s.destroy(); } catch (e) {}
                s = this.physics.add.sprite(x, y, key).setCollideWorldBounds(true);
                try { s.setDisplaySize(64, 64); } catch (e) {}
                if (s.body && s.body.setSize) s.body.setSize(40, 56).setOffset(12, 8);
                try { s.setFrame(0); } catch (e) {}
                p.sprite = s;
                if (this.mode === 'cooperativo' && this.players[1]) this.players[1].sprite = s;
            }
            // common sanity
            p.immobilized = false;
            p.blocking = false; p.wasBlocking = false; p.blockPressTime = 0;
            // NO forzar a 1 HP, mantener la vida actual
            try { s.setActive(true).setVisible(true).setAlpha(1).setDepth(8).setCollideWorldBounds(true); } catch (e) {}
            if (s.body) {
                try {
                    s.body.enable = true;
                    if (s.body.setAllowGravity) s.body.setAllowGravity(true);
                    // ensure collision checks are on
                    if (s.body.checkCollision) {
                        s.body.checkCollision.none = false;
                        s.body.checkCollision.up = s.body.checkCollision.down = s.body.checkCollision.left = s.body.checkCollision.right = true;
                    }
                } catch (e) {}
            }
            // Detach from enemies group if mistakenly included
            try { if (this.enemies && this.enemies.contains && this.enemies.contains(s)) this.enemies.remove(s, false, false); } catch (e) {}
            // Collide with ground
            try {
                if (!this._playerColliders) this._playerColliders = [];
                this._playerColliders.push(this.physics.add.collider(s, this.groundGroup));
            } catch (e) {}
            // Rebind projectile->player overlaps
            try {
                if (!this._projPlayerOverlaps) this._projPlayerOverlaps = [];
                this._projPlayerOverlaps.forEach(c => { try { this.physics.world.removeCollider(c); } catch (e) {} });
                this._projPlayerOverlaps.length = 0;
                this._projPlayerOverlaps.push(this.physics.add.overlap(this.projectiles, this.players[0].sprite, (a, b) => this.handleProjectilePlayerOverlap(a, b, 0)));
                this._projPlayerOverlaps.push(this.physics.add.overlap(this.projectiles, this.players[1].sprite, (a, b) => this.handleProjectilePlayerOverlap(a, b, 1)));
            } catch (e) {}
            // Rebind boss spikes overlap
            try {
                if (this._bossSpikesOverlap) { this.physics.world.removeCollider(this._bossSpikesOverlap); this._bossSpikesOverlap = null; }
                if (this.bossSpikes && this.players[0].sprite) {
                    this._bossSpikesOverlap = this.physics.add.overlap(this.bossSpikes, this.players[0].sprite, (spike, sprite) => {
                        try { spike.destroy(); } catch (e) {}
                        this.applyDamageToPlayer(0, 70);
                    });
                }
            } catch (e) {}
            // Bring visuals to top
            try { if (this.children && this.children.bringToTop) this.children.bringToTop(s); } catch (e) {}
            if (this.reticle) {
                try { if (this.children && this.children.bringToTop) this.children.bringToTop(this.reticle); } catch (e) {}
                try { if (this.reticle.setDepth) this.reticle.setDepth(11); } catch (e) {}
            }
        } catch (e) { /* ignore */ }
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
        // Try fullscreen on start (may be rejected if not user-gesture). Swallow promise rejection.
        try {
            const fs = this.scale && this.scale.startFullscreen ? this.scale.startFullscreen() : null;
            if (fs && typeof fs.then === 'function' && typeof fs.catch === 'function') {
                fs.catch(err => { /* ignore permission errors like "not granted" */ });
            }
        } catch (e) { /* ignore fullscreen errors */ }

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
    const p1KeyBase = `char${this.player1Index}_idle`;
    const p2KeyBase = `char${this.player2Index}_idle`;
    const p1Sprite = this.physics.add.sprite(200, height - 150, p1KeyBase).setCollideWorldBounds(true);
    const p2Sprite = this.physics.add.sprite(width - 200, height - 150, p2KeyBase).setCollideWorldBounds(true);
    // Ensure players render above enemies/boss/spikes (boss depth=5, spikes=4)
    try { p1Sprite.setDepth(8); p2Sprite.setDepth(8); } catch (e) {}

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
        // Hide and disable the original p2Sprite since we'll use p1's sprite
        p2Sprite.setVisible(false);
        p2Sprite.setActive(false);
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
            try { this.reticle.setDepth(11); } catch (e) {}
        } catch (e) { /* ignore */ }
    } else {
        this.physics.add.collider(this.players[1].sprite, this.groundGroup);
    }

    // Projectiles group (sin gravedad por defecto)
    this.projectiles = this.physics.add.group({ allowGravity: false });

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

        // DEBUG: tecla T salta directo al jefe final en modo cooperativo
        try {
            this.input.keyboard.on('keydown-T', () => {
                if (this.mode !== 'cooperativo') return;
                // cancelar futuros spawns de oleadas
                this._cancelWaveSpawns = true;
                // limpiar enemigos y proyectiles enemigos actuales
                try { if (this.enemies) this.enemies.clear(true, true); } catch (e) {}
                try { if (this.enemyProjectiles) this.enemyProjectiles.clear(true, true); } catch (e) {}
                // preparar estado para jefe
                this.currentWave = this.maxWaves;
                this.waveActive = false;
                this.waveCompleted = true;
                if (this.boss) { try { this.boss.destroy(); } catch (e) {} }
                this.boss = null; this.bossActive = false;
                if (this.waveText && this.waveText.setText) this.waveText.setText('¡Jefe final! (debug)');
                // Saneamiento: asegurar sprite válido/activo y rebind de overlaps
                try { this.ensurePlayerSpriteValid(); if (this.physics && this.physics.world && this.physics.world.isPaused) this.physics.resume(); } catch (ee) { /* ignore */ }
                // spawn boss inmediatamente
                this.spawnBoss();
            });
        } catch (e) { /* ignore debug key errors */ }

        // Gamepad connect listener: initialize flags
        this.input.gamepad.on('connected', pad => {
            pad._leftPressed = pad._rightPressed = false;
            pad._aPressed = pad._bPressed = false;
            pad._lastButtons = [];
        });

        // Sistema de oleadas para modo cooperativo
        if (this.mode === 'cooperativo') {
            this.currentWave = 0;
            this.maxWaves = 5;
            this.enemies = this.physics.add.group();
            // Grupo de proyectiles enemigos (sin gravedad por defecto)
            this.enemyProjectiles = this.physics.add.group({ allowGravity: false });
            this.waveActive = false;
            this.waveCompleted = false;
            // Boss state
            this.boss = null;
            this.bossActive = false;
            this.bossSpikes = this.physics.add.staticGroup();
            
            // Configuración de oleadas: número de enemigos por oleada
            this.waveConfig = [
                { enemies: 3 },  // Oleada 1
                { enemies: 5 },  // Oleada 2
                { enemies: 7 },  // Oleada 3
                { enemies: 9 },  // Oleada 4
                { enemies: 12 }  // Oleada 5
            ];
            
            // Texto de oleada
            this.waveText = this.add.text(this.scale.width / 2, 100, '', {
                fontSize: '32px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5).setDepth(1000).setScrollFactor(0);
            
            // Iniciar primera oleada después de 2 segundos
            this.time.delayedCall(2000, () => this.startWave());
            
            // Colisiones: proyectiles enemigos con jugador (bloqueables con parry perfecto)
            this.physics.add.overlap(
                this.enemyProjectiles,
                this.players[0].sprite,
                (a, b) => {
                    // Determinar el proyectil con seguridad
                    const proj = (a && a.texture && a.texture.key === 'tex_bullet') ? a : b;
                    if (!proj || !proj.active) return;
                    const shooterIndex = 1; // En coop, P2 es el que dispara/parrea
                    const p = this.players[shooterIndex];
                    const now = this.time.now;
                    const parryWindow = 500;
                    const justBlocked = p.blockPressTime && (now - p.blockPressTime) < parryWindow;
                    if (p.blocking && justBlocked && !proj.parried) {
                        proj.parried = true;
                        proj.damage = (proj.damage || 35) * 2;
                        proj.isReflected = true;
                        proj.parryReflected = true;
                        try { proj.setTint(0xff00ff); } catch (e) {}
                        this.cameras.main.flash(120, 255, 255, 0);
                        if (proj.body) {
                            const vx = proj.body.velocity.x || 0;
                            const vy = proj.body.velocity.y || 0;
                            let speed = Math.hypot(vx, vy);
                            let angle;
                            if (speed > 10) {
                                angle = Math.atan2(-vy, -vx);
                            } else {
                                const px = this.players[0].sprite.x;
                                const py = this.players[0].sprite.y;
                                angle = Phaser.Math.Angle.Between(proj.x, proj.y, px, py) + Math.PI;
                                speed = 600;
                            }
                            const newSpeed = Math.max(500, speed);
                            const newVx = Math.cos(angle) * newSpeed;
                            const newVy = Math.sin(angle) * newSpeed;
                            proj.body.setAllowGravity(false);
                            if (proj.body.setGravity) proj.body.setGravity(0, 0);
                            proj.body.setDrag(0, 0);
                            proj.body.setVelocity(newVx, newVy);
                            proj.rotation = angle;
                        }
                        proj.shooter = shooterIndex;
                        this.enemyProjectiles.remove(proj, true, false);
                        this.projectiles.add(proj, true);
                        if (proj.body) {
                            // Reasegurar configuración tras cambio de grupo
                            proj.body.setAllowGravity(false);
                            if (proj.body.setGravity) proj.body.setGravity(0, 0);
                            proj.body.setDrag(0, 0);
                            if (proj.body.velocity.length && proj.body.velocity.length() < 10) {
                                // Si perdió velocidad, usar su rotación para impulsarlo
                                const speed = 600;
                                const ang = proj.rotation || 0;
                                proj.body.setVelocity(Math.cos(ang) * speed, Math.sin(ang) * speed);
                            }
                        }
                        return; // no continuar con lógica de daño al jugador
                    }
                    if (p.blocking) {
                        this.changeEnergyFor(p, -10);
                        try { proj.destroy(); } catch (e) {}
                        return;
                    }
                    this.applyDamageToPlayer(0, proj.damage || 35);
                    try { proj.destroy(); } catch (e) {}
                }
            );

            // Colisión: pinchos del jefe con el jugador (no bloqueables)
            this.physics.add.overlap(this.bossSpikes, this.players[0].sprite, (spike, sprite) => {
                try { spike.destroy(); } catch(e) {}
                this.applyDamageToPlayer(0, 70);
            });
            
            // Colisiones: proyectiles del jugador con enemigos (con reflexión para enemigos terrestres)
            this.physics.add.overlap(this.projectiles, this.enemies, (proj, enemy) => {
                if (!proj.active || !enemy.active) return;

                // Si el enemigo refleja proyectiles del jugador Y NO es un proyectil de parry, devuélvelo hacia el jugador
                if (enemy.reflectsProjectiles && !proj.isReflected && !proj.parryReflected) {
                    proj.isReflected = true;
                    try { proj.setTint(0x66ccff); } catch (e) { /* visual */ }

                    const playerSprite = this.players[0] && this.players[0].sprite;
                    if (playerSprite && proj.body) {
                        const ang = Phaser.Math.Angle.Between(enemy.x, enemy.y, playerSprite.x, playerSprite.y);
                        // Mantener la velocidad actual si existe, sino usar 500
                        const curVx = proj.body.velocity.x || 0;
                        const curVy = proj.body.velocity.y || 0;
                        const curSpeed = Math.max(300, Math.hypot(curVx, curVy));
                        proj.body.setVelocity(Math.cos(ang) * curSpeed, Math.sin(ang) * curSpeed);
                        proj.rotation = ang;
                        // Asegurar que no se trate como fuego amigo
                        proj.shooter = -1;
                    }
                    // No dañar al enemigo
                    return;
                }

                // Si el proyectil fue reflejado por parry, siempre daña al enemigo (ignora reflexión enemiga)
                let damage = proj.damage || 20;
                if (proj.parryReflected) {
                    // Proyectil de parry perfecto: siempre hace daño completo y doble
                    damage = proj.damage; // Ya tiene el daño duplicado
                    console.log('Parry hit enemy with damage:', damage);
                }
                if (enemy === this.boss) {
                    enemy.health -= damage;
                    console.log('Boss health after parry hit:', enemy.health);
                } else {
                    enemy.health -= damage;
                    console.log('Enemy health after parry hit:', enemy.health);
                }
                proj.destroy();

                if (enemy.health <= 0) {
                    if (enemy.healthBar) enemy.healthBar.destroy();
                    if (enemy.healthBarBg) enemy.healthBarBg.destroy();
                    enemy.destroy();
                    this.checkWaveComplete();
                }
            });
        }

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

        // Bloqueo: si el jugador está bloqueando, anula el impacto (aplica pequeño coste de energía)
        if (target.blocking) {
            this.changeEnergyFor(target, -10);
            if (!proj.piercing) proj.destroy();
            return;
        }

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
        // Si es un proyectil reflejado por parry, ignorar colisión con jugadores
        if (proj && proj.parryReflected) return;
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
        // Update enemies in cooperative mode
        if (this.mode === 'cooperativo') {
            this.updateEnemies(time);
            this.updateBoss(time);
        }
        // Track last known player position and reinforce sprite validity during boss phase
        try {
            if (this.players && this.players[0] && this.players[0].sprite) {
                this._lastPlayerX = this.players[0].sprite.x;
                this._lastPlayerY = this.players[0].sprite.y;
            }
            if (this.bossActive) {
                this.ensurePlayerSpriteValid();
            }
        } catch (e) { /* ignore */ }

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
                    // Limpiar barras de vida del jefe si existen
                    if (this.bossHealthBarBg) { this.bossHealthBarBg.destroy(); this.bossHealthBarBg = null; }
                    if (this.bossHealthBar) { this.bossHealthBar.destroy(); this.bossHealthBar = null; }
                    if (this.bossHealthText) { this.bossHealthText.destroy(); this.bossHealthText = null; }
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

        // CARGA DE ENERGÍA COOPERATIVA: verificar si ambos jugadores están bloqueando con A
        if (this.mode === 'cooperativo') {
            const p1 = this.players[0];
            const p2 = this.players[1];
            const p1Pad = getPad(p1.padIndex, this);
            const p2Pad = getPad(p2.padIndex, this);
            const p1Block = p1Pad && p1Pad.connected && p1Pad.buttons[0] && p1Pad.buttons[0].pressed;
            const p2Block = p2Pad && p2Pad.connected && p2Pad.buttons[0] && p2Pad.buttons[0].pressed;
            if (p1Block && p2Block) {
                // Ambos están bloqueando con A: recargar energía
                this.changeEnergyFor(player, 2.0);
            }
        }

        // CO-OP: player index 1 does not move the shared character; they control the reticle and shooting
        // If the main player is immobilized (secondary HP depleted state), they can't move or charge
        if (this.mode === 'cooperativo' && player.immobilized && i === 0) {
            try { sprite.setVelocityX(0); } catch (e) {}
            player.chargingShot = false;
            player.chargeAmount = 0;
            return;
        }
        if (this.mode === 'cooperativo' && i === 1) {
            // P2 puede disparar rápido y cargado solo con X (2) del gamepad, nunca con otro botón ni teclado
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
                
                // DETECCIÓN DE PARRY PARA P2: registrar cuando presiona A (botón 0) para bloquear
                const blockPressed = btn[0] && btn[0].pressed;
                if (blockPressed && !coopPlayer.wasBlocking) {
                    coopPlayer.blockPressTime = this.time.now;
                    coopPlayer.wasBlocking = true;
                    coopPlayer.blocking = true;
                } else if (!blockPressed) {
                    coopPlayer.wasBlocking = false;
                    coopPlayer.blocking = false;
                }
                
                // Disparo rápido con B (1) y disparo cargado con X (2) del gamepad
                const quickPressed = btn[1] && btn[1].pressed && !pad._lastButtons[1];
                const chargeHeld = btn[2] && btn[2].pressed;
                const chargeReleased = (!btn[2] || !btn[2].pressed) && pad._lastButtons[2];
                pad._lastButtons = btn.map(b => !!b.pressed);
                
                // Disparo cargado
                if (chargeHeld && this.getEnergy(coopPlayer) > 0) {
                    if (!coopPlayer.chargingShot) { coopPlayer.chargingShot = true; coopPlayer.chargeAmount = 0; coopPlayer.chargeStart = time; }
                    const dt = this.game.loop.delta / 1000;
                    const energyRate = 160;
                    const consume = Math.min(this.getEnergy(coopPlayer), energyRate * dt);
                    this.changeEnergyFor(coopPlayer, -consume);
                    coopPlayer.chargeAmount = (coopPlayer.chargeAmount || 0) + consume;
                    try { if (this.reticle) this.reticle.setScale(1 + Math.min(1.2, coopPlayer.chargeAmount / 240)); } catch (e) {}
                }
                
                // Al soltar el botón X, disparar el disparo cargado
                if (chargeReleased && coopPlayer.chargingShot && coopPlayer.chargeAmount > 0) {
                    const baseDamage = 20;
                    const steps = Math.floor((coopPlayer.chargeAmount || 0) / 25);
                    const damage = baseDamage + (steps * 3);
                    try { if (this.reticle) this.reticle.setScale(1); } catch (e) {}
                    if ((time - shooter.lastShot) > shooter.shotCD) {
                        shooter.lastShot = time;
                        this.spawnProjectile(0, damage);
                    }
                    coopPlayer.chargingShot = false; 
                    coopPlayer.chargeAmount = 0; 
                    coopPlayer.chargeStart = 0;
                }
                
                // Si no está cargando, resetear
                if (!chargeHeld && !chargeReleased) {
                    coopPlayer.chargingShot = false;
                    coopPlayer.chargeAmount = 0;
                }
                
                // Disparo rápido
                if (quickPressed) {
                    if ((time - shooter.lastShot) > shooter.shotCD) {
                        shooter.lastShot = time;
                        this.spawnProjectile(0, 20);
                    }
                }
            } else {
                // Solo permitir mover la retícula con teclado, pero NO disparar ni cargar con teclado
                if (this.keysP2.left.isDown) this.reticle.x -= 4;
                if (this.keysP2.right.isDown) this.reticle.x += 4;
                if (this.keysP2.up.isDown) this.reticle.y -= 4;
                if (this.keysP2.down.isDown) this.reticle.y += 4;
                coopPlayer.chargingShot = false;
                coopPlayer.chargeAmount = 0;
            }
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
            // Registrar tiempo cuando se presiona bloquear por primera vez (para parry perfecto)
            // En modo cooperativo: solo el P2 (que dispara con gamepad) puede hacer parry
            // En modo versus: ambos pueden bloquear normalmente
            const isShooterInCoop = (this.mode === 'cooperativo' && i === 1); // P2 dispara en coop
            if ((isShooterInCoop || this.mode !== 'cooperativo') && !player.wasBlocking) {
                player.blockPressTime = this.time.now;
                player.wasBlocking = true;
            }
            
            const charIndexLocal = charIndex;
            if (dist > chargeDistance) {
                // Cargar energía (lejos)
                player.blocking = false;
                sprite.setTint(0x2222cc); // Color para cargar
                // En modo versus, cargar normalmente. En coop, ya se maneja al inicio
                if (this.mode !== 'cooperativo') {
                    this.changeEnergyFor(player, 2.0);
                }
                // intentar usar la textura específica de carga y mostrar frame 1
                const chargeKey = `char${charIndexLocal}_charge`;
                if (this.textures.exists(chargeKey)) {
                    try { sprite.setTexture(chargeKey); sprite.setFrame(1); } catch (e) { /* ignore */ }
                } else {
                    try { if (sprite.anims && sprite.anims.isPlaying) sprite.anims.stop(); sprite.setFrame(1); } catch (e) { /* ignore if no frame 1 */ }
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
                    try { if (sprite.anims && sprite.anims.isPlaying) sprite.anims.stop(); sprite.setFrame(1); } catch (e) { /* ignore if no frame 1 */ }
                }
            }
            // No puede moverse, saltar, disparar ni pegar
            sprite.setVelocityX(0);
            return;
            } else {
            player.blocking = false;
            player.wasBlocking = false; // Reset para detectar próxima pulsación
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
        if (explicitDamage != null) {
            proj.damage = explicitDamage;
            // Si el daño es mayor a 20 (disparo cargado), hacer el proyectil más grande
            if (explicitDamage > 20) {
                const scale = 1 + Math.min(2.5, (explicitDamage - 20) / 30);
                proj.setScale(scale);
            }
        }

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
        const attacker = this.players[i];
        const target = this.players[1 - i];
        
        // Siempre reproducir animación de puñetazo
        const attChar = (i === 0) ? this.player1Index : this.player2Index;
        const atkPunchKey = `char${attChar}_punch`;
        if (this.anims.exists(atkPunchKey)) {
            try { attacker.sprite.anims.play(atkPunchKey, true); } catch (e) { }
        } else if (this.textures.exists(atkPunchKey)) {
            try { attacker.sprite.setTexture(atkPunchKey); attacker.sprite.setFrame(0); } catch (e) { }
        }

        // En modo cooperativo, golpear enemigos en lugar de PvP
        if (this.mode === 'cooperativo') {
            if (!this.enemies) return;
            
            // Buscar enemigos cercanos
            const hitRange = 150;
            this.enemies.children.entries.forEach(enemy => {
                if (!enemy.active) return;
                
                const dist = Phaser.Math.Distance.Between(attacker.sprite.x, attacker.sprite.y, enemy.x, enemy.y);
                
                if (dist < hitRange) {
                    // Aplicar daño al enemigo
                    const damage = 50;
                    enemy.health -= damage;
                    
                    // Efecto visual: empujar al enemigo
                    const dir = (enemy.x > attacker.sprite.x) ? 1 : -1;
                    enemy.setVelocityX(300 * dir);
                    enemy.setVelocityY(-100);
                    
                    // Destruir enemigo si su vida llega a 0
                    if (enemy.health <= 0) {
                        if (enemy.healthBar) enemy.healthBar.destroy();
                        if (enemy.healthBarBg) enemy.healthBarBg.destroy();
                        enemy.destroy();
                        this.checkWaveComplete();
                    }
                }
            });
            return;
        }

        // Modo versus: lógica PvP original
        const dist = Phaser.Math.Distance.Between(attacker.sprite.x, attacker.sprite.y, target.sprite.x, target.sprite.y);

        // Efecto imán: si el enemigo está cerca (menos de 150px), mover al atacante hacia él
        const magnetRange = 150;
        if (dist < magnetRange && dist > 0) {
            const dir = (target.sprite.x > attacker.sprite.x) ? 1 : -1;
            const magnetForce = 300; // Velocidad del imán
            attacker.sprite.setVelocityX(magnetForce * dir);
        }

        // Solo aplicar daño si está lo suficientemente cerca (después del imán)
        const hitRange = 90;
        if (dist < hitRange && !target.beingHit) {
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
        }
    }

    // Sistema de oleadas para modo cooperativo
    startWave() {
        if (this.currentWave >= this.maxWaves) {
            this.waveText.setText('¡Victoria! Todas las oleadas completadas');
            return;
        }
        
        this.currentWave++;
        this.waveActive = true;
        this.waveCompleted = false;
        
        const config = this.waveConfig[this.currentWave - 1];
        this.waveText.setText(`Oleada ${this.currentWave}/${this.maxWaves}`);
        
        // Crear mezcla de enemigos: alterna voladores y terrestres
        for (let i = 0; i < config.enemies; i++) {
            this.time.delayedCall(i * 800, () => {
                if (i % 2 === 0) this.spawnFlyingEnemy();
                else this.spawnGroundEnemy();
            });
        }
    }

    spawnFlyingEnemy() {
        if (this._cancelWaveSpawns) return; // debug: no spawns when jumping to boss
        const width = this.scale.width;
        const height = this.scale.height;
        
        // Spawn en posiciones aleatorias del borde superior o lateral
        const spawnSide = Phaser.Math.Between(0, 2);
        let x, y;
        
        if (spawnSide === 0) { // Arriba
            x = Phaser.Math.Between(100, width - 100);
            y = 50;
        } else if (spawnSide === 1) { // Izquierda
            x = 50;
            y = Phaser.Math.Between(100, height - 200);
        } else { // Derecha
            x = width - 50;
            y = Phaser.Math.Between(100, height - 200);
        }
        
        // Crear sprite del enemigo más grande
        const enemy = this.physics.add.sprite(x, y, 'tex_bullet');
        enemy.setTint(0xff0000); // Color rojo para distinguir
        enemy.setScale(3.5); // Aumentado de 1.5 a 3.5
        
        // Propiedades del enemigo
        // Vida para aguantar ~4 disparos (20 daño c/u) y ~3 golpes (50 daño c/u)
        enemy.health = 180; // 4 disparos = 80, 3 golpes = 150, promedio ~180
        enemy.maxHealth = 180;
        enemy.lastShot = 0;
        enemy.shotCooldown = 4000; // Aumentado de 2000 a 4000ms (dispara cada 4 segundos)
        enemy.moveSpeed = 60; // Reducido de 100 a 60
        enemy.isFlying = true;
        
        this.enemies.add(enemy);
        enemy.body.setAllowGravity(false);
        enemy.setCollideWorldBounds(true);
        
        // Crear barra de vida del enemigo
        enemy.healthBarBg = this.add.rectangle(enemy.x, enemy.y - 30, 50, 6, 0x000000).setDepth(6);
        enemy.healthBar = this.add.rectangle(enemy.x, enemy.y - 30, 50, 6, 0xff0000).setDepth(7);
        
        // Colisión con plataformas
        this.physics.add.collider(enemy, this.groundGroup);
        
        // Movimiento aleatorio más lento
        this.tweens.add({
            targets: enemy,
            x: Phaser.Math.Between(100, width - 100),
            y: Phaser.Math.Between(100, height - 200),
            duration: 5000, // Aumentado de 3000 a 5000ms (más lento)
            ease: 'Sine.inOut',
            yoyo: true,
            repeat: -1
        });
    }

    // Enemigo terrestre que persigue, salta y refleja proyectiles del jugador
    spawnGroundEnemy() {
        if (this._cancelWaveSpawns) return; // debug: no spawns when jumping to boss
        const width = this.scale.width;
        const height = this.scale.height;

        // Aparece desde arriba, cerca de las plataformas superiores
        const side = Phaser.Math.Between(0, 1);
        const x = (side === 0) ? 200 : width - 200;
        const y = height * 0.3; // Spawn desde arriba para que caiga sobre las plataformas

        const enemy = this.physics.add.sprite(x, y, 'tex_bullet');
        enemy.setTint(0x33cc33); // Verde para diferenciar
        enemy.setScale(2.6);

        // Propiedades
        enemy.type = 'ground';
        enemy.health = 220; // un poco más tanque que el volador
        enemy.maxHealth = 220;
        enemy.moveSpeed = 90;
        enemy.jumpSpeed = -420;
        enemy.lastMelee = 0;
        // Aumentar cooldown de ataque cuerpo a cuerpo para evitar stunlock
        enemy.meleeCooldown = 1400;
        enemy.reflectsProjectiles = true;
        enemy.lastJump = 0;
        enemy.jumpCooldown = 500;

        this.enemies.add(enemy);
        enemy.body.setAllowGravity(true);
        enemy.setCollideWorldBounds(true);

        // Crear barra de vida del enemigo
        enemy.healthBarBg = this.add.rectangle(enemy.x, enemy.y - 30, 50, 6, 0x000000).setDepth(6);
        enemy.healthBar = this.add.rectangle(enemy.x, enemy.y - 30, 50, 6, 0x33cc33).setDepth(7);

        // Colisión con plataformas
        this.physics.add.collider(enemy, this.groundGroup);
    }

    // Jefe final: rectángulo grande con 3 ataques
    spawnBoss() {
        if (this.boss || this.bossActive) return;
        // Asegurar que el jugador está operativo al entrar al jefe
        try {
            this.ensurePlayerSpriteValid();
        } catch (e) { /* ignore */ }
        const width = this.scale.width;
        const height = this.scale.height;

        // Crear rectángulo pequeño como placeholder del jefe
        const boss = this.add.rectangle(width * 0.5, height * 0.3, 60, 90, 0x7a00ff);
        boss.setDepth(5);
        boss.setOrigin(0.5);
        
        this.physics.add.existing(boss);
        boss.body.setAllowGravity(true);
        boss.body.setCollideWorldBounds(true);
        boss.body.setSize(60, 90); // Asegurar el tamaño del body
        boss.body.setEnable(true); // Asegurar que el body esté activo
        
        this.physics.add.collider(boss, this.groundGroup);

        // Propiedades del jefe (usar setData para que Phaser las preserve correctamente)
        boss.setData('health', 1000);
        boss.setData('maxHealth', 1000);
        boss.setData('moveSpeed', 80);
        boss.setData('lastShot', 0);
        boss.setData('shotCooldown', 3500); // Disparar cada 3.5 segundos
        boss.setData('lastAreaAttack', 0);
        boss.setData('areaAttackCooldown', 8000); // Ataque de área cada 8 segundos

        this.boss = boss;
        this.bossActive = true;
        this.waveText.setText('¡Jefe Final!');

        // Crear barra de vida del jefe en la parte inferior
        const barWidth = 600;
        const barHeight = 30;
        const barX = width / 2;
        const barY = height - 50;
        
        this.bossHealthBarBg = this.add.rectangle(barX, barY, barWidth, barHeight, 0x000000).setDepth(100);
        this.bossHealthBar = this.add.rectangle(barX, barY, barWidth, barHeight, 0xff0066).setDepth(101);
        this.bossHealthText = this.add.text(barX, barY, 'JEFE: 1000/1000', {
            fontSize: '20px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(102);

        // Daño de proyectiles del jugador al jefe
        this.bossOverlap = this.physics.add.overlap(this.projectiles, boss, (proj, b) => {
            if (!proj || !proj.active) return;
            
            // IMPORTANTE: Usar this.boss (el Rectangle) en lugar del parámetro b (el ArcadeSprite wrapper)
            const bossTarget = this.boss;
            if (!bossTarget) return;
            
            // Obtener health usando getData del Rectangle original
            let currentHealth = bossTarget.getData('health');
            const maxHealth = bossTarget.getData('maxHealth') || 1000;
            
            console.log('BOSS DAMAGE - Current health:', currentHealth, 'Max health:', maxHealth);
            
            // Asegurar que el boss tiene vida inicializada
            if (typeof currentHealth !== 'number') {
                currentHealth = maxHealth;
                bossTarget.setData('health', currentHealth);
                bossTarget.setData('maxHealth', maxHealth);
            }
            
            const damage = proj.damage || 20;
            const newHealth = Math.max(0, currentHealth - damage);
            bossTarget.setData('health', newHealth);
            
            console.log('BOSS HIT! Health:', currentHealth, '->', newHealth, 'Damage:', damage);
            
            // Efecto visual de impacto
            const flash = this.add.circle(proj.x, proj.y, 15, 0xff6600, 0.8).setDepth(10);
            this.tweens.add({
                targets: flash,
                alpha: 0,
                scale: 2,
                duration: 300,
                onComplete: () => { try { flash.destroy(); } catch (e) {} }
            });
            
            try { proj.destroy(); } catch (e) {}
        });
        
        // Daño de ataques cuerpo a cuerpo del jugador al jefe
        const playerSprite = this.players[0] && this.players[0].sprite;
        if (playerSprite) {
            this.bossPlayerOverlap = this.physics.add.overlap(playerSprite, boss, (player, b) => {
                // Solo hacer daño cuando el jugador está atacando (animación punch)
                const p0 = this.players[0];
                if (!p0 || !p0.isAttacking) return;
                
                // Cooldown para evitar daño múltiple en un solo ataque
                const now = this.time.now;
                if (p0._lastBossMeleeHit && now - p0._lastBossMeleeHit < 500) return;
                p0._lastBossMeleeHit = now;
                
                const bossTarget = this.boss;
                if (!bossTarget) return;
                
                let currentHealth = bossTarget.getData('health');
                const maxHealth = bossTarget.getData('maxHealth') || 1000;
                
                if (typeof currentHealth !== 'number') {
                    currentHealth = maxHealth;
                    bossTarget.setData('health', currentHealth);
                    bossTarget.setData('maxHealth', maxHealth);
                }
                
                const damage = 30; // Daño de melee
                const newHealth = Math.max(0, currentHealth - damage);
                bossTarget.setData('health', newHealth);
                
                console.log('BOSS MELEE HIT! Health:', currentHealth, '->', newHealth, 'Damage:', damage);
                
                // Efecto visual de impacto
                const flash = this.add.circle(bossTarget.x, bossTarget.y, 20, 0xff3300, 0.8).setDepth(10);
                this.tweens.add({
                    targets: flash,
                    alpha: 0,
                    scale: 2,
                    duration: 300,
                    onComplete: () => { try { flash.destroy(); } catch (e) {} }
                });
            });
        }
    }

    spawnBossSpikeAt(x, y) {
        // Crear un pincho estático que dura poco tiempo
        const spike = this.add.rectangle(x, y + 32, 20, 64, 0xcc0066).setDepth(4);
        this.physics.add.existing(spike, true); // estático
        this.bossSpikes.add(spike);
        // Destruir después de 700ms
        this.time.delayedCall(700, () => { try { if (spike && spike.scene) spike.destroy(); } catch (e) {} });
    }

    bossShootAtPlayer() {
        if (!this.boss || !this.players[0] || !this.players[0].sprite) return;
        const player = this.players[0].sprite;
        const b = this.boss;
        const angle = Phaser.Math.Angle.Between(b.x, b.y, player.x, player.y);
        const proj = this.physics.add.sprite(b.x, b.y - 40, 'tex_bullet');
        proj.setTint(0x9933ff);
        proj.setScale(2.2);
        proj.damage = 50;
        this.enemyProjectiles.add(proj);
        proj.body.setAllowGravity(false);
        const speed = 460;
        proj.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        proj.rotation = angle;
        this.time.delayedCall(3500, () => { if (proj && proj.active) proj.destroy(); });
    }

    updateBoss(time) {
        if (!this.bossActive || !this.boss || this.mode !== 'cooperativo') return;
        const b = this.boss;
        if (!b.scene) { this.bossActive = false; this.boss = null; return; }
        
        // Asegurar que el boss sea visible
        b.setVisible(true);
        b.setActive(true);
        b.setAlpha(1);
        
        // Asegurar que el boss tenga health inicializada
        if (typeof b.getData('health') !== 'number') {
            b.setData('health', 1000);
            b.setData('maxHealth', 1000);
        }
        
        const player = this.players[0] && this.players[0].sprite;
        if (!player) return;

        // Movimiento sencillo hacia el jugador
        const dir = (player.x > b.x) ? 1 : -1;
        try { b.body.setVelocityX(dir * (b.getData('moveSpeed') || 80)); } catch (e) {}

        // Actualizar barra de vida del jefe
        if (this.bossHealthBar && this.bossHealthText) {
            const health = b.getData('health');
            const maxHealth = b.getData('maxHealth') || 1000;
            const healthPercent = Math.max(0, health / maxHealth);
            const barWidth = 600;
            this.bossHealthBar.width = barWidth * healthPercent;
            this.bossHealthText.setText(`JEFE: ${Math.ceil(health)}/${maxHealth}`);
        }

        // Spawn de enemigos durante la fase del jefe (máximo 5)
        if (!this._bossEnemySpawnTimer) this._bossEnemySpawnTimer = 0;
        if (!this._bossEnemiesCount) this._bossEnemiesCount = 0;
        
        // Contar enemigos activos
        this._bossEnemiesCount = this.enemies ? this.enemies.children.entries.filter(e => e.active).length : 0;
        
        // Spawn cada 10 segundos si hay menos de 5 enemigos
        if (time - this._bossEnemySpawnTimer > 10000 && this._bossEnemiesCount < 5) {
            this._bossEnemySpawnTimer = time;
            // Alternar entre voladores y terrestres
            const spawnType = Phaser.Math.Between(0, 1);
            if (spawnType === 0) this.spawnFlyingEnemy();
            else this.spawnGroundEnemy();
        }

        // Disparo de proyectil
        if (time - (b.getData('lastShot') || 0) > (b.getData('shotCooldown') || 3500)) {
            b.setData('lastShot', time);
            this.bossShootAtPlayer();
        }

        // Ataque de área (radio 300): daña solo si el jugador está dentro del radio
        const dist = Phaser.Math.Distance.Between(b.x, b.y, player.x, player.y);
        if (time - (b.getData('lastAreaAttack') || 0) > (b.getData('areaAttackCooldown') || 8000)) {
            b.setData('lastAreaAttack', time);
            // Crear efecto visual del área
            const areaCircle = this.add.circle(b.x, b.y, 300, 0xff0066, 0.3).setDepth(4);
            this.tweens.add({
                targets: areaCircle,
                alpha: 0,
                scale: 1.2,
                duration: 800,
                onComplete: () => { try { areaCircle.destroy(); } catch (e) {} }
            });
            // Aplicar daño solo si el jugador está dentro del radio
            if (dist < 300) {
                this.applyDamageToPlayer(0, 100);
                this.cameras.main.shake(200, 0.02);
            }
        }

        // Muerte del jefe
        const bossHealth = b.getData('health');
        if (bossHealth != null && bossHealth <= 0) {
            // Destruir el collider antes de destruir el jefe
            if (this.bossOverlap) {
                try { this.physics.world.removeCollider(this.bossOverlap); } catch (e) {}
                this.bossOverlap = null;
            }
            // Limpiar barra de vida del jefe
            try {
                if (this.bossHealthBarBg) this.bossHealthBarBg.destroy();
                if (this.bossHealthBar) this.bossHealthBar.destroy();
                if (this.bossHealthText) this.bossHealthText.destroy();
            } catch (e) {}
            try { if (b && b.scene) b.destroy(); } catch (e) {}
            this.boss = null;
            this.bossActive = false;
            // Ir a escena de victoria en cooperativo
            try {
                this.scene.launch('VictoryScene', { mode: this.mode });
                this.scene.stop();
            } catch (e) {
                console.warn('Failed to launch VictoryScene:', e);
                this.waveText.setText('¡Victoria! Jefe derrotado');
            }
        }
    }

    updateEnemies(time) {
        if (!this.enemies || this.mode !== 'cooperativo') return;
        
        this.enemies.children.entries.forEach(enemy => {
            if (!enemy.active) return;
            
            // Actualizar barra de vida del enemigo
            if (enemy.healthBar && enemy.healthBarBg) {
                enemy.healthBarBg.x = enemy.x;
                enemy.healthBarBg.y = enemy.y - 30;
                enemy.healthBar.x = enemy.x;
                enemy.healthBar.y = enemy.y - 30;
                const healthPercent = Math.max(0, enemy.health / (enemy.maxHealth || 180));
                enemy.healthBar.width = 50 * healthPercent;
            }
            
            if (enemy.isFlying) {
                // Disparar al jugador (solo voladores)
                if (time - enemy.lastShot > enemy.shotCooldown) {
                    enemy.lastShot = time;
                    this.enemyShoot(enemy);
                }
            } else if (enemy.type === 'ground') {
                // IA básica de persecución y salto
                const playerSprite = this.players[0] && this.players[0].sprite;
                if (!playerSprite) return;

                // Movimiento horizontal hacia el jugador
                const dir = (playerSprite.x > enemy.x) ? 1 : -1;
                enemy.setVelocityX(dir * (enemy.moveSpeed || 90));

                // Si el jugador está más alto, intentar saltar con cooldown
                const now = time || this.time.now;
                const onFloor = enemy.body && (enemy.body.blocked && enemy.body.blocked.down || enemy.body.touching && enemy.body.touching.down);
                const horizDist = Math.abs(playerSprite.x - enemy.x);
                const shouldJump = (playerSprite.y + 20 < enemy.y) || (enemy.body && (enemy.body.blocked && (enemy.body.blocked.left || enemy.body.blocked.right)));
                if (onFloor && shouldJump && (now - (enemy.lastJump || 0) > (enemy.jumpCooldown || 500)) && horizDist < 160) {
                    enemy.setVelocityY(enemy.jumpSpeed || -420);
                    enemy.lastJump = now;
                }

                // Ataque cuerpo a cuerpo si está cerca, con i-frames para jugador y menor stun
                const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, playerSprite.x, playerSprite.y);
                const targetP = this.players[0];
                const playerIframesUntil = (targetP && targetP.groundMeleeIframesUntil) || 0;
                if (
                    dist < 65 &&
                    now - (enemy.lastMelee || 0) > (enemy.meleeCooldown || 1400) &&
                    now >= playerIframesUntil
                ) {
                    enemy.lastMelee = now;
                    // Daño fijo de 45
                    this.applyDamageToPlayer(0, 45);
                    // Reducir el tiempo de stun específico de este golpe
                    if (targetP) {
                        targetP.hitTimer = this.time.now + 150; // stun corto
                        // Dar i-frames contra golpes cuerpo a cuerpo para evitar stunlock si hay varios enemigos
                        targetP.groundMeleeIframesUntil = now + 750; // 0.75s sin poder ser golpeado por melee
                    }
                    // Pequeño retroceso visual al jugador
                    const kdir = (playerSprite.x > enemy.x) ? 1 : -1;
                    try { playerSprite.setVelocity(220 * kdir, -120); } catch (e) { /* ignore */ }
                }
            }
        });
    }

    enemyShoot(enemy) {
        if (!enemy.active || !this.players[0].sprite) return;
        
        const player = this.players[0].sprite;
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
        
        // Crear proyectil enemigo más grande
        const proj = this.physics.add.sprite(enemy.x, enemy.y, 'tex_bullet');
        proj.setTint(0xff6600); // Color naranja para proyectiles enemigos
        proj.setScale(2.5); // Hacer el proyectil más grande
        proj.damage = 35;
        
        this.enemyProjectiles.add(proj);
        proj.body.setAllowGravity(false);
        
        const speed = 400;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        proj.body.setVelocity(vx, vy);
        proj.rotation = angle;
        
        // Destruir después de 3 segundos
        this.time.delayedCall(3000, () => {
            if (proj && proj.active) proj.destroy();
        });
    }

    checkWaveComplete() {
        if (!this.enemies) return;
        
        const activeEnemies = this.enemies.children.entries.filter(e => e.active).length;
        
        if (activeEnemies === 0 && this.waveActive) {
            this.waveActive = false;
            this.waveCompleted = true;
            
            // Recuperar 150 HP al completar una oleada
            try {
                const p = this.players && this.players[0];
                if (p) {
                    p.health = Math.min(1000, (p.health || 0) + 150);
                    // Feedback visual: flash verde y mensaje
                    this.cameras.main.flash(200, 80, 255, 80);
                }
            } catch (e) { /* ignore */ }
            
            if (this.currentWave < this.maxWaves) {
                this.waveText.setText(`Oleada ${this.currentWave} completada. +150 HP. Siguiente en 3s...`);
                this.time.delayedCall(3000, () => this.startWave());
            } else if (!this.bossActive && !this.boss) {
                this.waveText.setText('¡Jefe final! Prepárate...');
                // Spawn boss after a short delay
                this.time.delayedCall(2500, () => this.spawnBoss());
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
                            target.health = Math.max(0, target.health - 30);
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

// --- ESCENA VICTORIA ---
class VictoryScene extends Phaser.Scene {
    constructor() { super('VictoryScene'); }
    init(data) {
        this.player1Index = data.player1Index ?? 0;
        this.player2Index = data.player2Index ?? 1;
        this.mode = data.mode || 'cooperativo';
    }
    create() {
        const { width, height } = this.scale;
        this.cameras.main.setBackgroundColor(0x003311);
        
        // Victory title
        this.add.text(width/2, 120, '¡VICTORIA!', { font: '64px Arial', color: '#44ff44' }).setOrigin(0.5);
        this.add.text(width/2, 200, '¡Derrotaron al jefe!', { font: '36px Arial', color: '#ffffff' }).setOrigin(0.5);

        // Buttons
        const buttonW = 260, buttonH = 64, spacing = 30;
        const bx = width/2;
        let by = height - 160;

        this.buttons = [];

        const restartBtn = this.add.rectangle(bx - (buttonW + spacing), by, buttonW, buttonH, 0x004466).setInteractive();
        const restartTxt = this.add.text(restartBtn.x, restartBtn.y, 'REINICIAR', { font: '24px Arial', color: '#00ffff' }).setOrigin(0.5);
        this.buttons.push({ rect: restartBtn, txt: restartTxt, callback: () => {
            try { this.scene.stop('HudScene'); } catch (e) {}
            try { this.scene.stop('GameScene'); } catch (e) {}
            try { this.textures.remove('map1'); } catch (e) {}
            this.scene.stop('VictoryScene');
            this.scene.start('GameScene', { player1Index: this.player1Index, player2Index: this.player2Index, mode: this.mode, map: 'Mapa 1' });
        }});

        const charSelBtn = this.add.rectangle(bx, by, buttonW, buttonH, 0x003355).setInteractive();
        const charSelTxt = this.add.text(charSelBtn.x, charSelBtn.y, 'SELECCIONAR PERSONAJE', { font: '18px Arial', color: '#00ffff' }).setOrigin(0.5);
        this.buttons.push({ rect: charSelBtn, txt: charSelTxt, callback: () => {
            try { this.scene.stop('HudScene'); } catch (e) {}
            try { this.scene.stop('GameScene'); } catch (e) {}
            try { this.textures.remove('map1'); } catch (e) {}
            this.scene.stop('VictoryScene');
            this.scene.start('CharacterSelector', { mode: this.mode });
        }});

        const menuBtn = this.add.rectangle(bx + (buttonW + spacing), by, buttonW, buttonH, 0x002244).setInteractive();
        const menuTxt = this.add.text(menuBtn.x, menuBtn.y, 'MENU', { font: '24px Arial', color: '#00ffff' }).setOrigin(0.5);
        this.buttons.push({ rect: menuBtn, txt: menuTxt, callback: () => {
            try { this.scene.stop('HudScene'); } catch (e) {}
            try { this.scene.stop('GameScene'); } catch (e) {}
            try { this.textures.remove('map1'); } catch (e) {}
            this.scene.stop('VictoryScene');
            this.scene.start('Menu');
        }});

        // Selector visual
        this.selector = this.add.rectangle(this.buttons[0].rect.x, this.buttons[0].rect.y, buttonW + 12, buttonH + 12).setStrokeStyle(4, 0xffff00).setOrigin(0.5);
        this.selectedIndex = 0;

        // Input keys
        this.keyLeft = this.input.keyboard.addKey('A');
        this.keyRight = this.input.keyboard.addKey('D');
        this.keyLeft2 = this.input.keyboard.addKey('LEFT');
        this.keyRight2 = this.input.keyboard.addKey('RIGHT');
        this.keyConfirmP1 = this.input.keyboard.addKey('SPACE');
        this.keyConfirmP2 = this.input.keyboard.addKey('ENTER');

        // Gamepad support
        this.input.gamepad.on('connected', pad => { pad._leftPressed = pad._rightPressed = pad._aPressed = false; });

        // Pointer handling
        this.buttons.forEach((b, idx) => {
            b.rect.on('pointerdown', () => {
                try {
                    const cb = this.buttons && this.buttons[idx] && this.buttons[idx].callback;
                    if (typeof cb === 'function') cb();
                } catch (e) {
                    console.warn('Menu button callback failed:', e);
                }
            });
        });
    }
    update() {
        if (Phaser.Input.Keyboard.JustDown(this.keyLeft) || Phaser.Input.Keyboard.JustDown(this.keyLeft2)) this.moveSelector(-1);
        if (Phaser.Input.Keyboard.JustDown(this.keyRight) || Phaser.Input.Keyboard.JustDown(this.keyRight2)) this.moveSelector(1);
        if (Phaser.Input.Keyboard.JustDown(this.keyConfirmP1) || Phaser.Input.Keyboard.JustDown(this.keyConfirmP2)) this.selectCurrent();

        const pads = this.input.gamepad.gamepads;
        pads.forEach(pad => {
            if (!pad) return;
            const x = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
            if (x < -0.6 && !pad._leftPressed) { this.moveSelector(-1); pad._leftPressed = true; }
            else if (x > 0.6 && !pad._rightPressed) { this.moveSelector(1); pad._rightPressed = true; }
            else if (x > -0.6 && x < 0.6) { pad._leftPressed = pad._rightPressed = false; }

            const a = pad.buttons[0] && pad.buttons[0].pressed;
            if (a && !pad._aPressed) { this.selectCurrent(); pad._aPressed = true; }
            if (!a) pad._aPressed = false;
        });
    }
    moveSelector(dir) {
        this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + dir, 0, this.buttons.length);
        const b = this.buttons[this.selectedIndex].rect;
        if (b) { this.selector.x = b.x; this.selector.y = b.y; }
    }
    selectCurrent() { if (this.buttons && this.buttons[this.selectedIndex]) this.buttons[this.selectedIndex].callback(); }
}

// --- ESCENA GAME OVER ---
class GameOver extends Phaser.Scene {
    constructor() { super('GameOver'); }
    init(data) {
        this.winnerIndex = data.winnerIndex ?? 0;
        this.winnerChar = data.winnerChar ?? 0;
        this.player1Index = data.player1Index ?? 0;
        this.player2Index = data.player2Index ?? 1;
        this.mode = data.mode || 'versus';
    }
    create() {
        const { width, height } = this.scale;
        this.cameras.main.setBackgroundColor(0x001d33);
        
        // Si es modo cooperativo, mostrar "PERDIERON" sin jugador específico
        if (this.mode === 'cooperativo') {
            this.add.text(width/2, 120, 'FIN DEL JUEGO', { font: '64px Arial', color: '#ff4444' }).setOrigin(0.5);
            this.add.text(width/2, 200, '¡PERDIERON!', { font: '36px Arial', color: '#ffffff' }).setOrigin(0.5);
        } else {
            // Modo versus: mostrar el ganador
            const winnerName = this.winnerIndex === 0 ? (['Charles','Sofia','Franchesca','Mario'][this.player1Index] || 'Player 1') : (['Charles','Sofia','Franchesca','Mario'][this.player2Index] || 'Player 2');
            this.add.text(width/2, 120, 'FIN DEL JUEGO', { font: '64px Arial', color: '#ff4444' }).setOrigin(0.5);
            this.add.text(width/2, 200, `${winnerName} ganó!`, { font: '36px Arial', color: '#ffffff' }).setOrigin(0.5);
        }

        // Buttons
        const buttonW = 260, buttonH = 64, spacing = 30;
        const bx = width/2;
        let by = height - 160;

        this.buttons = [];

        const restartBtn = this.add.rectangle(bx - (buttonW + spacing), by, buttonW, buttonH, 0x004466).setInteractive();
        const restartTxt = this.add.text(restartBtn.x, restartBtn.y, isEnglish ? 'RESTART' : 'REINICIAR', { font: '24px Arial', color: '#00ffff' }).setOrigin(0.5);
        this.buttons.push({ rect: restartBtn, txt: restartTxt, callback: () => {
            // Reiniciar: detener escenas y reiniciar GameScene
            try { this.scene.stop('HudScene'); } catch (e) {}
            try { this.scene.stop('GameScene'); } catch (e) {}
            // remove map texture so next GameScene will reload and position it cleanly
            try { this.textures.remove('map1'); } catch (e) {}
            this.scene.stop('GameOver');
            this.scene.start('GameScene', { player1Index: this.player1Index, player2Index: this.player2Index, mode: this.mode, map: 'Mapa 1' });
        }});

        const charSelBtn = this.add.rectangle(bx, by, buttonW, buttonH, 0x003355).setInteractive();
        const charSelTxt = this.add.text(charSelBtn.x, charSelBtn.y, isEnglish ? 'CHAR SELECT' : 'SELECCIONAR PERSONAJE', { font: '18px Arial', color: '#00ffff' }).setOrigin(0.5);
        this.buttons.push({ rect: charSelBtn, txt: charSelTxt, callback: () => {
            // Ir a selector de personaje: detener GameScene/HudScene primero
            try { this.scene.stop('HudScene'); } catch (e) {}
            try { this.scene.stop('GameScene'); } catch (e) {}
            // remove map texture to avoid background staying behind or being mispositioned
            try { this.textures.remove('map1'); } catch (e) {}
            this.scene.stop('GameOver');
            this.scene.start('CharacterSelector', { mode: this.mode });
        }});

        const menuBtn = this.add.rectangle(bx + (buttonW + spacing), by, buttonW, buttonH, 0x002244).setInteractive();
        const menuTxt = this.add.text(menuBtn.x, menuBtn.y, isEnglish ? 'MENU' : 'MENU', { font: '24px Arial', color: '#00ffff' }).setOrigin(0.5);
        this.buttons.push({ rect: menuBtn, txt: menuTxt, callback: () => {
            // Volver al menú: detener escenas primero
            try { this.scene.stop('HudScene'); } catch (e) {}
            try { this.scene.stop('GameScene'); } catch (e) {}
            // remove map texture to avoid background issues on next run
            try { this.textures.remove('map1'); } catch (e) {}
            this.scene.stop('GameOver');
            this.scene.start('Menu');
        }});

        // Selector visual
        this.selector = this.add.rectangle(this.buttons[0].rect.x, this.buttons[0].rect.y, buttonW + 12, buttonH + 12).setStrokeStyle(4, 0xffff00).setOrigin(0.5);
        this.selectedIndex = 0;

        // Input keys
        this.keyLeft = this.input.keyboard.addKey('A');
        this.keyRight = this.input.keyboard.addKey('D');
        this.keyLeft2 = this.input.keyboard.addKey('LEFT');
        this.keyRight2 = this.input.keyboard.addKey('RIGHT');
        this.keyConfirmP1 = this.input.keyboard.addKey('SPACE');
        this.keyConfirmP2 = this.input.keyboard.addKey('ENTER');

        // Gamepad support
        this.input.gamepad.on('connected', pad => { pad._leftPressed = pad._rightPressed = pad._aPressed = false; });

        // Pointer handling
        this.buttons.forEach((b, idx) => {
            b.rect.on('pointerdown', () => {
                try {
                    const cb = this.buttons && this.buttons[idx] && this.buttons[idx].callback;
                    if (typeof cb === 'function') cb();
                } catch (e) {
                    console.warn('Menu button callback failed:', e);
                }
            });
        });
    }
    update() {
        if (Phaser.Input.Keyboard.JustDown(this.keyLeft) || Phaser.Input.Keyboard.JustDown(this.keyLeft2)) this.moveSelector(-1);
        if (Phaser.Input.Keyboard.JustDown(this.keyRight) || Phaser.Input.Keyboard.JustDown(this.keyRight2)) this.moveSelector(1);
        if (Phaser.Input.Keyboard.JustDown(this.keyConfirmP1) || Phaser.Input.Keyboard.JustDown(this.keyConfirmP2)) this.selectCurrent();

        const pads = this.input.gamepad.gamepads;
        pads.forEach(pad => {
            if (!pad) return;
            const x = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
            if (x < -0.6 && !pad._leftPressed) { this.moveSelector(-1); pad._leftPressed = true; }
            else if (x > 0.6 && !pad._rightPressed) { this.moveSelector(1); pad._rightPressed = true; }
            else if (x > -0.6 && x < 0.6) { pad._leftPressed = pad._rightPressed = false; }

            const a = pad.buttons[0] && pad.buttons[0].pressed;
            if (a && !pad._aPressed) { this.selectCurrent(); pad._aPressed = true; }
            if (!a) pad._aPressed = false;
        });
    }
    moveSelector(dir) {
        this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + dir, 0, this.buttons.length);
        const b = this.buttons[this.selectedIndex].rect;
        if (b) { this.selector.x = b.x; this.selector.y = b.y; }
    }
    selectCurrent() { if (this.buttons && this.buttons[this.selectedIndex]) this.buttons[this.selectedIndex].callback(); }
}

