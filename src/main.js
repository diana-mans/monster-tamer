import Phaser from './lib/phaser.js';
import { BattleScene } from './scenes/battle-scene.js';
import { PreloadScene } from './scenes/preload-scene.js';
import { SCENE_KEYS } from './scenes/scene-keys.js';

const game = new Phaser.Game({
	type: Phaser.CANVAS, // тип контекста, AUTO по умолчанию и он проверяет поддерживается ли webgl. Если нет, то идет использование canvas
	pixelArt: false, // pixelArt true отключает сглаживание и округляет координаты, чтобы не было размытия
	scale: {
		mode: Phaser.Scale.FIT, // Режим масштабирования (fit - игра масштабируется, сохраняя пропорции)
		autoCenter: Phaser.Scale.CENTER_BOTH, //центрирование по вертикали и горизонтали
		parent: 'game-container', //указываем id контейнера, в котором будет автоматически создан canvas
		width: 1024,
		height: 576,
	},
	backgroundColor: '#000',
	// scene: [PreloadScene],
});

game.scene.add(SCENE_KEYS.PRELOAD_SCENE, PreloadScene); //Добавляем сцену, указываем ключ и сам класс
game.scene.add(SCENE_KEYS.BATTLE_SCENE, BattleScene); //Добавляем сцену, указываем ключ и сам класс
game.scene.start(SCENE_KEYS.PRELOAD_SCENE); //Запускаем сцену по ключу (еще можно в super active true чтобы сцена сама запустилась)
