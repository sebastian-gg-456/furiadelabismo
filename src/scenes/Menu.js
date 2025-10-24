// Menu.js
// ESCENA MENU

import { globals } from "../globals.js";

export default class Menu extends Phaser.Scene {
    constructor() {
        super("Menu");
    }
    create() {
        const { width } = this.scale;
        this.selectedIndex = 0;
        this.buttons = [];

        this.updateTexts = () => {
            this.title.setText(
                globals.isEnglish
                    ? "THE FURY OF THE ABYSS"
                    : "LA FURIA DEL ABISMO"
            );
            this.playText.setText(globals.isEnglish ? "PLAY" : "JUGAR");
            this.langText.setText(globals.isEnglish ? "LANGUAGE" : "IDIOMA");
            this.controlsText.setText(
                globals.isEnglish ? "CONTROLS" : "CONTROLES"
            );
        };

        this.cameras.main.setBackgroundColor(0x001d33);
        this.title = this.add
            .text(
                width / 2,
                80,
                globals.isEnglish
                    ? "THE FURY OF THE ABYSS"
                    : "LA FURIA DEL ABISMO",
                { font: "72px Arial", color: "#00e5ff" }
            )
            .setOrigin(0.5);

        const buttonWidth = 250,
            buttonHeight = 70,
            spacing = 40;
        let startY = 250;

        const playButton = this.add
            .rectangle(width / 2, startY, buttonWidth, buttonHeight, 0x004466)
            .setInteractive();
        this.playText = this.add
            .text(width / 2, startY, globals.isEnglish ? "PLAY" : "JUGAR", {
                font: "28px Arial",
                color: "#00ffff",
            })
            .setOrigin(0.5);
        this.buttons.push({
            rect: playButton,
            callback: () => this.scene.start("ModeSelector"),
        });

        startY += buttonHeight + spacing;
        const langButton = this.add
            .rectangle(width / 2, startY, buttonWidth, buttonHeight, 0x003355)
            .setInteractive();
        this.langText = this.add
            .text(
                width / 2,
                startY,
                globals.isEnglish ? "LANGUAGE" : "IDIOMA",
                { font: "28px Arial", color: "#00ffcc" }
            )
            .setOrigin(0.5);
        this.buttons.push({
            rect: langButton,
            callback: () => {
                globals.isEnglish = !globals.isEnglish;
                this.updateTexts();
            },
        });

        startY += buttonHeight + spacing;
        const controlsButton = this.add
            .rectangle(width / 2, startY, buttonWidth, buttonHeight, 0x002244)
            .setInteractive();
        this.controlsText = this.add
            .text(
                width / 2,
                startY,
                globals.isEnglish ? "CONTROLS" : "CONTROLES",
                { font: "28px Arial", color: "#66ffff" }
            )
            .setOrigin(0.5);
        this.buttons.push({
            rect: controlsButton,
            callback: () => this.scene.start("ControlsScene"),
        });

        this.selector = this.add
            .rectangle(
                this.buttons[this.selectedIndex].rect.x,
                this.buttons[this.selectedIndex].rect.y,
                buttonWidth + 10,
                buttonHeight + 10
            )
            .setStrokeStyle(4, 0xffff00)
            .setOrigin(0.5);

        this.pressedNavTime = 0;
        this.keyUp = this.input.keyboard.addKey("W");
        this.keyDown = this.input.keyboard.addKey("S");
        this.keyUp2 = this.input.keyboard.addKey("UP");
        this.keyDown2 = this.input.keyboard.addKey("DOWN");

        this.keyConfirmP1 = this.input.keyboard.addKey("SPACE");
        this.keyConfirmP2 = this.input.keyboard.addKey("ENTER");

        this.keyBackP1 = this.input.keyboard.addKey("SHIFT");
        this.keyBackP2 = this.input.keyboard.addKey("BACKSPACE");

        this.input.gamepad.on("connected", (pad) => {
            pad._upPressed =
                pad._downPressed =
                pad._aPressed =
                pad._bPressed =
                    false;
        });
    }

    update(time) {
        if (
            Phaser.Input.Keyboard.JustDown(this.keyUp) ||
            Phaser.Input.Keyboard.JustDown(this.keyUp2)
        )
            this.moveSelector(-1);
        if (
            Phaser.Input.Keyboard.JustDown(this.keyDown) ||
            Phaser.Input.Keyboard.JustDown(this.keyDown2)
        )
            this.moveSelector(1);

        if (
            Phaser.Input.Keyboard.JustDown(this.keyConfirmP1) ||
            Phaser.Input.Keyboard.JustDown(this.keyConfirmP2)
        ) {
            this.buttons[this.selectedIndex].callback();
        }

        const pads = this.input.gamepad.gamepads;
        pads.forEach((pad) => {
            if (!pad) return;
            const y = pad.axes.length > 1 ? pad.axes[1].getValue() : 0;
            if (y < -0.6 && !pad._upPressed) {
                this.moveSelector(-1);
                pad._upPressed = true;
            } else if (y > 0.6 && !pad._downPressed) {
                this.moveSelector(1);
                pad._downPressed = true;
            } else if (y > -0.6 && y < 0.6) {
                pad._upPressed = pad._downPressed = false;
            }

            const aPressed = pad.buttons[0] && pad.buttons[0].pressed;
            if (aPressed && !pad._aPressed) {
                this.buttons[this.selectedIndex].callback();
                pad._aPressed = true;
            }
            if (!aPressed) pad._aPressed = false;
        });
    }

    moveSelector(dir) {
        if (!this.buttons || this.buttons.length === 0) return;
        this.selectedIndex = Phaser.Math.Wrap(
            this.selectedIndex + dir,
            0,
            this.buttons.length
        );
        const button = this.buttons[this.selectedIndex];
        if (button && button.rect) {
            this.selector.x = button.rect.x;
            this.selector.y = button.rect.y;
        }
    }
}
