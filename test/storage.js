/* test/storage.js */


describe('Storage Object', function() {

	// SETUP
	before(function(){
		console.log("----------------------------------------------------------");
		console.log("------->> start storage tests");
		localStorage.clear();
		sessionStorage.clear();
	});
	// TEARDOWN
	after(function(){
		localStorage.clear();
		sessionStorage.clear();
		console.log("------->> end storage tests");
		console.log("----------------------------------------------------------");
		console.log(" ");
	});
	var key1 = "key1";
	var key2 = "key 2";
	var key3 = "key3";
	var key4 = "key 4";
	var nskey = "myNameSpace:myKey";
	var expkey = "expiringKey";

	var value1 = 'double-quoted "string"';
	var value2 = "single-quoted 'string'";
	var value3 = {foo: "bar"};
	var value4 = {name1: value1, name2: value2, name3: value3};
	var value5 = "edit #1";
	var value6 = "edit #2";
	var nsvalue = "my namespaced value";
	var expvalue = "my expiring value";

	it('should use safe key names', function() {
		expect(storage._getKeyName(' aa  b c')).to.equal('aabc');
	});

	describe('should support local storage', function() {

		it('should set data in local storage by key', function() {

			// housekeeping, make sure we start with a clean slate
			storage.clearLocal();

			storage.setLocalItem(key1, value1);
			storage.setLocalItem(key2, value2);
			storage.setLocalItem(key3, value3);
			storage.setLocalItem(key4, value4);
			// Inspect localStorage directly.
			// Data is stored somewhat cryptic so check the actual expected value.
			expect(localStorage.getItem(storage._getKeyName(key1)).indexOf('^^_data_^^:^^double-quoted \\^^string\\^^^^')).to.equal(1);
			expect(localStorage.getItem(storage._getKeyName(key2)).indexOf('^^_data_^^:^^single-quoted \'string\'^^')).to.equal(1);
			expect(localStorage.getItem(storage._getKeyName(key3)).indexOf('^^_data_^^:{^^foo^^:^^bar^^}')).to.equal(1);
			expect(localStorage.getItem(storage._getKeyName(key4)).indexOf('^^_data_^^:{^^name1^^:^^double-quoted \\^^string\\^^^^,^^name2^^:^^single-quoted \'string\'^^,^^name3^^:{^^foo^^:^^bar^^}}')).to.equal(1);
		});

		it('should get data from local storage by key', function() {
			// now use the object's API and we should get back what we put in
			expect(storage.getLocalItem(key1)).to.equal(value1);
			expect(storage.getLocalItem(key2)).to.equal(value2);
			expect(storage.getLocalItem(key3)).to.deep.equal(value3);
			expect(storage.getLocalItem(key4)).to.deep.equal(value4);
		});

		it('should get key from local storage by index', function() {
			expect(storage.getLocalKey(0)).to.equal(storage._getKeyName(key1));
			expect(storage.getLocalKey(1)).to.equal(storage._getKeyName(key2));
			expect(storage.getLocalKey(2)).to.equal(storage._getKeyName(key3));
			expect(storage.getLocalKey(3)).to.equal(storage._getKeyName(key4));
		});

		it('should get number of stored items from local storage', function() {
			expect(storage.getLocalLength()).to.equal(4);
		});

		it('should time-stamp data in local storage', function() {
			// Inspect localStorage directly, it should have a _ts_ property with
			// a 13-digit timestamp.
			expect(localStorage.getItem(key1).search(/\^\^_ts_\^\^:\d{13}/) !== -1).to.equal(true);
		});

		it('should remove data from local storage by key', function() {
			// remove one item and check localStorage directly to see that
			// it is gone and check the Storage object to see that the number
			// of stored items is reduced
			storage.removeLocalItem(key1);
			expect(localStorage.getItem(storage._getKeyName(key1))).to.equal(null);
			expect(storage.getLocalItem(key1)).to.equal(null);
			expect(storage.getLocalLength()).to.equal(3);
			// remove one more item
			storage.removeLocalItem(key3);
			expect(localStorage.getItem(storage._getKeyName(key3))).to.equal(null);
			expect(storage.getLocalItem(key3)).to.equal(null);
			expect(storage.getLocalLength()).to.equal(2);
		});

		it('should be able to namespace data in local storage', function() {
			storage.setLocalItem(nskey, nsvalue);
			expect(storage.getLocalItem(nskey)).to.equal(nsvalue);
		});

		it('should get data from local storage by key unless it has expired, and should remove an expired item', function() {
			var exp = 60 * 1000;
			storage.setLocalItem(expkey, expvalue, exp);
			var storedObj = JSON.parse(localStorage.getItem(expkey).replace(/\^\^/g, '\"'));
			// verify that the _exp_ time is set to the timestamp time at moment of
			// storage plus the exp setting.
			expect(storedObj._exp_ - storedObj._ts_).to.equal(exp);
			// verify we can access it if it is not yet expired
			expect(storage.getLocalItem(expkey)).to.equal(expvalue);

			// now reset the expvalue and expire it immediatly
			exp = -1;
			storage.setLocalItem(expkey, expvalue, exp);
			// store current number of stored items so we can compare later
			var nrItems = storage.getLocalLength();
			// inspect internal variables (this is not ideal in a test case since
			// it should be possible to change internals without breaking tests...)
			storedObj = JSON.parse(localStorage.getItem(expkey).replace(/\^\^/g, '\"'));
			expect(storedObj._exp_ - storedObj._ts_).to.equal(exp);
			// now we should get null back if we try to access it again
			expect(storage.getLocalItem(expkey)).to.equal(null);
			// and it has been removed from storage
			expect(storage.getLocalLength()).to.equal(nrItems - 1);
		});

		it('should be able to clear expired data only', function() {
			// add a key/value pair that was not set by storage, to
			// make sure those don't break the clearing method
			if (localStorage && localStorage.setItem) {
				localStorage.setItem('myroguekey', '{myroguevalue}');
			}
			var exp;
			// set two items that expire in a minute
			exp = 60 * 1000;
			storage.setLocalItem(expkey+"1", expvalue+"1", exp);
			storage.setLocalItem(expkey+"2", expvalue+"2", exp);
			// set 3 items that expire immediately
			var nrItems = storage.getLocalLength();
			exp = -1;
			storage.setLocalItem(expkey+"3", expvalue+"3", exp);
			storage.setLocalItem(expkey+"4", expvalue+"4", exp);
			storage.setLocalItem(expkey+"5", expvalue+"5", exp);
			// clear the expired items
			storage.clearLocalExpired();
			// there should be as many stored items as before adding the expiring ones
			expect(storage.getLocalLength()).to.equal(nrItems);
		});

		it('should be able to clear data for a given namespace in local storage', function() {
			// set values on namespace ns1 which has four sub-namespaces
			storage.setLocalItem("ns1:subns1:key1", "ns1 subns1 value1");
			storage.setLocalItem("ns1:subns1:key2", "ns1 subns1 value2");
			storage.setLocalItem("ns1:subns2:key1", "ns1 subns2 value1");
			storage.setLocalItem("ns1:subns2:key2", "ns1 subns2 value2");
			storage.setLocalItem("ns1:subns2:key3", "ns1 subns2 value3");
			storage.setLocalItem("ns1:subns3:key1", "ns1 subns3 value1");
			storage.setLocalItem("ns1:subns4:key1", "ns1 subns4 value1");
			// ... also define a namespace that starts with the same string...
			storage.setLocalItem("ns1:subns11:key1", "ns1 subns11 value1");

			// first make sure again we can get the namespaced value back
			expect(storage.getLocalItem("ns1:subns1:key1")).to.equal("ns1 subns1 value1");
			expect(storage.getLocalItem("ns1:subns2:key3")).to.equal("ns1 subns2 value3");
			// clear ns1:subns1, it should not impact ns1:subns2, ns1:subns3,
			// ns1:subns4 and subns11
			storage.clearLocalNamespaced("ns1:subns1");
			expect(storage.getLocalItem("ns1:subns1:key1")).to.equal(null);
			expect(storage.getLocalItem("ns1:subns1:key2")).to.equal(null);
			// ... spot checks for the others that should still exist
			expect(storage.getLocalItem("ns1:subns2:key1")).to.equal("ns1 subns2 value1");
			expect(storage.getLocalItem("ns1:subns4:key1")).to.equal("ns1 subns4 value1");
			expect(storage.getLocalItem("ns1:subns11:key1")).to.equal("ns1 subns11 value1");
			// clear everything remaing in ns1 (it should be fine to add the trailing colon)
			storage.clearLocalNamespaced("ns1:");
			expect(storage.getLocalItem("ns1:subns2:key1")).to.equal(null);
			expect(storage.getLocalItem("ns1:subns4:key1")).to.equal(null);
			expect(storage.getLocalItem("ns1:subns11:key1")).to.equal(null);
		});

		it('should clear local storage', function() {
			storage.clearLocal();
			expect(storage.getLocalLength()).to.equal(0);
		});

	});

	describe('should support session storage', function() {

		it('should set data in session storage by key', function() {
			// housekeeping, make sure we start with a clean slate
			storage.clearSession();

			storage.setSessionItem(key1, value1);
			storage.setSessionItem(key2, value2);
			storage.setSessionItem(key3, value3);
			storage.setSessionItem(key4, value4);
			// Inspect sessionStorage directly.
			// Data is stored somewhat cryptic so check the actual expected value.
			expect(sessionStorage.getItem(storage._getKeyName(key1)).indexOf('^^_data_^^:^^double-quoted \\^^string\\^^^^')).to.equal(1);
			expect(sessionStorage.getItem(storage._getKeyName(key2)).indexOf('^^_data_^^:^^single-quoted \'string\'^^')).to.equal(1);
			expect(sessionStorage.getItem(storage._getKeyName(key3)).indexOf('^^_data_^^:{^^foo^^:^^bar^^}')).to.equal(1);
			expect(sessionStorage.getItem(storage._getKeyName(key4)).indexOf('^^_data_^^:{^^name1^^:^^double-quoted \\^^string\\^^^^,^^name2^^:^^single-quoted \'string\'^^,^^name3^^:{^^foo^^:^^bar^^}}')).to.equal(1);
		});

		it('should get data from session storage by key', function() {
			// now use the object's API and we should get back what we put in
			expect(storage.getSessionItem(key1)).to.equal(value1);
			expect(storage.getSessionItem(key2)).to.equal(value2);
			expect(storage.getSessionItem(key3)).to.deep.equal(value3);
			expect(storage.getSessionItem(key4)).to.deep.equal(value4);
		});

		it('should get key from session storage by index', function() {
			expect(storage.getSessionKey(0)).to.equal(storage._getKeyName(key1));
			expect(storage.getSessionKey(1)).to.equal(storage._getKeyName(key2));
			expect(storage.getSessionKey(2)).to.equal(storage._getKeyName(key3));
			expect(storage.getSessionKey(3)).to.equal(storage._getKeyName(key4));
		});

		it('should get number of stored items from session storage', function() {
			expect(storage.getSessionLength()).to.equal(4);
		});

		it('should time-stamp data in session storage', function() {
			// Inspect localStorage directly, it should have a _ts_ property with
			// a 13-digit timestamp.
			expect(sessionStorage.getItem(storage._getKeyName(key1)).search(/\^\^_ts_\^\^:\d{13}/) !== -1).to.equal(true);
		});

		it('should remove data from session storage by key', function() {
			// remove one item and check sessionStorage directly to see that
			// it is gone and check the Storage object to see that the number
			// of stored items is reduced
			storage.removeSessionItem(key1);
			expect(sessionStorage.getItem(storage._getKeyName(key1))).to.equal(null);
			expect(storage.getSessionItem(key1)).to.equal(null);
			expect(storage.getSessionLength()).to.equal(3);
			// remove one more item
			storage.removeSessionItem(key3);
			expect(sessionStorage.getItem(storage._getKeyName(key3))).to.equal(null);
			expect(storage.getSessionItem(key3)).to.equal(null);
			expect(storage.getSessionLength()).to.equal(2);
		});

		it('should be able to namespace data in session storage', function() {
			storage.setSessionItem(nskey, nsvalue);
			expect(storage.getSessionItem(nskey)).to.equal(nsvalue);
		});

		it('should get data from session storage by key unless it has expired, and should remove an expired item', function() {
			var exp = 60 * 1000;
			storage.setSessionItem(expkey, expvalue, exp);
			var storedObj = JSON.parse(sessionStorage.getItem(storage._getKeyName(expkey)).replace(/\^\^/g, '\"'));
			// verify that the _exp_ time is set to the timestamp time at moment of
			// storage plus the exp setting.
			expect(storedObj._exp_ - storedObj._ts_).to.equal(exp);
			// verify we can access it if it is not yet expired
			expect(storage.getSessionItem(expkey)).to.equal(expvalue);

			// now reset the expvalue and expire it immediatly
			exp = -1;
			storage.setSessionItem(expkey, expvalue, exp);
			// store current number of stored items so we can compare later
			var nrItems = storage.getSessionLength();
			// inspect internal variables (this is not ideal in a test case since
			// it should be possible to change internals without breaking tests...)
			storedObj = JSON.parse(sessionStorage.getItem(storage._getKeyName(expkey)).replace(/\^\^/g, '\"'));
			expect(storedObj._exp_ - storedObj._ts_).to.equal(exp);
			// now we should get null back if we try to access it again
			expect(storage.getSessionItem(expkey)).to.equal(null);
			// and it has been removed from storage
			expect(storage.getSessionLength()).to.equal(nrItems - 1);
		});

		it('should be able to clear expired data only', function() {
			// add a key/value pair that was not set by storage, to
			// make sure those don't break the clearing method
			if (sessionStorage && sessionStorage.setItem) {
				sessionStorage.setItem('myroguekey', '{myroguevalue}');
			}
			var exp;
			// set two items that expire in a minute
			exp = 60 * 1000;
			storage.setSessionItem(expkey+"1", expvalue+"1", exp);
			storage.setSessionItem(expkey+"2", expvalue+"2", exp);
			// set 3 items that expire immediately
			var nrItems = storage.getSessionLength();
			exp = -1;
			storage.setSessionItem(expkey+"3", expvalue+"3", exp);
			storage.setSessionItem(expkey+"4", expvalue+"4", exp);
			storage.setSessionItem(expkey+"5", expvalue+"5", exp);
			// clear the expired items
			storage.clearSessionExpired();
			// there should be as many stored items as before adding the expiring ones
			expect(storage.getSessionLength()).to.equal(nrItems);
		});

		it('should be able to clear data for a given namespace in session storage', function() {
			// set values on namespace ns1 which has four sub-namespaces
			storage.setSessionItem("ns1:subns1:key1", "ns1 subns1 value1");
			storage.setSessionItem("ns1:subns1:key2", "ns1 subns1 value2");
			storage.setSessionItem("ns1:subns2:key1", "ns1 subns2 value1");
			storage.setSessionItem("ns1:subns2:key2", "ns1 subns2 value2");
			storage.setSessionItem("ns1:subns2:key3", "ns1 subns2 value3");
			storage.setSessionItem("ns1:subns3:key1", "ns1 subns3 value1");
			storage.setSessionItem("ns1:subns4:key1", "ns1 subns4 value1");
			// ... also define a namespace that starts with the same string...
			storage.setSessionItem("ns1:subns11:key1", "ns1 subns11 value1");

			// first make sure again we can get the namespaced value back
			expect(storage.getSessionItem("ns1:subns1:key1")).to.equal("ns1 subns1 value1");
			expect(storage.getSessionItem("ns1:subns2:key3")).to.equal("ns1 subns2 value3");
			// clear ns1:subns1, it should not impact ns1:subns2, ns1:subns3,
			// ns1:subns4 and subns11
			storage.clearSessionNamespaced("ns1:subns1");
			expect(storage.getSessionItem("ns1:subns1:key1")).to.equal(null);
			expect(storage.getSessionItem("ns1:subns1:key2")).to.equal(null);
			// ... spot checks for the others that should still exist
			expect(storage.getSessionItem("ns1:subns2:key1")).to.equal("ns1 subns2 value1");
			expect(storage.getSessionItem("ns1:subns4:key1")).to.equal("ns1 subns4 value1");
			expect(storage.getSessionItem("ns1:subns11:key1")).to.equal("ns1 subns11 value1");
			// clear everything remaing in ns1 (it should be fine to add the trailing colon)
			storage.clearSessionNamespaced("ns1:");
			expect(storage.getSessionItem("ns1:subns2:key1")).to.equal(null);
			expect(storage.getSessionItem("ns1:subns4:key1")).to.equal(null);
			expect(storage.getSessionItem("ns1:subns11:key1")).to.equal(null);
		});

		it('should clear session storage', function() {
			storage.clearSession();
			expect(storage.getSessionLength()).to.equal(0);
		});

	});

	describe('should support in-memory storage', function() {
		// store original _hasSupportedStorageType method
		var _hasSupportedStorageType = storage._hasSupportedStorageType;
		it('should provide in-memory storage  (primary and as fallback)', function() {

			// override the support test
			storage._hasSupportedStorageType = function(type){return false;};
			expect(storage._hasSupportedStorageType("local")).to.equal(false);

			// Tests below are copies of tests above with either reference to
			// local or session storage - either way, memoryStore will be used
			// since support for LocalStorage and SessionStorage has been
			// programmatically disabled above with _hasSupportedStorageType
			storage.setLocalItem(key1, value1);
			storage.setLocalItem(key3, value3);
			storage.setSessionItem(key1, value1);
			storage.setSessionItem(key3, value3);
			// inspect memoryStore directly to check that it has indeed be used
			expect(storage.memoryStore._localStorage[key1].indexOf('^^_data_^^:^^double-quoted \\^^string\\^^^^')).to.equal(1);
			expect(storage.memoryStore._sessionStorage[key3].indexOf('^^_data_^^:{^^foo^^:^^bar^^}')).to.equal(1);
			// next use the object's API and we should get back what we put in
			// even though it is stored in memory instead of local/session storage.
			expect(storage.getLocalItem(key1)).to.equal(value1);
			expect(storage.getSessionItem(key3)).to.deep.equal(value3);
			// next get key by index
			expect(storage.getSessionKey(0)).to.equal(key1);
			expect(storage.getLocalKey(1)).to.equal(key3);
			// next get number of stored items
			// NOTE that in the fallback case, sessionStorage and localStorage
			// are combined and thus getSessionLength() and/or getLocalLength()
			// are not reliable in themselves.
			expect(storage.getSessionLength()).to.equal(2);
			expect(storage.getLocalLength()).to.equal(2);
			// remove item by key
			storage.removeSessionItem(key1);
			expect(storage.getSessionItem(key1)).to.equal(null);
			storage.removeLocalItem(key1);
			expect(storage.getLocalItem(key1)).to.equal(null);
			// support namespacing
			storage.setSessionItem(nskey, nsvalue);
			expect(storage.getSessionItem(nskey)).to.equal(nsvalue);

			var exp;
			// set two items that expire in a minute
			exp = 60 * 1000;
			storage.setSessionItem(expkey+"1", expvalue+"1", exp);
			storage.setSessionItem(expkey+"2", expvalue+"2", exp);
			// set three items that expire immediately,
			// 2 Session and one Local
			var nrItems = storage.getSessionLength();
			exp = -1;
			storage.setSessionItem(expkey+"3", expvalue+"3", exp);
			storage.setSessionItem(expkey+"4", expvalue+"4", exp);
			storage.setLocalItem(expkey+"5", expvalue+"5", exp);
			// clear the expired items from session cache only
			storage.clearSessionExpired();
			// there should be as many stored items as before adding the expiring ones
			expect(storage.getSessionLength()).to.equal(nrItems);

			// set values on namespace ns1 which has four sub-namespaces
			storage.setSessionItem("ns1:subns1:key1", "ns1 subns1 value1");
			storage.setSessionItem("ns1:subns1:key2", "ns1 subns1 value2");
			storage.setSessionItem("ns1:subns2:key1", "ns1 subns2 value1");
			storage.setSessionItem("ns1:subns2:key2", "ns1 subns2 value2");
			storage.setSessionItem("ns1:subns2:key3", "ns1 subns2 value3");
			storage.setSessionItem("ns1:subns3:key1", "ns1 subns3 value1");
			storage.setSessionItem("ns1:subns4:key1", "ns1 subns4 value1");
			// ... also define a namespace that starts with the same string...
			storage.setSessionItem("ns1:subns11:key1", "ns1 subns11 value1");

			// first make sure again we can get the namespaced value back
			expect(storage.getSessionItem("ns1:subns1:key1")).to.equal("ns1 subns1 value1");
			expect(storage.getSessionItem("ns1:subns2:key3")).to.equal("ns1 subns2 value3");
			// clear ns1:subns1, it should not impact ns1:subns2, ns1:subns3,
			// ns1:subns4 and subns11
			storage.clearSessionNamespaced("ns1:subns1");
			expect(storage.getSessionItem("ns1:subns1:key1")).to.equal(null);
			expect(storage.getSessionItem("ns1:subns1:key2")).to.equal(null);
			// ... spot checks for the others that should still exist
			expect(storage.getSessionItem("ns1:subns2:key1")).to.equal("ns1 subns2 value1");
			expect(storage.getSessionItem("ns1:subns4:key1")).to.equal("ns1 subns4 value1");
			expect(storage.getSessionItem("ns1:subns11:key1")).to.equal("ns1 subns11 value1");
			// clear everything remaing in ns1 (it should be fine to add the trailing colon)
			storage.clearSessionNamespaced("ns1:");
			expect(storage.getSessionItem("ns1:subns2:key1")).to.equal(null);
			expect(storage.getSessionItem("ns1:subns4:key1")).to.equal(null);
			expect(storage.getSessionItem("ns1:subns11:key1")).to.equal(null);

			// clear session
			storage.clearSession();
			expect(storage.getSessionLength()).to.equal(0);
			// ... but local still exists with both the original and the expired
			// item (expkey+"5"), because no attempt to access the expired item
			// has been made yet.
			expect(storage.getLocalLength()).to.equal(2);
			// ... now clear local as well
			storage.clearLocal();
			expect(storage.getLocalLength()).to.equal(0);

			// restore original _hasSupportedStorageType method
			storage._hasSupportedStorageType = _hasSupportedStorageType;
			expect(storage._hasSupportedStorageType("local")).to.equal(true);
		});
	});

	describe('should support storage type config', function() {

		describe('should support config of local storage', function() {

			it('should set configured storage type to local storage', function() {
				// housekeeping, make sure we start with a clean slate
				storage.clearLocal();
				delete storage._type;

				storage.setType('local');
				expect(storage._type).to.equal('local');
				expect(storage._getDaStorage()).to.equal(localStorage);
			});

			it('should set data in configured (local) storage by key', function() {
				storage.setItem(key1, value1);
				storage.setItem(key2, value2);
				storage.setItem(key3, value3);
				storage.setItem(key4, value4);
				// Inspect localStorage directly.
				// Data is stored somewhat cryptic so check the actual expected value.
				expect(localStorage.getItem(storage._getKeyName(key1)).indexOf('^^_data_^^:^^double-quoted \\^^string\\^^^^')).to.equal(1);
				expect(localStorage.getItem(storage._getKeyName(key2)).indexOf('^^_data_^^:^^single-quoted \'string\'^^')).to.equal(1);
				expect(localStorage.getItem(storage._getKeyName(key3)).indexOf('^^_data_^^:{^^foo^^:^^bar^^}')).to.equal(1);
				expect(localStorage.getItem(storage._getKeyName(key4)).indexOf('^^_data_^^:{^^name1^^:^^double-quoted \\^^string\\^^^^,^^name2^^:^^single-quoted \'string\'^^,^^name3^^:{^^foo^^:^^bar^^}}')).to.equal(1);
			});

			it('should get data from local storage by key', function() {
				// now use the object's API and we should get back what we put in
				// whether from Local explicitly...
				expect(storage.getLocalItem(key1)).to.equal(value1);
				expect(storage.getLocalItem(key2)).to.equal(value2);
				expect(storage.getLocalItem(key3)).to.deep.equal(value3);
				expect(storage.getLocalItem(key4)).to.deep.equal(value4);
				// ...or implicitly
				expect(storage.getItem(key1)).to.equal(value1);
				expect(storage.getItem(key2)).to.equal(value2);
				expect(storage.getItem(key3)).to.deep.equal(value3);
				expect(storage.getItem(key4)).to.deep.equal(value4);
			});
		});

		describe('should support config of session storage', function() {

			it('should set configured storage type to session storage', function() {
				// housekeeping, make sure we start with a clean slate
				storage.clearSession();
				delete storage._type;

				storage.setType('session');
				expect(storage._type).to.equal('session');
				expect(storage._getDaStorage()).to.equal(sessionStorage);
			});

			it('should set data in configured (session) storage by key', function() {
				storage.setItem(key1, value1);
				storage.setItem(key2, value2);
				storage.setItem(key3, value3);
				storage.setItem(key4, value4);
				// Inspect sessionStorage directly.
				// Data is stored somewhat cryptic so check the actual expected value.
				expect(sessionStorage.getItem(storage._getKeyName(key1)).indexOf('^^_data_^^:^^double-quoted \\^^string\\^^^^')).to.equal(1);
				expect(sessionStorage.getItem(storage._getKeyName(key2)).indexOf('^^_data_^^:^^single-quoted \'string\'^^')).to.equal(1);
				expect(sessionStorage.getItem(storage._getKeyName(key3)).indexOf('^^_data_^^:{^^foo^^:^^bar^^}')).to.equal(1);
				expect(sessionStorage.getItem(storage._getKeyName(key4)).indexOf('^^_data_^^:{^^name1^^:^^double-quoted \\^^string\\^^^^,^^name2^^:^^single-quoted \'string\'^^,^^name3^^:{^^foo^^:^^bar^^}}')).to.equal(1);
			});

			it('should get data from session storage by key', function() {
				// now use the object's API and we should get back what we put in
				// whether from Session explicitly...
				expect(storage.getSessionItem(key1)).to.equal(value1);
				expect(storage.getSessionItem(key2)).to.equal(value2);
				expect(storage.getSessionItem(key3)).to.deep.equal(value3);
				expect(storage.getSessionItem(key4)).to.deep.equal(value4);
				// ...or implicitly
				expect(storage.getItem(key1)).to.equal(value1);
				expect(storage.getItem(key2)).to.equal(value2);
				expect(storage.getItem(key3)).to.deep.equal(value3);
				expect(storage.getItem(key4)).to.deep.equal(value4);
			});

		});

		describe('should support config default of session storage', function() {

			it('should default to session storage', function() {
				// housekeeping, make sure we start with a clean slate
				storage.clearSession();
				delete storage._type;

				expect(storage._getDaStorage()).to.equal(sessionStorage);
			});

			it('should set data in default (session) storage by key', function() {
				storage.setItem(key1, value1);
				storage.setItem(key2, value2);
				storage.setItem(key3, value3);
				storage.setItem(key4, value4);
				// Inspect sessionStorage directly.
				// Data is stored somewhat cryptic so check the actual expected value.
				expect(sessionStorage.getItem(storage._getKeyName(key1)).indexOf('^^_data_^^:^^double-quoted \\^^string\\^^^^')).to.equal(1);
				expect(sessionStorage.getItem(storage._getKeyName(key2)).indexOf('^^_data_^^:^^single-quoted \'string\'^^')).to.equal(1);
				expect(sessionStorage.getItem(storage._getKeyName(key3)).indexOf('^^_data_^^:{^^foo^^:^^bar^^}')).to.equal(1);
				expect(sessionStorage.getItem(storage._getKeyName(key4)).indexOf('^^_data_^^:{^^name1^^:^^double-quoted \\^^string\\^^^^,^^name2^^:^^single-quoted \'string\'^^,^^name3^^:{^^foo^^:^^bar^^}}')).to.equal(1);
			});

			it('should get data from session storage by key', function() {
				// now use the object's API and we should get back what we put in
				// whether from Session explicitly...
				expect(storage.getSessionItem(key1)).to.equal(value1);
				expect(storage.getSessionItem(key2)).to.equal(value2);
				expect(storage.getSessionItem(key3)).to.deep.equal(value3);
				expect(storage.getSessionItem(key4)).to.deep.equal(value4);
				// ...or implicitly
				expect(storage.getItem(key1)).to.equal(value1);
				expect(storage.getItem(key2)).to.equal(value2);
				expect(storage.getItem(key3)).to.deep.equal(value3);
				expect(storage.getItem(key4)).to.deep.equal(value4);
			});
		});
	});

	describe('should support in-memory undo functionality', function() {

		it('should support enabling/disabling of undo', function() {
			expect(storage._enableUndo).to.equal(false);
			storage.enableUndo();
			expect(storage._enableUndo).to.equal(true);
			storage.enableUndo(false);
			expect(storage._enableUndo).to.equal(false);
		});

		it('should support undo for local storage', function() {
			// housekeeping, make sure we start with a clean slate
			storage.clearLocal();
			delete storage._type;
			delete storage._localUndo;
			delete storage['_undo_local_' + key1];

			storage.enableUndo(false);
			storage.setLocalItem(key1, value5);
			expect(storage['_undo_local_' + key1]).to.equal(undefined);
			storage.setLocalItem(key1, value6);
			expect(storage['_undo_local_' + key1]).to.equal(undefined);

			storage.clearLocal();
			delete storage._type;
			delete storage['_undo_local_' + key1];

			storage.enableUndo();
			storage.setLocalItem(key1, value5);
			expect(storage['_undo_local_' + key1]).to.equal(null);
			storage.setLocalItem(key1, value6);
			expect(storage['_undo_local_' + key1]).to.equal(value5);
			expect(storage.getLocalItem(key1)).to.equal(value6);
			expect(storage.undoLocalItem(key1)).to.equal(value5);
			expect(storage.getLocalItem(key1)).to.equal(value5);
		});

		it('should support undo for session storage', function() {
			// housekeeping, make sure we start with a clean slate
			storage.clearSession();
			delete storage._type;

			storage.setSessionItem(key1, value5);
			storage.setSessionItem(key1, value6);
			expect(storage.getSessionItem(key1)).to.equal(value6);
			expect(storage.undoSessionItem(key1)).to.equal(value5);
			expect(storage.getSessionItem(key1)).to.equal(value5);
		});


		it('should support undo for configured storage', function() {
			// housekeeping, make sure we start with a clean slate
			storage.clearSession();
			storage.clearLocal();

			delete storage._type;
			storage.setType('session');
			expect(storage._type).to.equal('session');

			storage.setItem(key1, value5);
			storage.setItem(key1, value6);
			expect(storage.getItem(key1)).to.equal(value6);
			storage.undoItem(key1);
			expect(storage.getItem(key1)).to.equal(value5);
			expect(storage.getSessionItem(key1)).to.equal(value5);

			// housekeeping, make sure we start with a clean slate
			storage.clearSession();
			storage.clearLocal();

			delete storage._type;
			storage.setType('local');
			expect(storage._type).to.equal('local');

			storage.setItem(key1, value5);
			storage.setItem(key1, value6);
			expect(storage.getItem(key1)).to.equal(value6);
			expect(storage.undoItem(key1)).to.equal(value5);
			expect(storage.getItem(key1)).to.equal(value5);
			expect(storage.getLocalItem(key1)).to.equal(value5);

		});

		it('should return current item when undo is not enabled', function() {
			// housekeeping, make sure we start with a clean slate
			storage.clearLocal();
			delete storage._type;
			delete storage._localUndo;
			delete storage['_undo_local_' + key1];
			delete storage._sessionUndo;
			delete storage['_undo_session_' + key1];

			storage.enableUndo(false);
			storage.setLocalItem(key1, value5);
			storage.setLocalItem(key1, value6);
			expect(storage.undoLocalItem(key1)).to.equal(value6);

			storage.setSessionItem(key1, value5);
			storage.setSessionItem(key1, value6);
			expect(storage.undoSessionItem(key1)).to.equal(value6);
		});

	});


	describe('should support in-memory redo functionality', function() {

		it('should support redo for local storage', function() {
			// housekeeping, make sure we start with a clean slate
			storage.clearLocal();
			delete storage._type;
			delete storage._localUndo;
			delete storage['_undo_local_' + key1];

			// redo is nothing more than a repeat of the undo
			storage.enableUndo();
			storage.setLocalItem(key1, value5);
			expect(storage['_undo_local_' + key1]).to.equal(null);
			storage.setLocalItem(key1, value6);
			expect(storage['_undo_local_' + key1]).to.equal(value5);
			expect(storage.getLocalItem(key1)).to.equal(value6);
			// undo the last action
			expect(storage.undoLocalItem(key1)).to.equal(value5);
			expect(storage['_undo_local_' + key1]).to.equal(value6);
			expect(storage.getLocalItem(key1)).to.equal(value5);
			// redo (=undo the undo) the last action
			expect(storage.undoLocalItem(key1)).to.equal(value6);
			expect(storage.getLocalItem(key1)).to.equal(value6);
			// maybe be repeated again and again
			expect(storage.undoLocalItem(key1)).to.equal(value5);
			expect(storage.undoLocalItem(key1)).to.equal(value6);
			expect(storage.undoLocalItem(key1)).to.equal(value5);
			expect(storage.undoLocalItem(key1)).to.equal(value6);
		});

		it('should support redo for session storage', function() {
			// housekeeping, make sure we start with a clean slate
			storage.clearSession();
			delete storage._type;
			delete storage._sessionUndo;
			delete storage['_undo_session_' + key1];

			// redo is nothing more than a repeat of the undo
			storage.enableUndo();
			storage.setSessionItem(key1, value5);
			expect(storage['_undo_session_' + key1]).to.equal(null);
			storage.setSessionItem(key1, value6);
			expect(storage['_undo_session_' + key1]).to.equal(value5);
			expect(storage.getSessionItem(key1)).to.equal(value6);
			// undo the last action
			expect(storage.undoSessionItem(key1)).to.equal(value5);
			expect(storage['_undo_session_' + key1]).to.equal(value6);
			expect(storage.getSessionItem(key1)).to.equal(value5);
			// redo (=undo the undo) the last action
			expect(storage.undoSessionItem(key1)).to.equal(value6);
			expect(storage.getSessionItem(key1)).to.equal(value6);
			// maybe be repeated again and again
			expect(storage.undoSessionItem(key1)).to.equal(value5);
			expect(storage.undoSessionItem(key1)).to.equal(value6);
			expect(storage.undoSessionItem(key1)).to.equal(value5);
			expect(storage.undoSessionItem(key1)).to.equal(value6);
		});


		it('should support redo for configured storage', function() {
			// housekeeping, make sure we start with a clean slate
			storage.clearSession();
			storage.clearLocal();

			storage.setType('session');
			storage.setItem(key1, value5);
			storage.setItem(key1, value6);
			expect(storage.getItem(key1)).to.equal(value6);
			storage.undoItem(key1);
			expect(storage.getItem(key1)).to.equal(value5);
			expect(storage.getSessionItem(key1)).to.equal(value5);
			storage.undoItem(key1);
			expect(storage.getItem(key1)).to.equal(value6);
			expect(storage.getSessionItem(key1)).to.equal(value6);

			// housekeeping, make sure we start with a clean slate
			storage.clearSession();
			storage.clearLocal();

			storage.setType('local');
			storage.setItem(key1, value5);
			storage.setItem(key1, value6);
			expect(storage.getItem(key1)).to.equal(value6);
			expect(storage.undoItem(key1)).to.equal(value5);
			expect(storage.getItem(key1)).to.equal(value5);
			expect(storage.getLocalItem(key1)).to.equal(value5);
			expect(storage.undoItem(key1)).to.equal(value6);
			expect(storage.getItem(key1)).to.equal(value6);
			expect(storage.getLocalItem(key1)).to.equal(value6);

		});

	});


});
