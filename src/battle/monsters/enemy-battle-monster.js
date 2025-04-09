import { BattleMonster } from './battle-monster.js';

/** @type {import('../../types/typedef.js').Coordinate} */
const ENEMY_POSITION = Object.freeze({
	x: 768,
	y: 144,
});

export class EnemyBattleMonster extends BattleMonster {
	/**
	 * @param {import('../../types/typedef.js').BattleMonsterConfig} config
	 */
	constructor(config) {
		super({ ...config, scaleHealthBarBgImgByY: 0.8 }, ENEMY_POSITION);
	}
	/**
	 * @param {() => void} callback
	 * @returns {void}
	 */
	playMonsterAppearAnimation(callback) {
		const startXPos = -30;
		const endXPos = ENEMY_POSITION.x;
		this._phaserGameObject.setPosition(startXPos, ENEMY_POSITION.y);
		this._phaserGameObject.setAlpha(1);

		this._scene.tweens.add({
			targets: this._phaserGameObject,
			delay: 0,
			duration: 1600,
			x: {
				from: startXPos,
				start: startXPos,
				to: endXPos,
			},
			onComplete: () => {
				callback();
			},
		});
	}
	/**
	 * @param {() => void} callback
	 * @returns {void}
	 */
	playHealthBarAppearAnimation(callback) {
		const startXPos = -600;
		const endXPos = 0;
		this._phaserHealthBarContainer.setPosition(startXPos, this._phaserHealthBarContainer.y);
		this._phaserHealthBarContainer.setAlpha(1);

		this._scene.tweens.add({
			targets: this._phaserHealthBarContainer,
			delay: 0,
			duration: 1500,
			x: {
				from: startXPos,
				start: startXPos,
				to: endXPos,
			},
			onComplete: () => {
				callback();
			},
		});
	}

	/**
	 * @param {() => void} callback
	 * @returns {void}
	 */
	playDeathAnimation(callback) {
		const startYPos = this._phaserGameObject.y;
		const endYPos = startYPos - 400;

		this._scene.tweens.add({
			targets: this._phaserGameObject,
			delay: 0,
			duration: 2000,
			y: {
				from: startYPos,
				start: startYPos,
				to: endYPos,
			},
			onComplete: () => {
				callback();
			},
		});
	}
}
