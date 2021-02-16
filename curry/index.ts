let fibInternal: (c, n, m) => number;

fibInternal = (count: number, fibLastLast: number, fibLast: number): number =>
  count == 0 ? fibLast : fibInternal(count-1, fibLast, fibLastLast+fibLast);

let fibInternalC: (c: number) => (n: number) => (m: number) => number;

fibInternalC = (count: number) => (fibLastLast: number) => (fibLast: number) =>
  count == 0 ? fibLast : fibInternalC(count-1)(fibLast)(fibLastLast+fibLast);

let fibInternalCC: (c: number) => (n: number) => (m: number) => number;

fibInternalCC = (count: number) => count == 0 ?
                (_: number) => (fibLast: number) => fibLast :
                (fibLastLast: number) => (fibLast: number) => fibInternalCC(count-1)(fibLast)(fibLastLast+fibLast); 

console.log(fibInternal(2,0,1));
console.log(fibInternal(3,0,1));
console.log(fibInternal(4,0,1));
console.log(fibInternal(5,0,1));

console.log(fibInternalC(0)(0)(1));
console.log(fibInternalC(1)(0)(1));
console.log(fibInternalC(2)(0)(1));
console.log(fibInternalC(3)(0)(1));
console.log(fibInternalC(4)(0)(1));
console.log(fibInternalC(5)(0)(1));

console.log(fibInternalCC(0)(0)(1));
console.log(fibInternalCC(1)(0)(1));
console.log(fibInternalCC(2)(0)(1));
console.log(fibInternalCC(3)(0)(1));
console.log(fibInternalCC(4)(0)(1));
console.log(fibInternalCC(5)(0)(1));

function curry<R>(args: number, uncurried: (...args: any[]) => R) {
  const _args: any[] = new Array<any>(args);
  let ix: number = 0;
  const helper = (argsCount: number): any =>
    argsCount === 0 ? uncurried(..._args) : (a: any) => {_args[ix++] = a; return helper(--argsCount)};
  return helper(args);
}

console.log(curry(3,fibInternal)(0)(0)(1));
console.log(curry(3,fibInternal)(1)(0)(1));
console.log(curry(3,fibInternal)(2)(0)(1));
console.log(curry(3,fibInternal)(3)(0)(1));
console.log(curry(3,fibInternal)(4)(0)(1));
console.log(curry(3,fibInternal)(5)(0)(1));

function uncurry<R>(args: number, curried: (...args: any[]) => R) {
  return (..._args: any[]) => {
    let ret: R | any = curried;
    let ix = 0;
    while(ix < args) ret = ret(_args[ix++]);
    return ret;
  }
}

console.log(uncurry(3,fibInternalC)(2,0,1));
console.log(uncurry(3,fibInternalC)(3,0,1));
console.log(uncurry(3,fibInternalC)(4,0,1));
console.log(uncurry(3,fibInternalC)(5,0,1));
console.log(uncurry(3,fibInternalC)(5,0,1));

console.log(uncurry(3, curry(3,fibInternal))(2,0,1));
console.log(uncurry(3, curry(3,fibInternal))(3,0,1));
console.log(uncurry(3, curry(3,fibInternal))(4,0,1));
console.log(uncurry(3, curry(3,fibInternal))(5,0,1));
console.log(uncurry(3, curry(3,fibInternal))(5,0,1));
