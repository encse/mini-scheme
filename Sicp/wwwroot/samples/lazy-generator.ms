; Lazy generator
; https://en.wikipedia.org/wiki/Call-with-current-continuation
; In the following example, call/cc is used twice: 
; once to generate a "return" continuation as in the first example 
; and once to suspend an iteration through a list of items:

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

; Every time the loop is about to process another item from the list, 
; the function grabs the current continuation, and assigns it to the variable 'control-state'. 
; This variable initially is the closure that iterates through all elements of the list. 
; As the computation progresses, it becomes a closure that iterates through a suffix of the given list. 
; While the use of "call/cc" is unnecessary for a linear collection, such as [LISTOF X], the code 
; generalizes to any collection that can be traversed.