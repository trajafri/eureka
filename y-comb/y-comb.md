# Y-Combinator

Say you are told to write a recursive factorial function in a language like TypeScript. You will most probably come up
with something like the program below:

```typescript
function factorial(n: number): number {
  return n === 0 ? 1 : n * factorial(n - 1);
}
```

Pretty easy and obvious, but now you are told to write the same recursive function in a language called TypeScriptNR, a langauge
with same features as TypeScript, but the language does not allow recursion at all. How would you write `factorial` now?

This is basically the problem you run into when you are working with the lambda calculus, and finding a solution to this is actually
pretty cool.

Here's one way to come up with a solution (there are other resources online that explain this approach but I am trying to be
as slow as possible here).

1) First assume that the function we have is correct (we actually know it's correct because `factorial` worked in TypeScript`).
```typescript
function factorial(n: number): number {
  return n === 0 ? 1 : n * factorial(n - 1);
}
```

2) Fix errors so that TypeScriptNR is happy with our `factorial`. The only error we have is the self reference to `factorial`, so we
can make TypeScriptNR by simply adding another parameter called `factorial`.
```typescript
function factorial(factorial: any, n: number): number {
  return n === 0 ? 1 : n * factorial(n - 1);
}
```
(Note: Getting rid of that `any` is whole another beast of a problem which we will look at later)

3) Note that `factorial` now refers to the parameter, not the function, so the function doesn't violate any TypeScriptNR rules so far.
If we can actually pass `factorial` to itself, this functino should be good to go. However, using `factorial` "correctly" reveals another problem:
```typescript
function factorial(factorial: any, n: number): number {
  return n === 0 ? 1 : n * factorial(n - 1); //bad usage
}

console.log(factorial(factorial, 5)) //correct usage
```

our original recursive call didn't require as passing factorial to itself. So, the last step is to make our recursive call "type check"
```typescript
function factorial(factorial: any, n: number): number {
  return n === 0 ? 1 : n * factorial(factorial, n - 1); //bad usage
}

console.log(factorial(factorial, 5)) //correct usage
```

That's it, we have now implemented a recursive `factorial` function without recursion. We can make this more obvious by changing our
parameter name:
```typescript
function factorial(rec: any, n: number): number {
  return n === 0 ? 1 : n * rec(rec, n - 1); //"no references" to `factorial`
}

console.log(factorial(factorial, 5))
```

This seems to work as intended but it's pretty annoying that every time we have to use a recursive function, we need to pass the function
to itself. This pattern will show up for every recursive function written this way. It should be possible to write another function
that just takes care of this self application part for us. Meaning, I should be write some function like `appSelf` that lets me use
`factorial` as shown below:

```typescript
let fact = appSelf(factorial);

console.log(fact(5));
```

Note that we expect `appSelf` to return a version of `factorial` that can be used like the normal `factorial` function. For that, our
`factorial` should be written as shown below:
```typescript
function factorial(rec: any): (n: number) => number {
  return (n: number) => n === 0 ? 1 : n * rec(rec)(n - 1);
}

console.log(factorial(factorial)(5));
```

In general, we are assuming two things to be able to use `appSelf` without making this hard:
1) The self application parameter is always at the same location. In our case, it is always the first parameter. Any other location doesn't make any sense if the TypeScript version of the function is considering 0 arguments (because then all parameters before the self application parameter are useless).
2) The function is curried. If not, then at least curried upto the first parameter so that self-application yields a function expecting rest
of the arguments.

Here's another example of a function that can be used with `selfApp` (don't worry about what the function does):
```typescript
function ack(rec: any /*first parameter for self application*/): (m: number, n: number) => number { //curried upto the first parameter
  return (m: number, n: number) => m === 0 ? n + 1 : (n === 0 ? rec(rec)(m-1,1) : rec(rec)(m-1, rec(rec)(m, n-1)));
}

console.log(ack(ack)(3,4));
```
