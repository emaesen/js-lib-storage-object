# Javascript Storage object

### Description

The `/src/storage.js` file contains a simple library object that can be embedded in any client-side javascript project; to store and retrieve data, from either localStorage, sessionStorage or memory.



### Tests

```bash
#install devDependencies
npm install

#run the test in a browser interface (to have access to localStorage)
npm run test
```

The test command will run a `live-server` which will open the test result page in your default browser. Updates to either source file (`/src/storage.js`) or test file (`/test/storage.js`) will automatically trigger a re-run of the test suite (live reload).

You may also view the test results in any other local browser at http://127.0.0.1:9000/

(the port number can be configured in the `live-server` call in `package.json`)


*Note: it should be possible to run the tests in a command window (`npm run test:cmd`, using `mock-local-storage`) but I didn't quite get that to work.
The in-browser test is preferred anyway since Storage depends on browser functionality and this allows you to run the test in any target browser.*
