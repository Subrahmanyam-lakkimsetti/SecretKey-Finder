const path = require('path');
const { recoverSecretFromFile } = require('./src/recoverSecret');

const testFiles = ['test1.json', 'test2.json'];
const secretsDir = path.join(__dirname, 'secrets');

testFiles.forEach((filename) => {
  try {
    const filePath = path.join(secretsDir, filename);
    const secret = recoverSecretFromFile(filePath);
    console.log(`${filename}  Secret: ${secret}`);
  } catch (err) {
    console.error(`${filename}  ERROR: ${err.message}`);
  }
});
