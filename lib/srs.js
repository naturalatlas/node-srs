var binary = require('node-pre-gyp');
var exists = require('fs').existsSync || require('path').existsSync;
var path = require('path');
var binding_path = binary.find(path.resolve(path.join(__dirname,'../package.json')));
var settings_path = path.join(path.dirname(binding_path),'srs_settings.js');
var settings = require(settings_path);

/*
 * if we have statically linked libosr then we need
 * to set the GDAL_DATA directory so that the bundled
 * .csv and .wkt files are found.
*/
var srs_settings = require(settings_path);
if (!srs_settings.shared_gdal) {
    process.env.GDAL_DATA = path.join(__dirname, 'srs_data');
}

var binding = require(binding_path);
var srs = module.exports = exports = binding;
exports.module_path = path.dirname(binding_path);
var constants = require('./constants');
var canonical = constants.canonical;
exports.version = require('../package').version;


function split_proj(literal) {
    var parts = literal.split(' ');
    // remove blank parts due to double spaces (common in proj epsg table)
    var len = parts.length;
    for (i = 0; i < len; i++) {
        if (parts[i] === '') {
            parts.splice(i, 1);
        }
    }
    // break into key=value pairs, discarding +modifiers without values
    var pairs = {};
    parts.sort();
    var new_len = parts.length;
    for (i = 0; i < new_len; i++) {
        var p = parts[i];
        if (p.indexOf('=') != -1) {
            var pair = p.split('=');
            if (pair[1] && pair[1] === '0') {
                // https://github.com/mapbox/tilemill/issues/1866
                pair[1] = '0.0';
            }
            pairs[pair[0]] = pair[1];
        }
    }
    return pairs;
}

var canonical_parts = split_proj(canonical.spherical_mercator.proj4);
var canonical_stringify = JSON.stringify(canonical_parts);

var parse = function(arg) {
    if (arg instanceof Buffer) {
        arg = arg.toString();
    }

    // early check for known +init=epsg: syntax, which we will
    // translate to +proj literal to avoid requiring proj4 to do that in mapnik
    var arg_lower = arg.toLowerCase();
    if (arg_lower.indexOf('+init=') > -1) {
        var parts = arg_lower.split(':');
        if (parts[1]) {
            var code = +parts[1];
            if (constants.merc_srids.indexOf(code) > -1) {
                return force_merc({input:arg});
            }
            if (code === 4326) {
                return force_wgs84({input:arg});
            }
        }
    }

    for (var hack in constants.known_esri_variant_special_cases) {
        var obj = constants.known_esri_variant_special_cases[hack];
        if (arg.indexOf(obj[0]) > -1) {
            arg = arg.replace(obj[0],obj[1]);
        }
    }

    var result;
    var esri_try = false;
    try {
        result = srs._parse(arg);
    } catch (err) {
        if (arg.indexOf('ESRI::') !== 0) {
            try {
                esri_try = true;
                result = srs._parse('ESRI::' + arg);
            } catch (esri_err) {
                throw err; // throw original error
            }
        } else {
            throw err;
        }
    }

    // if the first parse succeeded without throwing
    // but still failed to detect the proj4 string then
    // we need to try harder and assume an ESRI variant
    if (result.proj4 === undefined &&
        esri_try === false &&
        arg.indexOf('ESRI::') !== 0) {
        try {
            var esri_result = srs._parse('ESRI::' + arg);
            // success detecting proj4 as ESRI variant?
            if (esri_result.proj4) {
                result = esri_result;
            }
        } catch (err) {
            // pass
        }
    }

    // force wgs84 variants to canonical
    if (result.srid === 4326) {
        return force_wgs84(result);
    }
    // detect mercator variants and
    // replace with canonical.spherical_mercator
    if (result.name in oc(constants.merc_names)) {
        // this should be a fast track for many .prj files
        return force_merc(result);
    } else if (result.srid in oc(constants.merc_srids)) {
        return force_merc(result);
    } else if (result.proj4 !== undefined && result.proj4.indexOf('+proj=merc') != -1) {
        // catch case of gdal's translation to proj4 being used as input
        if (result.proj4 === '+proj=merc +lon_0=0 +lat_ts=0 +x_0=0 +y_0=0 +ellps=WGS84 +units=m +no_defs') {
           return force_merc(result);
        } else if (result.proj4 === '+proj=merc +lon_0=0 +lat_ts=0 +x_0=0 +y_0=0 +a=6378137 +b=6378137 +units=m +no_defs') {
           return force_merc(result);
        }
        // break into parts
        // TODO - sort and remove less critical pairs
        var parts = split_proj(result.proj4);
        if (JSON.stringify(parts) === canonical_stringify) {
            return force_merc(result);
        }
    }

    // detect OSGB variant and fix the srid
    // https://github.com/mapbox/node-srs/issues/25
    if (!result.srid && result.name == 'OSGB 1936 / British National Grid') {
        result.srid = 27700;
        result.auth = 27700;
    }

    return result;
};

function jsonCrs(gj) {
    if (gj.crs && gj.crs.properties) {
        if (gj.crs.properties.urn) {
            return gj.crs.properties.urn;
        } else if (gj.crs.properties.name) {
            return gj.crs.properties.name;
        }
    } else {
        return canonical.wgs84.proj4;
    }
}

function oc(a) {
    var o = {};
    for (var i = 0; i < a.length; i++) {
        o[a[i]] = '';
    }
    return o;
}

function force_merc(result) {
    var new_srs = canonical.spherical_mercator;
    new_srs.input = result.input;
    return new_srs;
}

function force_wgs84(result) {
    var new_srs = canonical.wgs84;
    new_srs.input = result.input;
    return new_srs;
}

// push all C++ symbols into js module
for (var k in srs) { exports[k] = srs[k]; }

// make available objects from js
exports.settings = srs_settings;
exports.canonical = canonical;
exports.split_proj = split_proj;
exports.parse = parse;
exports.jsonCrs = jsonCrs;
