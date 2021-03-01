# A Curry Recipe

Currying is a cool trick that is often utilized in functional programs. In general, it allows us to reuse functions
a lot more easily than the *uncurried* version (assuming that a programming language makes currying easier, like Haskell).

Note: This text is just to get readers upto speed with the idea behind currying and to keep this repository self contained.
There are better articles if you would like learn about currying in TypeScript, or currying in general.


> [Currying](https://wiki.haskell.org/Currying) is the process of transforming a function that takes multiple arguments
in a tuple as its argument, into a function that takes just a single argument and returns another function which accepts
further arguments, one by one, that the original function would receive in the rest of that tuple. 

In other words, given a TypeScript function of the following uncurried type:

```typescript
(a: A, b: B, c: C, ...) => R
```

The type of a curried version of the same function will be:

```typescript
(a: A) => (b: B) => (c: C) =>  ... => R
```

Note that we don't care what the function is and how currying works, what we really care about is the type.

Example:

```typescript
let fibInternal: (c:number, n: number, m: number) => number;

fibInternal = (count: number, fibLastLast: number, fibLast: number): number => 
  count == 0 ? fibLast : fibInternal(count-1,fibLast, fibLastLast+fibLast);
```

Notice how the uncurried `fibInternal` takes "multiple arguments in a tuple as its argument":

```typescript
(c:number, n: number, m: number) => number
```

The curried version's type (regardless of how we achieve the currying), should like this:

```typescript
(c: number) => ((n: number) => ((m: number) => number))
```

which is equivalent to the easier to read type below:

```typescript
(c: number) => (n: number) => (m: number) => number
```

Here's one way to write a curried `fibInternal`:

```typescript
let fibInternalC1: (c: number) => (n: number) => (m: number) => number;

fibInternalC1 = (count: number) => (fibLastLast: number) => (fibLast: number) =>
  count == 0 ? fibLast : fibInternalC1(count-1)(fibLast)(fibLastLast+fibLast);
```

and here's another:

```typescript
let fibInternalC2: (c: number) => (n: number) => (m: number) => number;

fibInternalC2 = (count: number) => count == 0 ? 
                (_: number) => (fibLast: number) => fibLast : 
                (fibLastLast: number) => (fibLast: number) => fibInternalC2(count-1)(fibLast)(fibLastLast+fibLast);
```

Note that the two curried version of `fibInternal` are not the same function, but they are equivalent in the sense
that when either of them are used, their behavior is always the same. This demonstrates that currying is identified
by simply looking at the type of a function.

That's all there is to currying but a transformation like this raises an important question: Is it always possible to curry a function?

If you read through the wikipedia page, [this](https://en.wikipedia.org/wiki/Currying#Category_theory) complicated snippet basically says that
it is indeed possible to curry any function but not only that, we can also always uncurry a curried function. There's no better way to
demonstrate that by writing two tiny "compilers", one to curry uncurried functions, and the other to uncurry curried functions.

The following is a quick and dirty (maybe even nasty) implementation and does not consider some special cases,
but there are resources online to improve these functions:

```typescript
function curry<R>(args: number, uncurried: (...args: any[]) => R) {
  const _args: any[] = new Array<any>(args);
  let ix: number = 0;
  const helper = (argsCount: number): any =>
    argsCount === 0 ? uncurried(..._args) : (a: any) => {_args[ix++] = a; return helper(--argsCount)};
  return helper(args);
}

function uncurry<R>(args: number, curried: (...args: any[]) => R) {
  return (..._args: any[]) => {
    let ret: R | any = curried;
    let ix = 0;
    while(ix < args) ret = ret(_args[ix++]);
    return ret;
  }
}

```

and now, we can go from `fibInternal` to `fibInternalC1` (or `fibInternalC2`) and vice versa.

```typescript
console.log(fibInternal(5,0,1));             // 8
console.log(curry(3,fibInternal)(5)(0)(1));  // 8

console.log(fibInternalC1(5)(0)(1));         // 8
console.log(uncurry(3,fibInternalC1)(5,0,1));// 8

console.log(uncurry(3, curry(3,fibInternal))(5,0,1)); //curry, then uncurry gives us the same type back
```
