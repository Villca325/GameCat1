Mi primer proyecto con phaser

### Diagrama de Flujo General:
```
BootScene (precarga) → MenuScene → GameScene → [Player + WorldGenerator]
```

### 1. BootScene.js - Fase de Precarga
**Flujo**:
1. Precarga todos los assets (imágenes/spritesheets)
2. Muestra una barra de progreso
3. Cuando todo está cargado:
   ```javascript
   this.scene.start('MenuScene');
   ```

### 2. MenuScene.js - Menú Principal
**Flujo**:
1. Muestra fondo, título y botón "COMENZAR"
2. Espera interacción (click o tecla):
   ```javascript
   this.scene.start('GameScene');
   ```

### 3. GameScene.js - Nivel Principal
**Flujo en create()**:
```javascript
1. Crea WorldGenerator
   → Genera plataformas iniciales (1 fija después procedurales)
   → Configura límites del mundo

2. Crea Player
   → Configura física, animaciones y controles

3. Configura cámara:
   → Sigue al jugador con suavidad
   → Establece límites del mundo

4. Establece colisiones:
   this.physics.add.collider(player.sprite, worldGenerator.platforms)
```

**Flujo en update()** (60 veces/segundo):
```javascript
1. Actualiza jugador (Player.update()):
   → Control de movimiento
   → Lógica de salto
   → Gestión de animaciones

2. Actualiza WorldGenerator:
   → Genera nuevas plataformas cuando el jugador avanza
   → Elimina plataformas fuera de pantalla
   → Extiende el mundo si es necesario(no se elimina el mundo que queda atras, ineficiente)

3. Actualiza puntuación:
   → Basada en distancia recorrida (es el eje -250)

4. Verifica Game Over:
   → Si el jugador cae (posición <=599)
```

### 4. Player.js - Lógica del Jugador
**Flujo en update()**:
```javascript
1. Verifica colisión con suelo:
   this.checkStableGround()

2. Procesa inputs:
   → Movimiento horizontal (aceleración/deceleración)
   → Salto (solo si está en suelo)

3. Gestiona animaciones:
   → idle, run, jump, fall, landing
   → Transiciones suaves entre estados

4. Actualiza hitbox:
   → Ajusta offset al voltearse
```

### 5. WorldGenerator.js - Generación de Plataformas
**Flujo clave**:
```javascript
1. createInitialPlatforms():
   → Plataforma inicial ancha (400px) en (200, 568)
   → 5 plataformas procedurales con:
      - Gap: 100-250px
      - Ancho: 100-300px
      - Altura: 150-550px

2. generateNextPlatform():
   → Genera cuando jugador está a <800px del borde
   → Usa Phaser.Math.Between() para variedad

3. recycleOldPlatforms():
   → Elimina plataformas que quedan atrás
   → Evita acumulación de objetos
```

### Flujo de Generación de Plataformas:
```
Jugador avanza → 
WorldGenerator.checkDistance() → 
Si (distancia < umbral): 
   Genera nueva plataforma →
   Actualiza lastPlatformX →
   Si (necesita más mundo): 
      Extiende límites
```

### Flujo de Colisiones:
```
Physics Engine (Arcade) →
Detecta solapamiento jugador-plataforma →
Aplica gravedad y restricciones →
Player.checkStableGround() verifica si está "firmemente" en suelo
```

