/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-afac4cd2'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  }, {
    "url": "index.html",
    "revision": "0c64d9154f2efe275819ded9114368fe"
  }, {
    "url": "icon.svg",
    "revision": "a635fd769ff668ba39efc3ca2bc31adb"
  }, {
    "url": "favicon.ico",
    "revision": "8f253e12ebbc84132e9363c8036c00e4"
  }, {
    "url": "egg_warehouse_banner.jpg",
    "revision": "f221ecc8428fb28a2b189306028f6049"
  }, {
    "url": "egg-logo.jpg",
    "revision": "4e55956a0f3d9d0bdd367800ffc26705"
  }, {
    "url": "images/premium_egg_logo_1790446380772.jpg",
    "revision": "eac825f8c7682c002e9706dbaa8c3a9b"
  }, {
    "url": "images/luxury_egg_logo_1790446533465.jpg",
    "revision": "e8345f1ed084f69b364ef8033efa3dbe"
  }, {
    "url": "images/luxury_egg_app_logo_1790454939764.jpg",
    "revision": "b708e7b93bd6352fb23de7d00c9c1a93"
  }, {
    "url": "images/egg_warehouse_banner_1790454797592.jpg",
    "revision": "f221ecc8428fb28a2b189306028f6049"
  }, {
    "url": "images/egg_warehouse_1790454463108.jpg",
    "revision": "072d096f9158c9dbd3007132962576a8"
  }, {
    "url": "images/egg_app_logo_1790012465527.jpg",
    "revision": "e31d43baffacd90b50adec59cfcdc3a2"
  }, {
    "url": "assets/rolldown-runtime-Dik6OG8R.js",
    "revision": null
  }, {
    "url": "assets/react-vendor-BvFwm_i_.js",
    "revision": null
  }, {
    "url": "assets/mui-vendor-XQSeGgd5.js",
    "revision": null
  }, {
    "url": "assets/luxury_egg_app_logo_1790454939764-CLi_s7Qf.jpg",
    "revision": null
  }, {
    "url": "assets/index-ryshSMdE.js",
    "revision": null
  }, {
    "url": "assets/index-cxsTs4b5.css",
    "revision": null
  }, {
    "url": "assets/icons-vendor-DPSpt4AC.js",
    "revision": null
  }, {
    "url": "assets/firebase-vendor-CWlhfRSN.js",
    "revision": null
  }, {
    "url": "assets/egg_warehouse_banner_1790454797592-Bcp3USL8.jpg",
    "revision": null
  }, {
    "url": "egg-logo.jpg",
    "revision": "4e55956a0f3d9d0bdd367800ffc26705"
  }, {
    "url": "favicon.ico",
    "revision": "8f253e12ebbc84132e9363c8036c00e4"
  }, {
    "url": "icon.svg",
    "revision": "a635fd769ff668ba39efc3ca2bc31adb"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
