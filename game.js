function crearMenuInicio() {
    const app = document.getElementById('app');
    app.innerHTML = '';

    // Estilos
    const style = document.createElement('style');
    style.textContent = `
        body {
            background-color: #3a47d5 !important;
        }
        #app {
            justify-content: flex-start !important;
            align-items: flex-start !important;
            height: 100vh;
            display: flex;
        }
        .menu-container {
            margin-left: 40px;
            margin-top: 40px;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
        }
        .menu-title {
            color: #19d3f7;
            font-size: 5rem;
            font-family: Arial, Helvetica, sans-serif;
            text-align: left;
            margin-bottom: 50px;
            line-height: 1.1;
        }
        .menu-btn {
            color: #ffd600;
            background: #f52222;
            border: 2px solid #f52222;
            font-size: 2.5rem;
            font-family: Arial, Helvetica, sans-serif;
            margin-bottom: 40px;
            padding: 20px 40px;
            border-radius: 4px;
            cursor: pointer;
            text-align: left;
            width: 300px;
            box-sizing: border-box;
            outline: none;
            transition: border 0.2s;
        }
        .menu-btn.selected {
            border: 6px solid #ffd600;
        }
    `;
    document.head.appendChild(style);

    // Contenedor del menú
    const menuContainer = document.createElement('div');
    menuContainer.className = 'menu-container';

    // Título
    const titulo = document.createElement('div');
    titulo.className = 'menu-title';
    titulo.textContent = 'La furia del abismo';

    // Botón Jugar
    const btnJugar = document.createElement('button');
    btnJugar.className = 'menu-btn';
    btnJugar.textContent = 'Jugar';

    // Botón Controles
    const btnControles = document.createElement('button');
    btnControles.className = 'menu-btn';
    btnControles.textContent = 'Controles';

    // Eventos
    btnJugar.addEventListener('click', crearMenuModo);

    // Navegación con teclado
    const botones = [btnJugar, btnControles];
    let seleccionado = 0;
    function actualizarSeleccion() {
        botones.forEach((btn, i) => {
            btn.classList.toggle('selected', i === seleccionado);
        });
    }
    actualizarSeleccion();

    document.onkeydown = function(e) {
        if (e.key === 'ArrowDown') {
            seleccionado = (seleccionado + 1) % botones.length;
            actualizarSeleccion();
        }
        if (e.key === 'ArrowUp') {
            seleccionado = (seleccionado - 1 + botones.length) % botones.length;
            actualizarSeleccion();
        }
        if (e.key === ' ' || e.key === 'Enter') {
            botones[seleccionado].click();
        }
    };

    // Agregar elementos al contenedor
    menuContainer.appendChild(titulo);
    menuContainer.appendChild(btnJugar);
    menuContainer.appendChild(btnControles);

    app.appendChild(menuContainer);
}

