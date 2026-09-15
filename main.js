const mainScene = {
  key: 'MainScene',
  preload: preload,
  create: create,
  update: update,
};

const settingsScene = {
  key: 'SettingsScene',
  create: createSettings,
};

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 700,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  backgroundColor: '#1a1a2e',
  scene: [mainScene, settingsScene],
};

const game = new Phaser.Game(config);

let money = 0;
let totalEarned = 0;
let moneyText;

let button;

let level = 1;
let clickPower = 1;
let upgradeCost = 10;
let upgradeText;
let upgradeButton;

let autoClickPower = 0;
let autoClickLevel = 0;
let autoClickCost = 100;
let autoClickUpgradeText;
let autoClickUpgradeButton;

let soundOffButton;
let soundEnabled;

let timeSinceAutoClick = 0;

let progress = 0;
let progressBarBg;
let progressBarFill;

let settingsButton;

const levelColors = [
  0x0f3460, // уровень 1 — начальный тёмно-синий
  0x16537e, // уровень 2
  0x1b8a8a, // уровень 3
  0x2ecc71, // уровень 4 — зелёный
  0xf1c40f, // уровень 5 — жёлтый
  0xe67e22, // уровень 6 — оранжевый
  0xe74c3c, // уровень 7 — красный
  0x9b59b6, // уровень 8 — фиолетовый
  0xf39c12, // уровень 9
  0xffd700, // уровень 10 — золото
];

const levelThresholds = [
  0, 50, 150, 400, 1000, 2500, 6000, 15000, 35000, 80000,
];

function preload() {
  // сюда позже будем загружать картинки/звуки
  this.load.audio('clickSound', 'assets/20.mp3');
}

function create() {
  // кнопка настройки
  settingsButton = this.add
    .text(750, 30, '⚙', { fontSize: '32px', color: '#fff' })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });

  settingsButton.on('pointerdown', () => {
    this.scene.start('SettingsScene');
    // createSettings();
  });

  // текст с счетом на верху
  moneyText = this.add
    .text(400, 80, '0 ₽', {
      fontSize: '48px',
      color: '#00ff00',
    })
    .setOrigin(0.5);

  // прогресс бар
  progressBarBg = this.add
    .rectangle(400, 180, 300, 20, 0x333333)
    .setOrigin(0.5);
  progressBarFill = this.add
    .rectangle(250, 180, 0, 20, 0x2ecc71)
    .setOrigin(0, 0.5);

  // создаем звук
  clickSound = this.sound.add('clickSound');

  // кнопка-кружок в центре
  button = this.add
    .circle(400, 300, 100, levelColors[0])
    .setInteractive({ useHandCursor: true });

  button.on('pointerdown', () => {
    this.tweens.killTweensOf(button);
    money += clickPower;
    totalEarned += clickPower;
    updateProgressBar();
    checkLevelUp();
    updateUI();

    playClickFeedback(this);
  });

  // текст для описания уровня
  levelText = this.add
    .text(400, 150, `Уровень ${level} ${totalEarned}`, {
      fontSize: '24px',
      color: '#fff',
    })
    .setOrigin(0.5);

  // кнопка Купить
  upgradeButton = this.add
    .rectangle(400, 480, 540, 60, 0x16213e)
    .setInteractive({ useHandCursor: true });

  // текст для описание апгрейда
  upgradeText = this.add
    .text(400, 480, `Купить улучшение за ${upgradeCost} ₽`, {
      fontSize: '24px',
      color: '#fff',
    })
    .setOrigin(0.5);

  // кнопка Купить
  autoClickUpgradeButton = this.add
    .rectangle(400, 560, 540, 60, 0x16219e)
    .setInteractive({ useHandCursor: true });

  soundOffButton = this.add
    .rectangle(80, 560, 60, 60, 0x165123)
    .setInteractive({ useHandCursor: true });

  // текст для автоклика
  autoClickUpgradeText = this.add
    .text(400, 560, `Купить автоклик за ${autoClickCost}`, {
      fontSize: '24px',
      color: '#fff',
    })
    .setOrigin(0.5);

  upgradeButton.on('pointerdown', () => {
    if (money >= upgradeCost) {
      money -= upgradeCost;
      clickPower += 1;
      // level += 1;
      upgradeCost = upgradeCost * 2;
      updateUI();
      // upgradeButtonSkin();
      saveGame();
    }
  });

  autoClickUpgradeButton.on('pointerdown', () => {
    if (money >= autoClickCost) {
      money -= autoClickCost;
      autoClickCost = autoClickCost * 2;
      autoClickLevel += 1;
      autoClickPower += 1;
      updateUI();
      saveGame();
    }
  });

  soundOffButton.on('pointerdown', () => {
    if (!clickSound.mute) {
      clickSound.setMute(true);
    } else {
      clickSound.setMute(false);
    }
  });

  loadGame();
  upgradeButtonSkin();
  updateUI();

  // сохранение при потере фокуса вкладки
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      saveGame();
    }
  });
  // сохранение перед закрытие и перезагрузкой страницы
  window.addEventListener('beforeunload', () => {
    saveGame();
  });
}

