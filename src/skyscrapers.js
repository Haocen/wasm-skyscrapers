export default function solvePuzzleVanillaJs (clues) {
  // console.log(clues)
  // console.log(createBaseMatrix(clues))
  const p = hintM(createBaseMatrix(clues), clues);
  if (p.length === 0) {
    throw new Error('ouch, no solution found');
  } else if (p.length >= 2) {
    console.error(new Error('ouch, solution is not unique'));
  }
  return p[0];
}

function cloneMatrix(matrix) {
return matrix.map(row => row.map(h => h));
}

function getArr(matrix, num, isRow) {
const cm = cloneMatrix(matrix);
if (isRow) {
  return cm[num];
} else {
  return cm.map(row => row[num]);
}
}

function setArr(matrix, num, isRow, arr) {
const cm = cloneMatrix(matrix);
if (isRow) {
  arr.forEach(
    (h, i) => {
      cm[num][i] = h;
    }
  );
  return cm;
} else {
  arr.forEach(
    (h, i) => {
      cm[i][num] = h;
    }
  );
  return cm;
}
}

function arrEqual(a, b) {
if (Array.isArray(a) && Array.isArray(b)) {
  if (a.length === b.length) {
    for (let i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }
}
return false;
}

function isComplete(matrix) {
// quicker
return matrix.every(
  (r, i) => getArr(matrix, i, true).indexOf(0) === -1
);
}

function isValidArr(arr) {
const ca = arr.map(h => h);
ca.sort((a, b) => a - b);
return arrEqual(ca, [1, 2, 3, 4]);
}

function isValid(matrix) {
return matrix.every(
  (r, i) => isValidArr(getArr(matrix, i, true))
) &&
  matrix.every(
    (r, i) => isValidArr(getArr(matrix, i, false))
  );
}

function hintH(matrix, x, y) {
const possible = [1, 2, 3, 4];

const row = getArr(matrix, y, true);
const col = getArr(matrix, x, false);

for (const h of [].concat(row, col)) {
  if (possible.indexOf(h) !== -1) {
    possible.splice(possible.indexOf(h), 1);
  }
}

return possible;
}

function calcUnique(possible, { x, y }) {
const uX = possible.reduce(
  (s, p) =>
    x === p.x ? s + 1 : s,
  0
);
const uY = possible.reduce(
  (s, p) =>
    y === p.y ? s + 1 : s,
  0
);
return uX + uY;
}

function findEmpty(matrix) {
const possible = [];

matrix.forEach(
  (r, y) => {
    r.forEach(
      (h, x) => {
        if (h === 0) {
          possible.push({x, y});
        }
      }
    );
  }
);

// we prefer one that is the only empty one in its row & col 
possible.sort(
  (a, b) => {
    return calcUnique(possible, a) - calcUnique(possible, b);
  }
);

return possible;
}

function fillOne(matrix) {
// return an array which has one less empty height than current
const empties = findEmpty(matrix);

if (empties.length === 0) {
  throw new Error('matrix already completed');
} else {
  const { x, y } = empties[0];
  // console.log('=====hinted height===== ')
  // console.log({ x, y })
  // console.log(hintH(matrix, x, y));
  const possibleHeights = hintH(matrix, x, y);
  return possibleHeights.map(
    (h) => {
      const newMatrix = cloneMatrix(matrix);
      newMatrix[y][x] = h;
      // console.log('=====matrix=====')
      // console.log(matrix)
      // console.log(newMatrix)
      return newMatrix;
    }
  );
}
}

function observe(arr) {
let count = 0;
let maxHeight = 0;
for (let h of arr) {
  if (h > maxHeight) {
    count += 1;
    maxHeight = h;
  }
}
return count;
}

/*
function observeAll(matrix) {
let up = [], down = [], left = [], right = [];
for (let i = 0; i < matrix.length; ++i) {
  left.push(observe(getArr(matrix, i, true)));
  right.push(observe(getArr(matrix, i, true).reverse()));
}
for (let j = 0; j < matrix[0].length; ++j) {
  up.push(observe(getArr(matrix, j, false)));
  down.push(observe(getArr(matrix, j, false).reverse()));
}
return [].concat(up, right, down, left);
}
*/

function observeAll(matrix) {
let up = [], down = [], left = [], right = [];
for (let i = 0; i < matrix[0].length; ++i) {
  const row = getArr(matrix, i, true);
  if (row.indexOf(0) === -1) {
    left.push(observe(getArr(matrix, i, true)));
    right.push(observe(getArr(matrix, i, true).reverse()));
  } else {
    left.push(0);
    right.push(0);
  }
}
for (let j = 0; j < matrix.length; ++j) {
  const col = getArr(matrix, j, false);
  if (col.indexOf(0) === -1) {
    up.push(observe(getArr(matrix, j, false)));
    down.push(observe(getArr(matrix, j, false).reverse()));
  } else {
    up.push(0);
    down.push(0);
  }
}
return [].concat(up, right, down.reverse(), left.reverse());
}

// key point: if 4 , must be 1234, if 1, must be 4xxx
// TODO more hints for performance

function createBaseMatrix(clues) {
let up = clues.slice(0, 4);
let right = clues.slice(4, 8);
let down = clues.slice(8, 12).reverse();
let left = clues.slice(12, 16).reverse();

let m = [
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0]
];

up.forEach(
  (h, i) => {
    if (h === 4) {
      m = setArr(m, i, false, [1, 2, 3, 4]);
    }
    if (h === 1) {
      m = setArr(m, i, false, [4, 0, 0, 0]);
    }
  }
);

down.forEach(
  (h, i) => {
    if (h === 4) {
      m = setArr(m, i, false, [4, 3, 2, 1]);
    }
    if (h === 1) {
      m = setArr(m, i, false, [0, 0, 0, 4]);
    }
  }
);

left.forEach(
  (h, i) => {
    if (h === 4) {
      m = setArr(m, i, true, [1, 2, 3, 4]);
    }
    if (h === 1) {
      m = setArr(m, i, true, [4, 0, 0, 0]);
    }
  }
);

right.forEach(
  (h, i) => {
    if (h === 4) {
      m = setArr(m, i, true, [4, 3, 2, 1]);
    }
    if (h === 1) {
      m = setArr(m, i, true, [0, 0, 0, 4]);
    }
  }
);

return m;
};

