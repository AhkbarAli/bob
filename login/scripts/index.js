/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/WidgetLoader.js":
/*!*****************************!*\
  !*** ./src/WidgetLoader.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./constants */ "./src/constants.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils */ "./src/utils.js");
/* harmony import */ var _internalFunctions__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./internalFunctions */ "./src/internalFunctions.js");



const {
  LOADER_VERSION,
  EVENTS
} = _constants__WEBPACK_IMPORTED_MODULE_0__.default;
const {
  collectAndRemoveAllMatches,
  scriptsDiff,
  getAttribute,
  getCSSData,
  getHrefs,
  ensureEl,
  promiseSerial
} = _utils__WEBPACK_IMPORTED_MODULE_1__.default;
const {
  addNamespaceClass,
  createWidgetId,
  getCachedWidget,
  setCachedWidget,
  cleanCachedWidget,
  loadCSS,
  loadScript,
  loadWidget,
  createWidgetEvents
} = _internalFunctions__WEBPACK_IMPORTED_MODULE_2__.default;

/**
 * @class WidgetLoader
 * @description class for our WidgetLoader that will initialize widgets and facilitate communication between widget and page
 */
class WidgetLoaderClass {
  /**
   * initialize your widget with a dispatcher el to emit events and pub/sub methods
   */
  constructor(id) {
    const containerEl = document.getElementById(id);
    createWidgetEvents(containerEl, this);
  }

  /**
   * @method canRefreshWidget
   * @description To determine if we can refresh Widgets.
   * @param {string} widgetName Widget name.
   * @param {string} widgetVersion Widget version.
   * @param {boolean} enableWidgetRefresh Optional Flag to enable/disable widget refresh. Default value is true.
   * @returns {boolean} Return true if we can refresh widgets.
   */
  canRefreshWidget(widgetName, widgetVersion, enableWidgetRefresh) {
    // refresh widget if it exists, otherwise load it
    const widgets = [].slice.call(document.querySelectorAll(`[data-sparta-container="${widgetName}"][data-version="${widgetVersion}"]`) || []);
    return enableWidgetRefresh && widgets.length > 0;
  }

  /**
   * @method load
   * @description loads a widget into the specified container
   * @param {Object} Config object, must contain keys 'name, version, container, path', optional spinner Boolean value
   * @return {Object} returns the widget loader instance object
   */
  load(_ref) {
    let {
      name,
      version,
      container,
      path,
      spinner,
      options = {},
      language = 'en',
      enableWidgetRefresh = true,
      enableWidgetCache = false
    } = _ref;
    const id = ensureEl(container).id;

    // remove cache if enableWidgetCache is false.
    if (!enableWidgetCache) {
      cleanCachedWidget(name, version, id);
    }
    if (!name || !version || !id) {
      console.error('invalid config object passed to widget loader');
      return false;
    }
    let containersById = [];
    const containerNodes = [];

    // check if loading widget in multiple places
    if (Array.isArray(id)) {
      window.sparta.widgetLoader[name] = {
        [version]: {
          [id]: {}
        }
      };
      containersById = id;
    } else {
      containersById.push(id);
    }

    // loop over the containers, check if they exist and load as appropriate
    containersById.forEach(currentContainer => {
      // window.sparta.widgetLoader[name][version][currentContainer] = {loaded:false};

      // get Node for widget container
      const dest = document.getElementById(currentContainer);

      // if widget container does not exist
      if (!dest) {
        console.error('widget container destination does not exist');
        return false;
      }
      containerNodes.push(dest);
    });
    if (this.canRefreshWidget(name, version, enableWidgetRefresh)) {
      this.events.pub(EVENTS.REFRESH_WIDGET, {
        name,
        version,
        id: containerNodes
      });
    } else {
      if (!getCachedWidget(name, version, id)) {
        this.generateStyleSheet(containerNodes, spinner);
      }

      // UNCOMMENT THE CODE BELOW AND RM LINE 127 WHEN TIME TO ENABLE OVERRIDING
      // this.getWidgetOverride(path, name, version)
      //   .then((overrideVersion) => {
      //     const widgetVersion = (overrideVersion) ? overrideVersion : version;
      //     const oldVersion = (overrideVersion) ? version : null;
      //     // remove cache if enableWidgetCache is false.
      //     if (!enableWidgetCache) {
      //       cleanCachedWidget(name, widgetVersion, id);
      //     }
      //     this.callWidget(containerNodes, path, name, widgetVersion, id, options, language, oldVersion);
      //   }).catch(error => console.error(error));
      // }
      this.callWidget(containerNodes, path, name, version, id, options, language);
    }
    return this;
  }
  callWidget(containers, path, name, version, id, options, language) {
    let oldVersion = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : null;
    this.widgetXHR({
      containers,
      path,
      name,
      version,
      id,
      options,
      language
    }).then(xhrResp => this.prepareLoading(xhrResp)).then(loadingData => Promise.all([this.loadMultiCSS(loadingData), this.loadMultiScripts(loadingData)])).then(cssAndJsData => {
      const wasCached = typeof cssAndJsData[0] === 'boolean' ? cssAndJsData[0] : cssAndJsData[1];
      if (!wasCached[0]) {
        const config = {
          name,
          version,
          id
        };
        loadWidget(config, oldVersion);
      }
    }).catch(error => console.error(error));
  }

  /**
   * @method generatedStyleSheet
   * @description add stylesheet for loading states so we don't need another HTTP request
   * @param {Array} containers array of widget container Nodes
   * @param {Boolean} [spinner=true] should we use default spinner
   * @return {undefined}
   */
  generateStyleSheet(containers) {
    let spinner = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    const widgetStyleSheetEl = document.getElementById('sparta-widget-style-sheet');
    containers.forEach(dest => {
      if (!widgetStyleSheetEl) {
        var element = document.createElement('link');
        ;
        element.type = 'text/css';
        element.rel = 'stylesheet';
        element.href = window.sparta.widgets.styleSheetLocation;
        element.id = 'sparta-widget-style-sheet';
        document.head.appendChild(element);
        element.onload = function () {
          if (spinner) {
            dest.classList.add('loading', 'sparta-widget-loading');
            dest.style.background = `url('${window.sparta.widgets.spinnerLocation}') no-repeat center center`;
          }
        };
      } else {
        if (spinner) {
          dest.classList.add('loading', 'sparta-widget-loading');
          dest.style.background = `url('${window.sparta.widgets.spinnerLocation}') no-repeat center center`;
        }
      }
    });
  }

  /**
   * @method loadMultiScripts
   * @description loads all the JS scripts
   * @param {Object} anonymous object of the destination, cached bool and widget scripts
   * @return {Object<Promise>} a promise of the script loading
   */
  loadMultiScripts(_ref2) {
    let {
      dest,
      wasCached,
      widgetScripts
    } = _ref2;
    return new Promise((resolve, reject) => {
      if (wasCached) return resolve(true);
      widgetScripts.reduce((cur, next) => {
        return cur.then(() => loadScript(next, dest));
      }, Promise.resolve()).then(arrayOfResults => resolve(false)) // array of results for debugging, false for "was not cached"
      .catch(error => {
        console.error('Loading widget scripts failed.');
        reject(error);
      });
    });
  }

  /**
   * @method loadMultiCSS
   * @description loads all the JS scripts
   * @param {Object} anonymous object of the destination, cached bool, widget scripts and CSS links
   * @return {Object<Promise>} a promise of the CSS loading
   */
  loadMultiCSS(_ref3) {
    let {
      dest,
      wasCached,
      widgetScripts,
      cssData
    } = _ref3;
    return new Promise((resolve, reject) => {
      if (wasCached) return resolve(true);
      cssData.reduce((cur, next) => {
        return cur.then(() => loadCSS(next, dest));
      }, Promise.resolve()).then(arrayOfResults => resolve({
        dest,
        wasCached,
        widgetScripts
      })).catch(error => {
        console.error('Loading widget scripts failed.');
        reject(error);
      });
    });
  }
  prepareLoading(_ref4) {
    let {
      resp,
      data,
      wasCached
    } = _ref4;
    return new Promise((resolve, reject) => {
      const {
        containers,
        name,
        version,
        id,
        options,
        oldVersion,
        cssLinks
      } = data;
      const widgetVersion = oldVersion ? oldVersion : version;
      containers.forEach(currentContainer => {
        document.getElementById(currentContainer.id).innerHTML = resp;
      });
      addNamespaceClass({
        name,
        version,
        id
      });

      // grab the last item and load the JS into that
      const dest = document.getElementById(containers[containers.length - 1].id);
      dest.style.height = 'auto';

      // get all script tags so we can make the scripts load
      const widgetScripts = [].slice.call(dest.querySelectorAll('script') || []);
      const removeScriptsFromDom = scripts => scripts.forEach(script => script.parentNode.removeChild(script));
      dest.querySelector('[data-sparta-widget]').setAttribute('data-sparta-options', JSON.stringify(options));

      // if (wasCached) {
      //   // Since Scripts are added to <head> during first run, we need not to keep it during reload.
      //   const widgetModules = [...dest.querySelectorAll('[data-component="module"]')]
      //     .map(el => window.sparta.require[name][widgetVersion][id].require(`modules/${el.dataset.moduleRef}/${el.dataset.version}/js/${el.dataset.module}`));
      //   const bootstrapper = window.sparta.require[name][widgetVersion][id].require('global/sparta-bootstrap-utility');
      //   bootstrapper.default.init(widgetModules, { name, widgetVersion, id });
      // }
      const cssData = getCSSData(cssLinks);
      return resolve({
        dest,
        wasCached,
        widgetScripts,
        cssData
      });
    });
  }

  /**
   * @method getWidgetOverride
   * @description check for widget version override file.
   * @param {String} path where to load the widget from
   * @param {String} name name of widget to check for override
   * @param {String} versionKey version to check for override
   * @returns {Promise} Promise of fetching the widget override JSON
  */
  getWidgetOverride(path, name, versionKey) {
    const WIDGET_OVERRIDE_FILE_PATH = `${path}/spa/widgets/${name}/${name}.override.json`;
    return new Promise(function (resolve, reject) {
      const hostName = window.location.host;
      const xhrReq = new XMLHttpRequest();
      xhrReq.open('GET', WIDGET_OVERRIDE_FILE_PATH);
      xhrReq.onreadystatechange = function readyChange() {
        if (xhrReq.readyState !== 4) return;
        //if no file exists, return null to avoid an error
        if (xhrReq.status === 404) {
          resolve(null);
        }
        if (xhrReq.status < 200 || xhrReq.status >= 300) {
          reject({
            status: xhrReq.status,
            statusText: `Unable to load widget overrides: ${WIDGET_OVERRIDE_FILE_PATH} - ${xhrReq.statusText}`
          });
        } else {
          const overrideList = JSON.parse(xhrReq.responseText);
          let overrideVersion = null;
          const override = overrideList.hasOwnProperty(versionKey) ? overrideList[versionKey].version : null;
          if (override) {
            const exclusions = overrideList[versionKey].exclusions;
            const hostnamecheck = exclusions.domains.findIndex(hostname => hostName.includes(hostname));
            if (hostnamecheck === -1) {
              if (typeof spaParams !== 'undefined' && !exclusions.sites.includes(spaParams.siteName)) {
                overrideVersion = override;
                console.log(`${name} Widget Override with latest version ${overrideVersion}`);
              }
            }
          }
          resolve(overrideVersion);
        }
      };
      xhrReq.send();
    });
  }

