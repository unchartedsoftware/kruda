# kruda.js
Fast data pipeline in the browser.  
This is a derivative work of [BigDataParser](https://github.com/darionco/BigDataParser) by [Dario Segura](https://github.com/darionco)
  
**WARNING:** This is pre-release software under active development.


### Running the example.
- Run `yarn install`
- [Download airport data (Airports2.csv)](https://www.kaggle.com/flashgordon/usa-airport-dataset/version/2)
- Run `node ./src/DSBIN/node/generateDSBIN.js /path/to/Airports2.csv ./www/data/flight_routes.ds.bin` (change `/path/to/Airports2.csv` to the location where you stored the `Airports2.csv` file) to convert `Airports2.csv` to the `.ds.bin` format. 
- Run `yarn start`
- In Chrome ([must be chrome for now](https://caniuse.com/#feat=sharedarraybuffer)) navigate to `localhost:8090`
    - The example will allocate a 2GB memory heap
    - Load the generated flight routes `ds.bin` file (~3.6 million rows)
    - Apply a filter to it where:
        - The origin airport code equals `SEA`  
        and
        - The number of passengers equals `110`  
        and
        - The destination airport code is not equal to `LAX`
    - OR:
        - The origin airport code equals `MCO`  
        and
        - The number of passengers is more than `180`  
        and
        - The number of passengers is less than `200`  
        and
        - The flight date contains `2001`
- On a laptop running a 4th gen 2.5GHz intel i7 quad core processor:
    - Allocating 2GB of memory takes ~1242ms
    - Loading the `ds.bin` file (~38MB, ~500MB uncompressed) takes ~861ms
    - Filtering all ~3.6 million rows with the rules above takes ~115ms
    - Filtering all ~3.6 million rows with a filter that returns every single row takes ~462ms  

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
