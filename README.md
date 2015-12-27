# Mini Scheme
My toy implementation of a Scheme like programming language written in TypeScript. This project was greatly inspired by the books [The Little Schemer](http://www.amazon.com/The-Little-Schemer-4th-Edition/dp/0262560992) and [The Seasoned Schemer](http://www.amazon.com/The-Seasoned-Schemer-Daniel-Friedman/dp/026256100X/) from Daniel P. Friedman and Matthias Felleisen and especially by its cute illustrations from Duane Bibby. I also liked [SICP](http://www.amazon.com/Structure-Interpretation-Computer-Programs-Engineering/dp/0262510871) when I read it a few years ago, and always wanted to come up with my own functional looking something something. 

The most iteresting part, that actually made me to implement this was the `call-with-current-continuation` construct or `call/cc` for short (experienced Lispers and Schemers are now probably banging their heads agains the wall because of me not drawing a clear difference between the two). I just wanted to play with this construct a bit so that I understand it better. Also I haven't written an interpreter that supported anything like that before, so it was the best time to start.

Since a simple interpreter would have been too simple and not very interesting to demo, I also added an editor (built on ACE) and some very limited debugging functionality.

The project is hosted on [csokavar.hu](http://csokavar.hu/projects/mini-scheme).

# License
See the [LICENSE](LICENSE.md) file for license rights and limitations (MIT).
