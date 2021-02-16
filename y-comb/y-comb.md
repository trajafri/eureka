# Y-Combinator

If you are told to write a recursive factorial function in a language like TypeScript, you will come up
with something like the program below:

```typescript
function factorial(n: number): number {
  return n === 0 ? 1 : n * factorial(n - 1);
}
```

but suppose now you are told to write the same recursive function in a language called _TypeScriptNR_, a langauge
with same features as TypeScript, but the language does not allow recursion at all. How would you write `factorial` now?

This is basically the problem you run into when you are working with the lambda calculus, and finding a solution to this is
pretty neat.

Here's one way to come up with a solution (there are other resources online that explain this approach but I am trying to be
as slow as possible here).

1) First assume that the function we have is correct (behaves as we want it to). We know it's correct because `factorial`
worked in TypeScript`.
```typescript
function factorial(n: number): number {
  return n === 0 ? 1 : n * factorial(n - 1);
}
```

2) Fix "errors" so that TypeScriptNR is happy with our `factorial`. The only error we have is the self reference to `factorial`, so we
can make TypeScriptNR happy by simply adding another parameter called `factorial`.
```typescript
function factorial(factorial: any, n: number): number {
  return n === 0 ? 1 : n * factorial(n - 1);
}
```
(Note: Getting rid of that `any` is whole another beast of a problem which we will look at later)

3) Note that `factorial` now refers to the parameter, not the function, so the function doesn't violate any TypeScriptNR rules so far.
If we pass `factorial` to itself, this function should be good to go. However, using `factorial` "correctly" reveals another problem:
```typescript
function factorial(factorial: any, n: number): number {
  return n === 0 ? 1 : n * factorial(n - 1); //bad usage
}

console.log(factorial(factorial, 5)) //correct usage
```

our original recursive call didn't require us passing `factorial` to itself. So, the last step is to make our recursive call "type check"
```typescript
function factorial(factorial: any, n: number): number {
  return n === 0 ? 1 : n * factorial(factorial, n - 1); //bad usage is good now
}

console.log(factorial(factorial, 5)) //correct usage
```

That's it, we have now implemented a recursive `factorial` function without recursion. We can make this more obvious by changing our
self referential parameter's name to `rec`:
```typescript
function factorial(rec: any, n: number): number {
  return n === 0 ? 1 : n * rec(rec, n - 1); //"no references" to `factorial` here
}

console.log(factorial(factorial, 5))
```

This seems to work as intended but it's pretty annoying that every time we have to use a recursive function, we need to pass the function
to itself. This pattern will show up for every recursive function written this way. It should be possible to write another function
that just takes care of this self application part for us and make this easy for our users.
Meaning, I should be able to write some function like `selfApp` that lets me use `factorial` as shown below (or at least close to what
we have below):

```typescript
let fact = selfApp(factorial);

console.log(fact(5));
```

Note that we expect `selfApp` to return a version of `factorial` that can be used like the normal `factorial` function. For that, our
`factorial` should be written as shown below (check *currying*):
```typescript
function factorial(rec: any): (n: number) => number {
  return (n: number) => n === 0 ? 1 : n * rec(rec)(n - 1);
}

console.log(factorial(factorial)(5));
```

In general, we are assuming two things to be able to use `selfApp`:
1) The self application parameter is always at the same location. In our case, it is always the first parameter.
Any other location doesn't make sense (not every function has non-zero number of arguments).
2) The function is curried. If not, then at least curried upto the first parameter so that self-application yields a
function expecting rest of the arguments.

Here's another example of a function that can be used with `selfApp`:
```typescript
function maxNat(rec: any /*self application parameter*/):
               (m: number, n: number) => number { //curried upto the first parameter
  return (m: number, n: number) => m === 0 ? n : n === 0 ? m : rec(rec)(m-1,n-1);
}

console.log(maxNat(maxNat)(3,8) === maxNat(maxNat)(8,3)); // true
```
