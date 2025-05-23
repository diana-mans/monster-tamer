import Phaser from '../lib/phaser.js';
import { SCENE_KEYS } from './scene-keys.js';
import { WORLD_ASSET_KEYS } from '../assets/asset-keys.js';
import { Player } from '../world/characters/player.js';
import { Controls } from '../utils/controls.js';
import { DIRECTION } from '../common/direction.js';
import { TILE_SIZE } from '../config.js';

/** @type {import('../types/typedef.js').Coordinate} */
const PLAYER_POSITION = Object.freeze({
	x: 6 * TILE_SIZE,
	y: 21 * TILE_SIZE,
});

export class WorldScene extends Phaser.Scene {
	/** @type {Player} */
	#player;
	/** @type {Controls} */
	#controls;

	constructor() {
		super({
			key: SCENE_KEYS.WORLD_SCENE,
		});
	}

	create() {
		console.log(`[${WorldScene.name}:create] invoked`);

		//Ставим границы для камеры, чтобы за пределы не выходило, когда мы перемещаем игрока
		this.cameras.main.setBounds(0, 0, 1280, 2176);
		this.cameras.main.setZoom(0.8);

		this.add.image(0, 0, WORLD_ASSET_KEYS.WORLD_BACKGROUND, 0).setOrigin(0);

		this.#player = new Player({
			scene: this,
			position: PLAYER_POSITION,
			direction: DIRECTION.DOWN,
		});

		//startFollow - делает объект по центру всегда
		this.cameras.main.startFollow(this.#player.sprite);

		this.#controls = new Controls(this);

		this.cameras.main.fadeIn(1000, 0, 0, 0);
	}

	update(time) {
		const selectedDirection = this.#controls.getDirectionKeyJustPressed();
		if (selectedDirection !== DIRECTION.NONE) {
			this.#player.moveCharacter(selectedDirection);
		}
		this.#player.update(time);
	}
}
