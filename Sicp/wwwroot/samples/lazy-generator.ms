; lazy generator
; https://en.wikipedia.org/wiki/Call-with-current-continuation
 (define for-each 
    (lambda (dg lst)
        (cond 
            ((null? lst) ())
            (else 
                (dg (car lst))
                (for-each dg (cdr lst))))
    ))
(define generate-one-element-at-a-time (lambda (lst)
  (define control-state (lambda (return)
    (for-each 
        (lambda (element)
            (set! return (call-with-current-continuation
                (lambda (resume-here)
                   (set! control-state resume-here)
                   (return element)))))
        lst)
    (return 'you-fell-off-the-end)))
  
  (define generator (lambda()
    (call-with-current-continuation control-state)))
 
  generator))
  
  
(define generate-digit
  (generate-one-element-at-a-time '(0 1 2)))
(display 
    (generate-digit)
    (generate-digit)
    (generate-digit)
    (generate-digit))