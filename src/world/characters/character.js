import { DIRECTION } from '../../common/direction.js';
import Phaser from '../../lib/phaser.js';
import { getTargetPositionFromGameObjectPositionAndDirection } from '../../utils/grid-utils.js';
import { exhaustiveGuard } from '../../utils/guard.js';

/**
 * @typedef CharacterIdleFrameConfig
 * @type {object}
 * @property {number} LEFT
 * @property {number} RIGHT
 * @property {number} UP
 * @property {number} DOWN
 * @property {number} NONE
 */

/**
 * @typedef CharacterConfig
 * @type {object}
 * @property {Phaser.Scene} scene
 * @property {string} assetKey
 * @property {import('../../types/typedef.js').Coordinate} [origin={x:0, y:0}]
 * @property {import('../../types/typedef.js').Coordinate} position
 * @property {import('../../common/direction.js').Direction} direction
 * @property {() => void} [spriteGridMovementFinishedCallback]
 * @property {CharacterIdleFrameConfig} idleFrameConfig
 */

export class Character {
	/** @type {Phaser.Scene} */
	_scene;
	/** @type {Phaser.GameObjects.Sprite} */
	_phaserGameObject;
	/** @type {import('../../common/direction.js').Direction} */
	_direction;
	/** @type {boolean} */
	_isMoving;
	/** @type {import('../../types/typedef.js').Coordinate} */
	_targetPosition;
	/** @type {import('../../types/typedef.js').Coordinate} */
	_previousTargerPosition;
	/** @type {() => void | undefined} */
	_spriteGridMovementFinishedCallback;
	/** @type {CharacterIdleFrameConfig}  */
	_idleFrameConfig;
	/** @type {import('../../types/typedef.js').Coordinate} */
	_origin;

	/**
	 * @param {CharacterConfig} config
	 */
	constructor(config) {
		this._scene = config.scene;
		this._direction = config.direction;
		this._isMoving = false;
		this._targetPosition = { ...config.position };
		this._previousTargerPosition = { ...config.position };
		this._spriteGridMovementFinishedCallback = config.spriteGridMovementFinishedCallback;
		this._idleFrameConfig = config.idleFrameConfig;
		this._origin = config.origin ? { ...config.origin } : { x: 0, y: 0 };

		this._phaserGameObject = this._scene.add
			.sprite(config.position.x, config.position.y, config.assetKey, this._getIdleFrame())
			.setOrigin(this._origin.x, this._origin.y);
	}

	/** @type {boolean} */
	get isMoving() {
		return this._isMoving;
	}

	/** @type {import('../../common/direction.js').Direction} */
	get direction() {
		return this._direction;
	}

	/**
	 * @param {import('../../common/direction.js').Direction} direction
	 * @returns {void}
	 */
	moveCharacter(direction) {
		if (this._isMoving) {
			return;
		}
		this._moveSprite(direction);
	}

	/**
	 *
	 * @param {DOMHighResTimeStamp} time
	 * @returns {void}
	 */
	update(time) {
		if (this.isMoving) {
			return;
		}
		//ищем статичное положение в спрайте
		const idleFrame = this._phaserGameObject.anims.currentAnim?.frames[1].frame.name;
		this._phaserGameObject.anims.stop();
		if (!idleFrame) {
			return;
		}

		//устанавливаем статичный кадр по окончанию анимации
		switch (this._direction) {
			case DIRECTION.DOWN:
			case DIRECTION.LEFT:
			case DIRECTION.RIGHT:
			case DIRECTION.UP:
				this._phaserGameObject.setFrame(idleFrame);
			case DIRECTION.NONE:
				break;
			default:
				exhaustiveGuard(this._direction);
		}
	}

	_getIdleFrame() {
		return this._idleFrameConfig[this._direction];
	}

	/**
	 * @param {import('../../common/direction.js').Direction} direction
	 * @returns {void}
	 */
	_moveSprite(direction) {
		this._direction = direction;
		if (this._isBlockingTile()) return;
		this._isMoving = true;
		this.#handleSpriteMovement();
	}

	_isBlockingTile() {
		if (this._direction === DIRECTION.NONE) return;

		//TODO add in collision logic
		return false;
	}

	#handleSpriteMovement() {
		if (this._direction === DIRECTION.NONE) return;

		const updatedPosition = getTargetPositionFromGameObjectPositionAndDirection(
			this._targetPosition,
			this.direction,
		);
		this._previousTargerPosition = { ...this._targetPosition };
		this._targetPosition.x = updatedPosition.x;
		this._targetPosition.y = updatedPosition.y;

		this._scene.add.tween({
			targets: this._phaserGameObject,
			delay: 0,
			duration: 600,
			y: {
				start: this._phaserGameObject.y,
				from: this._phaserGameObject.y,
				to: this._targetPosition.y,
			},
			x: {
				start: this._phaserGameObject.x,
				from: this._phaserGameObject.x,
				to: this._targetPosition.x,
			},
			onComplete: () => {
				this._isMoving = false;
				this._previousTargerPosition = { ...this._targetPosition };
				if (this._spriteGridMovementFinishedCallback) this._spriteGridMovementFinishedCallback();
			},
		});
	}
}
