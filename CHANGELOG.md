# changelog

0.4.5

 - Upgraded bundled node-pre-gyp

0.4.4

 - Upgraded to GDAL 1.11.1
 - Stopped providing binaries for node v0.8.x
 - Now providing binaries against Visual Studio 2014 (pass --toolset=v140) and use binaries from https://github.com/mapbox/node-cpp11

0.4.3

 - No changes: just re-published to try to avoid npm shasum error upon download

0.4.2

 - Now supporting node v0.11.x

0.4.1

 - Now shipping binaries for OS X, Windows, and Ubuntu Linux

0.4.0

 - Now builds on FreeBSD
 - `srs.jsonCrs` added for detecting projection inside JSON object representing GeoJSON. Pass the result to `srs.parse`
 - `srs.parse` no longer supports being passed a filepath to a GeoJSON.

0.3.12

 - Fixed generation of valid `srs_settings.js` on windows (#39)
 - Fixed detection of some ESRI variant projections (#38)
 - Added preliminary appveyor.yml for continuous builds on windows

0.3.11

 - Removed binary stripping on OS X which may cause link problems on mavericks
 - Move to Mapbox organization

0.3.10

 - Improved support for topojson

0.3.9

 - `--runtime_link` option fixed to only apply when `--shared_gdal` is passed.

0.3.8

 - Build fixes for windows

0.3.7

 - Build fix for python3 (#33)

0.3.6

 - Build fixes to avoid possible undefined symbol errors are runtime on ubuntu linux
 - Additional travis.ci testing of 32bit builds

0.3.5

 - Minor test fixes to work with variable external gdal versions

0.3.4

 - Changed name of build option to configure against shared gdal lib. Now pass `npm install --shared_gdal` (to be consistent with older node-srs).

0.3.3

 - Now building against internal `osr` again by default. Pass `npm install --gdal=shared` to build against systemwide GDAL (#30)
 - Now forcing canonical wgs84/epsg:4326 represenation
 - Now translating `+init` syntax to `+proj` for known projections (epsg:4326 and epsg:3857)
 - Various fixes to detect more projections

0.3.2

 - Re-enabled optional linking with `gdal-config --dep-libs` by passing `npm install --runtime_link=static`

0.3.1

 - Removed build linking to gdal libs / gdal-config --dep-libs, now only linking to libgdal itself by default

0.3.0

 - Now using node-gyp for build
 - Now requiring Node >= 0.6.13 (for node-gyp support)
 - Node v0.10.x support
 - Now requiring external libgdal
 - Better detection of more spherical mercator variants
 - Better detection of +init=epsg based mercator srs and auto-transformation to +proj syntax
