const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var score = 0;
var scoreText;

const game = new Phaser.Game(config);

function preload() {
    // сюда позже будем загружать картинки/звуки
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 });
}

function updateScoreUI(){
    scoreText.setText('Score: ' + score);
}

function create() {
    // выполняется один раз при старте сцены
    this.add.image(400, 300, 'sky');

    // Создает новую группу статической физики 
    // В отличие от динамических тел, статическое тело имеет только положение и размер. На него не действует гравитация, ему нельзя задать скорость, и когда что-то сталкивается с ним, оно не двигается.
    // 
    platforms = this.physics.add.staticGroup();

    // Вызов refreshBody() необходим, потому что мы масштабировали статическое физическое тело, а значит, должны сообщить физическому миру о внесенных изменениях.
    platforms.create(400, 568, 'ground').setScale(2).refreshBody(); 

    platforms.create(600, 400, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 220, 'ground');

    // создание персонажа и добавление анимаций

    player = this.physics.add.sprite(100, 450, 'dude');
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', {start: 0, end: 3}),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn', 
        frames: [ {key: 'dude', frame: 4} ],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    // Скорость тела: мир физики
    player.body.setGravityY(300);

    this.physics.add.collider(player, platforms);

    // Управление игроком с помощью клавы
    cursors = this.input.keyboard.createCursorKeys();

    // Звезды
    stars = this.physics.add.group({
        key: 'star',
        repeat: 11,
        setXY: {x: 12, y: 0, stepX: 70}
    })
    
    this.physics.add.collider(stars, platforms)


    stars.children.iterate(function(child) {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8 ));
    })
    
    // Счет
    scoreText = this.add.text(16, 16, 'score: 0', {
        fontSize: '32px', fill: '#000'
    });
    
    this.physics.add.overlap(player, stars, collectStar, null, this)

    // Бомбы
    bombs = this.physics.add.group();

    this.physics.add.collider(bombs, platforms);
    this.physics.add.collider(bombs, player, hitBomb, null, this);
}

function update(time, delta) {
    // выполняется ~60 раз в секунду — это и есть game loop

    if (cursors.left.isDown) {
        player.setVelocityX(-160);
        player.anims.play('left', true);
    } else if (cursors.right.isDown) {
        player.setVelocityX(160);
        player.anims.play('right', true);
    }
    else {
        player.setVelocityX(0);
        player.anims.play('turn');
    }

    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-530);
    }
}

function collectStar(player, star){
    star.disableBody(true, true)

    score += 10;
    scoreText.setText('Score: ' + score);

    updateScoreUI();
    if (stars.countActive(true) === 0){
        stars.children.iterate(function(child){
            child.enableBody(true, child.x, 0, true, true);
        })
        var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400) ;

        var bomb = bombs.create(x, 16, 'bomb');
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
    }
}

function hitBomb(player, bomb){
    this.physics.pause();
    player.setTint(0xff0000);
    player.anims.play('turn');
    gameOver = true
}