  /**
   * @method widgetXHR
   * @description loads widget via AJAX request
   * @param {Array} containers array of widget container Nodes
   * @param {String} path where to load the widget from
   * @param {String} name the name of the widget
   * @param {String} version the version number of the widget to load
   * @param {String} language the language to attempt to load (en default)
   * @returns {Promise} Promise of fetching the widget code
   */
  widgetXHR(_ref5) {
    let {
      containers,
      path,
      name,
      version,
      id,
      options,
      language,
      oldVersion
    } = _ref5;
    const xhrResponseFromCache = getCachedWidget(name, version, id);
    let data = {
      containers,
      name,
      version,
      id,
      options,
      oldVersion
    };
    const self = this;
    const fromCache = xhrResponseFromCache && Object.keys(xhrResponseFromCache).length > 0;
    const reloadingWidget = document.getElementById(containers[0].id).querySelector('[data-sparta-widget]');
    const handleResp = resp => {
      // if (fromCache) return { resp, data, wasCached: true };
      const id = containers[0].id;
      const info = {
        resp,
        name,
        version,
        id
      };
      let updated_resp = createWidgetId(info, LOADER_VERSION);
      const linkTokenStart = '<link rel=';
      const tokenEnd = '\'>';
      const cssMatches = collectAndRemoveAllMatches(updated_resp, linkTokenStart, tokenEnd);
      updated_resp = cssMatches.updatedStr;
      data = Object.assign({}, data, {
        cssLinks: cssMatches.matches
      });
      setCachedWidget(name, version, id, {
        resp: updated_resp,
        data
      });
      const res = {
        resp: updated_resp,
        data,
        wasCached: false
      };
      return res;
    };
    if (fromCache && reloadingWidget) {
      return Promise.resolve({
        resp: xhrResponseFromCache.resp,
        data: xhrResponseFromCache.data,
        wasCached: true
      });
    }
    return new Promise(function (resolve, reject) {
      const xhrReq = new XMLHttpRequest();
      if (!options.withoutCredentials) xhrReq.withCredentials = true;
      const LANG_PATH = !language || language.toLowerCase() === 'en' ? '' : `${language.toLowerCase()}/`;
      const WIDGET_PATH = `${path}/spa/widgets/${name}/${version}/${LANG_PATH}index.html`;

      // execute AJAX request
      xhrReq.open('GET', WIDGET_PATH);
      xhrReq.onreadystatechange = function readyChange() {
        if (xhrReq.readyState !== 4) return; // request is not complete, move along
        if (xhrReq.status < 200 || xhrReq.status >= 300) {
          containers.forEach(dest => {
            dest.innerHTML = 'Unable to load widget';
            self.events.pub(EVENTS.ERROR_LOADING_WIDGET, {
              widget: {
                name: name,
                version,
                path: path,
                container: dest
              },
              xhrReq: this
            });
          });
          reject({
            status: xhrReq.status,
            statusText: `Unable to load widget: ${WIDGET_PATH} - ${xhrReq.statusText}`
          });
        } else {
          const res = handleResp(xhrReq.responseText);
          resolve(res);
        }
      };
      xhrReq.send();
    });
  }
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (WidgetLoaderClass);

/***/ }),

/***/ "./src/constants.js":
/*!**************************!*\
  !*** ./src/constants.js ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  LOADER_VERSION: '5.5.2',
  EVENTS: {
    ERROR_LOADING_WIDGET: 'errorLoadingWidget',
    REFRESH_WIDGET: 'refreshWidget'
  }
});

/***/ }),

/***/ "./src/internalFunctions.js":
/*!**********************************!*\
  !*** ./src/internalFunctions.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./constants */ "./src/constants.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils */ "./src/utils.js");


const widgetCache = {};
const {
  LOADER_VERSION
} = _constants__WEBPACK_IMPORTED_MODULE_0__.default;
const {
  getCacheKey,
  getComponent,
  removeScript,
  insertStr,
  findVal,
  addLoaderScript,
  ensureEl,
  createScript
} = _utils__WEBPACK_IMPORTED_MODULE_1__.default;
const createWidgetId = (info, LOADER_VERSION) => {
  const {
    resp,
    name,
    version,
    id
  } = info;
  const firstLineBreak = /\r|\n/.exec(resp);
  const minified = firstLineBreak && firstLineBreak.index > 1;
  const nameVersion = minified ? `["${name}"]["${version}"]` : `['${name}']['${version}']`;
  const nameVersionId = minified ? `${nameVersion}["${id}"]` : `${nameVersion}['${id}']`;
  const require = `window.sparta.require${nameVersionId}`;
  const widgetParams = `global.spaWidgetParams${nameVersionId}`;
  const widgetRules = `window.sparta.widgetRules${nameVersionId}`;
  const replaceScript = 'require.js';
  const replacementScript = `<script type="text/javascript">
    window.sparta.requireWidget.init({name: '${name}', version: '${version}', id: '${id}'});
  </script>`;
  const moduleOptions = {
    id,
    loader_version: LOADER_VERSION
  };
  const moduleOptsStr = JSON.stringify(moduleOptions);
  let updatedResp = resp;
  const replaceStrings = [{
    [`data-sparta-wrapper="${name}-${version}"`]: `data-sparta-wrapper="${name}-${version}-${id}"`
  }, {
    [`data-sparta-container="${name}"`]: `data-sparta-container="${name}" data-id="${id}"`
  }, {
    [`data-module="${name}"`]: `data-module="${name}" data-options='${moduleOptsStr}'`
  }, {
    [`${nameVersion} || {`]: `${nameVersion} || {};\n${require} = ${require} || { \n`
  }, {
    [`${nameVersion}.`]: `${nameVersionId}.`
  }, {
    [`${nameVersion} = {};`]: `${nameVersion} = {};\n\tif (!${widgetParams}) ${widgetParams} = {};`
  }, {
    [`${nameVersion} = [];`]: `${nameVersion} = {}; ${widgetRules} = ${widgetRules} || {}; ${widgetRules} = [];`
  }, {
    [`name: '${name}', version: '${version}'`]: `name: '${name}', version: '${version}', id: '${id}'`
  }, {
    // minified matches below
    [`${nameVersion}||{`]: `${nameVersion}||{},${require}=${require}||{`
  }, {
    [`${nameVersion}={}),`]: `${nameVersion}={}),e.spaWidgetParams${nameVersionId}||(e.spaWidgetParams${nameVersionId}={}),`
  }, {
    [`${nameVersion}=[],`]: `${nameVersion}={},${widgetRules}=${widgetRules}||{},${widgetRules}=[],`
  }, {
    [`name:"${name}",version:"${version}"`]: `name:"${name}",version:"${version}",id:"${id}"`
  }];
  replaceStrings.forEach(obj => {
    // add ID to the output of the AJAX resp by rules above
    const key = Object.keys(obj)[0];
    const strippedKey = key.replace(/[[\]{}()*+?,.\\^$|#]/g, '\\$&'); // cannot have -, \\s,  in the stripping
    if (updatedResp.includes(key)) {
      const regex = RegExp(strippedKey, 'gi');
      updatedResp = updatedResp.replace(regex, obj[key]);
    }
  });
  const cleanStrObj = removeScript(replaceScript, updatedResp);
  const cleanedResp = cleanStrObj.string;
  const entryPoint = cleanStrObj.cursor;
  updatedResp = insertStr(cleanedResp, replacementScript, entryPoint);
  return updatedResp;
};

/**
 * Creates and loads a CSS link and appends it to the head of the page.
 * @param {String|Object} data a string or object of CSS resource info
 * @return {undefined}
 */
const loadCSS = function () {
  let data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  return new Promise((resolve, reject) => {
    const element = document.createElement('link');
    const parent = 'head';
    const attr = 'href';
    element.type = 'text/css';
    element.rel = 'stylesheet';
    const {
      href: url,
      dataIncludes
    } = data;
    // Important success and error for the promise
    element.onload = () => resolve(url);
    element.onerror = () => reject(url);

    // Inject into document to kick off loading
    element[attr] = url;
    if (dataIncludes) element.setAttribute('data-includes', dataIncludes);
    document[parent].appendChild(element);
  });
};

/**
 * Creates and loads a Javascript link.
 * @param {String} script a stringified copy of a javascript script
 * @param {String} dest an optional destination for the script to append to
 * @return {undefined}
 */
const loadScript = function (script) {
  let dest = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'head';
  return new Promise((resolve, reject) => {
    const jscript = createScript(script);
    jscript.onload = () => resolve(true);
    jscript.error = err => reject(`script did not load: ${err}`);
    // Append the script to the head or destination
    if (dest === 'head') {
      document.getElementsByTagName(dest)[0].appendChild(jscript);
    } else {
      dest.appendChild(jscript);
    }
    if (!jscript.src) resolve(true);
  });
};

/**
 * To get Widget Loader Spinnner path.
 * @returns {string} Widget Loader spinner path.
 */
const getWidgetLoaderSpinnerAndCssPath = () => {
  let spinnerLocation = null;
  let styleSheetLocation = null;
  return function () {
    if (spinnerLocation && styleSheetLocation) {
      return {
        spinnerLocation,
        styleSheetLocation
      };
    }
    const scripts = [].slice.call(document.getElementsByTagName('script') || []);
    const widgetLoaderIndexRegex = '(http|https)://(.)*/spa/widgets/loader/([0-9]+).([0-9]+).([0-9]+)(-alpha)?/index.js';
    const widgetLoaderScripts = scripts.reverse().filter(script => script.src && script.src.match(widgetLoaderIndexRegex));
    if (widgetLoaderScripts && widgetLoaderScripts.length) {
      let currentScriptPath = widgetLoaderScripts[0].src.split('/');
      currentScriptPath[currentScriptPath.length - 1] = 'loading.gif';
      spinnerLocation = currentScriptPath.join('/');
      currentScriptPath = widgetLoaderScripts[0].src.split('/');
      currentScriptPath[currentScriptPath.length - 1] = 'loader.css';
      styleSheetLocation = currentScriptPath.join('/');
      return {
        spinnerLocation,
        styleSheetLocation
      };
    } else {
      console.error('Widget loader script does not exist');
      return false;
    }
  };
};

/**
 * To get mem cached widget response.
 * @param {string} name Widget name.
 * @param {string} version Widget version.
 * @param {string} id Widget ID
 * @returns {string} Cached Widget response.
 */
function getCachedWidget(name, version, id) {
  const cacheKey = getCacheKey(name, version, id);
  return widgetCache[cacheKey];
}

/**
 * To set mem cached widget response.
 * @param {string} name Widget name.
 * @param {string} version Widget version.
 * @param {string} id Widget ID
 * @returns {undefined} returns nothing
 */
function setCachedWidget(name, version, id, obj) {
  const cacheKey = getCacheKey(name, version, id);
  widgetCache[cacheKey] = {
    ...widgetCache[cacheKey],
    ...obj
  };
}

/**
 * To remove widget response from mem cache.
 * @param {string} name Widget name.
 * @param {string} version Widget version.
 * @param {string} id Widget ID
 * @returns {boolean} True/False for deletion of an object from cache.
 */
function cleanCachedWidget(name, version, id) {
  const cacheKey = getCacheKey(name, version, id);
  delete widgetCache[cacheKey];
}
const subscriptionPrototype = {
  pub: function (eventName) {
    let detail = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    // creates and dispatches a native CustomEvent on our DispatcherElement
    if (!detail.widget || detail.widget.id === this.dispatcherElement.id) {
      const evt = new CustomEvent(eventName, {
        detail
      });
      this.dispatcherElement.dispatchEvent(evt);
    }
  },
  sub: function (eventName, callback) {
    //attaches an event listener to our DispatcherElement
    this.eventCollection.push({
      type: 'widget',
      name: eventName,
      fn: callback
    });
    this.dispatcherElement.addEventListener(eventName, callback);
  },
  unsub: function (eventName, callback) {
    // allows subscriber to unsubscribe from event
    this.dispatcherElement.removeEventListener(eventName, callback);
  },
  once: function (eventName, callback) {
    //allows subscriber to listen to one instance of event and then unsub
    const fn = e => {
      this.dispatcherElement.removeEventListener(eventName, fn);
      callback(e);
    };
    this.dispatcherElement.addEventListener(eventName, fn);
  }
};
const eventsPrototype = id => {
  const dispatcherElement = {
    dispatcherElement: id
  };
  const eventCollection = {
    eventCollection: []
  };
  return Object.assign({}, subscriptionPrototype, dispatcherElement, eventCollection);
};
const addNamespaceClass = info => {
  const {
    name,
    version,
    id
  } = info;
  const spartaWrapperEl = document.querySelector(`[data-sparta-wrapper="${name}-${version}-${id}"]`);
  const dashedVersion = version.replace(/\./g, '-');
  const nameVersionNamespace = `${name}-${dashedVersion}`;
  spartaWrapperEl.classList.add(nameVersionNamespace);
};
const loadWidget = function (config) {
  let oldVersion = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  const {
    name,
    version,
    id
  } = config;
  // hijack require and define definitions and add them to a widget instance
  window.sparta.require[name][version][id].require = window.sparta.require[name][version].require;
  window.sparta.require[name][version][id].define = window.sparta.require[name][version].define;
  window.sparta.require[name][version][id].load();
  if (oldVersion) {
    window.sparta.require[name][oldVersion] = window.sparta.require[name][version];
  }
};

/**
 * @method createWidgetEvents
 * @param {Object|undefined} widgets an object of widgets or not
 * @param {Object} container dom object of the dispatch container
 * @returns {undefined} sets events
 */
function createWidgetEvents() {
  let container = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  let widgets = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  const proto = Object.create(eventsPrototype(container)); // a new widgets event obj for lateral widget communication
  if (widgets) return widgets.events = proto;
  return proto;
}

/**
 * @method refreshWidget
 * @description refreshes widget with new data
 * @param {Object} config for the widget
 * @param {Object} data new data for the widget
 * @returns {Null} returns nothing
 */
const refreshWidget = function (config) {
  let data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  if (!config.options) config.options = {};
  const {
    name,
    version,
    container: id,
    loaderVersion,
    options
  } = config;
  if (!options.data) options.data = {};
  options.data = data;
  const updatedConfig = Object.assign({}, config, {
    enableWidgetRefresh: false,
    enableWidgetCache: true
  });
  const widgetLoader = window.sparta.widgets[loaderVersion][name][version][id];
  widgetLoader.load(updatedConfig);
  return widgetLoader;
};

/**
 * @method destroyWidget
 * @description destroys a widget on a given page
 * @param {Object} config for the widget
 * @returns {Null} returns nothing
 */
const destroyWidget = config => {
  const {
    name,
    version,
    container: id,
    loaderVersion
  } = config;
  if (window.sparta.require && window.sparta.require[name] && window.sparta.require[name][version] && window.sparta.require[name][version][id]) {
    const requireWidget = window.sparta.require[name][version][id];
    const widget = window.sparta.widgets[loaderVersion][name][version][id];
    const widgetEvents = widget.events;
    const dispatcherEl = widgetEvents.dispatcherElement;
    widgetEvents.eventCollection.forEach(widgetEvent => {
      const {
        name: eventName,
        fn,
        type
      } = widgetEvent;
      if (type === 'sparta') {
        getComponent('js/sparta-events', requireWidget).unsubByEvent(eventName);
      } else if (type === 'widget') {
        getComponent('js/sparta-widget-events', requireWidget).unsub(eventName, fn);
      } else {
        dispatcherEl.removeEventListener(eventName, fn);
      }
    });
    widgetEvents.eventCollection.length = 0;
    delete window.sparta.require[name][version][id];
  }
  const widget = document.querySelector(`#${id}`);
  widget.innerHTML = '';
  const widgetClone = widget.cloneNode(true);
  widget.parentNode.replaceChild(widgetClone, widget);
  widgetClone.classList.remove('sparta-widget-loading');
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  addNamespaceClass,
  createWidgetId,
  getCachedWidget,
  setCachedWidget,
  cleanCachedWidget,
  loadCSS,
  loadScript,
  loadWidget,
  getWidgetLoaderSpinnerAndCssPath,
  createWidgetEvents,
  refreshWidget,
  destroyWidget
});

/***/ }),

