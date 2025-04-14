var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    input: {
        keyboard: true
    },

    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 40 },
            debug: false
        }
    },
    
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// Variables para touchdown
let debugText;
let minFallVelocity = 200; // Velocidad Y mínima para considerar una caída
let wasFalling = false;
let lastLandingTime = 0;
const landingCooldown = 300; // ms entre animaciones de aterrizaje

let stableGroundTime = 0;
const STABLE_GROUND_THRESHOLD = 100; // ms que debe estar estable en el suelo
let lastVelocityY = 0;

let isLanding = false;
let wasInAir = false;

var game = new Phaser.Game(config);

function preload() {
    this.load.image('sky', 'assets/Clouds1.png');
    this.load.image('ground', 'assets/platform.png');

    //assets cat
    this.load.spritesheet('cat_idle','assets/cat_white_idle.png',{frameWidth:134.8,frameHeight:95});
    this.load.spritesheet('cat_run','assets/cat_white_run.png',{frameWidth:135,frameHeight:95});
    this.load.spritesheet('cat_jump','assets/cat_white_jump.png',{frameWidth:130,frameHeight:95});

    //end asset cat
  

}

let cursors;
let player;
let plataform;

function create() {




    this.add.image(300, 300, 'sky').setScale(2);
 

    plataform = this.physics.add.staticGroup();


    plataform.create(400, 568, 'ground').setScale(2).refreshBody();

    plataform.create(600, 400, 'ground');
    plataform.create(50, 250, 'ground');
    plataform.create(750, 220, 'ground');


    //playes
    player = this.physics.add.sprite(100, 450, 'cat_idle').setScale(0.5);
    player.setCollideWorldBounds(true);


    //animations

    this.anims.create({
        key: 'stay',
        frames: this.anims.generateFrameNumbers('cat_idle', {start: 0, end: 7}),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'run',
        frames: this.anims.generateFrameNumbers('cat_run', {start: 0, end: 3}),
        frameRate: 10,
        repeat: -1,
        onStart: () => console.log("Run anim started"),
        onComplete: () => console.log("Run anim completed")
    });
    this.anims.create({
        key: 'jump',
        frames: this.anims.generateFrameNumbers('cat_jump', { start: 0, end: 2 }),
        frameRate: 95,  
        repeat: 0,
       
    });
    this.anims.create({
        key: 'fall',
        frames: this.anims.generateFrameNumbers('cat_jump', { start: 3, end: 6 }),
        frameRate: 10,  
        repeat: -1
    });
    this.anims.create({
    key: 'touchDown',
    frames: this.anims.generateFrameNumbers('cat_jump', { start: 7, end: 9 }),
    frameRate: 15,
    repeat: 0
});

 
 
    
    this.physics.add.collider(player, plataform);


    //entrada de teclas
    cursors = this.input.keyboard.createCursorKeys();

        // Añade estas propiedades al jugador
    player.isJumping = false;
    player.onFloor = true;

       // DEBUG: Listar todos los textures cargados
       console.log("Textures cargadas:", this.textures.list);

       // Asegurar que el spritesheet existe
       if (!this.textures.exists('cat_jump')) {
           console.error("ERROR: Texture 'cat_jump' no existe");
       } else {
           console.log("Frames en cat_jump:", 
               this.textures.get('cat_jump').frameTotal);
       }

       // hitbox
       const hitboxConfig = {
        width: 30,      // Ancho de la hitbox
        height: 60,     // Alto de la hitbox
        offsetRight: 30, // Offset cuando mira a la derecha
        offsetLeft: 75,  // Offset cuando mira a la izquierda (ajustado)
        offsetY: 35      // Offset vertical (igual para ambas direcciones)
    };
    
    // Configuración inicial
    player.setSize(hitboxConfig.width, hitboxConfig.height);
    player.setOffset(hitboxConfig.offsetRight, hitboxConfig.offsetY);
    player.setOrigin(0.5, 1);  // Punto de pivote en los pies
    
    // Función mejorada para voltear
    player.flipCharacter = function(flip) {
        this.flipX = flip;
        this.body.setOffset(
            flip ? hitboxConfig.offsetLeft : hitboxConfig.offsetRight,
            hitboxConfig.offsetY
        );
    };

 

        // Cambia el tamaño de la hitbox del jugador
     
    player.body.setMaxVelocity(300, 500); // Límites de velocidad
    // En create():
    player.body.setSize(30, 60); // Cambia el tamaño de la hitbox
    player.body.setOffset(30, 35); // Cambia el offset de la hitbox
 // Gravedad más consistente
player.setVelocityX(0);
player.setDragX(500);
player.body.setGravityY(350);


    //debug
    this.physics.world.createDebugGraphic();
    debugText = this.add.text(10, 10, '', { 
        font: '16px Arial', 
        fill: '#ffffff',
        backgroundColor: '#000000'
    }).setScrollFactor(0);
    
    // Tecla para toggle debug (D)
    this.input.keyboard.on('keydown-D', () => {
        debugText.visible = !debugText.visible;
    });

}

