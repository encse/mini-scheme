; Factorial 

(define (factorial x)
    (cond
        ((= x 1) 1)
        (else (* x (factorial (- x 1))))))
        
(display (factorial 5))
