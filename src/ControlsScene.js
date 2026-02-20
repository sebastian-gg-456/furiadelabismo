// --- ESCENA CONTROLES ---
class ControlsScene extends Phaser.Scene {
    constructor() { 
        super("ControlsScene"); 
        this.currentMenu = "main"; // main, basics, modes
    }

    create() {
        const { width, height } = this.scale;
        this.cameras.main.setBackgroundColor(0x001d33);
        
        // Tecla ESC siempre vuelve
        this.input.keyboard.on('keydown-ESC', () => {
            if (this.currentMenu === "main") {
                this.scene.start("Menu");
            } else {
                this.showMainMenu();
            }
        });

        this.showMainMenu();
    }

    showMainMenu() {
        this.currentMenu = "main";
        this.children.removeAll(true);

        const { width, height } = this.scale;

        // Título
        this.add.text(width / 2, 50, isEnglish ? "CONTROLS" : "CONTROLES", 
            { font: "48px Arial", color: "#00ffff", fontStyle: "bold" }).setOrigin(0.5);

        // Botón 1: Controles Básicos
        const btn1X = width / 2 - 200;
        const btn1Y = height / 2 - 80;
        const btnWidth = 300;
        const btnHeight = 160;

        const rect1 = this.add.rectangle(btn1X, btn1Y, btnWidth, btnHeight, 0x004466).setInteractive();
        rect1.setStrokeStyle(3, 0x00ffff);
        const text1 = this.add.text(btn1X, btn1Y, 
            isEnglish ? "BASIC\nCONTROLS" : "CONTROLES\nBÁSICOS", 
            { font: "36px Arial", color: "#00ffff", fontStyle: "bold", align: "center" }).setOrigin(0.5);
        
        rect1.on('pointerdown', () => this.showBasicsMenu());
        rect1.on('pointerover', () => rect1.setFillStyle(0x006688));
        rect1.on('pointerout', () => rect1.setFillStyle(0x004466));

        // Botón 2: Modos de Juego
        const btn2X = width / 2 + 200;
        const btn2Y = height / 2 - 80;

        const rect2 = this.add.rectangle(btn2X, btn2Y, btnWidth, btnHeight, 0x004466).setInteractive();
        rect2.setStrokeStyle(3, 0x00ffff);
        const text2 = this.add.text(btn2X, btn2Y, 
            isEnglish ? "GAME\nMODES" : "MODOS DE\nJUEGO", 
            { font: "36px Arial", color: "#00ffff", fontStyle: "bold", align: "center" }).setOrigin(0.5);
        
        rect2.on('pointerdown', () => this.showModesMenu());
        rect2.on('pointerover', () => rect2.setFillStyle(0x006688));
        rect2.on('pointerout', () => rect2.setFillStyle(0x004466));

        // Botón VOLVER
        const backBtn = this.add.rectangle(width / 2, height - 70, 220, 60, 0x003355).setInteractive();
        backBtn.setStrokeStyle(2, 0x00ffff);
        const backTxt = this.add.text(width / 2, height - 70, 
            isEnglish ? "BACK" : "VOLVER", 
            { font: "28px Arial", color: "#00ffff" }).setOrigin(0.5);
        
        backBtn.on('pointerdown', () => this.scene.start("Menu"));
        backBtn.on('pointerover', () => backBtn.setFillStyle(0x005577));
        backBtn.on('pointerout', () => backBtn.setFillStyle(0x003355));
    }

