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
        this.buttons.push({ rect: controlsButton, callback: () => this.scene.start("ControlsScene") });

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
            if (aPressed && !pad._aPressed) {
                this.buttons[this.selectedIndex].callback();
                pad._aPressed = true;
            }
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
        this.cameras.main.setBackgroundColor(0x001d33);

        const title = this.add.text(width / 2, 60, isEnglish ? "CONTROLS" : "CONTROLES", { font: "48px Arial", color: "#00ffff" }).setOrigin(0.5);

        let y = 130;
        const line = (txt) => {
this.add.text(80, y, txt, { font: "26px Arial", color: "#ffffff" }).setOrigin(0, 0.5);            y += 38;
        };

        // Controles básicos
        line(isEnglish ? "Basic Controls" : "Controles básicos");
        line(isEnglish ? "Move: A/D or LEFT/RIGHT" : "Moverse: A/D o IZQ/DERECHA");
        line(isEnglish ? "Jump: W or UP" : "Saltar: W o ARRIBA");
        line(isEnglish ? "Punch: X or K" : "Golpe: X o K");
        line(isEnglish ? "Block/Charge: C or L" : "Bloquear/Cargar: C o L");
        line(isEnglish ? "Shoot: B or P" : "Disparar: B o P");
        y += 18;

        // Habilidades
        line(isEnglish ? "Special Abilities (all characters):" : "Habilidades especiales (todos los personajes):");
        line(isEnglish ? "Ability 1: LEFT, RIGHT, PUNCH" : "Habilidad 1: IZQ, DER, GOLPE");
        line(isEnglish ? "Ability 2: RIGHT, LEFT, PUNCH" : "Habilidad 2: DER, IZQ, GOLPE");
        line(isEnglish ? "Ability 3: RIGHT, RIGHT, PUNCH" : "Habilidad 3: DER, DER, GOLPE");
        y += 18;

        // Botón para volver
        const backBtn = this.add.rectangle(width / 2, height - 70, 220, 60, 0x003355).setInteractive();
        const backTxt = this.add.text(width / 2, height - 70, isEnglish ? "BACK" : "VOLVER", { font: "28px Arial", color: "#00ffff" }).setOrigin(0.5);
        backBtn.on('pointerdown', () => this.scene.start("Menu"));

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
            if (a && !pad._aPressed) {
                this.buttons[this.selectedIndex].callback();
                pad._aPressed = true;
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
            this.scene.start("MapSelector", {
                player1: this.playerSelections[0].index,
                player2: this.playerSelections[1].index,
                mode: this.selectedMode
            });
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

            if (x < -0.55 && !pad._leftPressed) { 
                sel.index = Phaser.Math.Wrap(sel.index - 1, 0, this.characterRects.length); 
                pad._leftPressed = true; 
                this.updateSelectors(); 
            }
            else if (x > 0.55 && !pad._rightPressed) { 
                sel.index = Phaser.Math.Wrap(sel.index + 1, 0, this.characterRects.length); 
                pad._rightPressed = true; 
                this.updateSelectors(); 
            }
            else if (x > -0.55 && x < 0.55) pad._leftPressed = pad._rightPressed = false;

            // A confirm
            const a = pad.buttons[0] && pad.buttons[0].pressed;
            if (a && !pad._aPressed) {
                this.buttons[this.selectedIndex].callback();
                pad._aPressed = true;
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
            else if (x > -0.6 && x < 0.6) { pad._leftPressed = pad._rightPressed = false; }

            const a = pad.buttons[0] && pad.buttons[0].pressed;
            if (a && !pad._aPressed) {
                this.buttons[this.selectedIndex].callback();
                pad._aPressed = true;
            }
            if (!a) pad._aPressed = false;

            const b = pad.buttons[1] && pad.buttons[1].pressed;
            if (b && !pad._bPressed) { this.scene.start("Menu"); pad._bPressed = true; }
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

        // Cambios: vida 1000, energía 500, contador de golpes y flag de daño
        this.players.push({
            sprite: p1Sprite, health: 1000, energy: 500, blocking: false,
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
            // AÑADE ESTO:
            comboCount: 0,
            lastComboTime: 0
        });

        this.players.push({
            sprite: p2Sprite, health: 1000, energy: 500, blocking: false,
            lastShot: 0, lastPunch: 0, shotCD: 400, punchCD: 350, padIndex: 1,
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
            // AÑADE ESTO:
            comboCount: 0,
            lastComboTime: 0
        });

        // Colliders
        this.physics.add.collider(this.players[0].sprite, this.ground);
        this.physics.add.collider(this.players[1].sprite, this.ground);

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
        this.cameras.main.setBackgroundColor(0x001122);
    }

    onProjectileHit(proj, hitPlayerIndex) {
        console.log("onProjectileHit", proj, hitPlayerIndex, proj.texture ? proj.texture.key : "no texture");
        if (!proj.active || !proj.texture || proj.texture.key !== 'tex_bullet') return;
        const shooter = proj.shooter;
        if (shooter === hitPlayerIndex) return;
        const target = this.players[hitPlayerIndex];
        if (!target.blocking) {
            target.health = Math.max(0, target.health - 20);
            // Stun por disparo
            target.beingHit = true;
            target.hitTimer = this.time.now + 300; // 300ms de stun por disparo
        }
        proj.destroy();
    }

    handleProjectilePlayerOverlap(a, b, hitPlayerIndex) {
        // Detecta cuál es la bala y cuál el jugador
        let proj, playerSprite;
        if (a.texture && a.texture.key === 'tex_bullet') {
            proj = a;
            playerSprite = b;
        } else if (b.texture && b.texture.key === 'tex_bullet') {
            proj = b;
            playerSprite = a;
        } else {
            return; // Ninguno es proyectil, no hacer nada
        }
        this.onProjectileHit(proj, hitPlayerIndex);
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

        // Barras ajustadas a vida/energía máxima
        const maxHP = 1000, maxEN = 500, barLength = 400;
        this.hpBars[0].width = Math.max(0, (this.players[0].health / maxHP) * barLength);
        this.hpBars[1].width = Math.max(0, (this.players[1].health / maxHP) * barLength);
        this.enBars[0].width = Math.max(0, (this.players[0].energy / maxEN) * barLength);
        this.enBars[1].width = Math.max(0, (this.players[1].energy / maxEN) * barLength);

        this.projectiles.children.iterate(proj => {
            if (!proj) return;
            if (proj.x < -50 || proj.x > this.scale.width + 50) proj.destroy();
        });
    }

    updatePlayerInput(i, time) {
        const player = this.players[i];
        const sprite = player.sprite;
        if (!sprite || !sprite.body) return;

        // Si está siendo golpeado, no puede moverse, saltar, pegar ni disparar
        if (player.beingHit) {
            sprite.setVelocityX(0);
            sprite.setTint(0xff4444); // Color de daño
            return;
        }

        const pad = getPad(player.padIndex, this);

        let left = false, right = false, up = false, punch = false, blockOrCharge = false, shoot = false;

        if (pad && pad.connected) {
            const axisX = (pad.axes.length > 0) ? pad.axes[0].getValue() : 0;
            left = axisX < -0.3;
            right = axisX > 0.3;
            up = pad.buttons[0] && pad.buttons[0].pressed;
            if (!pad._lastButtons) pad._lastButtons = [];
            const btn = pad.buttons;
            if (btn[2] && btn[2].pressed && !pad._lastButtons[2]) punch = true;
            if (btn[7] && btn[7].pressed && !pad._lastButtons[7]) shoot = true;
            blockOrCharge = btn[5] && btn[5].pressed; // Usar solo RB para bloquear/cargar
            pad._lastButtons = btn.map(b => !!b.pressed);
        }

        // Keyboard fallback
        if (i === 0) {
            left = left || this.keysP1.left.isDown;
            right = right || this.keysP1.right.isDown;
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.up)) up = true;
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.hit)) punch = true;
            blockOrCharge = blockOrCharge || this.keysP1.block.isDown; // Usar solo C para bloquear/cargar
            if (Phaser.Input.Keyboard.JustDown(this.keysP1.shoot)) shoot = true;
        } else {
            left = left || this.keysP2.left.isDown;
            right = right || this.keysP2.right.isDown;
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.up)) up = true;
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.hit)) punch = true;
            blockOrCharge = blockOrCharge || this.keysP2.block.isDown; // Usar solo L para bloquear/cargar
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.shoot)) shoot = true;
        }

        // --- NUEVO: Si está bloqueando o cargando, no puede hacer nada más ---
        // Determinar si está cerca del enemigo (para bloquear) o lejos (para cargar)
        const other = this.players[1 - i];
        const dist = Phaser.Math.Distance.Between(sprite.x, sprite.y, other.sprite.x, other.sprite.y);
        const chargeDistance = 140; // Si está a más de 140px, puede cargar

        if (blockOrCharge) {
            if (dist > chargeDistance) {
                player.blocking = false;
                // cargar energía...
            } else {
                player.blocking = true;
                // bloquear...
            }
            // No puede moverse, saltar, disparar ni pegar
            sprite.setVelocityX(0);
            return;
        } else {
            player.blocking = false;
            sprite.setTint(i === 0 ? 0x00ffff : 0xff0066);
        }

        let slowFactor = 1;
        if (player.slowedUntil && this.time.now < player.slowedUntil) {
            slowFactor = 0.45; // Reduce la velocidad, salto y puñetazo a 45%
        } else {
            player.slowedUntil = null;
        }

        // Movimiento solo si NO está bloqueando/cargando
        const speed = 220 * slowFactor;
        if (left) { sprite.setVelocityX(-speed); sprite.flipX = true; }
        else if (right) { sprite.setVelocityX(speed); sprite.flipX = false; }
        else { sprite.setVelocityX(0); }

        // Saltar
        if (up && sprite.body.onFloor()) sprite.setVelocityY(-560 * slowFactor);

        // Puñetazo: 50 de daño
        if (punch && (time - player.lastPunch) > player.punchCD * (1 / slowFactor)) {
            player.lastPunch = time;
            this.doPunch(i);
        }

        // Disparo: 20 de daño, 100 energía
        if (shoot && (time - player.lastShot) > player.shotCD && player.energy >= 100) {
            player.lastShot = time;
            player.energy = Math.max(0, player.energy - 100);
            this.spawnProjectile(i);
        }

        this.handleCharlesSpecial(i, time);
        this.handleCharlesTransform(i, time);
        this.handleCharlesExplosion(i, time);
        this.handleSofiaLaser(i, time);
        this.handleSofiaTeleport(i, time);
        this.handleSofiaMeteor(i, time);
        this.handleFranchescaAura(i, time);
        this.handleFranchescaJumpSmash(i, time);
    }

    spawnProjectile(i) {
        const shooter = this.players[i];
        if (!shooter || !shooter.sprite) return;

        const sx = shooter.sprite.x + (shooter.sprite.flipX ? -30 : 30);
        const sy = shooter.sprite.y - 10;

        const proj = this.physics.add.sprite(sx, sy, 'tex_bullet');
        proj.shooter = i;

        this.projectiles.add(proj);
        proj.body.setAllowGravity(false);

        const velocity = shooter.sprite.flipX ? -450 : 450;
        if (proj && proj.body) proj.body.setVelocityX(velocity);

        this.time.delayedCall(2200, () => {
            if (proj && proj.active) proj.destroy();
        });
    }

    doPunch(i) {
        const player = this.players[i];
        const enemy = this.players[1 - i];

        // Si el jugador está bloqueando o cargando energía, no puede golpear
        if (player.blocking) return;

        // Si el enemigo está bloqueando, solo recibe poco daño y no empuje
        if (enemy.blocking) {
            enemy.health = Math.max(0, enemy.health - 5);
            player.comboCount = 0; // Se corta la secuencia
            return;
        }

        // Combo: si el tiempo entre golpes es corto, suma combo
        const now = this.time.now;
        if (!player.lastComboTime || now - player.lastComboTime > 700) {
            player.comboCount = 1;
        } else {
            player.comboCount = (player.comboCount || 1) + 1;
        }
        player.lastComboTime = now;

        // Daño normal
        enemy.health = Math.max(0, enemy.health - 20);

        // Si es el tercer golpe seguido, empuje horizontal fuerte
        if (player.comboCount === 3) {
            const dir = player.sprite.flipX ? -1 : 1;
            enemy.sprite.setVelocityX(1200 * dir); // Empuje más potente
            player.comboCount = 0; // Reinicia combo
        }
    }

    handleCharlesSpecial(i, time) {
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
                sprite.setTint(i === 0 ? 0x00ffff : 0xff0066); // Color normal
            }
            return;
        }

        // Detectar secuencia: DERECHA, IZQ, GOLPE (en menos de 1s entre cada uno)
        if (player.energy < 300) {
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
            player.energy = Math.max(0, player.energy - 300);
            player.transformed = true;
            player.transformTimer = time + 8000; // Dura 8 segundos (ajusta si quieres)
            player.transformBuffer = [];
        }
    }

    handleCharlesExplosion(i, time) {
        const player = this.players[i];
        const sprite = player.sprite;
        // Solo Charles (índice 0 en el selector de personaje)
        if ((i === 0 && this.player1Index !== 0) || (i === 1 && this.player2Index !== 0)) return;

        // Si la explosión está pendiente, verifica si debe explotar
        if (player.explosionPending && time > player.explosionTimer) {
            player.explosionPending = false;
            const target = this.players[1 - i];
            // Efecto visual: puedes agregar aquí una animación o sprite de explosión
            this.cameras.main.flash(200, 255, 180, 0);

            // Si el enemigo está bloqueando, no recibe daño, pero puedes poner un pequeño retroceso si quieres
            if (!target.blocking) {
                target.health = Math.max(0, target.health - 90); // Daño de la explosión
                target.sprite.setVelocityY(-400); // Lo lanza hacia arriba
            } else {
                // Si bloquea, recibe menos daño o nada (ajusta si quieres)
                target.health = Math.max(0, target.health - 30);
                target.sprite.setVelocityY(-120);
            }
            return;
        }

        // Detectar secuencia: DERECHA, DERECHA, GOLPE (en menos de 1s entre cada uno)
        if (player.energy < 180) {
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
            // Botón de golpe (X, index 2)
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
        ) {r
            // Gasta energía y programa la explosión
            player.energy = Math.max(0, player.energy - 180);
            player.explosionPending = true;
            player.explosionTimer = time + 1500; // 1.5 segundos después
            player.explosionBuffer = [];
        }
    }

    handleSofiaLaser(i, time) {
        const player = this.players[i];
        const sprite = player.sprite;
        // Solo Sofia (índice 1 en el selector de personaje)
        if ((i === 0 && this.player1Index !== 1) || (i === 1 && this.player2Index !== 1)) return;

        if (!player.sofiaLaserBuffer) player.sofiaLaserBuffer = [];

        // Detectar secuencia: IZQ, DER, GOLPE (en menos de 1s entre cada uno)
        // Solo si tiene suficiente energía (100)
        if (player.energy < 100) {
            player.sofiaLaserBuffer = [];
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
            if (axisX < -0.7 && !pad._sofiaLeft) { input = "L"; pad._sofiaLeft = true; }
            if (axisX > 0.7 && !pad._sofiaRight) { input = "R"; pad._sofiaRight = true; }
            if (axisX > -0.7 && axisX < 0.7) { pad._sofiaLeft = pad._sofiaRight = false; }
            if (pad.buttons[2] && pad.buttons[2].pressed && !pad._sofiaHit) { input = "X"; pad._sofiaHit = true; }
            if (!(pad.buttons[2] && pad.buttons[2].pressed)) pad._sofiaHit = false;
        }

        // Buffer de secuencia
        if (input) {
            const now = time;
            if (player.sofiaLaserBuffer.length === 0 || (now - (player.sofiaLaserBuffer[player.sofiaLaserBuffer.length - 1].t)) < 1000) {
                player.sofiaLaserBuffer.push({ k: input, t: now });
                if (player.sofiaLaserBuffer.length > 3) player.sofiaLaserBuffer.shift();
            } else {
                player.sofiaLaserBuffer = [{ k: input, t: now }];
            }
        }

        // Verificar secuencia
        if (
            player.sofiaLaserBuffer.length === 3 &&
            player.sofiaLaserBuffer[0].k === "L" &&
            player.sofiaLaserBuffer[1].k === "R" &&
            player.sofiaLaserBuffer[2].k === "X"
        ) {
            // Gasta energía y dispara el láser
            player.energy = Math.max(0, player.energy - 100);
            const target = this.players[1 - i];

            // Efecto visual simple: línea láser
            const laser = this.add.line(
                0, 0,
                sprite.x, sprite.y,
                target.sprite.x, target.sprite.y,
                0x00ffff
            ).setOrigin(0, 0).setLineWidth(6);

            this.time.delayedCall(180, () => { if (laser && laser.scene) laser.destroy(); });

            // Si el objetivo está bloqueando, no recibe daño ni efecto
            if (target.blocking) {
                player.sofiaLaserBuffer = [];
                return;
            }

            // Daño y teletransporte a un lado de Sofia
            target.health = Math.max(0, target.health - 10);

            // Teletransporta al enemigo a un lado de Sofia (como el teletransporte)
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

            // Aplica reducción de velocidad y salto y puñetazo (no afecta cargar, bloquear, disparar ni habilidades)
            target.slowedUntil = this.time.now + 1800; // 1.8 segundos de lentitud

            player.sofiaLaserBuffer = [];
        }
    }

    handleSofiaTeleport(i, time) {
        const player = this.players[i];
        const sprite = player.sprite;
        // Solo Sofia (índice 1 en el selector de personaje)
        if ((i === 0 && this.player1Index !== 1) || (i === 1 && this.player2Index !== 1)) return;

        // Inicializa el buffer si no existe
        if (!player.sofiaTeleportBuffer) player.sofiaTeleportBuffer = [];

        // Costo de energía
        if (player.energy < 120) {
            player.sofiaTeleportBuffer = [];
            return;
        }

        // Detectar secuencia: DERECHA, IZQ, GOLPE (en menos de 1s entre cada uno)
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
            if (axisX > -0.7 && axisX < 0.7) { pad._sofiaTRight = false; pad._sofiaTLeft = false; }
            if (pad.buttons[2] && pad.buttons[2].pressed && !pad._sofiaTHit) { input = "X"; pad._sofiaTHit = true; }
            if (!(pad.buttons[2] && pad.buttons[2].pressed)) pad._sofiaTHit = false;
        }

        // Buffer de secuencia
        if (input) {
            const now = time;
            if (player.sofiaTeleportBuffer.length === 0 || (now - (player.sofiaTeleportBuffer[player.sofiaTeleportBuffer.length - 1].t)) < 1000) {
                player.sofiaTeleportBuffer.push({ k: input, t: now });
                if (player.sofiaTeleportBuffer.length > 3) player.sofiaTeleportBuffer.shift();
            } else {
                player.sofiaTeleportBuffer = [{ k: input, t: now }];
            }
        }

        // Verificar secuencia
        if (
            player.sofiaTeleportBuffer.length === 3 &&
            player.sofiaTeleportBuffer[0].k === "R" &&
            player.sofiaTeleportBuffer[1].k === "L" &&
            player.sofiaTeleportBuffer[2].k === "X"
        ) {
            // Gasta energía
            player.energy = Math.max(0, player.energy - 120);
            const target = this.players[1 - i];

            // Teletransporta a Sofia a un lado del enemigo (a la derecha o izquierda según su posición)
            const offset = 60; // Distancia al costado
            let newX = target.sprite.x;
            if (sprite.x < target.sprite.x) {
                newX = target.sprite.x - offset;
            } else {
                newX = target.sprite.x + offset;
            }
            sprite.x = newX;
            sprite.y = target.sprite.y;
            sprite.setVelocity(0, 0);

            // Si Sofia queda cerca tras el teletransporte y el enemigo no está bloqueando, hace daño
            const maxHitDist = 120; // Si está más lejos, no recibe daño
            const dx = target.sprite.x - sprite.x;
            const dy = target.sprite.y - sprite.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= maxHitDist && !target.blocking) {
                target.health = Math.max(0, target.health - 40);
                this.cameras.main.flash(100, 100, 255, 255);
            }

            player.sofiaTeleportBuffer = [];
        }
    }

    handleSofiaMeteor(i, time) {
        const player = this.players[i];
        const sprite = player.sprite;
        // Solo Sofia (índice 1 en el selector de personaje)
        if ((i === 0 && this.player1Index !== 1) || (i === 1 && this.player2Index !== 1)) return;

        // Inicializa el buffer si no existe
        if (!player.sofiaMeteorBuffer) player.sofiaMeteorBuffer = [];

        // Costo de energía
        if (player.energy < 350) {
            player.sofiaMeteorBuffer = [];
            return;
        }

        // Detectar secuencia: DERECHA, DERECHA, GOLPE (en menos de 1s entre cada uno)
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

        // Buffer de secuencia
        if (input) {
            const now = time;
            if (player.sofiaMeteorBuffer.length === 0 || (now - (player.sofiaMeteorBuffer[player.sofiaMeteorBuffer.length - 1].t)) < 1000) {
                player.sofiaMeteorBuffer.push({ k: input, t: now });
                if (player.sofiaMeteorBuffer.length > 3) player.sofiaMeteorBuffer.shift();
            } else {
                player.sofiaMeteorBuffer = [{ k: input, t: now }];
            }
        }

        // Verificar secuencia
        if (
            player.sofiaMeteorBuffer.length === 3 &&
            player.sofiaMeteorBuffer[0].k === "R" &&
            player.sofiaMeteorBuffer[1].k === "R" &&
            player.sofiaMeteorBuffer[2].k === "X"
        ) {
            // Gasta energía
            player.energy = Math.max(0, player.energy - 350);
            const target = this.players[1 - i];

            // Invoca el meteoro encima del enemigo
            const meteorX = target.sprite.x;
            const meteorStartY = target.sprite.y - 400; // Muy arriba del enemigo
            const meteorEndY = this.ground.y - 60; // Justo sobre el suelo

            // Crea el meteoro (un círculo más grande)
            const meteor = this.add.circle(meteorX, meteorStartY, 80, 0x888888).setDepth(10); // Antes era 48
            this.tweens.add({
                targets: meteor,
                y: meteorEndY,
                duration: 1600, // Tarda 1.6 segundos en caer
                ease: 'Quad.easeIn',
                onComplete: () => {
                    // Efecto de impacto
                    this.cameras.main.shake(200, 0.01);
                    this.cameras.main.flash(120, 255, 200, 100);

                    // Detección de daño
                    const enemy = target;
                    const ex = enemy.sprite.x;
                    const ey = enemy.sprite.y;
                    const mx = meteor.x;
                    const my = meteorEndY;

                    // Rango de impacto
                    const centerRadius = 56; // Antes 32, ahora más grande
                    const outerRadius = 160; // Antes 90, ahora más grande

                    const dist = Phaser.Math.Distance.Between(mx, this.ground.y, ex, ey + 48); // +48 para el centro del sprite

                    if (dist <= centerRadius) {
                        enemy.health = Math.max(0, enemy.health - 150);
                    } else if (dist <= outerRadius) {
                        enemy.health = Math.max(0, enemy.health - 100);
                    }
                    // Efecto visual de explosión
                    const explosion = this.add.circle(mx, this.ground.y, outerRadius, 0xffcc00, 0.3).setDepth(9);
                    this.time.delayedCall(300, () => { if (explosion && explosion.scene) explosion.destroy(); });
                    if (meteor && meteor.scene) meteor.destroy();
                }
            });

            player.sofiaMeteorBuffer = [];
        }
    }

    handleFranchescaAura(i, time) {
        const player = this.players[i];
        const sprite = player.sprite;
        // Solo Franchesca (índice 2 en el selector de personaje)
        if ((i === 0 && this.player1Index !== 2) || (i === 1 && this.player2Index !== 2)) return;

        // Inicializa el buffer si no existe
        if (!player.franchescaAuraBuffer) player.franchescaAuraBuffer = [];
        if (!player.franchescaAuraActive) player.franchescaAuraActive = false;
        if (!player.franchescaAuraSprite) player.franchescaAuraSprite = null;
        if (!player.franchescaAuraLastTick) player.franchescaAuraLastTick = 0;

        // Detectar secuencia: IZQ, DER, GOLPE (en menos de 1s entre cada uno)
        if (!player.franchescaAuraActive && player.energy < 120) {
            player.franchescaAuraBuffer = [];
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
            if (axisX < -0.7 && !pad._franLeft) { input = "L"; pad._franLeft = true; }
            if (axisX > 0.7 && !pad._franRight) { input = "R"; pad._franRight = true; }
            if (axisX > -0.7 && axisX < 0.7) { pad._franLeft = pad._franRight = false; }
            if (pad.buttons[2] && pad.buttons[2].pressed && !pad._franHit) { input = "X"; pad._franHit = true; }
            if (!(pad.buttons[2] && pad.buttons[2].pressed)) pad._franHit = false;
        }

        // Buffer de secuencia
        if (input) {
            const now = time;
            if (player.franchescaAuraBuffer.length === 0 || (now - (player.franchescaAuraBuffer[player.franchescaAuraBuffer.length - 1].t)) < 1000) {
                player.franchescaAuraBuffer.push({ k: input, t: now });
                if (player.franchescaAuraBuffer.length > 3) player.franchescaAuraBuffer.shift();
            } else {
                player.franchescaAuraBuffer = [{ k: input, t: now }];
            }
        }

        // Verificar secuencia para activar el aura
        if (
            !player.franchescaAuraActive &&
            player.franchescaAuraBuffer.length === 3 &&
            player.franchescaAuraBuffer[0].k === "L" &&
            player.franchescaAuraBuffer[1].k === "R" &&
            player.franchescaAuraBuffer[2].k === "X"
        ) {
            // Gasta energía inicial y activa el aura
            player.energy = Math.max(0, player.energy - 120);
            player.franchescaAuraActive = true;
            player.franchescaAuraLastTick = time;
            // Crea el aura visual (radio 200)
            if (player.franchescaAuraSprite) player.franchescaAuraSprite.destroy();
            player.franchescaAuraSprite = this.add.circle(sprite.x, sprite.y, 200, 0xff00cc, 0.25).setDepth(8);
            player.franchescaAuraBuffer = [];
        }

        // Si el aura está activa, mantenerla mientras se mantenga presionado el botón de golpe y haya energía
        if (player.franchescaAuraActive) {
            // Actualiza la posición del aura visual
            if (player.franchescaAuraSprite) {
                player.franchescaAuraSprite.x = sprite.x;
                player.franchescaAuraSprite.y = sprite.y;
            }

            // Detectar si el botón de golpe sigue presionado
            let holding = false;
            if (i === 0) {
                holding = this.keysP1.hit.isDown;
            } else {
                holding = this.keysP2.hit.isDown;
            }
            if (pad && pad.connected) {
                holding = holding || (pad.buttons[2] && pad.buttons[2].pressed);
            }

            // Si no está presionando el botón o no tiene energía suficiente, desactiva el aura
            if (!holding || player.energy < 100) {
                player.franchescaAuraActive = false;
                if (player.franchescaAuraSprite) { player.franchescaAuraSprite.destroy(); player.franchescaAuraSprite = null; }
                return;
            }

            // Gasta energía constante
            if (time - player.franchescaAuraLastTick > 1000) {
                player.energy = Math.max(0, player.energy - 100);
                player.franchescaAuraLastTick = time;
                // Si se queda sin energía, desactiva el aura
                if (player.energy < 100) {
                    player.franchescaAuraActive = false;
                    if (player.franchescaAuraSprite) { player.franchescaAuraSprite.destroy(); player.franchescaAuraSprite = null; }
                    return;
                }
            }

            // Daño al enemigo si está dentro del área y no está bloqueando
            const target = this.players[1 - i];
            const dist = Phaser.Math.Distance.Between(sprite.x, sprite.y, target.sprite.x, target.sprite.y);
            if (dist <= 200) {
                if (!target.blocking) {
                    const dt = this.game.loop.delta / 1000;
                    target.health = Math.max(0, target.health - 40 * dt);

                }
            }
        }
    }

    handleFranchescaJumpSmash(i, time) {
        const player = this.players[i];
        const sprite = player.sprite;
        // Solo Franchesca (índice 2 en el selector de personaje)
        if ((i === 0 && this.player1Index !== 2) || ( i === 1 && this.player2Index !== 2)) return;

        // Inicializa el buffer si no existe
        if (!player.franchescaJumpBuffer) player.franchescaJumpBuffer = [];
        if (!player.franchescaJumpPending) player.franchescaJumpPending = false;

        // Detectar secuencia: DERECHA, IZQ, GOLPE (en menos de 1s entre cada uno)
        if (!player.franchescaJumpPending && player.energy < 120) {
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
            if (axisX > 0.7 && !pad._franJRight) { input = "R"; pad._franJRight = true; }
            if (axisX < -0.7 && !pad._franJLeft) { input = "L"; pad._franJLeft = true; }
            if (axisX > -0.7 && axisX < 0.7) { pad._franJRight = false; pad._franJLeft = false; }
            if (pad.buttons[2] && pad.buttons[2].pressed && !pad._franJHit) { input = "X"; pad._franJHit = true; }
            if (!(pad.buttons[2] && pad.buttons[2].pressed)) pad._franJHit = false;
        }

        // Buffer de secuencia
        if (input) {
            const now = time;
            if (player.franchescaJumpBuffer.length === 0 || (now - (player.franchescaJumpBuffer[player.franchescaJumpBuffer.length - 1].t)) < 1000) {
                player.franchescaJumpBuffer.push({ k: input, t: now });
                if (player.franchescaJumpBuffer.length > 3) player.franchescaJumpBuffer.shift();
            } else {
                player.franchescaJumpBuffer = [{ k: input, t: now }];
            }
        }

        // Verificar secuencia para activar el salto y smash
        if (
            !player.franchescaJumpPending &&
            player.franchescaJumpBuffer.length === 3 &&
            player.franchescaJumpBuffer[0].k === "R" &&
            player.franchescaJumpBuffer[1].k === "L" &&
            player.franchescaJumpBuffer[2].k === "X"
        ) {
            // Gasta energía y realiza el salto
            player.energy = Math.max(0, player.energy - 120);
            player.franchescaJumpPending = true;
            sprite.setVelocityY(-500); // Salto rápido
            sprite.setTint(0xff99ff);

            // Después de 0.7 segundos, realiza el golpe en área EN EL AIRE (no al tocar el piso)
            this.time.delayedCall(700, () => {
                // Efecto visual de área (radio 350)
                const smashCircle = this.add.circle(sprite.x, sprite.y, 350, 0xff00cc, 0.18).setDepth(9);
                this.cameras.main.shake(180, 0.01);

                // Daño al enemigo si está dentro del área y no está bloqueando
                const target = this.players[1 - i];
                const dist = Phaser.Math.Distance.Between(sprite.x, sprite.y, target.sprite.x, target.sprite.y);
                if (dist <= 350 && !target.blocking) {
                    target.health = Math.max(0, target.health - 180);
                }

                this.time.delayedCall(300, () => {
                    if (smashCircle && smashCircle.scene) smashCircle.destroy();
                });

                player.franchescaJumpBuffer = [];
                player.franchescaJumpPending = false;
                sprite.setTint(i === 0 ? 0x00ffff : 0xff0066);
            });
        }
    }
}

