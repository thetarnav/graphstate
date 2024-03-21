/**
 * '"' -> '\\"'
 * @param {string} str
 * @returns {string} */
function escape_quotes(str) {
	return str.replace(escape_quotes_regex, '\\"')
}
const escape_quotes_regex = /"/g

/** @typedef {string } String */
/** @typedef {string } ID */
/** @typedef {number } Int */
/** @typedef {number } Float */
/** @typedef {boolean} Boolean */
