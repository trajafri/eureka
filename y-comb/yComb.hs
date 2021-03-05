newtype Rec a = Rec {unwrap :: (Rec a) -> a}

selfApp :: (a -> a) -> a
selfApp f =
  let selfAppInternal = \rec -> f ((unwrap rec) rec)
  in selfAppInternal (Rec selfAppInternal)

maxNat :: Integer -> Integer -> Integer
maxNat = selfApp(\rec -> \m n -> if m == 0 then n else
                                 if n == 0 then m else 1 + (rec (m - 1) (n - 1)))

factorial :: Integer -> Integer
factorial = selfApp(\rec -> \n -> if n == 0 then 1 else n * (rec (n - 1)))