/***/ "./src/requireWidget.js":
/*!******************************!*\
  !*** ./src/requireWidget.js ***!
  \******************************/
/***/ (() => {

window.sparta = window.sparta || {};
window.sparta.requireWidget = window.sparta.requireWidget || function () {
  return {
    init: function (widgetInfo) {
      const {
        name,
        version,
        id
      } = widgetInfo;
      (function () {
        var requirejs, require, define;
        (function (global) {
          var req,
            s,
            head,
            baseElement,
            dataMain,
            src,
            interactiveScript,
            currentlyAddingScript,
            mainScript,
            subPath,
            version = '2.2.0',
            commentRegExp = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg,
            cjsRequireRegExp = /[^.]\s*require\s*\(\s*["']([^'"\s]+)["']\s*\)/g,
            jsSuffixRegExp = /\.js$/,
            currDirRegExp = /^\.\//,
            op = Object.prototype,
            ostring = op.toString,
            hasOwn = op.hasOwnProperty,
            isBrowser = !!(typeof window !== 'undefined' && typeof navigator !== 'undefined' && window.document),
            isWebWorker = !isBrowser && typeof importScripts !== 'undefined',
            readyRegExp = isBrowser && navigator.platform === 'PLAYSTATION 3' ? /^complete$/ : /^(complete|loaded)$/,
            defContextName = '_',
            isOpera = typeof opera !== 'undefined' && opera.toString() === '[object Opera]',
            contexts = {},
            cfg = {},
            globalDefQueue = [],
            useInteractive = false;
          function commentReplace(match, multi, multiText, singlePrefix) {
            return singlePrefix || '';
          }
          function isFunction(it) {
            return ostring.call(it) === '[object Function]';
          }
          function isArray(it) {
            return ostring.call(it) === '[object Array]';
          }
          function each(ary, func) {
            if (ary) {
              var i;
              for (i = 0; i < ary.length; i += 1) {
                if (ary[i] && func(ary[i], i, ary)) {
                  break;
                }
              }
            }
          }
          function eachReverse(ary, func) {
            if (ary) {
              var i;
              for (i = ary.length - 1; i > -1; i -= 1) {
                if (ary[i] && func(ary[i], i, ary)) {
                  break;
                }
              }
            }
          }
          function hasProp(obj, prop) {
            return hasOwn.call(obj, prop);
          }
          function getOwn(obj, prop) {
            return hasProp(obj, prop) && obj[prop];
          }
          function eachProp(obj, func) {
            var prop;
            for (prop in obj) {
              if (hasProp(obj, prop)) {
                if (func(obj[prop], prop)) {
                  break;
                }
              }
            }
          }
          function mixin(target, source, force, deepStringMixin) {
            if (source) {
              eachProp(source, function (value, prop) {
                if (force || !hasProp(target, prop)) {
                  if (deepStringMixin && typeof value === 'object' && value && !isArray(value) && !isFunction(value) && !(value instanceof RegExp)) {
                    if (!target[prop]) {
                      target[prop] = {};
                    }
                    mixin(target[prop], value, force, deepStringMixin);
                  } else {
                    target[prop] = value;
                  }
                }
              });
            }
            return target;
          }
          function bind(obj, fn) {
            return function () {
              return fn.apply(obj, arguments);
            };
          }
          function scripts() {
            return document.getElementsByTagName('script');
          }
          function defaultOnError(err) {
            throw err;
          }
          function getGlobal(value) {
            if (!value) {
              return value;
            }
            var g = global;
            each(value.split('.'), function (part) {
              g = g[part];
            });
            return g;
          }
          function makeError(id, msg, err, requireModules) {
            var e = new Error(msg + '\nhttp://requirejs.org/docs/errors.html#' + id);
            e.requireType = id;
            e.requireModules = requireModules;
            if (err) {
              e.originalError = err;
            }
            return e;
          }
          if (typeof define !== 'undefined') {
            return;
          }
          if (typeof requirejs !== 'undefined') {
            if (isFunction(requirejs)) {
              return;
            }
            cfg = requirejs;
            requirejs = undefined;
          }
          if (typeof require !== 'undefined' && !isFunction(require)) {
            cfg = require;
            require = undefined;
          }
          function newContext(contextName) {
            var inCheckLoaded,
              Module,
              context,
              handlers,
              checkLoadedTimeoutId,
              config = {
                waitSeconds: 7,
                baseUrl: './',
                paths: {},
                bundles: {},
                pkgs: {},
                shim: {},
                config: {}
              },
              registry = {},
              enabledRegistry = {},
              undefEvents = {},
              defQueue = [],
              defined = {},
              urlFetched = {},
              bundlesMap = {},
              requireCounter = 1,
              unnormalizedCounter = 1;
            function trimDots(ary) {
              var i, part;
              for (i = 0; i < ary.length; i++) {
                part = ary[i];
                if (part === '.') {
                  ary.splice(i, 1);
                  i -= 1;
                } else if (part === '..') {
                  if (i === 0 || i === 1 && ary[2] === '..' || ary[i - 1] === '..') {
                    continue;
                  } else if (i > 0) {
                    ary.splice(i - 1, 2);
                    i -= 2;
                  }
                }
              }
            }
            function normalize(name, baseName, applyMap) {
              var pkgMain,
                mapValue,
                nameParts,
                i,
                j,
                nameSegment,
                lastIndex,
                foundMap,
                foundI,
                foundStarMap,
                starI,
                normalizedBaseParts,
                baseParts = baseName && baseName.split('/'),
                map = config.map,
                starMap = map && map['*'];
              if (name) {
                name = name.split('/');
                lastIndex = name.length - 1;
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                  name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }
                if (name[0].charAt(0) === '.' && baseParts) {
                  normalizedBaseParts = baseParts.slice(0, baseParts.length - 1);
                  name = normalizedBaseParts.concat(name);
                }
                trimDots(name);
                name = name.join('/');
              }
              if (applyMap && map && (baseParts || starMap)) {
                nameParts = name.split('/');
                outerLoop: for (i = nameParts.length; i > 0; i -= 1) {
                  nameSegment = nameParts.slice(0, i).join('/');
                  if (baseParts) {
                    for (j = baseParts.length; j > 0; j -= 1) {
                      mapValue = getOwn(map, baseParts.slice(0, j).join('/'));
                      if (mapValue) {
                        mapValue = getOwn(mapValue, nameSegment);
                        if (mapValue) {
                          foundMap = mapValue;
                          foundI = i;
                          break outerLoop;
                        }
                      }
                    }
                  }
                  if (!foundStarMap && starMap && getOwn(starMap, nameSegment)) {
                    foundStarMap = getOwn(starMap, nameSegment);
                    starI = i;
                  }
                }
                if (!foundMap && foundStarMap) {
                  foundMap = foundStarMap;
                  foundI = starI;
                }
                if (foundMap) {
                  nameParts.splice(0, foundI, foundMap);
                  name = nameParts.join('/');
                }
              }
              pkgMain = getOwn(config.pkgs, name);
              return pkgMain ? pkgMain : name;
            }
            function removeScript(name) {
              if (isBrowser) {
                each(scripts(), function (scriptNode) {
                  if (scriptNode.getAttribute('data-requiremodule') === name && scriptNode.getAttribute('data-requirecontext') === context.contextName) {
                    scriptNode.parentNode.removeChild(scriptNode);
                    return true;
                  }
                });
              }
            }
            function hasPathFallback(id) {
              var pathConfig = getOwn(config.paths, id);
              if (pathConfig && isArray(pathConfig) && pathConfig.length > 1) {
                pathConfig.shift();
                context.require.undef(id);
                context.makeRequire(null, {
                  skipMap: true
                })([id]);
                return true;
              }
            }
            function splitPrefix(name) {
              var prefix,
                index = name ? name.indexOf('!') : -1;
              if (index > -1) {
                prefix = name.substring(0, index);
                name = name.substring(index + 1, name.length);
              }
              return [prefix, name];
            }
            function makeModuleMap(name, parentModuleMap, isNormalized, applyMap) {
              var url,
                pluginModule,
                suffix,
                nameParts,
                prefix = null,
                parentName = parentModuleMap ? parentModuleMap.name : null,
                originalName = name,
                isDefine = true,
                normalizedName = '';
              if (!name) {
                isDefine = false;
                name = '_@r' + (requireCounter += 1);
              }
              nameParts = splitPrefix(name);
              prefix = nameParts[0];
              name = nameParts[1];
              if (prefix) {
                prefix = normalize(prefix, parentName, applyMap);
                pluginModule = getOwn(defined, prefix);
              }
              if (name) {
                if (prefix) {
                  if (pluginModule && pluginModule.normalize) {
                    normalizedName = pluginModule.normalize(name, function (name) {
                      return normalize(name, parentName, applyMap);
                    });
                  } else {
                    normalizedName = name.indexOf('!') === -1 ? normalize(name, parentName, applyMap) : name;
                  }
                } else {
                  normalizedName = normalize(name, parentName, applyMap);
                  nameParts = splitPrefix(normalizedName);
                  prefix = nameParts[0];
                  normalizedName = nameParts[1];
                  isNormalized = true;
                  url = context.nameToUrl(normalizedName);
                }
              }
              suffix = prefix && !pluginModule && !isNormalized ? '_unnormalized' + (unnormalizedCounter += 1) : '';
              return {
                prefix: prefix,
                name: normalizedName,
                parentMap: parentModuleMap,
                unnormalized: !!suffix,
                url: url,
                originalName: originalName,
                isDefine: isDefine,
                id: (prefix ? prefix + '!' + normalizedName : normalizedName) + suffix
              };
            }
            function getModule(depMap) {
              var id = depMap.id,
                mod = getOwn(registry, id);
              if (!mod) {
                mod = registry[id] = new context.Module(depMap);
              }
              return mod;
            }
            function on(depMap, name, fn) {
              var id = depMap.id,
                mod = getOwn(registry, id);
              if (hasProp(defined, id) && (!mod || mod.defineEmitComplete)) {
                if (name === 'defined') {
                  fn(defined[id]);
                }
              } else {
                mod = getModule(depMap);
                if (mod.error && name === 'error') {
                  fn(mod.error);
                } else {
                  mod.on(name, fn);
                }
              }
            }
            function onError(err, errback) {
              var ids = err.requireModules,
                notified = false;
              if (errback) {
                errback(err);
              } else {
                each(ids, function (id) {
                  var mod = getOwn(registry, id);
                  if (mod) {
                    mod.error = err;
                    if (mod.events.error) {
                      notified = true;
                      mod.emit('error', err);
                    }
                  }
                });
                if (!notified) {
                  req.onError(err);
                }
              }
            }
            function takeGlobalQueue() {
              if (globalDefQueue.length) {
                each(globalDefQueue, function (queueItem) {
                  var id = queueItem[0];
                  if (typeof id === 'string') {
                    context.defQueueMap[id] = true;
                  }
                  defQueue.push(queueItem);
                });
                globalDefQueue = [];
              }
            }
            handlers = {
              'require': function (mod) {
                if (mod.require) {
                  return mod.require;
                } else {
                  return mod.require = context.makeRequire(mod.map);
                }
              },
              'exports': function (mod) {
                mod.usingExports = true;
                if (mod.map.isDefine) {
                  if (mod.exports) {
                    return defined[mod.map.id] = mod.exports;
                  } else {
                    return mod.exports = defined[mod.map.id] = {};
                  }
                }
              },
              'module': function (mod) {
                if (mod.module) {
                  return mod.module;
                } else {
                  return mod.module = {
                    id: mod.map.id,
                    uri: mod.map.url,
                    config: function () {
                      return getOwn(config.config, mod.map.id) || {};
                    },
                    exports: mod.exports || (mod.exports = {})
                  };
                }
              }
            };
            function cleanRegistry(id) {
              delete registry[id];
              delete enabledRegistry[id];
            }
            function breakCycle(mod, traced, processed) {
              var id = mod.map.id;
              if (mod.error) {
                mod.emit('error', mod.error);
              } else {
                traced[id] = true;
                each(mod.depMaps, function (depMap, i) {
                  var depId = depMap.id,
                    dep = getOwn(registry, depId);
                  if (dep && !mod.depMatched[i] && !processed[depId]) {
                    if (getOwn(traced, depId)) {
                      mod.defineDep(i, defined[depId]);
                      mod.check();
                    } else {
                      breakCycle(dep, traced, processed);
                    }
                  }
                });
                processed[id] = true;
              }
            }
            function checkLoaded() {
              var err,
                usingPathFallback,
                waitInterval = config.waitSeconds * 1000,
                expired = waitInterval && context.startTime + waitInterval < new Date().getTime(),
                noLoads = [],
                reqCalls = [],
                stillLoading = false,
                needCycleCheck = true;
              if (inCheckLoaded) {
                return;
              }
              inCheckLoaded = true;
              eachProp(enabledRegistry, function (mod) {
                var map = mod.map,
                  modId = map.id;
                if (!mod.enabled) {
                  return;
                }
                if (!map.isDefine) {
                  reqCalls.push(mod);
                }
                if (!mod.error) {
                  if (!mod.inited && expired) {
                    if (hasPathFallback(modId)) {
                      usingPathFallback = true;
                      stillLoading = true;
                    } else {
                      noLoads.push(modId);
                      removeScript(modId);
                    }
                  } else if (!mod.inited && mod.fetched && map.isDefine) {
                    stillLoading = true;
                    if (!map.prefix) {
                      return needCycleCheck = false;
                    }
                  }
                }
              });
              if (expired && noLoads.length) {
                err = makeError('timeout', 'Load timeout for modules: ' + noLoads, null, noLoads);
                err.contextName = context.contextName;
                return onError(err);
              }
              if (needCycleCheck) {
                each(reqCalls, function (mod) {
                  breakCycle(mod, {}, {});
                });
              }
              if ((!expired || usingPathFallback) && stillLoading) {
                if ((isBrowser || isWebWorker) && !checkLoadedTimeoutId) {
                  checkLoadedTimeoutId = setTimeout(function () {
                    checkLoadedTimeoutId = 0;
                    checkLoaded();
                  }, 50);
                }
              }
              inCheckLoaded = false;
            }
            Module = function (map) {
              this.events = getOwn(undefEvents, map.id) || {};
              this.map = map;
              this.shim = getOwn(config.shim, map.id);
              this.depExports = [];
              this.depMaps = [];
              this.depMatched = [];
              this.pluginMaps = {};
              this.depCount = 0;
            };
            Module.prototype = {
              init: function (depMaps, factory, errback, options) {
                options = options || {};
                if (this.inited) {
                  return;
                }
                this.factory = factory;
                if (errback) {
                  this.on('error', errback);
                } else if (this.events.error) {
                  errback = bind(this, function (err) {
                    this.emit('error', err);
                  });
                }
                this.depMaps = depMaps && depMaps.slice(0);
                this.errback = errback;
                this.inited = true;
                this.ignore = options.ignore;
                if (options.enabled || this.enabled) {
                  this.enable();
                } else {
                  this.check();
                }
              },
              defineDep: function (i, depExports) {
                if (!this.depMatched[i]) {
                  this.depMatched[i] = true;
                  this.depCount -= 1;
                  this.depExports[i] = depExports;
                }
              },
              fetch: function () {
                if (this.fetched) {
                  return;
                }
                this.fetched = true;
                context.startTime = new Date().getTime();
                var map = this.map;
                if (this.shim) {
                  context.makeRequire(this.map, {
                    enableBuildCallback: true
                  })(this.shim.deps || [], bind(this, function () {
                    return map.prefix ? this.callPlugin() : this.load();
                  }));
                } else {
                  return map.prefix ? this.callPlugin() : this.load();
                }
              },
              load: function () {
                var url = this.map.url;
                if (!urlFetched[url]) {
                  urlFetched[url] = true;
                  context.load(this.map.id, url);
                }
              },
              check: function () {
                if (!this.enabled || this.enabling) {
                  return;
                }
                var err,
                  cjsModule,
                  id = this.map.id,
                  depExports = this.depExports,
                  exports = this.exports,
                  factory = this.factory;
                if (!this.inited) {
                  if (!hasProp(context.defQueueMap, id)) {
                    this.fetch();
                  }
                } else if (this.error) {
                  this.emit('error', this.error);
                } else if (!this.defining) {
                  this.defining = true;
                  if (this.depCount < 1 && !this.defined) {
                    if (isFunction(factory)) {
                      if (this.events.error && this.map.isDefine || req.onError !== defaultOnError) {
                        try {
                          exports = context.execCb(id, factory, depExports, exports);
                        } catch (e) {
                          err = e;
                        }
                      } else {
                        exports = context.execCb(id, factory, depExports, exports);
                      }
                      if (this.map.isDefine && exports === undefined) {
                        cjsModule = this.module;
                        if (cjsModule) {
                          exports = cjsModule.exports;
                        } else if (this.usingExports) {
                          exports = this.exports;
                        }
                      }
                      if (err) {
                        err.requireMap = this.map;
                        err.requireModules = this.map.isDefine ? [this.map.id] : null;
                        err.requireType = this.map.isDefine ? 'define' : 'require';
                        return onError(this.error = err);
                      }
                    } else {
                      exports = factory;
                    }
                    this.exports = exports;
                    if (this.map.isDefine && !this.ignore) {
                      defined[id] = exports;
                      if (req.onResourceLoad) {
                        var resLoadMaps = [];
                        each(this.depMaps, function (depMap) {
                          resLoadMaps.push(depMap.normalizedMap || depMap);
                        });
                        req.onResourceLoad(context, this.map, resLoadMaps);
                      }
                    }
                    cleanRegistry(id);
                    this.defined = true;
                  }
                  this.defining = false;
                  if (this.defined && !this.defineEmitted) {
                    this.defineEmitted = true;
                    this.emit('defined', this.exports);
                    this.defineEmitComplete = true;
                  }
                }
              },
              callPlugin: function () {
                var map = this.map,
                  id = map.id,
                  pluginMap = makeModuleMap(map.prefix);
                this.depMaps.push(pluginMap);
                on(pluginMap, 'defined', bind(this, function (plugin) {
                  var load,
                    normalizedMap,
                    normalizedMod,
                    bundleId = getOwn(bundlesMap, this.map.id),
                    name = this.map.name,
                    parentName = this.map.parentMap ? this.map.parentMap.name : null,
                    localRequire = context.makeRequire(map.parentMap, {
                      enableBuildCallback: true
                    });
                  if (this.map.unnormalized) {
                    if (plugin.normalize) {
                      name = plugin.normalize(name, function (name) {
                        return normalize(name, parentName, true);
                      }) || '';
                    }
                    normalizedMap = makeModuleMap(map.prefix + '!' + name, this.map.parentMap);
                    on(normalizedMap, 'defined', bind(this, function (value) {
                      this.map.normalizedMap = normalizedMap;
                      this.init([], function () {
                        return value;
                      }, null, {
                        enabled: true,
                        ignore: true
                      });
                    }));
                    normalizedMod = getOwn(registry, normalizedMap.id);
                    if (normalizedMod) {
                      this.depMaps.push(normalizedMap);
                      if (this.events.error) {
                        normalizedMod.on('error', bind(this, function (err) {
                          this.emit('error', err);
                        }));
                      }
                      normalizedMod.enable();
                    }
                    return;
                  }
                  if (bundleId) {
                    this.map.url = context.nameToUrl(bundleId);
                    this.load();
                    return;
                  }
                  load = bind(this, function (value) {
                    this.init([], function () {
                      return value;
                    }, null, {
                      enabled: true
                    });
                  });
                  load.error = bind(this, function (err) {
                    this.inited = true;
                    this.error = err;
                    err.requireModules = [id];
                    eachProp(registry, function (mod) {
                      if (mod.map.id.indexOf(id + '_unnormalized') === 0) {
                        cleanRegistry(mod.map.id);
                      }
                    });
                    onError(err);
                  });
                  load.fromText = bind(this, function (text, textAlt) {
                    var moduleName = map.name,
                      moduleMap = makeModuleMap(moduleName),
                      hasInteractive = useInteractive;
                    if (textAlt) {
                      text = textAlt;
                    }
                    if (hasInteractive) {
                      useInteractive = false;
                    }
                    getModule(moduleMap);
                    if (hasProp(config.config, id)) {
                      config.config[moduleName] = config.config[id];
                    }
                    try {
                      req.exec(text);
                    } catch (e) {
                      return onError(makeError('fromtexteval', 'fromText eval for ' + id + ' failed: ' + e, e, [id]));
                    }
                    if (hasInteractive) {
                      useInteractive = true;
                    }
                    this.depMaps.push(moduleMap);
                    context.completeLoad(moduleName);
                    localRequire([moduleName], load);
                  });
                  plugin.load(map.name, localRequire, load, config);
                }));
                context.enable(pluginMap, this);
                this.pluginMaps[pluginMap.id] = pluginMap;
              },
              enable: function () {
                enabledRegistry[this.map.id] = this;
                this.enabled = true;
                this.enabling = true;
                each(this.depMaps, bind(this, function (depMap, i) {
                  var id, mod, handler;
                  if (typeof depMap === 'string') {
                    depMap = makeModuleMap(depMap, this.map.isDefine ? this.map : this.map.parentMap, false, !this.skipMap);
                    this.depMaps[i] = depMap;
                    handler = getOwn(handlers, depMap.id);
                    if (handler) {
                      this.depExports[i] = handler(this);
                      return;
                    }
                    this.depCount += 1;
                    on(depMap, 'defined', bind(this, function (depExports) {
                      if (this.undefed) {
                        return;
                      }
                      this.defineDep(i, depExports);
                      this.check();
                    }));
                    if (this.errback) {
                      on(depMap, 'error', bind(this, this.errback));
                    } else if (this.events.error) {
                      on(depMap, 'error', bind(this, function (err) {
                        this.emit('error', err);
                      }));
                    }
                  }
                  id = depMap.id;
                  mod = registry[id];
                  if (!hasProp(handlers, id) && mod && !mod.enabled) {
                    context.enable(depMap, this);
                  }
                }));
                eachProp(this.pluginMaps, bind(this, function (pluginMap) {
                  var mod = getOwn(registry, pluginMap.id);
                  if (mod && !mod.enabled) {
                    context.enable(pluginMap, this);
                  }
                }));
                this.enabling = false;
                this.check();
              },
              on: function (name, cb) {
                var cbs = this.events[name];
                if (!cbs) {
                  cbs = this.events[name] = [];
                }
                cbs.push(cb);
              },
              emit: function (name, evt) {
                each(this.events[name], function (cb) {
                  cb(evt);
                });
                if (name === 'error') {
                  delete this.events[name];
                }
              }
            };
            function callGetModule(args) {
              if (!hasProp(defined, args[0])) {
                getModule(makeModuleMap(args[0], null, true)).init(args[1], args[2]);
              }
            }
            function removeListener(node, func, name, ieName) {
              if (node.detachEvent && !isOpera) {
                if (ieName) {
                  node.detachEvent(ieName, func);
                }
              } else {
                node.removeEventListener(name, func, false);
              }
            }
            function getScriptData(evt) {
              var node = evt.currentTarget || evt.srcElement;
              removeListener(node, context.onScriptLoad, 'load', 'onreadystatechange');
              removeListener(node, context.onScriptError, 'error');
              return {
                node: node,
                id: node && node.getAttribute('data-requiremodule')
              };
            }
            function intakeDefines() {
              var args;
              takeGlobalQueue();
              while (defQueue.length) {
                args = defQueue.shift();
                if (args[0] === null) {
                  return onError(makeError('mismatch', 'Mismatched anonymous define() module: ' + args[args.length - 1]));
                } else {
                  callGetModule(args);
                }
              }
              context.defQueueMap = {};
            }
            context = {
              config: config,
              contextName: contextName,
              registry: registry,
              defined: defined,
              urlFetched: urlFetched,
              defQueue: defQueue,
              defQueueMap: {},
              Module: Module,
              makeModuleMap: makeModuleMap,
              nextTick: req.nextTick,
              onError: onError,
              configure: function (cfg) {
                if (cfg.baseUrl) {
                  if (cfg.baseUrl.charAt(cfg.baseUrl.length - 1) !== '/') {
                    cfg.baseUrl += '/';
                  }
                }
                if (typeof cfg.urlArgs === 'string') {
                  var urlArgs = cfg.urlArgs;
                  cfg.urlArgs = function (id, url) {
                    return (url.indexOf('?') === -1 ? '?' : '&') + urlArgs;
                  };
                }
                var shim = config.shim,
                  objs = {
                    paths: true,
                    bundles: true,
                    config: true,
                    map: true
                  };
                eachProp(cfg, function (value, prop) {
                  if (objs[prop]) {
                    if (!config[prop]) {
                      config[prop] = {};
                    }
                    mixin(config[prop], value, true, true);
                  } else {
                    config[prop] = value;
                  }
                });
                if (cfg.bundles) {
                  eachProp(cfg.bundles, function (value, prop) {
                    each(value, function (v) {
                      if (v !== prop) {
                        bundlesMap[v] = prop;
                      }
                    });
                  });
                }
                if (cfg.shim) {
                  eachProp(cfg.shim, function (value, id) {
                    if (isArray(value)) {
                      value = {
                        deps: value
                      };
                    }
                    if ((value.exports || value.init) && !value.exportsFn) {
                      value.exportsFn = context.makeShimExports(value);
                    }
                    shim[id] = value;
                  });
                  config.shim = shim;
                }
                if (cfg.packages) {
                  each(cfg.packages, function (pkgObj) {
                    var location, name;
                    pkgObj = typeof pkgObj === 'string' ? {
                      name: pkgObj
                    } : pkgObj;
                    name = pkgObj.name;
                    location = pkgObj.location;
                    if (location) {
                      config.paths[name] = pkgObj.location;
                    }
                    config.pkgs[name] = pkgObj.name + '/' + (pkgObj.main || 'main').replace(currDirRegExp, '').replace(jsSuffixRegExp, '');
                  });
                }
                eachProp(registry, function (mod, id) {
                  if (!mod.inited && !mod.map.unnormalized) {
                    mod.map = makeModuleMap(id, null, true);
                  }
                });
                if (cfg.deps || cfg.callback) {
                  context.require(cfg.deps || [], cfg.callback);
                }
              },
              makeShimExports: function (value) {
                function fn() {
                  var ret;
                  if (value.init) {
                    ret = value.init.apply(global, arguments);
                  }
                  return ret || value.exports && getGlobal(value.exports);
                }
                return fn;
              },
              makeRequire: function (relMap, options) {
                options = options || {};
                function localRequire(deps, callback, errback) {
                  var id, map, requireMod;
                  if (options.enableBuildCallback && callback && isFunction(callback)) {
                    callback.__requireJsBuild = true;
                  }
                  if (typeof deps === 'string') {
                    if (isFunction(callback)) {
                      return onError(makeError('requireargs', 'Invalid require call'), errback);
                    }
                    if (relMap && hasProp(handlers, deps)) {
                      return handlers[deps](registry[relMap.id]);
                    }
                    if (req.get) {
                      return req.get(context, deps, relMap, localRequire);
                    }
                    map = makeModuleMap(deps, relMap, false, true);
                    id = map.id;
                    if (!hasProp(defined, id)) {
                      return onError(makeError('notloaded', 'Module name "' + id + '" has not been loaded yet for context: ' + contextName + (relMap ? '' : '. Use require([])')));
                    }
                    return defined[id];
                  }
                  intakeDefines();
                  context.nextTick(function () {
                    intakeDefines();
                    requireMod = getModule(makeModuleMap(null, relMap));
                    requireMod.skipMap = options.skipMap;
                    requireMod.init(deps, callback, errback, {
                      enabled: true
                    });
                    checkLoaded();
                  });
                  return localRequire;
                }
                mixin(localRequire, {
                  isBrowser: isBrowser,
                  toUrl: function (moduleNamePlusExt) {
                    var ext,
                      index = moduleNamePlusExt.lastIndexOf('.'),
                      segment = moduleNamePlusExt.split('/')[0],
                      isRelative = segment === '.' || segment === '..';
                    if (index !== -1 && (!isRelative || index > 1)) {
                      ext = moduleNamePlusExt.substring(index, moduleNamePlusExt.length);
                      moduleNamePlusExt = moduleNamePlusExt.substring(0, index);
                    }
                    return context.nameToUrl(normalize(moduleNamePlusExt, relMap && relMap.id, true), ext, true);
                  },
                  defined: function (id) {
                    return hasProp(defined, makeModuleMap(id, relMap, false, true).id);
                  },
                  specified: function (id) {
                    id = makeModuleMap(id, relMap, false, true).id;
                    return hasProp(defined, id) || hasProp(registry, id);
                  }
                });
                if (!relMap) {
                  localRequire.undef = function (id) {
                    takeGlobalQueue();
                    var map = makeModuleMap(id, relMap, true),
                      mod = getOwn(registry, id);
                    mod.undefed = true;
                    removeScript(id);
                    delete defined[id];
                    delete urlFetched[map.url];
                    delete undefEvents[id];
                    eachReverse(defQueue, function (args, i) {
                      if (args[0] === id) {
                        defQueue.splice(i, 1);
                      }
                    });
                    delete context.defQueueMap[id];
                    if (mod) {
                      if (mod.events.defined) {
                        undefEvents[id] = mod.events;
                      }
                      cleanRegistry(id);
                    }
                  };
                }
                return localRequire;
              },
              enable: function (depMap) {
                var mod = getOwn(registry, depMap.id);
                if (mod) {
                  getModule(depMap).enable();
                }
              },
              completeLoad: function (moduleName) {
                var found,
                  args,
                  mod,
                  shim = getOwn(config.shim, moduleName) || {},
                  shExports = shim.exports;
                takeGlobalQueue();
                while (defQueue.length) {
                  args = defQueue.shift();
                  if (args[0] === null) {
                    args[0] = moduleName;
                    if (found) {
                      break;
                    }
                    found = true;
                  } else if (args[0] === moduleName) {
                    found = true;
                  }
                  callGetModule(args);
                }
                context.defQueueMap = {};
                mod = getOwn(registry, moduleName);
                if (!found && !hasProp(defined, moduleName) && mod && !mod.inited) {
                  if (config.enforceDefine && (!shExports || !getGlobal(shExports))) {
                    if (hasPathFallback(moduleName)) {
                      return;
                    } else {
                      return onError(makeError('nodefine', 'No define call for ' + moduleName, null, [moduleName]));
                    }
                  } else {
                    callGetModule([moduleName, shim.deps || [], shim.exportsFn]);
                  }
                }
                checkLoaded();
              },
              nameToUrl: function (moduleName, ext, skipExt) {
                var paths,
                  syms,
                  i,
                  parentModule,
                  url,
                  parentPath,
                  bundleId,
                  pkgMain = getOwn(config.pkgs, moduleName);
                if (pkgMain) {
                  moduleName = pkgMain;
                }
                bundleId = getOwn(bundlesMap, moduleName);
                if (bundleId) {
                  return context.nameToUrl(bundleId, ext, skipExt);
                }
                if (req.jsExtRegExp.test(moduleName)) {
                  url = moduleName + (ext || '');
                } else {
                  paths = config.paths;
                  syms = moduleName.split('/');
                  for (i = syms.length; i > 0; i -= 1) {
                    parentModule = syms.slice(0, i).join('/');
                    parentPath = getOwn(paths, parentModule);
                    if (parentPath) {
                      if (isArray(parentPath)) {
                        parentPath = parentPath[0];
                      }
                      syms.splice(0, i, parentPath);
                      break;
                    }
                  }
                  url = syms.join('/');
                  url += ext || (/^data\:|^blob\:|\?/.test(url) || skipExt ? '' : '.js');
                  url = (url.charAt(0) === '/' || url.match(/^[\w\+\.\-]+:/) ? '' : config.baseUrl) + url;
                }
                return config.urlArgs && !/^blob\:/.test(url) ? url + config.urlArgs(moduleName, url) : url;
              },
              load: function (id, url) {
                req.load(context, id, url);
              },
              execCb: function (name, callback, args, exports) {
                return callback.apply(exports, args);
              },
              onScriptLoad: function (evt) {
                if (evt.type === 'load' || readyRegExp.test((evt.currentTarget || evt.srcElement).readyState)) {
                  interactiveScript = null;
                  var data = getScriptData(evt);
                  context.completeLoad(data.id);
                }
              },
              onScriptError: function (evt) {
                var data = getScriptData(evt);
                if (!hasPathFallback(data.id)) {
                  var parents = [];
                  eachProp(registry, function (value, key) {
                    if (key.indexOf('_@r') !== 0) {
                      each(value.depMaps, function (depMap) {
                        if (depMap.id === data.id) {
                          parents.push(key);
                          return true;
                        }
                      });
                    }
                  });
                  return onError(makeError('scripterror', 'Script error for "' + data.id + (parents.length ? '", needed by: ' + parents.join(', ') : '"'), evt, [data.id]));
                }
              }
            };
            context.require = context.makeRequire();
            return context;
          }
          req = requirejs = function (deps, callback, errback, optional) {
            var context,
              config,
              contextName = defContextName;
            if (!isArray(deps) && typeof deps !== 'string') {
              config = deps;
              if (isArray(callback)) {
                deps = callback;
                callback = errback;
                errback = optional;
              } else {
                deps = [];
              }
            }
            if (config && config.context) {
              contextName = config.context;
            }
            context = getOwn(contexts, contextName);
            if (!context) {
              context = contexts[contextName] = req.s.newContext(contextName);
            }
            if (config) {
              context.configure(config);
            }
            return context.require(deps, callback, errback);
          };
          req.config = function (config) {
            return req(config);
          };
          req.nextTick = typeof setTimeout !== 'undefined' ? function (fn) {
            setTimeout(fn, 4);
          } : function (fn) {
            fn();
          };
          if (!require) {
            require = req;
          }
          req.version = version;
          req.jsExtRegExp = /^\/|:|\?|\.js$/;
          req.isBrowser = isBrowser;
          s = req.s = {
            contexts: contexts,
            newContext: newContext
          };
          req({});
          each(['toUrl', 'undef', 'defined', 'specified'], function (prop) {
            req[prop] = function () {
              var ctx = contexts[defContextName];
              return ctx.require[prop].apply(ctx, arguments);
            };
          });
          if (isBrowser) {
            head = s.head = document.getElementsByTagName('head')[0];
            baseElement = document.getElementsByTagName('base')[0];
            if (baseElement) {
              head = s.head = baseElement.parentNode;
            }
          }
          req.onError = defaultOnError;
          req.createNode = function (config, moduleName, url) {
            var node = config.xhtml ? document.createElementNS('http://www.w3.org/1999/xhtml', 'html:script') : document.createElement('script');
            node.type = config.scriptType || 'text/javascript';
            node.charset = 'utf-8';
            node.async = true;
            return node;
          };
          req.load = function (context, moduleName, url) {
            var config = context && context.config || {},
              node;
            if (isBrowser) {
              node = req.createNode(config, moduleName, url);
              node.setAttribute('data-requirecontext', context.contextName);
              node.setAttribute('data-requiremodule', moduleName);
              if (node.attachEvent && !(node.attachEvent.toString && node.attachEvent.toString().indexOf('[native code') < 0) && !isOpera) {
                useInteractive = true;
                node.attachEvent('onreadystatechange', context.onScriptLoad);
              } else {
                node.addEventListener('load', context.onScriptLoad, false);
                node.addEventListener('error', context.onScriptError, false);
              }
              node.src = url;
              if (config.onNodeCreated) {
                config.onNodeCreated(node, config, moduleName, url);
              }
              currentlyAddingScript = node;
              if (baseElement) {
                head.insertBefore(node, baseElement);
              } else {
                head.appendChild(node);
              }
              currentlyAddingScript = null;
              return node;
            } else if (isWebWorker) {
              try {
                setTimeout(function () {}, 0);
                importScripts(url);
                context.completeLoad(moduleName);
              } catch (e) {
                context.onError(makeError('importscripts', 'importScripts failed for ' + moduleName + ' at ' + url, e, [moduleName]));
              }
            }
          };
          function getInteractiveScript() {
            if (interactiveScript && interactiveScript.readyState === 'interactive') {
              return interactiveScript;
            }
            eachReverse(scripts(), function (script) {
              if (script.readyState === 'interactive') {
                return interactiveScript = script;
              }
            });
            return interactiveScript;
          }
          if (isBrowser && !cfg.skipDataMain) {
            eachReverse(scripts(), function (script) {
              if (!head) {
                head = script.parentNode;
              }
              dataMain = script.getAttribute('data-main');
              if (dataMain) {
                mainScript = dataMain;
                if (!cfg.baseUrl && mainScript.indexOf('!') === -1) {
                  src = mainScript.split('/');
                  mainScript = src.pop();
                  subPath = src.length ? src.join('/') + '/' : './';
                  cfg.baseUrl = subPath;
                }
                mainScript = mainScript.replace(jsSuffixRegExp, '');
                if (req.jsExtRegExp.test(mainScript)) {
                  mainScript = dataMain;
                }
                cfg.deps = cfg.deps ? cfg.deps.concat(mainScript) : [mainScript];
                return true;
              }
            });
          }
          define = function (name, deps, callback) {
            var node, context;
            if (typeof name !== 'string') {
              callback = deps;
              deps = name;
              name = null;
            }
            if (!isArray(deps)) {
              callback = deps;
              deps = null;
            }
            if (!deps && isFunction(callback)) {
              deps = [];
              if (callback.length) {
                callback.toString().replace(commentRegExp, commentReplace).replace(cjsRequireRegExp, function (match, dep) {
                  deps.push(dep);
                });
                deps = (callback.length === 1 ? ['require'] : ['require', 'exports', 'module']).concat(deps);
              }
            }
            if (useInteractive) {
              node = currentlyAddingScript || getInteractiveScript();
              if (node) {
                if (!name) {
                  name = node.getAttribute('data-requiremodule');
                }
                context = contexts[node.getAttribute('data-requirecontext')];
              }
            }
            if (context) {
              context.defQueue.push([name, deps, callback]);
              context.defQueueMap[name] = true;
            } else {
              globalDefQueue.push([name, deps, callback]);
            }
          };
          define.amd = {
            jQuery: true
          };
          req.exec = function (text) {
            return eval(text);
          };
          req(cfg);
        })(this);
        ;
        Object.assign(window.sparta.require[name][version], {
          require: require,
          define: define
        });
      })(window.sparta.require[name][version]);
    }
  };
}();

/***/ }),

