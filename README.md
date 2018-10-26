# Javascript Storage object

### Description

The `/src/storage.js` file contains a simple library object that can be embedded in any client-side javascript project; to store and retrieve data, from either localStorage, sessionStorage or memory.


### Basic usage

Import the `/src/storage.js` file in your project.

```javascript
//Set the desired storage type:
//'local' for localStorage or 'session' for sessionStorage:
storage.setType('local')

//Set a key/value pair:
storage.setItem('myKey', 'myValue')

//Retrieve the stored value for a key:
myValue = storage.getItem('myKey')
```

### Advanced usage

Storage function signatures:
```javascript
// set storage type to be used unless otherwise explicitly specified in
// subsequent calls.
// Define `type`="local" for localStorage
// or `type`="session" for sessionStorage
storage.setType(type)
/*
 * storage functions:
 * `key` (string),
 *  The key string can be 'namespaced': "ns-key".
 * `value` (string or json object).
 *  All values are stored as stringified json.
 * `type` indicates whether to store in "session"Storage (default),
 * "local"Storage or "memory".
 * `exp` is expiration time in milliseconds
 *
 * NOTE: setItem() can throw a QuotaExceededError exception if storage is
 * full. That case should be handled at application level.
 */
storage.setItem(key, value, type, exp)
// retrieve the value for the given key
storage.getItem(key, type)
// retrieve the i-th key in the list of stored keys
storage.getKey(i, type)
// return number of key/value pairs that are stored
storage.getLength(type)
// remove the key/value pair for a given key
storage.removeItem(key, type)
// clear all key/value pairs
// !!! CAREFUL: This clears everything in storage, not just items that
// were set with this app, also anything some other app on the same
// host might have stored!!!
storage.clear(type)
// clear all expired key/value pairs
storage.clearExpired(type)
// clear namespaced key/value pairs
// (only clear keys that start with "ns-")
storage.clearNamespaced(ns, type)

//cookie functionality
storage.setInCookie(key, value, isSession, expHours, domain, path, secure)
storage.getFromCookie(key)
storage.eraseCookie(key)
storage.expireCookie(key, cookieDomain)
```


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
