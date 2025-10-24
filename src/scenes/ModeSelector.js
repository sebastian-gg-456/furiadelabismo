// ModeSelector.js
// ESCENA MODE SELECTOR

export default class ModeSelector extends Phaser.Scene {
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

        this.keyLeft = this.input.keyboard.addKey('A');
        this.keyRight = this.input.keyboard.addKey('D');
        this.keyLeft2 = this.input.keyboard.addKey('LEFT');
        this.keyRight2 = this.input.keyboard.addKey('RIGHT');

        this.keyConfirmP1 = this.input.keyboard.addKey('SPACE');
        this.keyConfirmP2 = this.input.keyboard.addKey('ENTER');
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

            const a = pad.buttons[0] && pad.buttons[0].pressed;
            if (a && !pad._aPressed) { this.buttons[this.selectedIndex].callback(); pad._aPressed = true; }
            if (!a) pad._aPressed = false;

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
