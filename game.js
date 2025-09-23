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
        .menu-btn.play-img {
            padding: 0;
            background: none;
            border: none;
            width: 423px;
            height: 85px;
            cursor: pointer;
            margin-bottom: 40px;
        }
        .menu-btn.play-img img {
            width: 423px;
            height: 85px;
            display: block;
        }
        .menu-btn.confi-img {
            padding: 0;
            background: none;
            border: none;
            width: 419px;
            height: 87px;
            cursor: pointer;
            margin-bottom: 40px;
        }
        .menu-btn.confi-img img {
            width: 419px;
            height: 87px;
            display: block;
        }
        .menu-btn.selected {
            outline: 4px solid #ffd600;
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

    // Botón Jugar con imagen
    const btnJugar = document.createElement('button');
    btnJugar.className = 'menu-btn play-img';
    const imgJugar = document.createElement('img');
    imgJugar.src = 'public/assets/interfaz/play.png';
    imgJugar.alt = 'Jugar';
    imgJugar.width = 423;
    imgJugar.height = 85;
    btnJugar.appendChild(imgJugar);

    // Botón Controles con imagen
    const btnControles = document.createElement('button');
    btnControles.className = 'menu-btn confi-img';
    const imgControles = document.createElement('img');
    imgControles.src = 'public/assets/interfaz/confi.png';
    imgControles.alt = 'Controles';
    imgControles.width = 419;
    imgControles.height = 87;
    btnControles.appendChild(imgControles);

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

// --- Reemplaza tu función iniciarPelea por esta versión limpia ---
function iniciarPelea(mapa) {
    const app = document.getElementById('app');
    app.innerHTML = '';

    // Ajusta el tamaño del contenedor al tamaño de la imagen
    app.style.width = '1365px';
    app.style.height = '599px';
    app.style.margin = '0 auto';
    app.style.position = 'relative';
    app.style.overflow = 'hidden';

    // Fondo con la imagen "playaprov.jpg" y escala exacta 1365x599
    app.style.background = mapa.img
        ? `#87ceeb url('${mapa.img}') center center / 1365px 599px no-repeat`
        : mapa.color;

    // Estilos extra
    const style = document.createElement('style');
    style.textContent = `
        .barra-superior {
            position: absolute;
            top: 32px;
            left: 0;
            width: 100%;
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
            bottom: -5px;
            width: 80px;
            height: 160px;
            image-rendering: pixelated;
        }
        .personaje.j1 {
            left: 40vw;
            background: none;
            border: none;
        }
        .personaje.j2 {
            left: 52vw;
            background: none;
            border: none;
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
    pj1.style.bottom = '-5px';
    pj1.style.background = 'none';
    pj1.style.border = 'none';
    // Imagen para personaje 1
    const imgPJ1 = document.createElement('img');
    imgPJ1.src = 'public/assets/player/player.jpg';
    imgPJ1.alt = 'Jugador 1';
    imgPJ1.style.width = '100%';
    imgPJ1.style.height = '100%';
    imgPJ1.style.objectFit = 'contain';
    pj1.appendChild(imgPJ1);

    // Personaje 2 (misma imagen y escala que el personaje 1)
    const pj2 = document.createElement('div');
    pj2.className = 'personaje j2';
    pj2.style.left = '52vw';
    pj2.style.bottom = '-5px';
    pj2.style.width = '80px';
    pj2.style.height = '160px';
    pj2.style.background = 'none';
    pj2.style.border = 'none';
    // Imagen para personaje 2 (puedes cambiar por spritesheet cuando quieras)
    const imgPJ2 = document.createElement('img');
    imgPJ2.src = 'public/assets/player/player.jpg'; // Cambia por spritesheet cuando lo necesites
    imgPJ2.alt = 'Jugador 2';
    imgPJ2.style.width = '100%';
    imgPJ2.style.height = '100%';
    imgPJ2.style.objectFit = 'contain';
    pj2.appendChild(imgPJ2);

    app.appendChild(pj1);
    app.appendChild(pj2);

    // Estado
    let posJ1 = 40;
    let posJ2 = 52;
    let vidaJ1 = 100, vidaJ2 = 100;
    let energiaJ1 = 100, energiaJ2 = 100;
    let velYJ1 = 0, velYJ2 = 0;
    let saltandoJ1 = false, saltandoJ2 = false;
    let enSueloJ1 = true, enSueloJ2 = true;

    // Movimiento continuo
    let moviendoIzqJ1 = false, moviendoDerJ1 = false;
    let moviendoIzqJ2 = false, moviendoDerJ2 = false;

    // Actualizar barras
    function actualizarHUD() {
        document.getElementById('vida-j1').style.width = vidaJ1 + '%';
        document.getElementById('vida-j2').style.width = vidaJ2 + '%';
        document.getElementById('energia-j1').style.width = energiaJ1 + '%';
        document.getElementById('energia-j2').style.width = energiaJ2 + '%';
    }
    actualizarHUD();

    // Actualizar posición y salto
    function actualizarPersonajes() {
        pj1.style.left = posJ1 + 'vw';
        pj2.style.left = posJ2 + 'vw';
        pj1.style.bottom = Math.max(-5, velYJ1) + 'px';
        pj2.style.bottom = Math.max(-5, velYJ2) + 'px';
    }

    // Parámetros de movimiento y salto
    const velocidadMovimiento = 0.25; // Más lento, tipo caminar
    const gravedad = 2.5;
    const fuerzaSalto = 32; // Más alto y natural

    // Loop de movimiento y salto
    function loop() {
        // Movimiento horizontal J1
        if (moviendoIzqJ1) posJ1 = Math.max(0, posJ1 - velocidadMovimiento);
        if (moviendoDerJ1) posJ1 = Math.min(90, posJ1 + velocidadMovimiento);
        // Movimiento horizontal J2
        if (moviendoIzqJ2) posJ2 = Math.max(0, posJ2 - velocidadMovimiento);
        if (moviendoDerJ2) posJ2 = Math.min(90, posJ2 + velocidadMovimiento);

        // Salto y gravedad J1
        if (!enSueloJ1) {
            velYJ1 -= gravedad;
            if (velYJ1 <= -5) {
                velYJ1 = -5;
                enSueloJ1 = true;
            }
        }
        // Salto y gravedad J2
        if (!enSueloJ2) {
            velYJ2 -= gravedad;
            if (velYJ2 <= -5) {
                velYJ2 = -5;
                enSueloJ2 = true;
            }
        }

        actualizarPersonajes();
        requestAnimationFrame(loop);
    }
    loop();

    // Teclas presionadas
    document.onkeydown = function(e) {
        // Movimiento J1 (flechas)
        if (e.key === 'ArrowLeft') moviendoIzqJ1 = true;
        if (e.key === 'ArrowRight') moviendoDerJ1 = true;
        // Salto J1 (flecha arriba)
        if (e.key === 'ArrowUp' && enSueloJ1) {
            velYJ1 = fuerzaSalto;
            enSueloJ1 = false;
        }
        // Golpe J1 (tecla "v")
        if (e.key.toLowerCase() === 'v') {
            vidaJ2 = Math.max(0, vidaJ2 - 10);
            actualizarHUD();
        }

        // Movimiento J2 (A/D)
        if (e.key.toLowerCase() === 'a') moviendoIzqJ2 = true;
        if (e.key.toLowerCase() === 'd') moviendoDerJ2 = true;
        // Salto J2 (W)
        if (e.key.toLowerCase() === 'w' && enSueloJ2) {
            velYJ2 = fuerzaSalto;
            enSueloJ2 = false;
        }
        // Golpe J2 (tecla "1")
        if (e.key === '1') {
            vidaJ1 = Math.max(0, vidaJ1 - 10);
            actualizarHUD();
        }
    };

    document.onkeyup = function(e) {
        // Movimiento J1
        if (e.key === 'ArrowLeft') moviendoIzqJ1 = false;
        if (e.key === 'ArrowRight') moviendoDerJ1 = false;
        // Movimiento J2
        if (e.key.toLowerCase() === 'a') moviendoIzqJ2 = false;
        if (e.key.toLowerCase() === 'd') moviendoDerJ2 = false;
    };
}

function crearMenuModo() {
    const app = document.getElementById('app');
    app.innerHTML = '';

    // Estilos
    const style = document.createElement('style');
    style.textContent = `
        #app {
            height: 100vh;
            width: 100vw;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #3a47d5;
        }
        .modo-container {
            display: flex;
            flex-direction: row;
            gap: 120px;
            justify-content: center;
            align-items: center;
            width: 100vw;
            height: 100vh;
        }
        .modo-btn.versus-img {
            padding: 0;
            background: none;
            border: none;
            width: 333px;
            height: 357px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .modo-btn.versus-img img {
            width: 333px;
            height: 357px;
            display: block;
        }
        .modo-btn.coop-btn {
            background: #f52222;
            color: #ffd600;
            font-size: 3rem;
            font-family: Arial, Helvetica, sans-serif;
            border: none;
            width: 333px;
            height: 357px;
            border-radius: 10px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 12px rgba(0,0,0,0.2);
            transition: border 0.2s;
            outline: none;
        }
        .modo-btn.selected {
            outline: 6px solid #ffd600;
        }
    `;
    document.head.appendChild(style);

    // Contenedor de modos
    const modosContainer = document.createElement('div');
    modosContainer.className = 'modo-container';

    // Botón Versus con imagen
    const btnVersus = document.createElement('button');
    btnVersus.className = 'modo-btn versus-img';
    const imgVersus = document.createElement('img');
    imgVersus.src = 'public/assets/interfaz/botvers.jpg';
    imgVersus.alt = 'Versus';
    imgVersus.width = 333;
    imgVersus.height = 357;
    btnVersus.appendChild(imgVersus);

    // Botón Cooperativo (texto)
    const btnCoop = document.createElement('button');
    btnCoop.className = 'modo-btn coop-btn';
    btnCoop.textContent = 'Cooperativo';

    // Eventos para avanzar
    btnVersus.addEventListener('click', crearMenuVersus);
    btnCoop.addEventListener('click', () => {
        alert('Modo Cooperativo seleccionado (implementa el menú de personajes aquí)');
    });

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

    modosContainer.appendChild(btnVersus);
    modosContainer.appendChild(btnCoop);
    app.appendChild(modosContainer);
}

function crearMenuVersus() {
    const app = document.getElementById('app');
    app.innerHTML = '';

    // Personajes de ejemplo
    const personajes = [
        { nombre: 'KANDE', img: 'public/assets/player/player1.jpg' },
        { nombre: 'MAFUYU', img: 'public/assets/player/player2.jpg' },
        { nombre: 'ENA', img: 'public/assets/player/player3.jpg' },
        { nombre: 'MIZUKI', img: 'public/assets/player/player4.jpg' }
    ];

    // Estilos
    const style = document.createElement('style');
    style.textContent = `
        .personajes-container {
            display: flex;
            justify-content: center;
            align-items: flex-end;
            height: 100vh;
            gap: 40px;
            background: #e5eafc;
            position: relative;
        }
        .personaje-card {
            width: 260px;
            height: 500px;
            background: rgba(255,255,255,0.95);
            border: 6px solid transparent;
            border-radius: 24px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.15);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-end;
            position: relative;
            transition: border 0.2s;
            cursor: pointer;
        }
        .personaje-card.selected-p1 {
            border: 6px solid #ffd600;
        }
        .personaje-card.selected-p2 {
            border: 6px solid #42f554;
        }
        .personaje-card.selected-ambos {
            border-width: 6px;
            border-style: solid;
            border-image: linear-gradient(to right, #ffd600 50%, #42f554 50%) 1;
        }
        .personaje-card img {
            width: 220px;
            height: 340px;
            object-fit: cover;
            border-radius: 18px 18px 0 0;
            margin-top: 24px;
        }
        .personaje-nombre {
            font-size: 2.2rem;
            font-family: Arial, Helvetica, sans-serif;
            font-weight: bold;
            color: #2d2d2d;
            margin: 18px 0 10px 0;
            letter-spacing: 2px;
            text-align: center;
        }
        .personaje-sub {
            font-size: 1.1rem;
            color: #555;
            margin-bottom: 18px;
            text-align: center;
        }
        .selector-label {
            position: absolute;
            top: 10px;
            left: 10px;
            font-size: 1.2rem;
            font-weight: bold;
            background: rgba(255,255,255,0.8);
            padding: 4px 12px;
            border-radius: 8px;
            color: #222;
            z-index: 2;
        }
        .selector-label.p1 {
            border: 2px solid #ffd600;
            color: #ffd600;
        }
        .selector-label.p2 {
            border: 2px solid #42f554;
            color: #42f554;
        }
    `;
    document.head.appendChild(style);

    // Estado de selección
    let seleccionadoP1 = 0;
    let seleccionadoP2 = 1;
    let elegidoP1 = null;
    let elegidoP2 = null;

    // Crear tarjetas
    const container = document.createElement('div');
    container.className = 'personajes-container';
    container.style.justifyContent = 'center';

    const cards = personajes.map((p, i) => {
        const card = document.createElement('div');
        card.className = 'personaje-card';
        const img = document.createElement('img');
        img.src = p.img;
        img.alt = p.nombre;
        const nombre = document.createElement('div');
        nombre.className = 'personaje-nombre';
        nombre.textContent = p.nombre;
        const sub = document.createElement('div');
        sub.className = 'personaje-sub';
        sub.textContent = 'Selecciona tu personaje';
        card.appendChild(img);
        card.appendChild(nombre);
        card.appendChild(sub);
        container.appendChild(card);
        return card;
    });

    function actualizarSeleccion() {
        cards.forEach((card, i) => {
            card.classList.remove('selected-p1', 'selected-p2', 'selected-ambos');
            // Etiquetas P1/P2
            let label = card.querySelector('.selector-label');
            if (label) card.removeChild(label);
            if (i === seleccionadoP1 && i === seleccionadoP2) {
                card.classList.add('selected-ambos');
                // P1 label
                const labelP1 = document.createElement('div');
                labelP1.className = 'selector-label p1';
                labelP1.textContent = 'P1';
                card.appendChild(labelP1);
                // P2 label
                const labelP2 = document.createElement('div');
                labelP2.className = 'selector-label p2';
                labelP2.textContent = 'P2';
                labelP2.style.top = '40px';
                card.appendChild(labelP2);
            } else {
                if (i === seleccionadoP1) {
                    card.classList.add('selected-p1');
                    const labelP1 = document.createElement('div');
                    labelP1.className = 'selector-label p1';
                    labelP1.textContent = 'P1';
                    card.appendChild(labelP1);
                }
                if (i === seleccionadoP2) {
                    card.classList.add('selected-p2');
                    const labelP2 = document.createElement('div');
                    labelP2.className = 'selector-label p2';
                    labelP2.textContent = 'P2';
                    card.appendChild(labelP2);
                }
            }
        });
        // Si ambos eligieron, ir al menú de mapas
        if (elegidoP1 !== null && elegidoP2 !== null) {
            setTimeout(crearMenuMapas, 400);
        }
    }
    actualizarSeleccion();

    // Teclado para ambos jugadores
    document.onkeydown = function(e) {
        // Jugador 1 (flechas + enter)
        if (['ArrowRight', 'ArrowLeft', 'Enter'].includes(e.key)) {
            if (e.key === 'ArrowRight') {
                seleccionadoP1 = (seleccionadoP1 + 1) % cards.length;
                actualizarSeleccion();
            }
            if (e.key === 'ArrowLeft') {
                seleccionadoP1 = (seleccionadoP1 - 1 + cards.length) % cards.length;
                actualizarSeleccion();
            }
            if (e.key === 'Enter') {
                elegidoP1 = seleccionadoP1;
                actualizarSeleccion();
            }
        }
        // Jugador 2 (A/D + espacio)
        if (['a', 'd', 'A', 'D', ' '].includes(e.key)) {
            if (e.key.toLowerCase() === 'd') {
                seleccionadoP2 = (seleccionadoP2 + 1) % cards.length;
                actualizarSeleccion();
            }
            if (e.key.toLowerCase() === 'a') {
                seleccionadoP2 = (seleccionadoP2 - 1 + cards.length) % cards.length;
                actualizarSeleccion();
            }
            if (e.key === ' ') {
                elegidoP2 = seleccionadoP2;
                actualizarSeleccion();
            }
        }
    };

    app.appendChild(container);
}

// Carrusel de mapas centrado
function crearMenuMapas() {
    const app = document.getElementById('app');
    app.innerHTML = '';

    // Ejemplo de mapas
    const mapas = [
        { nombre: 'Playa', img: 'public/mapas/playaprov.jpg' },
        { nombre: 'Bosque', img: 'public/mapas/bosque.jpg' },
        { nombre: 'Volcán', img: 'public/mapas/volcan.jpg' }
    ];
    let seleccionado = 0;

    // Estilos
    const style = document.createElement('style');
    style.textContent = `
        .mapa-carrusel-container {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            gap: 40px;
            height: 100vh;
            background: #e5eafc;
            position: relative;
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
            width: 800px;
            height: 400px;
            background: #222;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 8px solid #f52222;
            border-radius: 20px;
            box-sizing: border-box;
            overflow: hidden;
        }
        .mapa-preview img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 12px;
        }
        .jugar-btn {
            position: absolute;
            left: 50%;
            bottom: 32px;
            transform: translateX(-50%);
            font-size: 1.5rem;
            padding: 16px 48px;
            background: #f52222;
            color: #ffd600;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            font-family: Arial, Helvetica, sans-serif;
            box-shadow: 0 2px 12px rgba(0,0,0,0.12);
        }
    `;
    document.head.appendChild(style);

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
        const img = document.createElement('img');
        img.src = mapas[seleccionado].img;
        img.alt = mapas[seleccionado].nombre;
        preview.appendChild(img);
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
        if (e.key === 'ArrowLeft') btnIzq.click();
        if (e.key === 'ArrowRight') btnDer.click();
        if (e.key === ' ' || e.key === 'Enter') jugarBtn.click();
    };

    container.appendChild(btnIzq);
    container.appendChild(preview);
    container.appendChild(btnDer);

    // Botón jugar
    const jugarBtn = document.createElement('button');
    jugarBtn.className = 'jugar-btn';
    jugarBtn.textContent = 'Jugar';
    jugarBtn.onclick = function() {
        iniciarPelea(mapas[seleccionado]);
    };

    app.appendChild(container);
    app.appendChild(jugarBtn);
}

export { crearMenuInicio };