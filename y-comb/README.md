# whY-Combinator

If you are told to write a recursive factorial function in TypeScript, you will come up
with something like the program below:

```typescript
function factorial(n: number): number {
  return n === 0 ? 1 : n * factorial(n - 1);
}
```

but suppose now you are told to write the same recursive function in a language called _TypeScriptNR_, a langauge
with same features as TypeScript, but the language does not allow recursion at all. How would you write a recursive `factorial`
function now?

This is basically the problem you run into when you are working with the lambda calculus, and finding a solution to this is
pretty neat.

Here's one way to come up with a solution (there are other resources online that explain this approach but I am trying to be
as slow as possible here).

1. First assume that the function we have is correct (behaves as we want it to). We know it's correct because `factorial`
worked in TypeScript.
2. Fix "errors" so that TypeScriptNR is happy with our `factorial`. The only error we have is the self reference to `factorial`, so we
can make TypeScriptNR happy by simply adding another parameter called `factorial`.

    ```typescript
    function factorial(factorial: any, n: number): number {
      return n === 0 ? 1 : n * factorial(n - 1);
    }
    ```
(Note: Getting rid of that `any` is whole another exercise which we will look at later)

3. Note that `factorial` now refers to the parameter, not the function, so the function doesn't violate any TypeScriptNR rules so far.
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
that just takes care of this self application part for us.
Meaning, I should be able to write some function like `selfApp` that lets me use `factorial` as shown below (or at least close to what
we have below):

```typescript
//pseudo
let fact = selfApp(factorial);

console.log(fact(5));
```

