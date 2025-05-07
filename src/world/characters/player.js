import { CHARACTER_ASSET_KEYS } from '../../assets/asset-keys.js';
import Phaser from '../../lib/phaser.js';
import { Character } from './character.js';

/**
 * @typedef {Omit<import('./character.js').CharacterConfig, 'assetKey' | 'assetFrame'>} PlayerrConfig

 */

export class Player extends Character {
	/**
	 * @param {PlayerrConfig} config
	 */
	constructor(config) {
		super({ ...config, assetKey: CHARACTER_ASSET_KEYS.PLAYER, assetFrame: 7 });
	}
}
