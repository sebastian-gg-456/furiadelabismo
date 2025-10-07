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
        this.buttons.push({ rect: controlsButton, callback: () => console.log(isEnglish ? "Show controls" : "Mostrar controles") });

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
            pad._upPressed = pad._downPressed = false;
            pad._aPressed = false;
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

        versusButton.on('pointerdown', () => this.scene.start("CharacterSelector", { mode: "versus" }));
        coopButton.on('pointerdown', () => this.scene.start("CharacterSelector", { mode: "cooperativo" }));
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.keyLeft) || Phaser.Input.Keyboard.JustDown(this.keyLeft2)) this.moveSelector(-1);
        if (Phaser.Input.Keyboard.JustDown(this.keyRight) || Phaser.Input.Keyboard.JustDown(this.keyRight2)) this.moveSelector(1);
        if (Phaser.Input.Keyboard.JustDown(this.keyConfirmP1) || Phaser.Input.Keyboard.JustDown(this.keyConfirmP2)) this.buttons[this.selectedIndex].callback();
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
            if (a && !pad._aPressed) { this.buttons[this.selectedIndex].callback(); pad._aPressed = true; }
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
            this.add.text(startX, centerY + rectHeight / 2 + 25, char.name, { font: "22px Arial", color: "#00ffff" }).setOrigin(0.5);
            box.on('pointerdown', () => {
                // if clicked, assign to a player depending on last input: here assign to player1 by default
                this.playerSelections[0].index = i;
                this.updateSelectors();
            });
            this.characterRects.push(box);
            startX += rectWidth + spacing;
        });

        // Player frames (player1: yellow, player2: orange)
        this.playerSelectors = [
            this.add.rectangle(this.characterRects[this.playerSelections[0].index].x, centerY, rectWidth + 12, rectHeight + 12).setStrokeStyle(4, 0xffff00).setOrigin(0.5),
            this.add.rectangle(this.characterRects[this.playerSelections[1].index].x, centerY, rectWidth + 12, rectHeight + 12).setStrokeStyle(4, 0xffaa00).setOrigin(0.5)
        ];

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

    update() {
        // Gamepad navigation for two controllers (index 0 and 1)
        const pads = this.input.gamepad.gamepads;

        // Player1 keyboard nav
        if (Phaser.Input.Keyboard.JustDown(this.keyLeftP1)) { this.playerSelections[0].index = Phaser.Math.Wrap(this.playerSelections[0].index - 1, 0, this.characterRects.length); this.updateSelectors(); }
        if (Phaser.Input.Keyboard.JustDown(this.keyRightP1)) { this.playerSelections[0].index = Phaser.Math.Wrap(this.playerSelections[0].index + 1, 0, this.characterRects.length); this.updateSelectors(); }
        // Player2 keyboard nav
        if (Phaser.Input.Keyboard.JustDown(this.keyLeftP2)) { this.playerSelections[1].index = Phaser.Math.Wrap(this.playerSelections[1].index - 1, 0, this.characterRects.length); this.updateSelectors(); }
        if (Phaser.Input.Keyboard.JustDown(this.keyRightP2)) { this.playerSelections[1].index = Phaser.Math.Wrap(this.playerSelections[1].index + 1, 0, this.characterRects.length); this.updateSelectors(); }

        // Confirm with keyboard: either player confirms -> start GameScene with both selections
        if (Phaser.Input.Keyboard.JustDown(this.keyConfirmP1) || Phaser.Input.Keyboard.JustDown(this.keyConfirmP2)) {
            this.scene.start("MapSelector", { player1: this.playerSelections[0].index, player2: this.playerSelections[1].index, mode: this.selectedMode });
        }

        // Back
        if (Phaser.Input.Keyboard.JustDown(this.keyBackP1) || Phaser.Input.Keyboard.JustDown(this.keyBackP2)) {
            this.scene.start("ModeSelector");
        }

        // Pads navigation (each pad controls its respective player selection)
        pads.forEach((pad, i) => {
            if (!pad) return;
            const x = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
            const sel = this.playerSelections[i] || this.playerSelections[0];

            if (x < -0.55 && !pad._leftPressed) { sel.index = Phaser.Math.Wrap(sel.index - 1, 0, this.characterRects.length); pad._leftPressed = true; this.updateSelectors(); }
            else if (x > 0.55 && !pad._rightPressed) { sel.index = Phaser.Math.Wrap(sel.index + 1, 0, this.characterRects.length); pad._rightPressed = true; this.updateSelectors(); }
            else if (x > -0.55 && x < 0.55) pad._leftPressed = pad._rightPressed = false;

            // A confirm -> start
            const a = pad.buttons[0] && pad.buttons[0].pressed;
            if (a && !pad._aPressed) { this.scene.start("MapSelector", { player1: this.playerSelections[0].index, player2: this.playerSelections[1].index, mode: this.selectedMode }); pad._aPressed = true; }
            if (!a) pad._aPressed = false;

            // B back
            const b = pad.buttons[1] && pad.buttons[1].pressed;
            if (b && !pad._bPressed) { this.scene.start("ModeSelector"); pad._bPressed = true; }
            if (!b) pad._bPressed = false;
        });
    }

    updateSelectors() {
        // snap frames to chosen rects
        this.playerSelectors[0].x = this.characterRects[this.playerSelections[0].index].x;
        this.playerSelectors[1].x = this.characterRects[this.playerSelections[1].index].x;
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
        this.startButton.on('pointerdown', () => this.startGame());

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

    create() {
        const { width, height } = this.scale;
        // Generar texturas simples (rects) para evitar depender de assets
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x00ffff, 1); g.fillRect(0, 0, 48, 96); g.generateTexture('tex_p1', 48, 96); g.clear();
        g.fillStyle(0xff0066, 1); g.fillRect(0, 0, 48, 96); g.generateTexture('tex_p2', 48, 96); g.clear();
        g.fillStyle(0x333333, 1); g.fillRect(0, 0, 200, 20); g.generateTexture('tex_ground', 200, 20); g.clear();
        g.fillStyle(0xffff00, 1); g.fillRect(0, 0, 12, 6); g.generateTexture('tex_bullet', 12, 6); g.clear();

        this.add.text(20, 20, `Mapa: ${this.selectedMap}`, { font: "20px Arial", color: "#00ffff" });

        // Fullscreen on start
        this.scale.startFullscreen();

        // Ground
        this.ground = this.physics.add.staticImage(width / 2, height - 30, 'tex_ground').setScale(width / 200, 1).refreshBody();

        // Players array with state
        this.players = [];

        const p1Sprite = this.physics.add.sprite(200, height - 150, 'tex_p1').setCollideWorldBounds(true);
        const p2Sprite = this.physics.add.sprite(width - 200, height - 150, 'tex_p2').setCollideWorldBounds(true);

        [p1Sprite, p2Sprite].forEach(s => {
            s.setBounce(0.05);
            s.body.setSize(40, 88);
        });

        this.players.push({
            sprite: p1Sprite, health: 100, energy: 100, blocking: false,
            lastShot: 0, lastPunch: 0, shotCD: 400, punchCD: 350, padIndex: 0
        });

        this.players.push({
            sprite: p2Sprite, health: 100, energy: 100, blocking: false,
            lastShot: 0, lastPunch: 0, shotCD: 400, punchCD: 350, padIndex: 1
        });

        // Colliders
        this.physics.add.collider(this.players[0].sprite, this.ground);
        this.physics.add.collider(this.players[1].sprite, this.ground);

        // Projectiles group
        this.projectiles = this.physics.add.group();

        // Projectile -> players overlap
        this.physics.add.overlap(this.projectiles, this.players[0].sprite, (proj, spr) => this.onProjectileHit(proj, 0));
        this.physics.add.overlap(this.projectiles, this.players[1].sprite, (proj, spr) => this.onProjectileHit(proj, 1));

        // Bars
        const barY = 30;
        this.hpBars = [
            this.add.rectangle(150, barY, this.players[0].health * 2, 18, 0xff0000).setOrigin(0, 0.5),
            this.add.rectangle(this.scale.width - 150, barY, this.players[1].health * 2, 18, 0xff0000).setOrigin(1, 0.5)
        ];
        this.enBars = [
            this.add.rectangle(150, barY + 28, this.players[0].energy * 2, 12, 0x00ccff).setOrigin(0, 0.5),
            this.add.rectangle(this.scale.width - 150, barY + 28, this.players[1].energy * 2, 12, 0x00ccff).setOrigin(1, 0.5)
        ];

        // Keyboard controls
        this.keysP1 = this.input.keyboard.addKeys({
            up: "W", left: "A", right: "D", down: "S",
            hit: "X", block: "C", charge: "V", shoot: "B"
        });
        this.keysP2 = this.input.keyboard.addKeys({
            up: "UP", left: "LEFT", right: "RIGHT", down: "DOWN",
            hit: "K", block: "L", charge: "O", shoot: "P"
        });

        // Also add confirm/back keys (used in menus) - not necessary here

        // Gamepad connect listener: initialize flags
        this.input.gamepad.on('connected', pad => {
            pad._leftPressed = pad._rightPressed = false;
            pad._aPressed = pad._bPressed = false;
            pad._lastButtons = [];
        });

        // small camera shake on hit
        this.cameras.main.setBackgroundColor(0x001122);
    }

    onProjectileHit(proj, hitPlayerIndex) {
        // proj.shooter is index of shooter
        if (!proj.active) return;
        const shooter = proj.shooter;
        if (shooter === hitPlayerIndex) return; // ignore self
        // if player blocking, no hp lost
        if (!this.players[hitPlayerIndex].blocking) {
            this.players[hitPlayerIndex].health = Math.max(0, this.players[hitPlayerIndex].health - 10);
        }
        proj.destroy();
    }

    update(time) {
        // Update inputs for each player (0 and 1)
        for (let i = 0; i < 2; i++) {
            this.updatePlayerInput(i, time);
        }

        // Update bars
        this.hpBars[0].width = Math.max(0, this.players[0].health * 2);
        this.hpBars[1].width = Math.max(0, this.players[1].health * 2);
        this.enBars[0].width = Math.max(0, this.players[0].energy * 2);
        this.enBars[1].width = Math.max(0, this.players[1].energy * 2);

        // destroy projectiles out of screen bounds
        this.projectiles.children.iterate(proj => {
            if (!proj) return;
            if (proj.x < -50 || proj.x > this.scale.width + 50) proj.destroy();
        });
    }

    updatePlayerInput(i, time) {
        const player = this.players[i];
        const sprite = player.sprite;
        const pad = getPad(player.padIndex, this);

        // read gamepad axes/buttons
        let left = false, right = false, up = false, punch = false, block = false, charge = false, shoot = false;

        if (pad && pad.connected) {
            const axisX = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
            left = axisX < -0.3;
            right = axisX > 0.3;
            up = pad.buttons[0] && pad.buttons[0].pressed;
            // discrete button presses: use edge detection
            if (!pad._lastButtons) pad._lastButtons = [];
            const btn = pad.buttons;

            // Punch = X (button 2)
            if (btn[2] && btn[2].pressed && !pad._lastButtons[2]) punch = true;
            // Shoot = RT (button 7) - treat as edge too
            if (btn[7] && btn[7].pressed && !pad._lastButtons[7]) shoot = true;
            // Block = RB (5) (hold)
            block = btn[5] && btn[5].pressed;
            // Charge = LB (4) (hold)
            charge = btn[4] && btn[4].pressed;

            // update lastButtons snapshot
            pad._lastButtons = btn.map(b => !!b.pressed);
        }

        // Keyboard fallback / simultaneous keyboard support
        if (i === 0) {
            left = left || this.keysP1.left.isDown;
            right = right || this.keysP1.right.isDown;
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.up)) up = true;
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.hit)) punch = true;
            block = block || this.keysP1.block.isDown;
            charge = charge || this.keysP1.charge.isDown;
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.shoot)) shoot = true;
        } else {
            left = left || this.keysP2.left.isDown;
            right = right || this.keysP2.right.isDown;
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.up)) up = true;
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.hit)) punch = true;
            block = block || this.keysP2.block.isDown;
            charge = charge || this.keysP2.charge.isDown;
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.shoot)) shoot = true;
        }

        // Movement
        const speed = 220;
        if (left) { sprite.setVelocityX(-speed); sprite.flipX = true; }
        else if (right) { sprite.setVelocityX(speed); sprite.flipX = false; }
        else { sprite.setVelocityX(0); }

        // Jump (use onFloor for reliability)
        if (up && sprite.body.onFloor()) sprite.setVelocityY(-560);

        // Blocking
        player.blocking = !!block;
        sprite.setTint(player.blocking ? 0x336633 : (i === 0 ? 0x00ffff : 0xff0066)); // visual feedback

        // Charge energy (hold)
        if (charge) {
            player.energy = Math.min(100, player.energy + 0.6);
        } else {
            // tiny passive regen
            player.energy = Math.min(100, player.energy + 0.05);
        }

        // Punch (discrete)
        if (punch && (time - player.lastPunch) > player.punchCD) {
            player.lastPunch = time;
            this.doPunch(i);
        }

        // Shoot (discrete & energy cost)
        if (shoot && (time - player.lastShot) > player.shotCD && player.energy >= 10) {
            player.lastShot = time;
            player.energy = Math.max(0, player.energy - 10);
            this.spawnProjectile(i);
        }
    }

    doPunch(i) {
        const attacker = this.players[i];
        const target = this.players[1 - i];
        const dist = Phaser.Math.Distance.Between(attacker.sprite.x, attacker.sprite.y, target.sprite.x, target.sprite.y);
        if (dist < 90) {
            // if target blocking -> no dmg
            if (!target.blocking) {
                target.health = Math.max(0, target.health - 10);
            }
            // imán: empuja al atacante hacia el target un poco
            const dir = (target.sprite.x > attacker.sprite.x) ? 1 : -1;
            attacker.sprite.setVelocityX(120 * dir);
        }
    }

spawnProjectile(i) {
    const shooter = this.players[i];
    if (!shooter || !shooter.sprite) return; // <-- prevención de errores

    const sx = shooter.sprite.x + (shooter.sprite.flipX ? -30 : 30);
    const sy = shooter.sprite.y - 10;

    const proj = this.physics.add.sprite(sx, sy, 'tex_bullet');
    proj.setGravity(0, 0);          // desactivar gravedad
    proj.body.setAllowGravity(false); 
    proj.shooter = i;
    const velocity = shooter.sprite.flipX ? -450 : 450;
if (proj && proj.body) proj.body.setVelocityX(velocity);

    this.projectiles.add(proj);

    // destrucción después de cierto tiempo
    this.time.delayedCall(2200, () => {
        if (proj && proj.active) proj.destroy();
    });
    // opcional: lifespan
this.time.delayedCall(2200, () => { if (proj && proj.active) proj.destroy(); });

    }
}



// ========================
// --- EXPORT / INICIALIZACIÓN ---
// ========================
// No config aquí — main.js debe contener la configuración y llamar a Phaser.Game
// Sólo export the classes by global name (they're already globally defined via class declarations)