/***/ "./src/smallPolyfill.js":
/*!******************************!*\
  !*** ./src/smallPolyfill.js ***!
  \******************************/
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

/**
 * Object.assign() polyfill
 */
if (typeof Object.assign != 'function') {
  // Must be writable: true, enumerable: false, configurable: true
  Object.defineProperty(Object, "assign", {
    value: function assign(target, varArgs) {
      // .length of function is 2
      'use strict';

      if (target == null) {
        // TypeError if undefined or null
        throw new TypeError('Cannot convert undefined or null to object');
      }
      var to = Object(target);
      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];
        if (nextSource != null) {
          // Skip over if undefined or null
          for (var nextKey in nextSource) {
            // Avoid bugs when hasOwnProperty is shadowed
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    },
    writable: true,
    configurable: true
  });
}

/**
 * String.prototype.includes() polyfill
 */
if (!String.prototype.includes) {
  String.prototype.includes = function (search, start) {
    'use strict';

    if (search instanceof RegExp) {
      throw TypeError('first argument must not be a RegExp');
    }
    if (start === undefined) {
      start = 0;
    }
    return this.indexOf(search, start) !== -1;
  };
}

/**
 * String.prototype.replaceAll() polyfill
 */
if (!String.prototype.replaceAll) {
  String.prototype.replaceAll = function (str, newStr) {
    // If a regex pattern
    if (Object.prototype.toString.call(str).toLowerCase() === '[object regexp]') {
      return this.replace(str, newStr);
    }

    // If a string
    return this.replace(new RegExp(str, 'g'), newStr);
  };
}

/**
 * Promise Polyfill
 */
(function (global, factory) {
   true ? factory() : 0;
})(this, function () {
  'use strict';

  /**
   * @this {Promise}
   */
  function finallyConstructor(callback) {
    var constructor = this.constructor;
    return this.then(function (value) {
      // @ts-ignore
      return constructor.resolve(callback()).then(function () {
        return value;
      });
    }, function (reason) {
      // @ts-ignore
      return constructor.resolve(callback()).then(function () {
        // @ts-ignore
        return constructor.reject(reason);
      });
    });
  }

  // Store setTimeout reference so promise-polyfill will be unaffected by
  // other code modifying setTimeout (like sinon.useFakeTimers())
  var setTimeoutFunc = setTimeout;
  function isArray(x) {
    return Boolean(x && typeof x.length !== 'undefined');
  }
  function noop() {}

  // Polyfill for Function.prototype.bind
  function bind(fn, thisArg) {
    return function () {
      fn.apply(thisArg, arguments);
    };
  }

  /**
   * @constructor
   * @param {Function} fn
   */
  function Promise(fn) {
    if (!(this instanceof Promise)) throw new TypeError('Promises must be constructed via new');
    if (typeof fn !== 'function') throw new TypeError('not a function');
    /** @type {!number} */
    this._state = 0;
    /** @type {!boolean} */
    this._handled = false;
    /** @type {Promise|undefined} */
    this._value = undefined;
    /** @type {!Array<!Function>} */
    this._deferreds = [];
    doResolve(fn, this);
  }
  function handle(self, deferred) {
    while (self._state === 3) {
      self = self._value;
    }
    if (self._state === 0) {
      self._deferreds.push(deferred);
      return;
    }
    self._handled = true;
    Promise._immediateFn(function () {
      var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
      if (cb === null) {
        (self._state === 1 ? resolve : reject)(deferred.promise, self._value);
        return;
      }
      var ret;
      try {
        ret = cb(self._value);
      } catch (e) {
        reject(deferred.promise, e);
        return;
      }
      resolve(deferred.promise, ret);
    });
  }
  function resolve(self, newValue) {
    try {
      // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
      if (newValue === self) throw new TypeError('A promise cannot be resolved with itself.');
      if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
        var then = newValue.then;
        if (newValue instanceof Promise) {
          self._state = 3;
          self._value = newValue;
          finale(self);
          return;
        } else if (typeof then === 'function') {
          doResolve(bind(then, newValue), self);
          return;
        }
      }
      self._state = 1;
      self._value = newValue;
      finale(self);
    } catch (e) {
      reject(self, e);
    }
  }
  function reject(self, newValue) {
    self._state = 2;
    self._value = newValue;
    finale(self);
  }
  function finale(self) {
    if (self._state === 2 && self._deferreds.length === 0) {
      Promise._immediateFn(function () {
        if (!self._handled) {
          Promise._unhandledRejectionFn(self._value);
        }
      });
    }
    for (var i = 0, len = self._deferreds.length; i < len; i++) {
      handle(self, self._deferreds[i]);
    }
    self._deferreds = null;
  }

  /**
   * @constructor
   */
  function Handler(onFulfilled, onRejected, promise) {
    this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
    this.onRejected = typeof onRejected === 'function' ? onRejected : null;
    this.promise = promise;
  }

  /**
   * Take a potentially misbehaving resolver function and make sure
   * onFulfilled and onRejected are only called once.
   *
   * Makes no guarantees about asynchrony.
   */
  function doResolve(fn, self) {
    var done = false;
    try {
      fn(function (value) {
        if (done) return;
        done = true;
        resolve(self, value);
      }, function (reason) {
        if (done) return;
        done = true;
        reject(self, reason);
      });
    } catch (ex) {
      if (done) return;
      done = true;
      reject(self, ex);
    }
  }
  Promise.prototype['catch'] = function (onRejected) {
    return this.then(null, onRejected);
  };
  Promise.prototype.then = function (onFulfilled, onRejected) {
    // @ts-ignore
    var prom = new this.constructor(noop);
    handle(this, new Handler(onFulfilled, onRejected, prom));
    return prom;
  };
  Promise.prototype['finally'] = finallyConstructor;
  Promise.all = function (arr) {
    return new Promise(function (resolve, reject) {
      if (!isArray(arr)) {
        return reject(new TypeError('Promise.all accepts an array'));
      }
      var args = Array.prototype.slice.call(arr);
      if (args.length === 0) return resolve([]);
      var remaining = args.length;
      function res(i, val) {
        try {
          if (val && (typeof val === 'object' || typeof val === 'function')) {
            var then = val.then;
            if (typeof then === 'function') {
              then.call(val, function (val) {
                res(i, val);
              }, reject);
              return;
            }
          }
          args[i] = val;
          if (--remaining === 0) {
            resolve(args);
          }
        } catch (ex) {
          reject(ex);
        }
      }
      for (var i = 0; i < args.length; i++) {
        res(i, args[i]);
      }
    });
  };
  Promise.resolve = function (value) {
    if (value && typeof value === 'object' && value.constructor === Promise) {
      return value;
    }
    return new Promise(function (resolve) {
      resolve(value);
    });
  };
  Promise.reject = function (value) {
    return new Promise(function (resolve, reject) {
      reject(value);
    });
  };
  Promise.race = function (arr) {
    return new Promise(function (resolve, reject) {
      if (!isArray(arr)) {
        return reject(new TypeError('Promise.race accepts an array'));
      }
      for (var i = 0, len = arr.length; i < len; i++) {
        Promise.resolve(arr[i]).then(resolve, reject);
      }
    });
  };

  // Use polyfill for setImmediate for performance gains
  Promise._immediateFn =
  // @ts-ignore
  typeof setImmediate === 'function' && function (fn) {
    // @ts-ignore
    setImmediate(fn);
  } || function (fn) {
    setTimeoutFunc(fn, 0);
  };
  Promise._unhandledRejectionFn = function _unhandledRejectionFn(err) {
    if (typeof console !== 'undefined' && console) {
      console.warn('Possible Unhandled Promise Rejection:', err); // eslint-disable-line no-console
    }
  };

  /** @suppress {undefinedVars} */
  var globalNS = function () {
    // the only reliable means to get the global object is
    // `Function('return this')()`
    // However, this causes CSP violations in Chrome apps.
    if (typeof self !== 'undefined') {
      return self;
    }
    if (typeof window !== 'undefined') {
      return window;
    }
    if (typeof __webpack_require__.g !== 'undefined') {
      return __webpack_require__.g;
    }
    throw new Error('unable to locate global object');
  }();
  if (!('Promise' in globalNS)) {
    globalNS['Promise'] = Promise;
  } else if (!globalNS.Promise.prototype['finally']) {
    globalNS.Promise.prototype['finally'] = finallyConstructor;
  }
});

