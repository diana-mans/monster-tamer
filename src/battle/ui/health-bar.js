import { HEALTH_BAR_ASSET_KEYS } from '../../assets/asset-keys.js';
import Phaser from '../../lib/phaser.js';

export class HealthBar {
	/** @type {Phaser.Scene} */
	#scene;

	/** @type {Phaser.GameObjects.Container} */
	#healthBarContainer;

	/** @type {number} */
	#fullWidth;

	/** @type {number} */
	#scaleY;

	/** @type {Phaser.GameObjects.Image} */
	#middle;
	/** @type {Phaser.GameObjects.Image} */
	#leftCap;
	/** @type {Phaser.GameObjects.Image} */
	#rightCap;

	/** @type {Phaser.GameObjects.Image} */
	#middleShadow;
	/** @type {Phaser.GameObjects.Image} */
	#leftCapShadow;
	/** @type {Phaser.GameObjects.Image} */
	#rightCapShadow;

	/**
	 *
	 * @param {Phaser.Scene} scene the Phaser 3 Scene the battle menu will be added to
	 * @param {number} x
	 * @param {number} y
	 */
	constructor(scene, x, y) {
		this.#scene = scene;
		this.#fullWidth = 360;
		this.#scaleY = 0.7;
		this.#healthBarContainer = this.#scene.add.container(x, y, []);
		this.#createHealthBarShadow(x, y);
		this.#createHealthBarImages(x, y);
		this.#setMeterPrecentage(1);
	}

	/** @type {Phaser.GameObjects.Container} */
	get container() {
		return this.#healthBarContainer;
	}

	/**
	 * @param {number} x the x position to place the health bar game object
	 * @param {number} y the y position to place the health bar game object
	 * @returns {void}
	 */
	#createHealthBarShadow(x, y) {
		this.#leftCapShadow = this.#scene.add
			.image(x, y, HEALTH_BAR_ASSET_KEYS.LEFT_CAP_SHADOW)
			.setOrigin(0, 0.5)
			.setScale(1, this.#scaleY);
		this.#middleShadow = this.#scene.add
			.image(
				this.#leftCapShadow.x + this.#leftCapShadow.width,
				y,
				HEALTH_BAR_ASSET_KEYS.MIDDLE_SHADOW,
			)
			.setOrigin(0, 0.5)
			.setScale(1, this.#scaleY);
		this.#middleShadow.displayWidth = this.#fullWidth;

		this.#rightCapShadow = this.#scene.add
			.image(
				this.#middleShadow.x + this.#middleShadow.displayWidth,
				y,
				HEALTH_BAR_ASSET_KEYS.RIGHT_CAP_SHADOW,
			)
			.setOrigin(0, 0.5)
			.setScale(1, this.#scaleY);

		this.#healthBarContainer.add([this.#leftCapShadow, this.#middleShadow, this.#rightCapShadow]);
	}

	/**
	 * @param {number} x the x position to place the health bar game object
	 * @param {number} y the y position to place the health bar game object
	 * @returns {void}
	 */
	#createHealthBarImages(x, y) {
		this.#leftCap = this.#scene.add
			.image(x, y, HEALTH_BAR_ASSET_KEYS.LEFT_CAP)
			.setOrigin(0, 0.5)
			.setScale(1, this.#scaleY);
		this.#middle = this.#scene.add
			.image(this.#leftCap.x + this.#leftCap.width, y, HEALTH_BAR_ASSET_KEYS.MIDDLE)
			.setOrigin(0, 0.5)
			.setScale(1, this.#scaleY);

		this.#rightCap = this.#scene.add
			.image(this.#middle.x + this.#middle.displayWidth, y, HEALTH_BAR_ASSET_KEYS.RIGHT_CAP)
			.setOrigin(0.1, 0.5)
			.setScale(1, this.#scaleY);

		this.#healthBarContainer.add([this.#leftCap, this.#middle, this.#rightCap]);
	}

	/**
	 * @param {number} [percent=1] a number between 0 and 1 that is used for setting how filled the health bar is
	 */
	#setMeterPrecentage(percent = 1) {
		const width = percent * this.#fullWidth;
		this.#middle.displayWidth = width;

		this.#rightCap.x = this.#middle.x + this.#middle.displayWidth;
	}

	/**
	 * @param {number} [percent=1] a number between 0 and 1 that is used for setting how filled the health bar is
	 * @param {Object} [options]
	 * @param {number} [options.duration=1000]
	 * @param {() => void} [options.callback]
	 */
	setMeterPrecentageAnimated(percent, options) {
		const width = percent * this.#fullWidth;

		this.#scene.tweens.add({
			targets: this.#middle,
			displayWidth: width,
			duration: options?.duration || 1000,
			ease: Phaser.Math.Easing.Sine.Out,
			onUpdate: () => {
				this.#rightCap.x = this.#middle.x + this.#middle.displayWidth;
				const isVisible = this.#middle.displayWidth > 0;
				this.#leftCap.visible = isVisible;
				this.#middle.visible = isVisible;
				this.#rightCap.visible = isVisible;
			},
			onComplete: options?.callback,
		});
	}
}
