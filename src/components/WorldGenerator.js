class WorldGenerator {
    constructor(scene) {
        this.scene = scene;
        
        // Grupo de plataformas
        this.platforms = scene.physics.add.staticGroup();
        
        // Propiedades de generación
        this.lastPlatformX = 0;
        this.generationDistance = 500;  
        this.worldWidth = 5000;
        this.screenWidth = scene.cameras.main.width;
        this.screenHeight = scene.cameras.main.height;
        
        // Configuración de las plataformas
        this.platformConfig = {
            // Distancia mínima horizontal entre el borde derecho de una plataforma y el borde izquierdo de la siguiente
            minGap: 100,  
            // Distancia máxima horizontal entre plataformas (afecta la dificultad de los saltos)
            maxGap: 250,  
            // Altura mínima en la que puede generarse una nueva plataforma (parte superior de la pantalla = 0)
            minY: 350,    
            // Altura máxima en la que puede generarse una nueva plataforma (más cerca del fondo de la pantalla)
            maxY: 400,    
            // Ancho mínimo que puede tener una plataforma (plataformas más cortas son más difíciles)
            minWidth: 100, 
            // Ancho máximo de una plataforma (plataformas grandes son más fáciles)
            maxWidth: 300, 
            // Tipos de plataformas disponibles. Aquí solo hay un tipo: 'ground', pero podrías agregar más tipos (como plataformas móviles, rompibles, etc.)
            types: ['ground']
        };
        
        // Arreglo para almacenar capas de fondo (parallax)
        this.backgroundLayers = [];
        
        // Configurar el mundo físico
        scene.physics.world.setBounds(0, 0, this.worldWidth, this.screenHeight);
    }
    
    // Configuración inicial
    setup() {
        // Crear la plataforma inicial
        this.createInitialPlatforms();
        
        // Configurar el parallax (si se desea)
        this.createParallaxBackground();
    }
    
    // Crea las plataformas iniciales
    createInitialPlatforms() {
        // Crear la plataforma inicial
        const startPlatform = this.platforms.create(200, 568, 'ground');
        startPlatform.setDepth(1); //la plataforma por alguna razon se generaba por debajo del fondo
        // Usa displayWidth/Height pero no setScale
        startPlatform.displayWidth = 520;
        startPlatform.displayHeight = 180;
    
        // Asegúrate de refrescar el cuerpo después de modificar dimensiones
        startPlatform.refreshBody();
    
        this.lastPlatformX = 400;
    }
    
    // Genera una nueva plataforma basada en la última
generateNextPlatform() {
    // Calcular posición
    const gap = Phaser.Math.Between(this.platformConfig.minGap, this.platformConfig.maxGap);
    const platformWidth = Phaser.Math.Between(this.platformConfig.minWidth, this.platformConfig.maxWidth);
    const platformX = this.lastPlatformX + gap + (platformWidth / 2);
    const platformY = Phaser.Math.Between(this.platformConfig.minY, this.platformConfig.maxY);
    
    // Crear plataforma con verificación de existencia
    if (!this.platforms) return null;
    
    const platform = this.platforms.create(platformX, platformY, 'ground');
    if (!platform) return null;
    
    platform.displayWidth = platformWidth;
    platform.displayHeight = 32; // Altura fija
    platform.refreshBody();
    
    // Actualizar posición de la última plataforma
    this.lastPlatformX = platformX + (platformWidth / 2);
    
    // Extender el mundo si es necesario
    if (this.lastPlatformX + 1000 > this.worldWidth) {
        this.extendWorld();
    }
    
    return platform;
}
    // Extiende el tamaño del mundo del juego
    extendWorld() {
        this.worldWidth += 1600;
        this.scene.physics.world.setBounds(0, 0, this.worldWidth, this.screenHeight);
        this.scene.cameras.main.setBounds(0, 0, this.worldWidth, this.screenHeight);
        
        // Extender el fondo si es necesario
        if (this.backgroundLayers.length > 0) {
            this.extendBackground();
        }
    }
    
    // Crea el fondo con efecto parallax
  // Crea el fondo con efecto parallax con 4 capas de profundidad
createParallaxBackground() {
    // Eliminar el fondo existente
    this.scene.children.list.forEach(child => {
        if (child.texture && (child.texture.key === 'sky' || child.texture.key.startsWith('background'))) {
            child.destroy();
        }
    });
    
    // Limpiar el array de capas de fondo
    this.backgroundLayers = [];
    
    // Crear 4 capas de fondo con diferentes velocidades
    // Capa 1: Cielo lejano (movimiento más lento)
    const background1 = this.scene.add.tileSprite(0, 0, this.screenWidth, this.screenHeight, 'background1')
        .setOrigin(0, 0)
        .setScrollFactor(0, 0)
        .setDepth(-10);
    background1.setScale(1.9);
    this.backgroundLayers.push({ sprite: background1, parallaxFactor: 0.01 });
    
    // Capa 2: Montañas lejanas
    // Nota: Asegúrate de tener la textura 'background1' cargada en tu escena
    const background2 = this.scene.add.tileSprite(0, 0, this.screenWidth, this.screenHeight, 'background2')
        .setOrigin(0, 0)
        .setScrollFactor(0, 0)
        .setDepth(-9);
    background2.setScale(1.9);
    this.backgroundLayers.push({ sprite: background2, parallaxFactor: 0.05 });
    
    // Capa 3: Colinas intermedias
    // Nota: Asegúrate de tener la textura 'background2' cargada en tu escena
    const background3 = this.scene.add.tileSprite(0, 0, this.screenWidth, this.screenHeight, 'background3')
        .setOrigin(0, 0)
        .setScrollFactor(0, 0)
        .setDepth(-8);
    background3.setScale(1.9);
    this.backgroundLayers.push({ sprite: background3, parallaxFactor: 0.1 });
    
    // Capa 4: Elementos cercanos (árboles, edificios, etc.)
    // Nota: Asegúrate de tener la textura 'background3' cargada en tu escena
    const background4 = this.scene.add.tileSprite(0, 0, this.screenWidth, this.screenHeight, 'background4')
        .setOrigin(0, 0)
        .setScrollFactor(0, 0)
        .setDepth(-7);
    background4.setScale(1.9);
    this.backgroundLayers.push({ sprite: background4, parallaxFactor: 0.2 });
    
}
    
    // Extiende el fondo cuando crece el mundo
    extendBackground() {
        this.backgroundLayers.forEach(layer => {
            // Expandir la anchura del tileSprite si es necesario
            layer.sprite.width = this.worldWidth;
        });
    }
    
    // Actualiza el sistema de generación (llamar en cada frame)
    update(playerX) {
        // Verificar si el jugador existe y tiene posición válida
        if (!playerX || playerX === undefined) return;
        
        // Generar plataformas si el jugador se acerca al límite
        if (playerX > this.lastPlatformX - this.generationDistance) {
            this.generateNextPlatform();
        }
        
        // Actualizar el parallax solo si hay capas
        if (this.backgroundLayers.length > 0) {
            this.updateParallax();
        }
        
        // Eliminar plataformas fuera de pantalla
        this.recycleOldPlatforms();
    }
    // Actualiza el efecto parallax
  updateParallax() {
    const cameraScrollX = this.scene.cameras.main.scrollX;
    
    this.backgroundLayers.forEach(layer => {
        // Actualiza la posición horizontal basada en el factor de parallax
        layer.sprite.tilePositionX = cameraScrollX * layer.parallaxFactor;
    });
}
    // Elimina plataformas que ya no son visibles
    recycleOldPlatforms() {
        // Crear una copia del array de children para evitar problemas durante la iteración
        const platformsToCheck = this.platforms.getChildren();
        
        platformsToCheck.forEach(platform => {
            if (!platform.body) return; // Si la plataforma ya no tiene cuerpo físico, saltar
            
            // Verificar si está fuera de pantalla (con margen)
            if (platform.x < this.scene.cameras.main.scrollX - 300) {
                // Destruir solo si la plataforma aún existe
                if (platform.active) {
                    platform.destroy();
                }
            }
        });
    }
    // Devuelve el grupo de plataformas para configurar colisiones
    getPlatforms() {
        return this.platforms;
    }
}