/***/ }),

/***/ "./src/utils.js":
/*!**********************!*\
  !*** ./src/utils.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
const addLoaderScript = (path, version) => {
  if (scriptExists(path, version)) return;
  const loader = document.createElement('script');
  loader.type = 'text/javascript';
  loader.src = `${path}/spa/widgets/loader/${version}/index.js`;
  document.body.appendChild(loader);
  return loader;
};
const findVal = (object, key) => {
  let value;
  Object.keys(object).some(k => {
    if (k === key) {
      value = object[k];
      return true;
    }
    if (object[k] && typeof object[k] === 'object') {
      value = findVal(object[k], key);
      return value !== undefined;
    }
  });
  return value;
};
const scriptsDiff = (array_a, array_b) => {
  return array_a.filter(el => array_b.every(el2 => el2.innerHTML !== el.innerHTML));
};
const scriptExists = (path, version) => {
  return document.querySelectorAll(`script[src="${path}/spa/widgets/loader/${version}/index.js"]`).length > 0;
};

/**
  * Create script element and append it to the head
  *
  * @param {object<Element>} _script Script element
  * @param {object} options Function options
  * @returns {object<Element>} Script element
  */
const createScript = function (_script) {
  let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  const script = document.createElement('script');
  const {
    skipBabelPolyFill
  } = options;

  // Copy the following properties
  const props = ['async', 'charset', 'crossorigin', 'integrity', 'language', 'nonce', 'onload', 'referrerpolicy', 'src', 'type'];
  props.forEach(function (prop) {
    const propVal = _script.getAttribute(prop);
    if (prop === 'src') {
      if (propVal) {
        // skip babel-polyfill loading when specified in config
        if (skipBabelPolyFill && script.src.indexOf("babel-polyfill.js") !== -1) return;
        script[prop] = propVal;
        return;
      } else {
        script.innerHTML = _script.innerHTML;
      }
    }
    if (!propVal) return;
    script[prop] = propVal;
  });
  return script;
};

