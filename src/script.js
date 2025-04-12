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

    //debug
    this.physics.world.createDebugGraphic();
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


}

player.enAire = false;
function update() {
    const isOnFloor = player.body.blocked.down || player.body.touching.down;
    const acceleration = 800;
    const maxSpeed = 300;

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

        if (!isLanding) {
            if (player.body.velocity.y < 0 && player.anims.currentAnim?.key !== 'jump') {
                player.anims.play('jump', true);
            } else if (player.body.velocity.y >= 0 && player.anims.currentAnim?.key !== 'fall') {
                player.anims.play('fall', true);
            }
        }

    } else {
        if (wasInAir) {
            // Acaba de aterrizar
            wasInAir = false;
            isLanding = true;

            if (player.anims.currentAnim?.key !== 'touchDown') {
                player.anims.play('touchDown', true);
            
                player.once('animationcomplete-touchDown', () => {
                    isLanding = false;
            
                    if (player.body.velocity.x === 0) {
                        player.anims.play('stay', true);
                    } else {
                        player.anims.play('run', true);
                    }
                });
            }
            
        } else if (!isLanding) {
      
            if (player.body.velocity.x === 0 && player.anims.currentAnim?.key !== 'stay') {
                player.anims.play('stay', true);
            } else if (player.body.velocity.x !== 0 && player.anims.currentAnim?.key !== 'run') {
                player.anims.play('run', true);
            }
        }
    }
    //player.setDragX(800); // Fricción 
}
