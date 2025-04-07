/**
 *
 * @param {never} _value
 */
export function exhaustiveGuard(_value) {
	//Эта функция используется, чтобы проверять учли ли мы все варианты в switch проверке
	throw new Error(
		`Error! Reached forbidden guard function with unexpected value: ${JSON.stringify(_value)}`,
	);
}