function crearMenuModo() {
    const app = document.getElementById('app');
    app.innerHTML = '';

    // Estilos
    const style = document.createElement('style');
    style.textContent = `
        body {
            background-color: #3a47d5 !important;
        }
        #app {
            height: 100vh;
            width: 100vw;
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
        }
        .modo-btn {
            background: #f52222;
            color: #ffd600;
            font-size: 4rem;
            font-family: Arial, Helvetica, sans-serif;
            border: none;
            width: 40vw;
            height: 60vh;
            margin: 0 3vw;
            border-radius: 10px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 12px rgba(0,0,0,0.2);
            transition: background 0.2s, color 0.2s, border 0.2s;
            outline: none;
        }
        .modo-btn.selected {
            border: 6px solid #ffd600;
        }
    `;
    document.head.appendChild(style);

    // Botón Versus
    const btnVersus = document.createElement('button');
    btnVersus.className = 'modo-btn';
    btnVersus.textContent = 'Versus';

    // Botón Cooperativo
    const btnCoop = document.createElement('button');
    btnCoop.className = 'modo-btn';
    btnCoop.textContent = 'Cooperativo';

    // Navegación con teclado
    const botones = [btnVersus, btnCoop];
    let seleccionado = 0;
    function actualizarSeleccion() {
        botones.forEach((btn, i) => {
            btn.classList.toggle('selected', i === seleccionado);
        });
    }
    actualizarSeleccion();

    document.onkeydown = function(e) {
        if (e.key === 'ArrowRight') {
            seleccionado = (seleccionado + 1) % botones.length;
            actualizarSeleccion();
        }
        if (e.key === 'ArrowLeft') {
            seleccionado = (seleccionado - 1 + botones.length) % botones.length;
            actualizarSeleccion();
        }
        if (e.key === ' ' || e.key === 'Enter') {
            botones[seleccionado].click();
        }
    };

    // Eventos
    btnVersus.addEventListener('click', crearMenuVersus);
    btnCoop.addEventListener('click', crearMenuVersus);

    // Contenedor de los botones
    const modosContainer = document.createElement('div');
    modosContainer.style.display = 'flex';
    modosContainer.style.flexDirection = 'row';
    modosContainer.style.justifyContent = 'center';
    modosContainer.style.alignItems = 'center';
    modosContainer.style.width = '100vw';
    modosContainer.style.height = '100vh';

    modosContainer.appendChild(btnVersus);
    modosContainer.appendChild(btnCoop);

    app.appendChild(modosContainer);
}

