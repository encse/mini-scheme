; Emulate return statement with call/cc 
; https://en.wikipedia.org/wiki/Call-with-current-continuation
; As shown by the following example, call/cc can be used to emulate the functionality of the 
; return statement known from C-style languages, which is missing from Scheme:

(define (f return)
	(return 2)
	3)
(display (f (lambda (x) x))) ; displays 3
(newline)
(display (call-with-current-continuation f)) ; displays 2

; Calling f with a regular function argument first applies this function to the value 2, 
; then returns 3. However, when f is passed to call/cc (as in the last line of the example), 
; applying the parameter (the continuation) to 2 forces execution of the program to jump to the
; point where call/cc was called, and causes call/cc to return the value 2. This is then printed 
; by the display function.