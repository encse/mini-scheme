; 8-queens
; How many ways can we place eight chess queens on an 8×8 chessboard so that no two queens threaten each other?

(define (add1 n)
    (+ n 1))
    
(define (sub1 n)
    (- n 1))

(define (legal? try legal-pl)
    (letrec
        ((good?
          (lambda (new-pl up down)
            (cond
              ((null? new-pl) #t)
              (else (let ((next-pos (car new-pl)))
                      (and
                       (not (= next-pos try))
                       (not (= next-pos up))
                       (not (= next-pos down))
                       (good? (cdr new-pl)
                              (add1 up)
                              (sub1 down)))))))))
      (good? legal-pl (add1 try) (sub1 try))))

(define (solution? legal-pl boardsize)
      (= (length legal-pl) boardsize))

(define (build-solution legal-pl boardsize)
    (cond
      ((solution? legal-pl boardsize) legal-pl)
      (else (forward boardsize legal-pl boardsize))))

(define (forward try legal-pl boardsize)
    (cond
      ((zero? try) (backtrack legal-pl boardsize))
      ((legal? try legal-pl) (build-solution (cons try legal-pl) boardsize))
      (else (forward (sub1 try) legal-pl boardsize))))

(define (backtrack legal-pl boardsize)
    (cond
      ((null? legal-pl) '())
      (else (forward (sub1 (car legal-pl)) (cdr legal-pl) boardsize))))

(define (build-all-solutions boardsize)
    (letrec
        ((loop (lambda (sol)
                 (cond
                   ((null? sol) '())
                   (else (begin 
                        (display sol "\n")
                        (cons sol (loop (backtrack sol boardsize)))))))))
      (loop (build-solution '() boardsize))))

(define (queens n)
    (display "Valid positions for " n " queens:\n")
    (build-all-solutions n))
    
(queens 8)
