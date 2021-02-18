# whY-Combinator

If you are told to write a recursive factorial function in TypeScript, you will come up
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
worked in TypeScript.
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
function maxNatInternal(rec: any /*self application parameter*/):
               (m: number, n: number) => number { //curried upto the first parameter
  return (m: number, n: number) => m === 0 ? n : n === 0 ? m : rec(rec)(m-1,n-1);
}

console.log(maxNatInternal(maxNatInternal)(3,8) === maxNatInternal(maxNatInternal)(8,3)); // true
```

## Implementation:

One very obvious attempt at implementing `selfApp` is the following:
```typescript
function selfApp(f: any) {
  return f(f);
}

const maxNat = selfApp(maxNatInternal);
```
here, `maxNatInternal`'s first parameter is bound to itself (nice), but any further uses of `maxNatInternal` are still expecting us to
self apply (sad).


The following might be another realistic attempt:
```typescript
function selfApp(f: any) {
  return f(f(f));
//           ^
}

const maxNat = selfApp(maxNatInternal);
```
Now, things do work for the first two uses of `maxNatInternal`, but once we get to the `f` pointed out in the code above, we are again
expected to self apply manually.

Since we don't know how many times `maxInternal` will be used, we want all expected uses to be self applied already. That means we
actually need something like the following:
```typescript
function selfApp(f: any) {
  return f(f(f(f(f(...)))));
}
```

or in other words:

```typescript
function selfApp(f: any) {
  return f(selfApp(f));
}
```
This will work, but it very obviously is incorrect for the following reasons:
1. It is recursive (remember that TypeScriptNR does not allow recursion)
2. It doesn't terminate

We can fix the recursive issue exactly how we solved it before:

1. Assume `selfApp` is correct.
2. Fix errors to make TypeScriptNR happy (add a parameter with the same name as the function):
```typescript
function selfApp(rec: any, f: any) {
  return f(rec(f));
}
```
3. Make the recursive call "type check":
```typescript
function selfApp(rec: any, f: any) {
  return f(rec(rec, f));
}
```
This works, however, there is still this incovenience of applying `selfApp` to itself. We can solve this issue by completely internalizing the
self application itself.

```typescript
function selfApp(f: any) {
  const selfAppInternal = (rec: any) => f(rec(rec))
  return selfAppInternal(selfAppInternal);
}
```

This takes care of making `selfApp` recursive.

Now what about it being non-terminating?

If TypeScriptNR was [lazy](https://en.wikipedia.org/wiki/Lazy_evaluation), this would actually not be an issue at this point!
However, we can take inspiration from lazy evaluaion and get this to work by introducing thunks to `selfApp`:
```typescript
function selfApp(f: any) {
  const selfAppInternal = (rec: any) => f(()=> rec(rec))
  return selfAppInternal(selfAppInternal);
}
```

Now, a function's self application parameter is bound to a thunked function. That means, `maxNat` and `factorial` can be defined
in the following manner:

```typescript
const maxNat    = selfApp((rec: any) => (m: number, n: number) => m === 0 ? n : n === 0 ? m : (rec)(m-1,n-1));
const factorial = selfApp((rec: any) => (n: number) => n === 0 ? 1 : n*(rec)(n-1));
```

---

# Y-Combinator

The exercise done above was a way to figure out Haskell Curry's [Y Combinator](https://en.wikipedia.org/wiki/Fixed-point_combinator).

What we called `selfApp` is more commonly just called `Y`. In the lambda calculus, it is defined as follows:

```math
Y = \lambda f. (\lambda x. x x) (\lambda x. f(x x))
```

---

# Typing the Y-Combinator

We made things easy by using the `any` type in multiple places. Figuring out how to make this typecheck is also a fun exercise.

First, let's focus on the "easy to read" definition of `selfApp`:

```typescript
function selfApp(f: any) {
  return f(f(f(f(f(...)))));
}
```

Since `f` is used as a function, we know that `f`'s type is something like `(a: A) => B`. Since `selfApp` whatever invocation of `f` returns,
we know that `selfApp`'s return type is also `B`.

```typescript
function selfApp(f: any): B {
  return f(f(f(f(f(...)))));
}
```
Now notice how `f` is also applied on whatever the invocation of `f` returns. Therefore, we now know that the types `A` and `B` are the same.

This gives us the following type for `selfApp`:
```typescript
function selfApp(f: (a :A) => A): A {
  return f(f(f(f(f(...)))));
}
```
