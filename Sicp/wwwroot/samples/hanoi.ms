; Hanoi towers

(define (towers-of-hanoi n source dest temp)
  (if (= n 1)
      (begin 
        (display "Move the disk from " source " to " dest)
		(newline))
      (begin 
        (towers-of-hanoi (- n 1) source temp dest)
		(display "Move the disk from " source " to " dest)
		(newline)
        (towers-of-hanoi (- n 1) temp dest source))))

(towers-of-hanoi 3 "source" "dest" "temp")