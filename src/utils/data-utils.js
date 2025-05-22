import Phaser from '../lib/phaser.js';
import { DATA_ASSET_KEYS } from '../assets/asset-keys.js';

export class DataUtils {
	/**
	 * Utility function for retrieving an Attack object from the attack.json data file
	 * @param {Phaser.Scene} scene The Phaser 3 Scene to get cached JSON file from
	 * @param {number} attackId The id of the attact to retrieve from the attack.json file
	 * @returns {import('../types/typedef.js').Attack | undefined}
	 */

	static getMonsterAttack(scene, attackId) {
		/** @type {import('../types/typedef.js').Attack[]} */
		const data = scene.cache.json.get(DATA_ASSET_KEYS.ATTACKS);
		return data.find((attack) => {
			return attack.id === attackId;
		});
	}

	/**
	 * Utility function for retrieving an Animations objects from the animations.json data file
	 * @param {Phaser.Scene} scene The Phaser 3 Scene to get cached JSON file from
	 * @returns {import('../types/typedef.js').Animation[]}
	 */
	static getAnimations(scene) {
		/** @type {import('../types/typedef.js').Animation[]} */
		const data = scene.cache.json.get(DATA_ASSET_KEYS.ANIMATIONS);
		return data;
	}
}