Note that we expect `selfApp` to return a version of `factorial` that can be used like the normal `factorial` function. For that, our
`factorial` should be written as shown below (check [*currying*](https://github.com/trajafri/eureka/blob/main/curry/README.md)):
```typescript
function factorialInternal(rec: any): (n: number) => number {
  return (n: number) => n === 0 ? 1 : n * rec(rec)(n - 1);
}

console.log(factorialInternal(factorialInternal)(5));
```

In general, we are assuming two things to be able to use `selfApp`:

1. The self application parameter is always at the same location. In our case, it is always the first parameter.
Any other location doesn't make sense.
2. The function is curried. If not, then at least curried upto the first parameter so that self-application yields a
function expecting rest of the arguments.

Here's another example of a function that can be used with `selfApp`:
```typescript
function maxNatInternal(rec: any /*self application parameter*/):
               (m: number, n: number) => number { //curried upto the first parameter
  return (m: number, n: number) => m === 0 ? n : n === 0 ? m : 1 + rec(rec)(m-1,n-1);
}

console.log(maxNatInternal(maxNatInternal)(3,8)); // 8
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
//pseudo
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
    //pseudo
    function selfApp(selfApp: any, f: any) {
      return f(selfApp(f));
    }
    ```
3. Make the recursive call "type check":

    ```typescript
    function selfApp(selfApp: any, f: any) {
      return f(selfApp(selfApp, f));
    }
    ```
   This works, however, there is still this incovenience of applying `selfApp` to itself when we actually use it.
   We can solve this issue by completely internalizing the self application itself.

    ```typescript
    function selfApp(f: any) {
      const selfAppInternal: any = (selfApp: any) => f(selfApp(selfApp))
      return selfAppInternal(selfAppInternal);
    }
    ```


This takes care of making `selfApp` recursive.

Now what about it being non-terminating?

If TypeScriptNR was [lazy](https://en.wikipedia.org/wiki/Lazy_evaluation), this would not be an issue at this point!
However, we can take inspiration from lazy evaluaion and get this to work by introducing thunks to `selfApp`:
```typescript
function selfApp(f: any) {
  const selfAppInternal = (selfApp: any) => f(()=> selfApp(selfApp))
  return selfAppInternal(selfAppInternal);
}
```

Now, a function's self application parameter is bound to a thunked function. That means, `maxNat` and `factorial` can be defined
in the following manner:

```typescript
const maxNat    = selfApp((rec: any) =>
  (m: number, n: number) => m === 0 ? n : n === 0 ? m : 1 + rec()(m-1,n-1));
const factorial = selfApp((rec: any) =>
  (n: number) => n === 0 ? 1 : n*rec()(n-1));
```

---

# Y-Combinator

The exercise done above was a way to figure out Haskell Curry's [Y Combinator](https://en.wikipedia.org/wiki/Fixed-point_combinator).

What we called `selfApp` is more commonly just called `Y`.
In a language that looks more like the lambda calculus (like Racket), it is defined as follows:

```racket
(define Y (lambda (f) ((lambda (x) (x x)) (lambda (x) (f (x x))))))
```

---

# Typing the Y-Combinator

We made things easy by using the `any` type in multiple places. Figuring out how to make this typecheck is also a fun exercise.

First, let's focus on the "easy to read" definition of `selfApp`:

```typescript
//pseudo
function selfApp(f: any) {
  return f(f(f(f(f(...)))));
}
```

Since `f` is used as a function, we know that `f`'s type is something like

```typescript
(a: A) => B
```

Since `selfApp` returns whatever the invocation of `f` returns,
we know that `selfApp`'s return type is also `B`.

```typescript
// pseudo
function selfApp<B>(f: any): B {
  return f(f(f(f(f(...)))));
}
```
Now notice how `f` is also applied on whatever the invocation of `f` returns. Therefore, we now know that the types `A` and `B` are the same.

This gives us the following type for `selfApp`:
```typescript
//pseudo
function selfApp<A>(f: (a: A) => A): A {
  return f(f(f(f(f(...)))));
}
```
But in our actual `selfApp`, `f` was applied to a thunked value as shown below:
```typescript
function selfApp(f: any) {
  const selfAppInternal: any = (selfApp: any) => f(()=> selfApp(selfApp))
  return selfAppInternal(selfAppInternal);
}
```

So now, our type is the same as we just figured out except that `f`'s input type is thunked

```typescript
function selfApp<A>(f: (a: () => A) => A): A {
  const selfAppInternal: any = (selfApp: any) => f(()=> selfApp(selfApp))
  return selfAppInternal(selfAppInternal);
}
```
that takes care of `f`'s type, up next are the other two `any` types in `selfApp`

For `selfAppInternal`, we know it's a function with the same return type as `f`, but we need to do some work for its input type.

To make this a bit easier, renaming some identifiers will help.

```typescript
function selfApp<A>(f: (a: () => A) => A): A {
  const selfAppInternal: any = (rec: any) => f(()=> rec(rec))
  return selfAppInternal(selfAppInternal);
}
```

Now, we know `rec` is a function where the output type is same as `f`'s, but its input type is same as itself.
This gives us this interesting type:
```typescript
(rec: ((((... => A) => A) => A) => A)) => A
```
This looks very similar to the very first definition of `selfApp`:
```typescript
//pseudo
function selfApp(f: any): B {
  return f(f(f(f(f(...)))));
}
```
So now that our `selfApp` function is non-recursive, it seems like that recursion has moved up to the type level.
To get our `rec` to type check, we need a recursive type that can represent the `((((... => A) => A) => A) => A)`
pattern we saw above:
```typescript
type Rec<A> = (rec: Rec<A>) => A

```

And finally, our fully typed `selfApp` can now be written as:
```typescript
function selfApp<A>(f: (a: () => A) => A): A {
  const selfAppInternal: Rec<A> = (rec: Rec<A>) => f(()=> rec(rec))
  return selfAppInternal(selfAppInternal);
}
```

with all types figured out, we can now define typed recursive functions using the Y-combinator in the following manner:
```typescript
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
```

---

# Y-Combinator in Haskell

Same thing can be done in Haskell but sadly, type synonyms can't be recursive the way they were in the exercises done above.
So the trick is to use a data type to do what we just did above. Because of this, our `Rec` uses a `newtype` and
`selfApp` does the constructor wrapping/unwrapping where needed.

Since Haskell is lazy, we don't need to worry about thunks any more. Haskell also
curries all functions by default, but to keep the TypeScript and Haskell implementation similar,
I have explicitly made the Haskell implementation more verbose than it should be:

```haskell
newtype Rec a = Rec {unwrap :: (Rec a) -> a}

selfApp :: (a -> a) -> a
selfApp f =
  let selfAppInternal = \rec -> f ((unwrap rec) rec)
  in selfAppInternal (Rec selfAppInternal)

maxNat :: Integer -> Integer -> Integer
maxNat = selfApp(\rec -> \m n -> if m == 0 then n else
                                 if n == 0 then m else succ (rec (m - 1) (n - 1)))

factorial :: Integer -> Integer
factorial = selfApp(\rec -> \n -> if n == 0 then 1 else n * (rec (n - 1)))
```