// MENÚ VERSUS (Selección de personajes para dos jugadores)
function crearMenuVersus() {
    const app = document.getElementById('app');
    app.innerHTML = '';

    // Estilos
    const style = document.createElement('style');
    style.textContent = `
        body {
            background-color: #3a47d5 !important;
        }
        #app {
            height: 100vh;
            width: 100vw;
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
        }
        .versus-container {
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
            width: 100vw;
            height: 100vh;
            gap: 20px;
        }
        .personaje-card {
            width: 22vw;
            height: 85vh;
            background: #000;
            border: 4px solid transparent;
            border-radius: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            margin: 0;
            position: relative;
            transition: border 0.2s, background 0.2s;
        }
        .personaje-card.habilitado {
            cursor: pointer;
        }
        .personaje-card.bloqueado {
            border: 4px solid #b06ca7;
            background: #000;
            opacity: 0.7;
        }
        .personaje-card.bloqueado .candado {
            display: block;
        }
        .personaje-card .candado {
            display: none;
            width: 80px;
            height: 80px;
            background: #ffd600;
            margin: 0 auto;
            margin-top: 40px;
            border-radius: 4px;
            position: relative;
        }
        .personaje-card .candado::before {
            content: '';
            display: block;
            width: 60px;
            height: 30px;
            border-radius: 30px 30px 0 0;
            border: 6px solid #aaa;
            border-bottom: none;
            position: absolute;
            left: 10px;
            top: -28px;
        }
        .personaje-card.elegido-j1 {
            background: #f52222;
        }
        .personaje-card.elegido-j2 {
            background: #2222f5;
        }
        .personaje-card.seleccionado-j1 {
            border: 6px solid #ffd600;
        }
        .personaje-card.seleccionado-j2 {
            border: 6px solid #006400;
        }
        .personaje-card.seleccionado-ambos {
            border-width: 6px;
            border-style: solid;
            border-image: linear-gradient(to right, #ffd600 50%, #006400 50%) 1;
        }
    `;
    document.head.appendChild(style);

    // Datos de personajes
    const personajes = [
        { nombre: 'Personaje 1', habilitado: true },
        { nombre: 'Personaje 2', habilitado: true },
        { nombre: 'Personaje 3', habilitado: false },
        { nombre: 'Personaje 4', habilitado: false }
    ];

    // Estado de selección
    let seleccionadoJ1 = 0; // Jugador 1 (flechas)
    let seleccionadoJ2 = 1; // Jugador 2 (wasd)
    let elegidoJ1 = null;
    let elegidoJ2 = null;

    // Crear cards
    const versusContainer = document.createElement('div');
    versusContainer.className = 'versus-container';
    const cards = personajes.map((p, i) => {
        const card = document.createElement('div');
        card.className = 'personaje-card' + (p.habilitado ? ' habilitado' : ' bloqueado');
        card.tabIndex = p.habilitado ? 0 : -1;

        // Nombre del personaje
        const nombre = document.createElement('div');
        nombre.textContent = p.nombre;
        nombre.style.color = p.habilitado ? '#ffd600' : '#fff';
        nombre.style.fontSize = '3rem';
        nombre.style.textAlign = 'center';
        nombre.style.marginTop = '40px';

        // Candado si está bloqueado
        const candado = document.createElement('div');
        candado.className = 'candado';

        card.appendChild(nombre);
        card.appendChild(candado);

        versusContainer.appendChild(card);
        return card;
    });

    // Actualizar visual de selección
    function actualizarSeleccion() {
        cards.forEach((card, i) => {
            card.classList.remove('seleccionado-j1', 'seleccionado-j2', 'seleccionado-ambos', 'elegido-j1', 'elegido-j2');
            // Selección visual
            if (i === seleccionadoJ1 && i === seleccionadoJ2) {
                card.classList.add('seleccionado-ambos');
            } else {
                if (i === seleccionadoJ1) card.classList.add('seleccionado-j1');
                if (i === seleccionadoJ2) card.classList.add('seleccionado-j2');
            }
            // Elegido visual
            if (i === elegidoJ1 && i === elegidoJ2) {
                card.classList.add('elegido-j1', 'elegido-j2');
            } else {
                if (i === elegidoJ1) card.classList.add('elegido-j1');
                if (i === elegidoJ2) card.classList.add('elegido-j2');
            }
        });

        // Si ambos eligieron, ir al menú de mapas
        if (elegidoJ1 !== null && elegidoJ2 !== null) {
            setTimeout(crearMenuMapas, 500);
        }
    }
    actualizarSeleccion();

    // Click para elegir personaje (solo habilitados)
    cards.forEach((card, i) => {
        if (personajes[i].habilitado) {
            card.addEventListener('click', () => {
                // Por defecto, jugador 1 elige con click
                elegidoJ1 = i;
                actualizarSeleccion();
            });
        }
    });

    // Teclado para ambos jugadores
    document.onkeydown = function(e) {
        // Jugador 1 (flechas + espacio/enter)
        if (['ArrowRight', 'ArrowLeft', ' ', 'Enter'].includes(e.key)) {
            if (e.key === 'ArrowRight') {
                do {
                    seleccionadoJ1 = (seleccionadoJ1 + 1) % cards.length;
                } while (!personajes[seleccionadoJ1].habilitado);
                actualizarSeleccion();
            }
            if (e.key === 'ArrowLeft') {
                do {
                    seleccionadoJ1 = (seleccionadoJ1 - 1 + cards.length) % cards.length;
                } while (!personajes[seleccionadoJ1].habilitado);
                actualizarSeleccion();
            }
            if (e.key === ' ' || e.key === 'Enter') {
                elegidoJ1 = seleccionadoJ1;
                actualizarSeleccion();
            }
        }
        // Jugador 2 (wasd + g)
        if (['d', 'a', 'g', 'D', 'A', 'G'].includes(e.key)) {
            if (e.key.toLowerCase() === 'd') {
                do {
                    seleccionadoJ2 = (seleccionadoJ2 + 1) % cards.length;
                } while (!personajes[seleccionadoJ2].habilitado);
                actualizarSeleccion();
            }
            if (e.key.toLowerCase() === 'a') {
                do {
                    seleccionadoJ2 = (seleccionadoJ2 - 1 + cards.length) % cards.length;
                } while (!personajes[seleccionadoJ2].habilitado);
                actualizarSeleccion();
            }
            if (e.key.toLowerCase() === 'g') {
                elegidoJ2 = seleccionadoJ2;
                actualizarSeleccion();
            }
        }
    };

    app.appendChild(versusContainer);
}

