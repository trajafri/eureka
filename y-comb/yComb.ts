function factorial(rec: any): (n: number) => number {
  return (n: number) => n === 0 ? 1 : n * rec(rec)(n-1);
}

console.log(factorial(factorial)(5));

function maxNat(rec: any /*self application arg*/):
               (m: number, n: number) => number { //curried upto the first parameter
  return (m: number, n: number) => m === 0 ? n : n === 0 ? m : rec(rec)(m-1,n-1);
}

console.log(maxNat(maxNat)(3,8) === maxNat(maxNat)(8,3)); // true