player.enAire = false;
function update() {

    updateDebugInfo();//debug

    const isOnFloor = checkStableGround();
    const acceleration = 800;
    const maxSpeed = 300;


  // Detección de caída (velocidad Y positiva = cayendo)
  if (!isOnFloor && player.body.velocity.y > minFallVelocity) {
    wasFalling = true;
}
    // Movimiento horizontal
    if (cursors.left.isDown) {
        player.setAccelerationX(-acceleration);
        player.flipCharacter(true);
    } else if (cursors.right.isDown) {
        player.setAccelerationX(acceleration);
        player.flipCharacter(false);
    } else {
        player.setAccelerationX(0);
        if (Math.abs(player.body.velocity.x) < 5) {
            player.setVelocityX(0);
        }
    }

    // Limite de velocidad
    if (Math.abs(player.body.velocity.x) > maxSpeed) {
        player.setVelocityX(maxSpeed * Math.sign(player.body.velocity.x));
    }

    // Salto
    if (cursors.up.isDown && isOnFloor && !isLanding) {
        player.setVelocityY(-350);
        player.anims.play('jump', true);
        wasInAir = true
    }
    
    // Lógica de animaciones
    if (!isOnFloor) {
        wasInAir = true;
        stableGroundTime = 0;
        if (!isLanding) {
            if (player.body.velocity.y < 0 && player.anims.currentAnim?.key !== 'jump') {
                player.anims.play('jump', true);
            } else if (player.body.velocity.y >= 0 && player.anims.currentAnim?.key !== 'fall') {
                player.anims.play('fall', true);
            }
        }

    } else {
       // Lógica de aterrizaje solo si veníamos de una caída significativa
       if (wasFalling && !isLanding && this.time.now - lastLandingTime > landingCooldown) {
        wasFalling = false;
        isLanding = true;
        lastLandingTime = this.time.now;
        
        player.anims.play('touchDown', true);
        player.once('animationcomplete-touchDown', () => {
            isLanding = false;
            updateIdleRunAnimation();
        });
    }
    // Transición a animaciones terrestres solo si estamos estables
    else if (!isLanding && stableGroundTime > STABLE_GROUND_THRESHOLD) {
        updateIdleRunAnimation();
    }
}
}


function checkStableGround() {
    const currentFloorCheck = player.body.blocked.down || player.body.touching.down;
    
    // Solo consideramos que está en suelo si se mantiene por varios frames
    if (currentFloorCheck) {
        stableGroundTime += this.game.loop.delta;
        if (stableGroundTime > STABLE_GROUND_THRESHOLD) {
            return true;
        }
    } else {
        stableGroundTime = 0;
    }
    
    return false;
}
function updateDebugInfo() {
    const velocityChange = player.body.velocity.y - lastVelocityY;
    lastVelocityY = player.body.velocity.y;
    
    debugText.setText([
        `Debug Mode (D para toggle)`,
        `Velocidad Y: ${player.body.velocity.y.toFixed(1)}`,
        `Cambio Y/frame: ${velocityChange.toFixed(1)}`,
        `Umbral caída: ${minFallVelocity}`,
        `Estado: ${wasFalling ? 'CAYENDO' : (isLanding ? 'ATERRIZANDO' : 
            stableGroundTime > STABLE_GROUND_THRESHOLD ? 'SUELO_FIRME' : 'SUELO_INESTABLE')}`,
        `Tiempo estable: ${stableGroundTime.toFixed(0)}ms`,
        `Animación actual: ${player.anims.currentAnim?.key || 'NINGUNA'}`
    ]);
}
function updateIdleRunAnimation() {
    if (player.body.velocity.x === 0) {
        player.anims.play('stay', true);
    } else {
        player.anims.play('run', true);
    }
}