// MENÚ MAPAS (Carrusel)
function crearMenuMapas() {
    const app = document.getElementById('app');
    app.innerHTML = '';

    // Estilos
    const style = document.createElement('style');
    style.textContent = `
        body {
            background-color: #3a47d5 !important;
        }
        #app {
            height: 100vh;
            width: 100vw;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .mapa-carrusel-container {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            gap: 40px;
            width: 100vw;
            height: 100vh;
        }
        .mapa-arrow {
            font-size: 5rem;
            color: #ffd600;
            background: none;
            border: none;
            cursor: pointer;
            user-select: none;
        }
        .mapa-preview {
            width: 600px;
            height: 400px;
            background: #222;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 8px solid #f52222;
            border-radius: 20px;
            box-sizing: border-box;
            transition: border 0.2s, background 0.2s;
            overflow: hidden;
        }
        .mapa-preview img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 12px;
        }
    `;
    document.head.appendChild(style);

    // Mapas de ejemplo
    const mapas = [
        { nombre: 'Playa', color: '#f5e642', img: 'public/mapas/playaprov.jpg' },
        { nombre: 'Bosque', color: '#42f554', img: '' },
        { nombre: 'Volcán', color: '#f54242', img: '' }
    ];
    let seleccionado = 0;

    // Preload de la imagen principal
    const preloadImg = new Image();
    preloadImg.src = mapas[0].img;
    preloadImg.onload = () => {
        mostrarCarrusel();
    };
    preloadImg.onerror = () => {
        // Si falla la carga, igual muestra el carrusel
        mostrarCarrusel();
    };

    function mostrarCarrusel() {
        app.innerHTML = '';
        const container = document.createElement('div');
        container.className = 'mapa-carrusel-container';

        const btnIzq = document.createElement('button');
        btnIzq.className = 'mapa-arrow';
        btnIzq.textContent = '⟨';

        const btnDer = document.createElement('button');
        btnDer.className = 'mapa-arrow';
        btnDer.textContent = '⟩';

        const preview = document.createElement('div');
        preview.className = 'mapa-preview';

        function actualizarPreview() {
            preview.innerHTML = '';
            if (mapas[seleccionado].img) {
                const img = document.createElement('img');
                img.src = mapas[seleccionado].img;
                img.alt = mapas[seleccionado].nombre;
                preview.appendChild(img);
            } else {
                preview.style.background = mapas[seleccionado].color;
            }
        }
        actualizarPreview();

        btnIzq.addEventListener('click', () => {
            seleccionado = (seleccionado - 1 + mapas.length) % mapas.length;
            actualizarPreview();
        });
        btnDer.addEventListener('click', () => {
            seleccionado = (seleccionado + 1) % mapas.length;
            actualizarPreview();
        });

        // Teclado para carrusel
        document.onkeydown = function(e) {
            if (e.key === 'ArrowLeft') {
                btnIzq.click();
            }
            if (e.key === 'ArrowRight') {
                btnDer.click();
            }
            if (e.key === ' ' || e.key === 'Enter') {
                iniciarPelea(mapas[seleccionado]);
            }
        };

        container.appendChild(btnIzq);
        container.appendChild(preview);
        container.appendChild(btnDer);

        app.appendChild(container);
    }
}

