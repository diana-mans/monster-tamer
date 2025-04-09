import { BattleMonster } from './battle-monster.js';

/** @type {import('../../types/typedef.js').Coordinate} */
const PLAYER_POSITION = Object.freeze({
	x: 256,
	y: 316,
});

export class PlayerBattleMonster extends BattleMonster {
	/** @type {Phaser.GameObjects.Text} */
	#healthBarTextGameObject;

	/**
	 * @param {import('../../types/typedef.js').BattleMonsterConfig} config
	 */
	constructor(config) {
		super({ ...config }, PLAYER_POSITION);
		this._phaserGameObject.setFlipX(true);
		this._phaserHealthBarContainer.setPosition(556, 318);
		this.#addHealthBarComponents();
	}

	#setHealthBarText() {
		this.#healthBarTextGameObject.setText(`${this._currentHealth}/${this._maxHealth}`);
	}
	#addHealthBarComponents() {
		this.#healthBarTextGameObject = this._scene.add
			.text(443, 80, '', {
				color: '#7E3D3F',
				fontSize: '16px',
			})
			.setOrigin(1, 0);
		this.#setHealthBarText();
		this._phaserHealthBarContainer.add(this.#healthBarTextGameObject);
	}
	/**
	 *
	 * @param {number} damage
	 * @param {() => void} [callback]
	 */
	takeDamage(damage, callback) {
		super.takeDamage(damage, callback);
		this.#setHealthBarText();
	}
	/**
	 * @param {() => void} callback
	 * @returns {void}
	 */
	playMonsterAppearAnimation(callback) {
		const startXPos = -30;
		const endXPos = PLAYER_POSITION.x;
		this._phaserGameObject.setPosition(startXPos, PLAYER_POSITION.y);
		this._phaserGameObject.setAlpha(1);

		this._scene.tweens.add({
			targets: this._phaserGameObject,
			delay: 0,
			duration: 800,
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
		const startXPos = 800;
		const endXPos = this._phaserHealthBarContainer.x;
		this._phaserHealthBarContainer.setPosition(startXPos, this._phaserHealthBarContainer.y);
		this._phaserHealthBarContainer.setAlpha(1);

		this._scene.tweens.add({
			targets: this._phaserHealthBarContainer,
			delay: 0,
			duration: 800,
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
		const endYPos = startYPos + 400;

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
