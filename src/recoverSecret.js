const fs = require('fs');
const path = require('path');

function decodeShareValue(valueStr, base) {
  const radix = parseInt(base);
  if (isNaN(radix) || radix < 2 || radix > 36) {
    throw new Error(`Invalid base: ${base}`);
  }
  return BigInt(parseInt(valueStr, radix));
}

function interpolateAtZero(points) {
  let result = BigInt(0);

  for (let i = 0; i < points.length; i++) {
    const [xi, yi] = points[i];
    let numerator = BigInt(1);
    let denominator = BigInt(1);

    for (let j = 0; j < points.length; j++) {
      if (i === j) continue;
      const [xj] = points[j];
      numerator *= -BigInt(xj);
      denominator *= BigInt(xi - xj);
    }

    result += yi * (numerator / denominator);
  }

  return result;
}

function getCombinations(arr, k) {
  const results = [];

  function helper(start, combo) {
    if (combo.length === k) {
      results.push([...combo]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      helper(i + 1, combo);
      combo.pop();
    }
  }

  helper(0, []);
  return results;
}

function recoverSecretFromFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw);

  if (!data.keys || typeof data.keys.k !== 'number') {
    throw new Error(`Invalid or missing keys in ${filePath}`);
  }

  const { k } = data.keys;

  const allPoints = Object.entries(data)
    .filter(([key]) => key !== 'keys')
    .map(([x, { value, base }]) => {
      if (value === undefined || base === undefined) {
        throw new Error(`Missing value/base for point x=${x} in ${filePath}`);
      }
      return [parseInt(x), decodeShareValue(value, base)];
    });

  const totalPoints = allPoints.length;

  if (totalPoints < 2) {
    throw new Error(`Not enough valid points in ${filePath}`);
  }

  const minK = Math.min(k, totalPoints);

  const secretsMap = new Map();


  for (let size = minK; size <= totalPoints; size++) {
    const combinations = getCombinations(allPoints, size);

    for (const subset of combinations) {
      try {
        const secret = interpolateAtZero(subset).toString();
        secretsMap.set(secret, (secretsMap.get(secret) || 0) + 1);
      } catch (_) {}
    }

    if (secretsMap.size > 0) break;
  }

  if (secretsMap.size === 0) {
    throw new Error(`No valid secret combinations found for ${filePath}`);
  }

  const mostFrequentSecret = [...secretsMap.entries()].reduce((a, b) =>
    a[1] >= b[1] ? a : b
  )[0];

  return mostFrequentSecret;
}

module.exports = { recoverSecretFromFile };