function hintM(matrix, observed) {
let possible = [matrix];
let mIndex = null;
while (true) {
  // console.log(possible.length)
  mIndex = possible.findIndex(m => !isComplete(m));
  if (mIndex === -1) {
    // console.log('=====all complete=====')
    // console.log(possible)
    break;
  }
  let m = possible[mIndex];
  // console.log(m)
  possible.splice(mIndex, 1);
  possible = possible.concat(fillOne(m));
  // cut branch early if violation is found
  possible = possible.filter(
    (p) => isMatchObserved(p, observed)
  );
}

return possible;
}

function isMatchObserved(partialMatrix, observed) {
const currentObserved = observeAll(partialMatrix);
// console.log(observed)
for (let i = 0; i < currentObserved.length && i < observed.length; ++i) {
  if (currentObserved[i] !== 0 &&
    observed[i] !== 0 &&
    currentObserved[i] != observed[i]) {
    return false;
  }
}
return true;
}


const example = [
  [2, 1, 4, 3],
  [3, 4, 1, 2],
  [4, 2, 3, 1],
  [1, 3, 2, 4]
];

/*
console.log(isValid(example))

console.log(isComplete(example))

console.log(observeAll(example))

const hm = createBaseMatrix(observeAll(example));

console.log(hm)

console.log(findEmpty(hm))

console.log(isComplete(hm))
*/

// const o = observeAll(example);

// console.log(o)

// console.log(hintM([ [ 0, 0, 0, 0 ], [ 0, 0, 0, 0 ], [ 0, 0, 0, 0 ], [ 0, 0, 0, 0 ] ], o))