/**
  * Find text within a string starting and ending with tokens
  * @param {String} str a string to search
  * @param {String} startToken the start of a string to search
  * @param {String} endToken the end of a string to search
  * @returns {String} a string of the match if it exists
  */
const findText = function (str, startToken, endToken) {
  let fullStr = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
  if (!str.includes(startToken)) return;
  let substr = str.match(startToken + '(.*?)' + endToken);
  if (!substr) return false;
  substr = substr[1];
  if (!fullStr) return substr;
  return startToken + substr + endToken;
};

/**
  * Collect and remove all matches
  * @param {String} str a string to search
  * @param {String} startToken the start of a string to search
  * @param {String} endToken the end of a string to search
  * @returns {Object} an Object of matches and the updated string
  */
const collectAndRemoveAllMatches = str => {
  const searchRgx = new RegExp("<link[^>]*href[^>]*>", "g");
  const matches = str.match(searchRgx);
  if (!matches || !matches.length) return {
    matches: [],
    updatedStr: str
  };
  return {
    matches,
    updatedStr: str.replace(searchRgx, '')
  };
};

/**
  * Return a given attribute string
  * @param {String} str of the element searched
  * @param {String} attr of the attribute wishing to be found
  * @returns {String} a string of the value wishing to be found
  */
const getAttribute = (link, attr) => {
  return findText(link, `${attr}="`, '"', false) || findText(link, `${attr}='`, "'", false);
};

