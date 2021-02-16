function factorial(rec: any): (n: number) => number {
  return (n: number) => n === 0 ? 1 : n * rec(rec)(n-1);
}

console.log(factorial(factorial)(5));

function ack(rec: any /*first parameter for self application*/): (m: number, n: number) => number { //curried upto the first parameter
  return (m: number, n: number) => m === 0 ? n + 1 : (n === 0 ? rec(rec)(m-1,1) : rec(rec)(m-1, rec(rec)(m, n-1)));
}

console.log(ack(ack)(3,4));