    showBasicsMenu() {
        this.currentMenu = "basics";
        this.children.removeAll(true);

        const { width, height } = this.scale;

        // Título
        this.add.text(width / 2, 30, 
            isEnglish ? "BASIC CONTROLS" : "CONTROLES BÁSICOS", 
            { font: "42px Arial", color: "#00ffff", fontStyle: "bold" }).setOrigin(0.5);

        // Definir botones de controles
        const controls = [
            { 
                label: isEnglish ? "MOVEMENT" : "MOVIMIENTO", 
                keys: "A/D\n← ↑ →",
                x: width / 2 - 220,
                y: 150
            },
            { 
                label: isEnglish ? "ATTACK" : "ATAQUE", 
                keys: "X\nK",
                x: width / 2,
                y: 150
            },
            { 
                label: isEnglish ? "SHOOT" : "DISPARAR", 
                keys: "B\nP",
                x: width / 2 + 220,
                y: 150
            },
            { 
                label: isEnglish ? "BLOCK" : "BLOQUEAR", 
                keys: "C\nL",
                x: width / 2 - 220,
                y: 320
            },
            { 
                label: isEnglish ? "CHARGE" : "CARGAR", 
                keys: "C\n(Hold)",
                x: width / 2,
                y: 320
            }
        ];

        // Crear botones de controles
        controls.forEach(control => {
            const btnWidth = 140;
            const btnHeight = 140;

            const rect = this.add.rectangle(control.x, control.y, btnWidth, btnHeight, 0x004466).setInteractive();
            rect.setStrokeStyle(2, 0x00ffff);

            this.add.text(control.x, control.y - 40, control.label, 
                { font: "18px Arial", color: "#00ffff", fontStyle: "bold", align: "center" }).setOrigin(0.5);

            this.add.text(control.x, control.y + 20, control.keys, 
                { font: "16px Arial", color: "#ffffff", align: "center", lineSpacing: 4 }).setOrigin(0.5);

            rect.on('pointerover', () => rect.setFillStyle(0x006688));
            rect.on('pointerout', () => rect.setFillStyle(0x004466));
        });

        // Botón VOLVER
        const backBtn = this.add.rectangle(width / 2, height - 70, 220, 60, 0x003355).setInteractive();
        backBtn.setStrokeStyle(2, 0x00ffff);
        const backTxt = this.add.text(width / 2, height - 70, 
            isEnglish ? "BACK" : "VOLVER", 
            { font: "28px Arial", color: "#00ffff" }).setOrigin(0.5);
        
        backBtn.on('pointerdown', () => this.showMainMenu());
        backBtn.on('pointerover', () => backBtn.setFillStyle(0x005577));
        backBtn.on('pointerout', () => backBtn.setFillStyle(0x003355));
    }

    showModesMenu() {
        this.currentMenu = "modes";
        this.children.removeAll(true);

        const { width, height } = this.scale;

        // Título
        this.add.text(width / 2, 30, 
            isEnglish ? "GAME MODES" : "MODOS DE JUEGO", 
            { font: "42px Arial", color: "#00ffff", fontStyle: "bold" }).setOrigin(0.5);

        let y = 90;

        // VERSUS MODE
        this.add.text(60, y, isEnglish ? "VERSUS MODE" : "MODO VERSUS", 
            { font: "32px Arial", color: "#ff6600", fontStyle: "bold" }).setOrigin(0, 0);
        
        y += 50;

        const versusText = isEnglish ? 
            "Two players face off in combat!\nBoth players battle to determine\nwho is the strongest. Victory goes\nto the player who defeats their opponent." :
            "¡Dos jugadores se enfrentan en combate!\nAmbos jugadores luchan para determinar\nquién es el más fuerte. ¡La victoria va\npara el jugador que derrote a su rival!";

        this.add.text(80, y, versusText, 
            { font: "20px Arial", color: "#ffffff", lineSpacing: 8 }).setOrigin(0, 0);

        y += 160;

        // COOPERATIVE MODE
        this.add.text(60, y, isEnglish ? "COOPERATIVE MODE" : "MODO COOPERATIVO", 
            { font: "32px Arial", color: "#00ff00", fontStyle: "bold" }).setOrigin(0, 0);
        
        y += 50;

        const coopText = isEnglish ? 
            "Two players fuse into one body!\n\nPlayer 1: Controls movement, melee attacks, and blocking.\nPlayer 2: Aims and shoots at enemies, deflecting incoming projectiles.\n\nWork together to survive endless enemy waves and\nface the final boss to achieve victory!\n\nNote: If Health drops to zero, the body cannot move\nbut can still shoot and deflect attacks until Secondary\nHealth is depleted." :
            "¡Dos jugadores se fusionan en un mismo cuerpo!\n\nJugador 1: Controla el movimiento, golpes cuerpo a cuerpo y bloqueo.\nJugador 2: Apunta y dispara a los enemigos, desviando proyectiles entrantes.\n\n¡Trabajen juntos para superar oleadas infinitas de enemigos\ny enfrentar al jefe final para lograr la victoria!\n\nNota: Si la Salud baja a cero, el cuerpo no se puede mover\npero sigue pudiendo disparar y desviar ataques hasta que\nla Salud Secundaria se agote.";

        this.add.text(80, y, coopText, 
            { font: "18px Arial", color: "#ffffff", lineSpacing: 8, wordWrap: { width: width - 160 } }).setOrigin(0, 0);

        // Botón VOLVER
        const backBtn = this.add.rectangle(width / 2, height - 50, 220, 60, 0x003355).setInteractive();
        backBtn.setStrokeStyle(2, 0x00ffff);
        const backTxt = this.add.text(width / 2, height - 50, 
            isEnglish ? "BACK" : "VOLVER", 
            { font: "28px Arial", color: "#00ffff" }).setOrigin(0.5);
        
        backBtn.on('pointerdown', () => this.showMainMenu());
        backBtn.on('pointerover', () => backBtn.setFillStyle(0x005577));
        backBtn.on('pointerout', () => backBtn.setFillStyle(0x003355));
    }
}