(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

module.exports = {
    toObject        : toObject,
    toArray         : toArray,
    toCSV           : toCSV,
    toColumnArray   : toColumnArray,
    toSchemaObject  : toSchemaObject
}

function putDataInSchema(header, item, schema){
    var match = header.match(/\[*[\d]\]\.(\w+)|\.|\[\]|\[(.)\]|-|\+/ig);
    var headerName, currentPoint;
    if(match){
        var testMatch = match[0];
        if(match.indexOf('-') !== -1){
            return true;
        }else if(match.indexOf('.') !== -1){
            var headParts = header.split('.');
            currentPoint = headParts.shift();
            schema[currentPoint] = schema[currentPoint] || {};
            putDataInSchema(headParts.join('.'), item, schema[currentPoint]);
        }else if(match.indexOf('[]') !== -1){
            headerName = header.replace(/\[\]/ig,'');
            if(!schema[headerName]){
            schema[headerName] = [];
            }
            schema[headerName].push(item);
        }else if(/\[*[\d]\]\.(\w+)/.test(testMatch)){
            headerName = header.split('[').shift();
            var index = parseInt(testMatch.match(/\[(.)\]/).pop(),10);
            currentPoint = header.split('.').pop();
            schema[headerName] = schema[headerName] || [];
            schema[headerName][index] = schema[headerName][index] || {};
            schema[headerName][index][currentPoint] = item;
        }else if(/\[(.)\]/.test(testMatch)){
            var delimiter = testMatch.match(/\[(.)\]/).pop();
            headerName = header.replace(/\[(.)\]/ig,'');
            schema[headerName] = convertArray(item, delimiter);
        }else if(match.indexOf('+') !== -1){
            headerName = header.replace(/\+/ig,"");
            schema[headerName] = Number(item);
        }
    }else{
        schema[header] = trimQuote(item);
    }
    return schema ;
}

function toColumnArray(data){

    var content = data;
    if(typeof(content) !== "string"){
        throw new Error("Invalid input, input data should be a string");
    }
    content         = content.split(/[\n\r]+/ig);
    var headers     = content.shift().split(',');
    var hashData    = { };

    headers.forEach(function(item){
        hashData[item] = [];
    });

    content.forEach(function(item){
        if(item){
            item = item.split(',');
            item.forEach(function(val, index){
                hashData[headers[index]].push(trimQuote(val));
            });
        }
    });

    return hashData;
}

function toObject(data){
    var content = data;
    if(typeof(content) !== "string"){
        throw new Error("Invalid input, input data should be a string");
    }
    content = content.split(/[\n\r]+/ig);
    var headers = content.shift().split(','),
        hashData = [];
    content.forEach(function(item){
        if(item){
            item = item.split(',');
            var hashItem = {};
            headers.forEach(function(headerItem, index){
                hashItem[headerItem] = trimQuote(item[index]);
            });
            hashData.push(hashItem);
        }
    });
    return hashData;
}

function toSchemaObject(data){

    var content = data;
    if(typeof(content) !== "string"){
        throw new Error("Invalid input, input should be a string");
    }
    content         = content.split(/[\n\r]+/ig);
    var headers     = content.shift().split(',');
    var hashData    = [ ];

    content.forEach(function(item){
        if(item){
            item = item.split(',');
            var schemaObject = {};
            item.forEach(function(val, index){
                putDataInSchema(headers[index], val, schemaObject);
            });
            hashData.push(schemaObject);
        }
    });

    return hashData;
}


function toArray(data){
    var content = data;

    if(typeof(content) !== "string"){
        throw new Error("Invalid input, input data should be a string");
    }

    content = content.split(/[\n\r]+/ig);
    var arrayData = [];
    content.forEach(function(item){
        if(item){
            item = item.split(',').map(function(cItem){
                return trimQuote(cItem);
            });
            arrayData.push(item);
        }
    });
    return arrayData;
}


function trimQuote(str){
    return str.trim().replace(/^["|'](.*)["|']$/, '$1');
}

function convertArray(str, delimiter) {
    var output = [];
    var arr = str.split(delimiter);
    arr.forEach(function(val) {
        var trimmed = val.trim();
        output.push(trimmed);
    });
    return output;
}


function dataType(arg) {
    if (arg === null) {
        return 'null';
    }
    else if (arg && (arg.nodeType === 1 || arg.nodeType === 9)) {
        return 'element';
    }
    var type = (Object.prototype.toString.call(arg)).match(/\[object (.*?)\]/)[1].toLowerCase();
    if (type === 'number') {
        if (isNaN(arg)) {
            return 'nan';
        }
        if (!isFinite(arg)) {
            return 'infinity';
        }
    }
    return type;
}

function getKeyNameForObject(title, origin, key, opts){
  if(opts.headers === 'key' || opts.headers === 'none'){
    return key;
  }else{
    if(origin){
      return (title ? title : '') + key;
    }else{
      return (title ? title + opts.objectDenote : '') + key;
    }
  }
}

function getKeyNameForArray(title, opts, contentIsObject){
  if(contentIsObject && opts.headers === "relative"){
     return "";
  }
  return title + opts.arrayDenote;
}

function _toCSV(data, csv, title, opts, origin){
    if(!data){
        return data;
    }else if(Array.isArray(data)){
        data.some(function(i){
            if(dataType(i) === 'string'){
                _toCSV(
                  data.join(';'),
                  csv,
                  getKeyNameForArray(title, opts, false),
                  opts
                );
                return true;
            }
            return _toCSV(
              i,
              csv,
              getKeyNameForArray(title, opts, true),
              opts
            );
        });
    }else if(dataType(data) === 'object'){
        return Object.keys(data).forEach(function(key){
            return _toCSV(
              data[key],
              csv,
              getKeyNameForObject(title, origin, key, opts),
              opts
            );
        });
    }else{
        if(csv[title]){
            csv[title].push(data);
        }else{
            csv[title] = [ data ];
        }
    }
}

function toCSV(data, opts){

    opts                = opts || { };
    opts.delimiter      = opts.delimiter || ',';

    opts.wrap           = opts.wrap || '';

    opts.arrayDenote    = opts.arrayDenote && String(opts.arrayDenote).trim() ? opts.arrayDenote : '[]';

    opts.objectDenote   = opts.objectDenote && String(opts.objectDenote).trim() ? opts.objectDenote : '.';

    opts.detailedOutput  = typeof(opts.detailedOutput) !== "boolean" ? true : opts.detailedOutput;

    opts.headers  = String(opts.headers).toLowerCase();

    if(!opts.headers.match(/none|full|relative|key/)){
      opts.headers = 'full';
    }else{
      opts.headers = opts.headers.match(/none|full|relative|key/)[0];
    }



    var csvJSON         = { };
    var csvData         = "";
    var topLength       = 0;
    var headers         = null;

    if(opts.wrap === true){
        opts.wrap = '"';
    }

    if(dataType(data) === "string"){
        data = JSON.parse(data);
    }


    _toCSV(data, csvJSON, '', opts, true);

    if(opts.wrap){
        headers = Object.keys(csvJSON).map(function(i){
            return opts.wrap + i + opts.wrap;
        }).join(opts.delimiter) + '\n';
    }else{
        headers = Object.keys(csvJSON).join(opts.delimiter) + '\n';
    }

    csvData += opts.headers !== 'none' ? headers : '';

    Object.keys(csvJSON).forEach(function(i){
        if(Array.isArray(csvJSON[i]) && csvJSON[i].length > topLength){
            topLength = csvJSON[i].length;
        }
    });

    for(var i = 0; i < topLength; i++){
        var thisLine = [ ];
        Object.keys(csvJSON).forEach(function(j){
            if(Array.isArray(csvJSON[j]) && csvJSON[j][i]){
                if(opts.wrap){
                    thisLine.push( opts.wrap + csvJSON[j][i] + opts.wrap);
                }else{
                    thisLine.push(csvJSON[j][i]);
                }

            }else{
                if(opts.wrap){
                    thisLine.push( opts.wrap + opts.wrap);
                }else{
                    thisLine.push('');
                }
            }
        });
        csvData += thisLine.join(opts.delimiter) + '\n' ;
    }

    return csvData;

}

},{}],2:[function(require,module,exports){
var csvjson = require("csvjson");

function merge(file1, file2, key, orderBy) {
  var arr1 = csvjson.toObject(file1);
  var arr2 = csvjson.toObject(file2);

  if (!orderBy || !arr1[0].hasOwnProperty(orderBy)) {
    orderBy = Object.keys(arr1[0])[0];
  }

  if (!key) {
    var keys1 = Object.keys(arr1[0]);
    var keys2 = Object.keys(arr2[0]);

    keys1.forEach(function(key1) {
      if (key) return;
      keys2.forEach(function(key2) {
        if (key1 === key2) {
          key = key1;
        }
      });
    });
  }

  var merge = function(arr, obj2) {
  	arr1.forEach(function(obj1) {
  		if (obj1[key] === obj2[key]) {
  			var merged = JSON.parse(JSON.stringify(obj1));
  			Object.assign(merged, obj2);
  			arr.push(merged);
  		}
  	});
  	return arr;
  };

  var reduced = arr2.reduce(merge, []);

  reduced.sort(function (a, b) {
    if (a[orderBy] > b[orderBy]) {
      return 1;
    }
    if (a[orderBy] < b[orderBy]) {
      return -1;
    }

    return 0;
  });

  var options = {
      delimiter   : ";",
      headers		: "key",
      wrap        : false
  };

  return csvjson.toCSV(reduced, options);
}

function onInitFs(output) {
  return function (fs) {
    console.log('Opened file system: ' + fs.name);
  };
}

function errorHandler(e) {
  var msg = '';

  switch (e.code) {
    case FileError.QUOTA_EXCEEDED_ERR:
      msg = 'QUOTA_EXCEEDED_ERR';
      break;
    case FileError.NOT_FOUND_ERR:
      msg = 'NOT_FOUND_ERR';
      break;
    case FileError.SECURITY_ERR:
      msg = 'SECURITY_ERR';
      break;
    case FileError.INVALID_MODIFICATION_ERR:
      msg = 'INVALID_MODIFICATION_ERR';
      break;
    case FileError.INVALID_STATE_ERR:
      msg = 'INVALID_STATE_ERR';
      break;
    default:
      msg = 'Unknown Error';
      break;
  }

  console.log('Error: ' + msg);
}

window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;

function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

if (window.requestFileSystem) {
   var createPromise = function(file) {
    return new Promise(function(resolve, reject) {
      var reader = new FileReader();

      reader.onerror = function(e) {
        reject(e);
      };

      reader.onloadend = function(e) {
        resolve(this.result.replace(/;/g, ","));
      };

      reader.readAsText(file);
    });
  };

  document.querySelector('#join_button').onclick = function(e) {
    console.log('Button clicked');
    var file1 = document.querySelector('#file_1').files[0];
    var file2 = document.querySelector('#file_2').files[0];
    var joinField = document.querySelector('#join_field').value;
    var orderBy = document.querySelector('#order_by_field').value;


    if (!file1 || !file2) {
      alert('Select files');
      return;
    }

    /*
    console.log('file1:', file1.name);
    console.log('file2:', file2.name);
    console.log('joinField:', joinField);
    console.log('orderBy:', orderBy);
    */

    var promises = [];
    promises.push(createPromise(file1));
    promises.push(createPromise(file2));

    Promise.all(promises).then(function(values) {
      var output = merge(values[0], values[1], joinField);
      download('output.csv', output);
    }, function(error) {
      console.error(error);
    });


  };
} else {
  alert('Browser not supported. Use Google Chrome (or other webKit support).');
}

},{"csvjson":1}]},{},[2]);
