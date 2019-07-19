# Mini Scheme
My implementation of a Scheme like toy programming language written in TypeScript. The project was greatly inspired by the books [The Little Schemer](http://www.amazon.com/The-Little-Schemer-4th-Edition/dp/0262560992) and [The Seasoned Schemer](http://www.amazon.com/The-Seasoned-Schemer-Daniel-Friedman/dp/026256100X/) from Daniel P. Friedman and Matthias Felleisen and especially by the cute illustrations of Duane Bibby. I also liked [SICP](http://www.amazon.com/Structure-Interpretation-Computer-Programs-Engineering/dp/0262510871) when I read it a few years ago, and always wanted to come up with my own functional looking something something. 

The most iteresting part, that actually made me to implement this was the `call-with-current-continuation` construct or `call/cc` for short (experienced Lispers and Schemers are now probably banging their heads against the wall because I’m not drawing a clear difference between the two). I just wanted to play with this construction a bit so that I understand it better. Also I haven't written an interpreter that supported anything like that before, so it was the best time to start.

Since a simple interpreter would have been too simple and not very interesting to demo, I also added an editor (built on [ACE](https://ace.c9.io/#nav=about)) and some very limited debugging functionality.

<img src="https://cloud.githubusercontent.com/assets/6275775/12012500/afe644b6-acf8-11e5-85d4-af9ff01135db.jpg" width="45%"></img> 

The project is hosted on [csokavar.hu](https://csokavar.hu/projects/mini-scheme).

# License
See the [LICENSE](LICENSE.md) file for license rights and limitations (MIT).
