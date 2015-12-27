; Yin-yang puzzle
; https://en.wikipedia.org/wiki/Call-with-current-continuation
; In 1999, David Madore (the inventor of Unlambda programming language) found 
; a 12 characters term in Unlambda that have the same effect (write all integers 
; in unary form) of an over 600 characters term with an operation equivalent to call/cc.

; When converting this term into Scheme he obtained a scheme program that 
; known as the yin-yang puzzle.It was then being customary to show while discussing call/cc:

(let* ((yin
         ((lambda (cc) (display "#\@") cc) (call-with-current-continuation (lambda (c) c))))
       (yang
         ((lambda (cc) (display "#\*") cc) (call-with-current-continuation (lambda (c) c)))))
	            (yin yang))