function iniciarPelea(mapa) {
    const app = document.getElementById('app');
    app.innerHTML = '';

    // Fondo más ancho y centrado
    app.style.background = mapa.img
        ? `#87ceeb url('${mapa.img}') center center / 100vw 100vh no-repeat`
        : mapa.color;

    // Estilos extra
    const style = document.createElement('style');
    style.textContent = `
        #app {
            position: relative;
            height: 90vh;
            width: 100vw;
            overflow: hidden;
        }
        .barra-superior {
            position: absolute;
            top: 32px;
            left: 0;
            width: 100vw;
            height: 90px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            z-index: 2;
            pointer-events: none;
        }
        .hud-jugador {
            width: 420px;
            height: 90px;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            justify-content: flex-start;
            margin: 0 20px;
        }
        .hud-jugador.derecha {
            align-items: flex-end;
        }
        .vida-barra, .energia-barra {
            width: 320px;
            height: 18px;
            margin-bottom: 8px;
            background: #e53935;
            image-rendering: pixelated;
            border: 0;
            border-radius: 0;
            box-shadow: 0 0 0 4px #fff, 0 0 0 8px #222;
            position: relative;
            overflow: hidden;
        }
        .energia-barra {
            height: 10px;
            background: #00cfff;
        }
        .vida-barra .relleno {
            background: #e53935;
            height: 100%;
            width: 100%;
            image-rendering: pixelated;
            transition: width 0.2s;
        }
        .energia-barra .relleno {
            background: #00cfff;
            height: 100%;
            width: 100%;
            image-rendering: pixelated;
            transition: width 0.2s;
        }
        .personaje {
            position: absolute;
            bottom: 60px;
            width: 80px;
            height: 160px;
            background: #ffd600;
            border: 4px solid #f52222;
            border-radius: 8px;
            z-index: 1;
            transition: left 0.1s, right 0.1s;
            box-shadow: 0 8px 24px rgba(0,0,0,0.2);
            image-rendering: pixelated;
        }
        .personaje.j1 {
            left: 40vw;
            background: #42f554;
            border-color: #006400;
        }
        .personaje.j2 {
            left: 52vw;
            background: #ffd600;
            border-color: #f52222;
        }
    `;
    document.head.appendChild(style);

    // Barra superior HUD
    const barra = document.createElement('div');
    barra.className = 'barra-superior';

    // HUD Jugador 1
    const hud1 = document.createElement('div');
    hud1.className = 'hud-jugador';
    hud1.innerHTML = `
        <div class="vida-barra"><div class="relleno" id="vida-j1"></div></div>
        <div class="energia-barra"><div class="relleno" id="energia-j1"></div></div>
    `;

    // HUD Jugador 2
    const hud2 = document.createElement('div');
    hud2.className = 'hud-jugador derecha';
    hud2.innerHTML = `
        <div class="vida-barra"><div class="relleno" id="vida-j2"></div></div>
        <div class="energia-barra"><div class="relleno" id="energia-j2"></div></div>
    `;

    barra.appendChild(hud1);
    barra.appendChild(hud2);
    app.appendChild(barra);

    // Personajes
    const pj1 = document.createElement('div');
    pj1.className = 'personaje j1';
    pj1.style.left = '40vw';

    const pj2 = document.createElement('div');
    pj2.className = 'personaje j2';
    pj2.style.left = '52vw';

    app.appendChild(pj1);
    app.appendChild(pj2);

    // Estado
    let posJ1 = 40;
    let posJ2 = 52;
    let vidaJ1 = 100, vidaJ2 = 100;
    let energiaJ1 = 100, energiaJ2 = 100;

    // Actualizar barras
    function actualizarHUD() {
        document.getElementById('vida-j1').style.width = vidaJ1 + '%';
        document.getElementById('vida-j2').style.width = vidaJ2 + '%';
        document.getElementById('energia-j1').style.width = energiaJ1 + '%';
        document.getElementById('energia-j2').style.width = energiaJ2 + '%';
    }
    actualizarHUD();

    // Movimiento
    document.onkeydown = function(e) {
        // Jugador 1 (flechas)
        if (e.key === 'ArrowLeft') {
            posJ1 = Math.max(0, posJ1 - 2);
            pj1.style.left = posJ1 + 'vw';
        }
        if (e.key === 'ArrowRight') {
            posJ1 = Math.min(90, posJ1 + 2);
            pj1.style.left = posJ1 + 'vw';
        }
        // Jugador 2 (A/D)
        if (e.key.toLowerCase() === 'a') {
            posJ2 = Math.max(0, posJ2 - 2);
            pj2.style.left = posJ2 + 'vw';
        }
        if (e.key.toLowerCase() === 'd') {
            posJ2 = Math.min(90, posJ2 + 2);
            pj2.style.left = posJ2 + 'vw';
        }
    };
}

export { crearMenuInicio };