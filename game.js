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
// --- ESCENA CONTROLES ---
class ControlsScene extends Phaser.Scene {
    constructor() { super("ControlsScene"); }
    create() {
        const { width, height } = this.scale;
        this.cameras.main.setBackgroundColor(0x001d33);

        const title = this.add.text(width / 2, 60, isEnglish ? "CONTROLS" : "CONTROLES", { font: "48px Arial", color: "#00ffff" }).setOrigin(0.5);

        let y = 130;
        const line = (txt) => {
            this.add.text(width / 2, y, txt, { font: "26px Arial", color: "#ffffff" }).setOrigin(0.5);
            y += 38;
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

            // A confirm
            const a = pad.buttons[0] && pad.buttons[0].pressed;
            if (a && !pad._aPressed) {
                this.scene.start("MapSelector", {
                    player1: this.playerSelections[0].index,
                    player2: this.playerSelections[1].index,
                    mode: this.selectedMode
                });
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
            franchescaEnergyBuffer: [],
            franchescaEnergyActive: false,
            franchescaEnergyTimer: 0,
            sofiaLaserBuffer: [],
            sofiaTeleportBuffer: [],
            sofiaMeteorBuffer: []
        });

        this.players.push({
            sprite: p2Sprite, health: 1000, energy: 500, blocking: false,
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
                // Cargar energía (lejos)
                player.blocking = false;
                sprite.setTint(0x2222cc); // Color para cargar
                player.energy = Math.min(500, player.energy + 2.0); // Carga más rápida
            } else {
                // Bloquear (cerca)
                player.blocking = true;
                sprite.setTint(0x336633); // Color para bloquear
            }
            // No puede moverse, saltar, disparar ni pegar
            sprite.setVelocityX(0);
            return;
        } else {
            player.blocking = false;
            sprite.setTint(i === 0 ? 0x00ffff : 0xff0066);
        }

        // Movimiento solo si NO está bloqueando/cargando
        const speed = 220;
        if (left) { sprite.setVelocityX(-speed); sprite.flipX = true; }
        else if (right) { sprite.setVelocityX(speed); sprite.flipX = false; }
        else { sprite.setVelocityX(0); }

        // Saltar
        if (up && sprite.body.onFloor()) sprite.setVelocityY(-560);

        // Pequeña recarga pasiva
        player.energy = Math.min(500, player.energy + 0.05);

        // Puñetazo: 50 de daño
        if (punch && (time - player.lastPunch) > player.punchCD) {
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
        this.handleFranchescaEnergy(i, time);
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
            player.energy = Math.max(0, player.energy - 180);
            player.explosionPending = true;
            player.explosionTimer = time + 1500; // 1.5 segundos después
            player.explosionBuffer = [];
        }
    }

    handleSofiaLaser(i, time) {
        const player = this.players[i];
        const sprite = player.sprite;

        // Solo Sofía (índice 1 en el selector de personaje)
        if ((i === 0 && this.player1Index !== 1) || (i === 1 && this.player2Index !== 1)) return;

        if (!player.sofiaLaserBuffer) player.sofiaLaserBuffer = [];
        if (player.energy < 100) {
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
            player.energy = Math.max(0, player.energy - 100);
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
            player.energy = Math.max(0, player.energy - 100);
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
        const player = this.players[i];
        const sprite = player.sprite;

        // Solo Sofía (índice 1 en el selector de personaje)
        if ((i === 0 && this.player1Index !== 1) || (i === 1 && this.player2Index !== 1)) return;

        if (!player.sofiaMeteorBuffer) player.sofiaMeteorBuffer = [];
        if (player.energy < 250) {
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
            player.energy = Math.max(0, player.energy - 250);
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

    handleFranchescaEnergy(i, time) {
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
                    target.health = Math.max(0, target.health - 15 * dt);
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
            if (player.franchescaEnergyBuffer.length === 0 || (now - (player.franchescaEnergyBuffer[player.franchescaEnergyBuffer.length - 1].t)) < 1000) {
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
}

