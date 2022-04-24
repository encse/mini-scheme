; Odd or even

(letrec ( 
    (even?
        (lambda (n)
            (if (zero? n)
                (tell "It is even.")
                (odd? (- n 1)))))
    (odd?
        (lambda (n)
            (if (zero? n)
                (tell "It is odd.")
                (even? (- n 1))))))
    (display (even? (ask "Enter a number"))))
