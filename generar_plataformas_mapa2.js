// PLATAFORMAS PARA MAPA 2 - Generadas desde mapa2.JSON capa "suelo"
// Basado en mapa de 30x20 tiles, cada tile = 32x32px

// Nota: En el mapa JSON, fila 0 = arriba, pero en Phaser Y aumenta hacia abajo
// Entonces usamos las coordenadas directamente

const tileSize = 32;

// Función auxiliar para convertir tiles a píxeles
function tilesToPlatform(startCol, endCol, row) {
    const numTiles = endCol - startCol + 1;
    const centerCol = (startCol + endCol) / 2;
    return {
        x: Math.round(centerCol * tileSize + tileSize / 2),
        y: Math.round(row * tileSize + tileSize / 2),
        w: numTiles * tileSize,
        h: tileSize
    };
}

// Lista de plataformas identificadas:
const mapa2Platforms = [
    // PLATAFORMA SUPERIOR DERECHA (fila 3, col 21) - individual
    tilesToPlatform(21, 21, 3),  // { x: 696, y: 112, w: 32, h: 32 }
    
    // PLATAFORMA FLOTANTE PEQUEÑA (fila 4, cols 20-21)
    tilesToPlatform(20, 21, 4),  // { x: 664, y: 144, w: 64, h: 32 }
    
    // PLATAFORMAS FLOTANTES FILA 5
    tilesToPlatform(7, 7, 5),    // { x: 232, y: 176, w: 32, h: 32 }
    tilesToPlatform(10, 10, 5),  // { x: 328, y: 176, w: 32, h: 32 }
    tilesToPlatform(15, 15, 5),  // { x: 488, y: 176, w: 32, h: 32 }
    tilesToPlatform(18, 20, 5),  // { x: 616, y: 176, w: 96, h: 32 }
    
    // PLATAFORMA GRANDE FILA 6 (cols 7-14 aprox, con algunos huecos)
    // Dividida en segmentos sólidos
    tilesToPlatform(7, 10, 6),   // Segmento izquierdo
    tilesToPlatform(11, 14, 6),  // Segmento derecho
    tilesToPlatform(15, 17, 6),  // Segmento más a la derecha
    
    // PLATAFORMA DERECHA ALTA (fila 7, cols 21-27)
    tilesToPlatform(21, 27, 7),  // { x: 776, y: 240, w: 224, h: 32 }
    
    // PLATAFORMA PEQUEÑA (fila 8, cols 19-22)
    tilesToPlatform(19, 22, 8),  // { x: 664, y: 272, w: 128, h: 32 }
    
    // PLATAFORMAS FILA 9
    tilesToPlatform(0, 3, 9),    // Izquierda (pared)
    tilesToPlatform(10, 14, 9),  // Centro
    tilesToPlatform(20, 21, 9),  // Derecha
    
    // PLATAFORMAS FILA 10
    tilesToPlatform(0, 3, 10),   // Izquierda (pared)
    tilesToPlatform(5, 8, 10),   // Centro-izquierda
    tilesToPlatform(17, 20, 10), // Derecha
    
    // PLATAFORMAS FILA 11
    tilesToPlatform(0, 3, 11),   // Izquierda (pared)
    tilesToPlatform(8, 9, 11),   // Centro
    tilesToPlatform(17, 18, 11), // Derecha
    
    // PLATAFORMA CENTRAL LARGA (fila 12, cols 7-17)
    tilesToPlatform(7, 17, 12),  // { x: 392, y: 400, w: 352, h: 32 }
    
    // PARED IZQUIERDA Y SUELO (filas 13-19, cols 0-3)
    tilesToPlatform(0, 3, 13),
    tilesToPlatform(0, 3, 14),
    tilesToPlatform(0, 3, 15),
    tilesToPlatform(0, 3, 16),
    tilesToPlatform(0, 3, 17),
    tilesToPlatform(0, 3, 18),
    tilesToPlatform(0, 3, 19),
    
    // COLUMNAS Y PLATAFORMA DERECHA (filas 14-16)
    tilesToPlatform(14, 15, 14), // Columnas
    tilesToPlatform(14, 15, 15), // Columnas
    tilesToPlatform(14, 19, 16), // Plataforma derecha
];

console.log('Total de plataformas:', mapa2Platforms.length);
console.log('\nEjemplo de código para game.js:');
console.log('if (mapName === "Mapa 2") {');
mapa2Platforms.forEach((p, i) => {
    console.log(`    this._platformData.push({ x: ${p.x}, y: ${p.y}, w: ${p.w}, h: ${p.h} }); // Plataforma ${i + 1}`);
});
console.log('}');
