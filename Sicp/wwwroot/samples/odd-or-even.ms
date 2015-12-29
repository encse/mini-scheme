; Odd or even

(letrec ( 
    (even?
        (lambda (n)
            (if (zero? n)
                #t
                (odd? (- n 1)))))
    (odd?
        (lambda (n)
            (if (zero? n)
                 #f
                (even? (- n 1))))))
    (display (even? 88)))
