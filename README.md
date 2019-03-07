# kruda.js
Fast data pipeline in the browser.  
This is a derivative work of [BigDataParser](https://github.com/darionco/BigDataParser) by [Dario Segura](https://github.com/darionco)
  
**WARNING:** This is pre-release software under active development.


### Running the example.
- Run `yarn install`
- [Download airport data (Airports2.csv)](https://www.kaggle.com/flashgordon/usa-airport-dataset/version/2)
- Convert `Airports2.csv` to the `.ds.bin` format and place it in the `www/data` folder by running `node ./src/DSBIN/node/generateDSBIN.js /path/to/Airports2.csv ./www/data/flight_routes.ds.bin` (change `/path/to/Airports2.csv` to the location where you stored the `Airports2.csv` file).
- Run `yarn start`
- In Chrome ([must be chrome for now](https://caniuse.com/#feat=sharedarraybuffer)) navigate to `localhost:8090`
- See the example run

### Usage
- `www/index.html` has a working example you can look at.
- Look at the [documentation](https://unchartedsoftware.github.io/kruda.js/) 

### Debugging
Unfortunately many error checks must be disabled for the sake of performance, `if` statements are very expensive!  
You can re-enable them by changing the flag `DEBUG` in the `webpack.config.js` file:
```
{
    test: /\.js$/,
    loader: 'ifdef-loader',
    options: {
        DEBUG: false, // <<<<<< CHANGE THIS LINE TO `true`
        PRODUCTION: isProduction,
        USE_SHARED_MEMORY: true,
        BROWSER: isBrowser,
    },
    exclude: /node_modules/,
},
``` 
