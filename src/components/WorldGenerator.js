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
            maxY: 500,    
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
        startPlatform.displayWidth = 400;
        startPlatform.displayHeight = 64;
    
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
    createParallaxBackground() {
        // Eliminar el fondo existente
        this.scene.children.list.forEach(child => {
            if (child.texture && child.texture.key === 'sky') {
                child.destroy();
            }
        });
        
        // Crear capas de fondo con diferentes velocidades
        const skyFar = this.scene.add.tileSprite(0, 0, this.screenWidth, this.screenHeight, 'sky')
            .setOrigin(0, 0)
            .setScrollFactor(0, 0);
            skyFar.setScale(1.9); // Escalar el fondo para que ocupe toda la pantalla
        
        this.backgroundLayers.push({ sprite: skyFar, parallaxFactor: 0.1 });
        
        // Puedes añadir más capas de fondo con diferentes texturas y factores
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
        this.backgroundLayers.forEach(layer => {
            layer.sprite.tilePositionX = this.scene.cameras.main.scrollX * layer.parallaxFactor;
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