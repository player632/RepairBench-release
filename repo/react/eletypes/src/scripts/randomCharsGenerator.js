const generateRandomInt = (min = 0, max = 1, rng) => {
  const rand = rng ? rng() : Math.random();
  return Math.floor(rand * (max - min + 1)) + min;
}

const numArray = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
const symbolArray = ["!", "\"", "#", "$", "%", "&", "'", "(", ")", "-", "=", "^", "~", "\\", "|", "@", "`", "[", "{", ";", "+", ":", "*", "]", "}", ",", "<", ".", ">", "/", "?", "_"]

const generateRandomChars = (charArray, min = 1, max = 1, rng) => {
  const charsLen = generateRandomInt(min, max, rng)
  return [...Array(charsLen)].reduce(
    (accum) => accum + charArray[generateRandomInt(0, charArray.length - 1, rng)],
    ""
  )
}
const generateRandomNumChras = (min, max, rng) => generateRandomChars(numArray, min, max, rng)
const generateRandomSymbolChras = (min, max, rng) => generateRandomChars(symbolArray, min, max, rng)

export { generateRandomNumChras, generateRandomSymbolChras }
