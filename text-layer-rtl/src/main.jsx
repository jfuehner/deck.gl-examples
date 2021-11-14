
import React from 'react'
import ReactDOM from 'react-dom'

import {StaticMap} from 'react-map-gl';

import DeckGL from '@deck.gl/react';
import {TextLayer} from '@deck.gl/layers';

import {applyArabicShaping, processBidirectionalText} from '@mapbox/mapbox-gl-rtl-text';

import './index.css'

import DATA from './osm-world-airports.json'  
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json';
// const COUNTRY_CODES = ['CN', 'ER', 'ET', 'IL', 'IR', 'NG', 'OM', 'PK', 'SA', 'SG', 'YE'];
const COUNTRY_CODES = ['IR'];

const CHARACTER_RANGE_RTL = '\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC';const CHARACTER_RANGE_LTR = 'A-za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF\u200E\u2C00-\uFB1C\uFE00-\uFE6F\uFEFDD-\uFFFF';
const unicodeRegExp = new RegExp(/^\u/);
//const unicodeRegExp = new RegExp('\u{61}', 'u');
//const unicodeRegExp = new RegExp('\u{61}');
//const asciiRegExp = new RegExp(/[\p{ASCII}]+/u);
const rtlRegExp = new RegExp("^[^" + CHARACTER_RANGE_LTR + "]*[" + CHARACTER_RANGE_RTL + "]");
const ltrRegExp = new RegExp("^[^" + CHARACTER_RANGE_RTL + "]*[" + CHARACTER_RANGE_LTR + "]");

const INITIAL_VIEW_STATE = {
  latitude: 12.8628,
  longitude: 30.2176,
  zoom: 3,
  maxZoom: 16,
  pitch: 0,
  bearing: 0
};

const data = getData();
const characterSet = new Set([...data.flatMap(d => [...d.labelCharCodes], Infinity)]);
// const characterSet = new Set([...data.flatMap(d => d.labelCharCodes.map(cc => String.fromCharCode(cc)), Infinity)]);
debugger;
const textLayer = new TextLayer({
  id: 'text-layer-rtl',
  data,
  characterSet,
  getText: d => d.label,
  getPosition: x => x.coordinates,
  getColor: d => [29, 145, 192],
  sizeMinPixels: 24,
  sizeMaxPixels: 24,
  sizeUnits: 'meters',
});

ReactDOM.render(
  <React.StrictMode>
    <DeckGL 
        layers={[textLayer]} 
        initialViewState={INITIAL_VIEW_STATE} 
        controller={{dragRotate: false}}>
          <StaticMap reuseMaps mapStyle={MAP_STYLE} preventStyleDiffing={true} />
      </DeckGL>
  </React.StrictMode>,
  document.getElementById('root')
)

function getData() {
  return DATA.map(d => {
    const {fields} = d;
    const {geo_point_2d, country_code: country, name} = fields;
    const [lat, lon] = geo_point_2d;
    const coordinates = [lon, lat];
    //const label = convertCharactersToDisplayCharacterCharCodes(name);
    const label = name;
    const labelCharCodes = convertCharactersToDisplayCharacterCharCodes(name);
    //debugger;

    return {coordinates, country, label, labelCharCodes};
  }).filter(d => COUNTRY_CODES.find(cc => cc === d.country));
}

function convertCharactersToDisplayCharacterCharCodes(text) {    
  let characters = [...text];
  
  if(isRtlString(text)) {
    characters = convertRtlStringToDisplayCharacters(text);
    //debugger;
  }
  //return convertCharactersToCharCodes(characters);
  return characters;
}

// function convertCharactersToDisplayCharacterCharCodes(encodedCharacters) {    
//   const text = convertCharactersFromCodePoints(encodedCharacters).join('');
//   let characters = encodedCharacters;
  
//   if(isRtlString(text)) {
//     characters = convertRtlStringToDisplayCharacters(text);
//   }
//   return convertCharactersToCharCodes(characters);
// }

function convertCharactersFromCodePoints(characters) {
  const output = [];
  
  for(let x = 0; x < characters.length; x++) {
    const text = characters[x];
    
    if(isAscii(text)) {
      output.push(text);
    } else {
      output.push(String.fromCodePoint(text));
    }
  }
  return output;
}
  
// function convertCharactersFromCodePoints(characters) {
//   const output = [];
  
//   for(let x = 0; x < characters.length; x++) {
//     const text = characters[x];
    
//     if(isUnicode(text)) {
//       output.push(String.fromCodePoint(text));
//     } else {
//       output.push(text);
//     }
//   }
//   return output;
// }

function convertCharactersToCharCodes(characters) {
  const output = [];
  
  for(let x = 0; x < characters.length; x++) {
    const text = characters[x];
    
    // if(isAscii(text)) {
      output.push(text.charCodeAt());
    // } else {
    //   output.push(parseInt(text, 16));
    // }
  }
  return output;
}
  
// function convertCharactersToCharCodes(characters) {
//   const output = [];
  
//   for(let x = 0; x < characters.length; x++) {
//     const text = characters[x];
    
//     if(isUnicode(text)) {
//       output.push(parseInt(text, 16));
//     } else {
//       output.push(text.charCodeAt());
//     }
//   }
//   return output;
// }

function convertRtlStringToDisplayCharacters(input) {
  const output = [];
  const arabicText = applyArabicShaping(input);
  const displayText = processBidirectionalText(arabicText, []);
  
  for(let i = 0; i < displayText.length; i++) {
    output.push(...displayText[i].split(''));
  }
  return output;
}

function isAscii(input) {
  return /[\p{ASCII}]+/u.test(input);
}

function isUnicode(input) {
  return unicodeRegExp.test(input);
}

function isRtlString(input) {
  return rtlRegExp.test(input);
}

function isLtrString(input) {
  return ltrRegExp.test(input);
}

// function isNeutralString(input) {
//   return !isRtlString(input) && !isLtrString(input);
// }