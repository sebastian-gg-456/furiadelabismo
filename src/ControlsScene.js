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