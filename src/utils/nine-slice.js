const ASSET_CUT_FRAMES = Object.freeze({
	TL: 'TL',
	TM: 'TM',
	TR: 'TR',
	ML: 'ML',
	MM: 'MM',
	MR: 'MR',
	BL: 'BL',
	BM: 'BM',
	BR: 'BR',
});

/**
 * @typedef NineSliceConfig
 * @type {object}
 * @property {number} cornerCutSize
 * @property {Phaser.Textures.TextureManager} textureManager
 * @property {string} assetKey
 */
export class NineSlice {
	/** @type {number} */
	#cornerCutSize;
	/** @type {string} */
	#assetKey;

	/**
	 * @param {NineSliceConfig} config
	 */
	constructor(config) {
		this.#cornerCutSize = config.cornerCutSize;
		this.#assetKey = config.assetKey;
		this.#createNineSliceTextures(config.textureManager, config.assetKey);
	}

	/**
	 * @param {Phaser.Textures.TextureManager} textureManager
	 * @param {string} assetKey
	 * @returns {void}
	 */
	#createNineSliceTextures(textureManager, assetKey) {
		const texture = textureManager.get(assetKey);
		if (texture.key === '__MISSING') {
			console.warn(
				`[${NineSlice.name}:createNineSliceTextures] the provided texture asset key was not found`,
			);
			return;
		}
		// get the original frame so we can the image dimensions
		if (!texture.frames['__BASE']) {
			console.warn(
				`[${NineSlice.name}:createNineSliceTextures] the provided texture asset key does not have a base texture`,
			);
			return;
		}

		if (texture.getFrameNames(false).length !== 0) {
			console.debug(
				`[${NineSlice.name}:createNineSliceTextures] the provided texture asset key already has additional frames`,
			);
			return;
		}
		/** @type {Phaser.Textures.Frame} */
		const baseFrame = texture.frames['__BASE'];
		console.log(baseFrame.width, baseFrame.height);

		// start in the top left corner for our first cut
		texture.add(ASSET_CUT_FRAMES.TL, 0, 0, 0, this.#cornerCutSize, this.#cornerCutSize);
		// for the middle, we need to calculate the width remaining after we take our two cuts
		texture.add(
			ASSET_CUT_FRAMES.TM,
			0,
			this.#cornerCutSize,
			0,
			baseFrame.width - this.#cornerCutSize * 2,
			this.#cornerCutSize,
		);
		// for the top right side corner we just need to take the total width and remove the cut length
		texture.add(
			ASSET_CUT_FRAMES.TR,
			0,
			baseFrame.width - this.#cornerCutSize,
			0,
			this.#cornerCutSize,
			this.#cornerCutSize,
		);

		// for the middle left, we take the overall image height and subtract the size of the two corner cuts to get new height
		texture.add(
			ASSET_CUT_FRAMES.ML,
			0,
			0,
			this.#cornerCutSize,
			this.#cornerCutSize,
			baseFrame.height - this.#cornerCutSize * 2,
		);
		// for the middle, we need to take the overall image height and width, subtract the two corner cuts to get the new dimensions
		texture.add(
			ASSET_CUT_FRAMES.MM,
			0,
			this.#cornerCutSize,
			this.#cornerCutSize,
			baseFrame.width - this.#cornerCutSize * 2,
			baseFrame.height - this.#cornerCutSize * 2,
		);
		// for the middle right, we need to do similar logic that was done for the middle left piece
		texture.add(
			ASSET_CUT_FRAMES.MR,
			0,
			baseFrame.width - this.#cornerCutSize,
			this.#cornerCutSize,
			this.#cornerCutSize,
			baseFrame.height - this.#cornerCutSize * 2,
		);

		// for the bottom left, we take the overall image height and subtract the corner cut
		texture.add(
			ASSET_CUT_FRAMES.BL,
			0,
			0,
			baseFrame.height - this.#cornerCutSize,
			this.#cornerCutSize,
			this.#cornerCutSize,
		);
		// for the middle and right, we do the same logic we did in th tm and tr frames, just at a lower y value
		texture.add(
			ASSET_CUT_FRAMES.BM,
			0,
			this.#cornerCutSize,
			baseFrame.height - this.#cornerCutSize,
			baseFrame.width - this.#cornerCutSize * 2,
			this.#cornerCutSize,
		);
		texture.add(
			ASSET_CUT_FRAMES.BR,
			0,
			baseFrame.width - this.#cornerCutSize,
			baseFrame.height - this.#cornerCutSize,
			this.#cornerCutSize,
			this.#cornerCutSize,
		);
	}

	/**
	 *
	 * @param {Phaser.Scene} scene
	 * @param {number} targetWidth
	 * @param {number} targetHeight
	 * @returns {Phaser.GameObjects.Container}
	 */
	createNineSliceContainer(scene, targetWidth, targetHeight) {
		const tl = scene.add.image(0, 0, this.#assetKey, ASSET_CUT_FRAMES.TL).setOrigin(0);
		const tm = scene.add
			.image(tl.displayWidth, 0, this.#assetKey, ASSET_CUT_FRAMES.TM)
			.setOrigin(0);
		tm.displayWidth = targetWidth - this.#cornerCutSize * 2;
		const tr = scene.add
			.image(tl.displayWidth + tm.displayWidth, 0, this.#assetKey, ASSET_CUT_FRAMES.TR)
			.setOrigin(0);

		const ml = scene.add
			.image(0, tl.displayHeight, this.#assetKey, ASSET_CUT_FRAMES.ML)
			.setOrigin(0);
		ml.displayHeight = targetHeight - this.#cornerCutSize * 2;
		const mm = scene.add
			.image(ml.displayWidth, ml.y, this.#assetKey, ASSET_CUT_FRAMES.MM)
			.setOrigin(0);
		mm.displayHeight = targetHeight - this.#cornerCutSize * 2;
		mm.displayWidth = targetWidth - this.#cornerCutSize * 2;
		const mr = scene.add
			.image(ml.displayWidth + mm.displayWidth, ml.y, this.#assetKey, ASSET_CUT_FRAMES.MR)
			.setOrigin(0);
		mr.displayHeight = mm.displayHeight;

		const bl = scene.add
			.image(0, tl.displayHeight + ml.displayHeight, this.#assetKey, ASSET_CUT_FRAMES.BL)
			.setOrigin(0);
		const bm = scene.add
			.image(bl.displayWidth, bl.y, this.#assetKey, ASSET_CUT_FRAMES.BM)
			.setOrigin(0);
		bm.displayWidth = tm.displayWidth;
		const br = scene.add
			.image(bl.displayWidth + bm.displayWidth, bl.y, this.#assetKey, ASSET_CUT_FRAMES.BR)
			.setOrigin(0);

		// finally, create a container to group our new game objects together in
		return scene.add.container(0, 0, [tl, tm, tr, ml, mm, mr, bl, bm, br]);
	}
}