/**
  * Create an array of hrefs from links
  * @param {Object<Array>} links Collection of links
  * @returns {Object<Array>} a collection of hrefs
  */
const getHrefs = links => [...links].map(link => {
  return getAttribute(link, 'href');
});

/**
  * Get data from CSS links
  * @param {Object<Array>} links Collection of links
  * @returns {Object<Array>} a collection of Objects with hrefs and possible data includes
  */
const getCSSData = cssLinks => cssLinks.map(link => ({
  href: getAttribute(link, 'href'),
  dataIncludes: getAttribute(link, 'data-includes')
}));

/**
  * Manage promises serially
  * @param {object<Array>} promises Collection of pending promises
  * @returns {Object<Promise>} a promise that returns and array of resolutions
  */
const promiseSerial = promises => promises.reduce((promiseChain, currentTask) => {
  // sequential resolution
  return promiseChain.then(chainResults => currentTask.then(currentResult => [...chainResults, currentResult]));
}, Promise.resolve([]));
const removeScript = (needle, str) => {
  const startingPoint = str.indexOf(needle); // if the needle is in the string, rm the script
  const leftStr = str.slice(0, startingPoint);
  const rightStr = str.slice(startingPoint, str.length - 1);
  const leftPoint = leftStr.lastIndexOf('<script');
  const rightPoint = startingPoint + rightStr.indexOf('</script>') + '</script>'.length;
  return {
    cursor: leftPoint,
    string: str.substr(0, leftPoint) + str.substr(rightPoint)
  };
};
const insertStr = (str1, str2, pos) => str1.substring(0, pos) + str2 + str1.substring(pos);
const getCacheKey = (name, version, id) => {
  return `${name}-${version}-${id}`;
};
const isLetter = c => c.toLowerCase() != c.toUpperCase();
const generateId = () => 'id' + new Date().getTime();
const addElId = el => el.id = !el.id ? generateId() : el.id;
const ensureEl = function (elOrSelector) {
  let scope = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document;
  if (typeof elOrSelector === 'string') {
    const str = isLetter(elOrSelector[0]) ? `#${elOrSelector}` : elOrSelector;
    if (document.querySelectorAll(str).length !== 1) {
      throw new Error('A single element is required as a container.');
    }
    const el = document.querySelector(str);
    addElId(el);
    return el;
  }
  if (typeof elOrSelector === 'object' && elOrSelector.nodeType) {
    addElId(elOrSelector);
    return elOrSelector;
  }
  throw new Error('A valid selector or DOM Node must be passed as a container.');
};
const getComponentUrl = (str, deps) => Object.values(deps).find(vals => vals.find(el => el.includes(str))).find(val => val.includes(str));
const getComponent = (str, obj) => {
  const deps = obj.require.dependenciesMap;
  return obj.require()(getComponentUrl(str, deps)).default;
};
const widgetExists = _ref => {
  let {
    loaderVersion,
    name,
    version,
    id
  } = _ref;
  return window.sparta && window.sparta.widgets && window.sparta.widgets[loaderVersion] && window.sparta.widgets[loaderVersion][name] && window.sparta.widgets[loaderVersion][name][version] && window.sparta.widgets[loaderVersion][name][version][id];
};
let widget;
const setWidget = aWidget => {
  widget = aWidget;
  return widget;
};
const getWidget = () => widget;
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  addLoaderScript,
  collectAndRemoveAllMatches,
  findVal,
  getAttribute,
  getComponent,
  getCSSData,
  getHrefs,
  getWidget,
  scriptsDiff,
  createScript,
  promiseSerial,
  getCacheKey,
  ensureEl,
  removeScript,
  insertStr,
  setWidget,
  widgetExists
});

