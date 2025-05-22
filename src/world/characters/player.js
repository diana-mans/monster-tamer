import { CHARACTER_ASSET_KEYS } from '../../assets/asset-keys.js';
import { DIRECTION } from '../../common/direction.js';
import Phaser from '../../lib/phaser.js';
import { exhaustiveGuard } from '../../utils/guard.js';
import { Character } from './character.js';

/**
 * @typedef {Omit<import('./character.js').CharacterConfig, 'assetKey' | 'idleFrameConfig' | 'origin'>} PlayerrConfig

 */

export class Player extends Character {
	/**
	 * @param {PlayerrConfig} config
	 */
	constructor(config) {
		super({
			...config,
			assetKey: CHARACTER_ASSET_KEYS.PLAYER,
			idleFrameConfig: { DOWN: 7, UP: 1, NONE: 7, LEFT: 10, RIGHT: 4 },
			origin: { x: 0, y: 0.2 },
		});
	}

	/**
	 * @param {import('../../common/direction.js').Direction} direction
	 * @returns {void}
	 */
	moveCharacter(direction) {
		super.moveCharacter(direction);

		switch (this._direction) {
			case DIRECTION.DOWN:
			case DIRECTION.LEFT:
			case DIRECTION.RIGHT:
			case DIRECTION.UP:
				if (
					!this._phaserGameObject.anims.isPlaying ||
					this._phaserGameObject.anims.currentAnim?.key !== `PLAYER_${this.direction}`
				) {
					this._phaserGameObject.play(`PLAYER_${this.direction}`);
				}
				break;
			case DIRECTION.NONE:
				break;
			default:
				exhaustiveGuard(this._direction);
		}
	}
}
