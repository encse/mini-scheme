; Tower of Hanoi

(define (tower-of-hanoi n source dest temp)
  (if (= n 1)
      (begin 
        (display "Move the disk from " source " to " dest)
		(newline))
      (begin 
        (tower-of-hanoi (- n 1) source temp dest)
		(display "Move the disk from " source " to " dest)
		(newline)
        (tower-of-hanoi (- n 1) temp dest source))))

(tower-of-hanoi (ask "Number of disks? [1-10]") "source" "dest" "temp")
