type Rec<A> = (rec: Rec<A>) => A;

function selfApp<A>(f: (a: () => A) => A): A {
  const selfAppInternal: Rec<A> = (rec: Rec<A>) => f(()=> rec(rec))
  return selfAppInternal(selfAppInternal);
}

let maxNat: (m: number, n: number) => number
  = selfApp(rec => (m, n) => m === 0 ? n :
                             n === 0 ? m : 1 + rec()(m-1,n-1));

let factorial: (n: number) => number
  = selfApp(rec => n => n === 0 ? 1 : n * rec()(n-1));

console.log(maxNat(10,6)); // 10
console.log(factorial(5)); // 120