function createSettings() {
  this.add
    .text(400, 100, 'Настройки', { fontSize: '36px', color: '#fff' })
    .setOrigin(0.5);

  // переключатель звука
  const soundToggleText = this.add
    .text(400, 250, `Звук: ${soundEnabled ? 'Вкл' : 'Выкл'}`, {
      fontSize: '28px',
      color: '#fff',
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });

  soundToggleText.on('pointerdown', () => {
    soundEnabled = !soundEnabled;
    this.sound.mute = !soundEnabled; // глобальный mute на весь звук игры
    soundToggleText.setText(`Звук: ${soundEnabled ? 'Вкл' : 'Выкл'}`);
    saveGame();
  });

  // кнопка назад
  const backButton = this.add
    .text(400, 500, '← Назад', { fontSize: '24px', color: '#fff' })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });

  backButton.on('pointerdown', () => {
    this.scene.start('MainScene');
  });
}

function update(time, delta) {
  // выполняется ~60 раз в секунду — это и есть game loop

  if (autoClickLevel > 0) {
    timeSinceAutoClick += delta;

    if (timeSinceAutoClick >= 500) {
      money += autoClickPower;
      totalEarned += autoClickPower;
      updateProgressBar();
      checkLevelUp();
      updateUI();
      timeSinceAutoClick = 0;

      playClickFeedback(this);
    }
  }
}

function playClickFeedback(scene) {
  scene.tweens.killTweensOf(button);
  button.setScale(1);
  scene.tweens.add({
    targets: button,
    scale: 0.9,
    duration: 80,
    yoyo: true,
    ease: 'Quad.easeOut',
  });

  clickSound.play();
}

function updateProgressBar() {
  if (level >= levelThresholds.length) {
    progressBarFill.width = 300;
    return;
  }

  const currentThreshold = levelThresholds[level - 1];
  const nextThreshold = levelThresholds[level];

  progress =
    (totalEarned - currentThreshold) / (nextThreshold - currentThreshold);
  progressBarFill.width = 300 * progress;
}

function checkLevelUp() {
  if (level < levelThresholds.length && totalEarned >= levelThresholds[level]) {
    level += 1;
    upgradeButtonSkin();
    saveGame();
  }
}

function upgradeButtonSkin() {
  const colorIndex = Math.min(level - 1, levelColors.length - 1);
  button.setFillStyle(levelColors[colorIndex]);
}

function updateUI() {
  levelText.setText(`Уровень ${level} ${totalEarned}`);
  moneyText.setText(money + ' ₽');
  upgradeText.setText(`Купить улучшение за ${upgradeCost} ₽`);

  autoClickUpgradeText.setText(`Купить автоклик за ${autoClickCost}`);

  progressBarFill.width = 300 * progress;
}

function saveGame() {
  const saveData = {
    money: money,
    totalEarned: totalEarned,
    level: level,
    progress: progress,
    clickPower: clickPower,
    upgradeCost: upgradeCost,

    autoClickPower,
    autoClickLevel,
    autoClickCost,
  };
  localStorage.setItem('codeClickSave', JSON.stringify(saveData));
}

function loadGame() {
  const saved = localStorage.getItem('codeClickSave');
  if (saved) {
    const saveData = JSON.parse(saved);
    money = saveData.money;
    totalEarned = saveData.totalEarned;
    level = saveData.level;
    progress = saveData.progress;
    clickPower = saveData.clickPower;
    upgradeCost = saveData.upgradeCost;

    autoClickPower = saveData.autoClickPower;
    autoClickLevel = saveData.autoClickLevel;
    autoClickCost = saveData.autoClickCost;
  }
}
