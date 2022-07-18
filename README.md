# Mini Scheme
Scheme-like toy programming language written in TypeScript. The project was greatly inspired by the books [The Little Schemer](http://www.amazon.com/The-Little-Schemer-4th-Edition/dp/0262560992) and [The Seasoned Schemer](http://www.amazon.com/The-Seasoned-Schemer-Daniel-Friedman/dp/026256100X/) from Daniel P. Friedman and Matthias Felleisen and especially by the cute illustrations of Duane Bibby. I also liked [SICP](http://www.amazon.com/Structure-Interpretation-Computer-Programs-Engineering/dp/0262510871) when I read it a few years ago, and always wanted to come up with my own functional looking something something. 

The most iteresting part, that actually made me to implement this, was the `call-with-current-continuation` construct or `call/cc` for short (experienced lispers and schemers are now probably banging their heads against the wall because I’m not drawing a clear difference between the two). I just wanted to play with this construct a bit so that I understand it better. Also I haven't written an interpreter that supported anything like that before, so it was the best time to start.

Since a simple interpreter would have been too simple and not very interesting to demo, I also added an editor (built on [ACE](https://ace.c9.io/#nav=about)) and some rudimentary debug functionality.

## Hosted version

You can try it out right now with steering your browser to https://mini-scheme.csokavar.hu/

## Getting Started

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

You can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm run build`

Builds the app for production to the `docs` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.
