; emulate return with call/cc 
; https://en.wikipedia.org/wiki/Call-with-current-continuation
(define (f return)
	(return 2)
	3)
(display (f (lambda (x) x))) ; displays 3
(display (call-with-current-continuation f)) ; displays 2