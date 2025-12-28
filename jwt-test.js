const jwt = require('jsonwebtoken');

const secret = 'shhhhh';

// Case 1: "15m"
const token1 = jwt.sign({ foo: 'bar' }, secret, { expiresIn: '15m' });
const decoded1 = jwt.decode(token1);
console.log('15m exp:', decoded1.exp - decoded1.iat); // Should be 900 (seconds)

// Case 2: "900000" (String ms)
const token2 = jwt.sign({ foo: 'bar' }, secret, { expiresIn: '900000' });
const decoded2 = jwt.decode(token2);
console.log('900000 (string) exp:', decoded2.exp - decoded2.iat); // Should be 900 (seconds)

// Case 3: 900 (Number seconds)
const token3 = jwt.sign({ foo: 'bar' }, secret, { expiresIn: 900 });
const decoded3 = jwt.decode(token3);
console.log('900 (number) exp:', decoded3.exp - decoded3.iat); // Should be 900 (seconds)
