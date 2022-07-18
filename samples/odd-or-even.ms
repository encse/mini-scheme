; Odd or even

(letrec ( 
    (even?
        (lambda (n)
            (if (zero? n)
                (display num " is even.\n")
                (odd? (- n 1)))))
    (odd?
        (lambda (n)
            (if (zero? n)
                (display num " is odd.\n")
                (even? (- n 1)))))
    (num (ask "Enter a non negative integer:")))
    (even? num))
