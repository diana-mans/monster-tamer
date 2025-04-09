import { BATTLE_ASSET_KEYS } from '../../assets/asset-keys.js';
import Phaser from '../../lib/phaser.js';
import { DataUtils } from '../../utils/data-utils.js';
import { HealthBar } from '../ui/health-bar.js';

export class BattleMonster {
	/** @type {Phaser.Scene} */
	_scene;
	/** @type {import('../../types/typedef.js').Monster} */
	_monsterDetails;

	/** @type {Phaser.GameObjects.Image} */
	_phaserGameObject;

	/** @type {HealthBar} */
	_healthBar;
	/** @type {number} */
	_currentHealth;
	/** @type {number} */
	_maxHealth;
	/** @type {import('../../types/typedef.js').Attack[]} */
	_monsterAttacks;
	/** @type {Phaser.GameObjects.Container} */
	_phaserHealthBarContainer;

	/**
	 * @param {import('../../types/typedef.js').BattleMonsterConfig} config
	 * @param {import('../../types/typedef.js').Coordinate} position
	 */
	constructor(config, position) {
		this._scene = config.scene;
		this._monsterDetails = config.monsterDetails;
		this._currentHealth = config.monsterDetails.currentHp;
		this._maxHealth = config.monsterDetails.maxHp;
		this._monsterAttacks = [];

		this._phaserGameObject = this._scene.add
			.image(
				position.x,
				position.y,
				this._monsterDetails.assetKey,
				this._monsterDetails.assetFrame || 0,
			)
			.setAlpha(0);

		this.#createHealthBarComponents(config.scaleHealthBarBgImgByY);

		this._monsterDetails.attackIds.forEach((attackId) => {
			const monsterAttack = DataUtils.getMonsterAttack(this._scene, attackId);
			if (monsterAttack !== undefined) {
				this._monsterAttacks = [...this._monsterAttacks, monsterAttack];
			}
		});
	}

	/** @type {boolean} */
	get isFainted() {
		return this._currentHealth <= 0;
	}

	/** @type {string} */
	get name() {
		return this._monsterDetails.name;
	}

	/** @type {import('../../types/typedef.js').Attack[]} */
	get attacks() {
		return [...this._monsterAttacks];
	}

	/** @type {number} */
	get baseAttack() {
		return this._monsterDetails.baseAttack;
	}

	/** @type {number} */
	get level() {
		return this._monsterDetails.currentLevel;
	}

	/**
	 * @param {number} damage
	 * @param {() => void} [callback]
	 */
	takeDamage(damage, callback) {
		this._currentHealth -= damage;
		if (this._currentHealth < 0) {
			this._currentHealth = 0;
		}
		this._healthBar.setMeterPrecentageAnimated(this._currentHealth / this._maxHealth, { callback });
	}

	/**
	 * @param {() => void} callback
	 * @returns {void}
	 */
	playMonsterAppearAnimation(callback) {
		throw new Error('playMonsterAppearAnimation is not implemented');
	}
	/**
	 * @param {() => void} callback
	 * @returns {void}
	 */
	playHealthBarAppearAnimation(callback) {
		throw new Error('playHealthBarAppearAnimation is not implemented');
	}

	/**
	 * @param {() => void} callback
	 * @returns {void}
	 */
	playTakeDamageAnimation(callback) {
		this._scene.tweens.add({
			targets: this._phaserGameObject,
			delay: 0,
			duration: 150,
			alpha: {
				from: 1,
				start: 1,
				to: 0,
			},
			repeat: 10,
			onComplete: () => {
				this._phaserGameObject.setAlpha(1);
				callback();
			},
		});
	}

	/**
	 * @param {() => void} callback
	 * @returns {void}
	 */
	playDeathAnimation(callback) {
		throw new Error('playDeathAnimation is not implemented');
	}

	/**
	 * @param {number} [scaleHealthBarBgImgByY=1]
	 */
	#createHealthBarComponents(scaleHealthBarBgImgByY) {
		this._healthBar = new HealthBar(this._scene, 34, 34);

		const monsterNameGameText = this._scene.add.text(30, 20, this.name, {
			color: '#7E3D3F',
			fontSize: '32px',
		});

		const healthBarBgImage = this._scene.add
			.image(0, 0, BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND)
			.setOrigin(0)
			.setScale(1, scaleHealthBarBgImgByY);

		const monsterHealthBarLevelText = this._scene.add.text(
			monsterNameGameText.width + 35,
			23,
			`L${this.level}`,
			{
				color: '#ED474B',
				fontSize: '28px',
			},
		);
		const monsterHpText = this._scene.add.text(30, 55, 'HP', {
			color: '#FF6505',
			fontSize: '24px',
			fontStyle: 'italic',
		});

		this._phaserHealthBarContainer = this._scene.add
			.container(0, 0, [
				healthBarBgImage,
				monsterNameGameText,
				this._healthBar.container,
				monsterHealthBarLevelText,
				monsterHpText,
			])
			.setAlpha(0);
	}
}
