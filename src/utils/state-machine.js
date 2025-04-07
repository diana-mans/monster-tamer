/**
 * @typedef State
 * @type {Object}
 * @property {string} name
 * @property {() => void} [onEnter]
 */

export class StateMachine {
	/** @type {Map<string, State>} */
	#states;
	/** @type {State | undefined} */
	#currentState;
	/** @type {string} */
	#id;
	/** @type {Object | undefined} */
	#context;
	/** @type {boolean} */
	#isChangingState;
	/** @type {string[]} */
	#changingStateQueue;

	/**
	 * @param {string} id
	 * @param {Object} [context]
	 */
	constructor(id, context) {
		this.#id = id;
		this.#context = context;
		this.#isChangingState = false;
		this.#changingStateQueue = [];
		this.#currentState = undefined;
		this.#states = new Map();
	}

	/** @type {string | undefined} */
	get currentStateName() {
		return this.#currentState?.name;
	}

	update() {
		//Если есть очередь, то мы убираем первый элемент и ставим это состояние
		if (this.#changingStateQueue.length > 0) {
			this.setState(this.#changingStateQueue.shift());
		}
	}

	/**
	 * @param {string} name
	 */
	setState(name) {
		const methodName = 'setState';

		//Если нет такого состояния в списке, выводим ошибку
		if (!this.#states.has(name)) {
			console.warn(
				`[${StateMachine.name}-${
					this.#id
				}:${methodName}] tried to change to unknown state: ${name}`,
			);
			return;
		}

		//Если новое состояние равно старому, не выполеяем код
		if (this.#isCurrentState(name)) {
			return;
		}

		//Если сейчас происходит изменение состояния, то добавляем в очередь
		if (this.#isChangingState) {
			this.#changingStateQueue.push(name);
			return;
		}

		//Начинаем менять состояние
		this.#isChangingState = true;

		console.log(
			`[${StateMachine.name}-${this.#id}:${methodName}] change from ${
				this.#currentState?.name ?? 'none'
			} to: ${name}`,
		);
		//Меняем состояние на новое
		this.#currentState = this.#states.get(name);

		//Выполняем функцию обратного вызова
		if (this.#currentState.onEnter) {
			this.#currentState.onEnter();
			console.log(
				`[${StateMachine.name}-${this.#id}:${methodName}] ${
					this.#currentState.name
				} on enter invoked`,
			);
		}
		//Заканчиваем менять состояние
		this.#isChangingState = false;
	}

	/**
	 * @param {State} state
	 */
	addState(state) {
		this.#states.set(state.name, {
			name: state.name,
			onEnter: this.#context ? state.onEnter?.bind(this.#context) : state.onEnter,
		});
	}
	/**
	 * @param {string} name
	 */
	#isCurrentState(name) {
		if (!this.#currentState) return false;
		return this.#currentState.name === name;
	}
}