/***/ }),

/***/ "./node_modules/custom-event-polyfill/custom-event-polyfill.js":
/*!*********************************************************************!*\
  !*** ./node_modules/custom-event-polyfill/custom-event-polyfill.js ***!
  \*********************************************************************/
/***/ (() => {

// Polyfill for creating CustomEvents on IE9/10/11

// code pulled from:
// https://github.com/d4tocchini/customevent-polyfill
// https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent#Polyfill

try {
    var ce = new window.CustomEvent('test');
    ce.preventDefault();
    if (ce.defaultPrevented !== true) {
        // IE has problems with .preventDefault() on custom events
        // http://stackoverflow.com/questions/23349191
        throw new Error('Could not prevent default');
    }
} catch(e) {
  var CustomEvent = function(event, params) {
    var evt, origPrevent;
    params = params || {
      bubbles: false,
      cancelable: false,
      detail: undefined
    };

    evt = document.createEvent("CustomEvent");
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
    origPrevent = evt.preventDefault;
    evt.preventDefault = function () {
      origPrevent.call(this);
      try {
        Object.defineProperty(this, 'defaultPrevented', {
          get: function () {
            return true;
          }
        });
      } catch(e) {
        this.defaultPrevented = true;
      }
    };
    return evt;
  };

  CustomEvent.prototype = window.Event.prototype;
  window.CustomEvent = CustomEvent; // expose definition to window
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _smallPolyfill__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./smallPolyfill */ "./src/smallPolyfill.js");
/* harmony import */ var _smallPolyfill__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_smallPolyfill__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var custom_event_polyfill__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! custom-event-polyfill */ "./node_modules/custom-event-polyfill/custom-event-polyfill.js");
/* harmony import */ var custom_event_polyfill__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(custom_event_polyfill__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _requireWidget__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./requireWidget */ "./src/requireWidget.js");
/* harmony import */ var _requireWidget__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_requireWidget__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./constants */ "./src/constants.js");
/* harmony import */ var _WidgetLoader__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./WidgetLoader */ "./src/WidgetLoader.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./utils */ "./src/utils.js");
/* harmony import */ var _internalFunctions__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./internalFunctions */ "./src/internalFunctions.js");







const {
  LOADER_VERSION
} = _constants__WEBPACK_IMPORTED_MODULE_3__.default;
const {
  ensureEl,
  findVal,
  getWidget,
  setWidget,
  widgetExists
} = _utils__WEBPACK_IMPORTED_MODULE_5__.default;
const {
  getWidgetLoaderSpinnerAndCssPath,
  refreshWidget,
  destroyWidget
} = _internalFunctions__WEBPACK_IMPORTED_MODULE_6__.default;

/**
 * @method addWidget
 * @description adds a widget loader and its accompanying script to the page
 * @param {Object} config object of the widget configuration
 * @param {Array} widgets an array of widgets
 * @returns {Null} returns nothing
 */
const addWidget = (config, widgets) => {
  const {
    name,
    version,
    container
  } = config;
  const {
    id
  } = ensureEl(container);
  if (config.loaderVersion.charAt(0) >= 4) {
    const widgetLoader = new _WidgetLoader__WEBPACK_IMPORTED_MODULE_4__.default(id);
    if (!widgets[name]) {
      widgets[name] = {
        [version]: {
          [id]: widgetLoader
        }
      };
    } else if (!widgets[name][version]) {
      widgets[name][version] = {
        [id]: widgetLoader
      };
    } else {
      widgets[name][version][id] = widgetLoader;
    }
    const widgetInstance = widgets[name][version][id];
    setWidget(widgetInstance);
    widgetInstance.refresh = data => refreshWidget(config, data);
    widgetInstance.destroy = () => destroyWidget(config);
  } else {
    // kick off old sparta widgets
    const loader = addLoaderScript(config.path, config.loaderVersion);
    loader.dataset.widgetName = name;
    loader.dataset.widgetVersion = version;
    document.body.appendChild(loader);
  }
};

/**
 * @method initializeWidgets
 * @description initialization of the primary widget loader
 * @param {Object} sparta global object to namespace our widget goodies
 * @returns {Object} returns the widget loader object
 */
const initializeWidgets = sparta => {
  const widgetPrototype = {
    // events: createWidgetEvents(),
    load: function (widgetConfig) {
      const {
        name,
        version,
        container: id,
        loaderVersion,
        onload
      } = widgetConfig;
      const widget = widgetExists({
        name,
        version,
        id,
        loaderVersion
      });
      if (widget) widget.destroy();
      addWidget(widgetConfig, this);
      if (loaderVersion >= LOADER_VERSION) {
        const loader = getWidget();
        loader.load(widgetConfig);
        if (onload && onload.constructor === Function) onload(loader);
        return loader;
      }
    }
  };
  const loaderAssetPaths = getWidgetLoaderSpinnerAndCssPath();
  if (!sparta.widgets) {
    sparta.widgets = {};
    sparta.widgets = Object.create({
      get: id => findVal(sparta.widgets, id),
      spinnerLocation: loaderAssetPaths().spinnerLocation,
      styleSheetLocation: loaderAssetPaths().styleSheetLocation
    });
  }
  sparta.widgets[LOADER_VERSION] = Object.create(widgetPrototype);
};
window.sparta = window.sparta || {};
const {
  sparta
} = window;
if (!sparta.widgets || sparta.widgets && !sparta.widgets[LOADER_VERSION]) initializeWidgets(sparta);
document.dispatchEvent(new CustomEvent('spartaLoaderInitialized'));
})();

/******/ })()
;
//# sourceMappingURL=index.js.map