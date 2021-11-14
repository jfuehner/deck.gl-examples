
import React from 'react'
import ReactDOM from 'react-dom'

import DeckGL from '@deck.gl/react';
import {CompositeLayer} from '@deck.gl/core';
import {BitmapLayer} from '@deck.gl/layers';
import {TileLayer} from '@deck.gl/geo-layers';

import {ImageLoader} from '@loaders.gl/images';
import {parse} from '@loaders.gl/core';

import {CacheExpiration} from 'workbox-expiration';

import './index.css'

const INITIAL_VIEW_STATE = {
  latitude: 12.8628,
  longitude: 30.2176,
  zoom: 2,
  maxZoom: 16,
  pitch: 0,
  bearing: 0
};

class CacheTileLayer extends CompositeLayer {
  initializeState() {
    const {props} = this;
    const {id: cacheName} = props;
    const cacheEnabled = true;
    const maxAgeSeconds = (60*2); // 2-minute expiration
    const expirationManager = new CacheExpiration(cacheName, {maxAgeSeconds})
    
    this.state = {cacheEnabled, cacheName, expirationManager};
  }

  renderLayers() {
    const {props, state} = this;
    const {cacheEnabled, cacheName, expirationManager} = state;

    return [
      new TileLayer(props, {
        id: props.id + '-TileLayer',
        getTileData: async (tile) => {
          try {
            const {x, y, z, signal} = tile;
      
            if(!signal?.aborted) {
              const url = `https://c.tile.openstreetmap.org/${z}/${x}/${y}.png`;
              let tileResponse;

              if(cacheEnabled) {
                const tileRequest = new Request(url);
        
                const cache = await caches.open(cacheName);
                tileResponse = await cache.match(tileRequest);
            
                if(!signal?.aborted && !tileResponse) {
                  const fetchResponse = await fetch(url, {signal});
            
                  if(!signal?.aborted && fetchResponse) {  
                    await cache.put(tileRequest, fetchResponse);
                    tileResponse = await cache.match(tileRequest);
  
                    if(tileResponse) {
                      await expirationManager.updateTimestamp(url);
                    }
                  }
                }                
              } else {
                tileResponse = await fetch(url, {signal});
              }

              if(!signal?.aborted && tileResponse) {
                try {
                  return parse(tileResponse, ImageLoader);
                } catch(err) {
                  if(cacheEnabled) await cache.delete(tileRequest);
                  console.error(err);
                }
              }
            }
            return null;            
          } finally {
            if(cacheEnabled) await expirationManager.expireEntries();
          }
        },
      
        renderSubLayers: (props) => {
          const {
            bbox: {west, south, east, north}
          } = props.tile;
      
          return new BitmapLayer(props, {
            data: null,
            image: props.data,
            bounds: [west, south, east, north]
          });
        }
      })
    ]
  }
};

CacheTileLayer.layerName = 'CacheTileLayer';

const tileLayer = new CacheTileLayer({
  id: 'tile-layer-20211113-0',
  minZoom: 0,
  maxZoom: 19,
  tileSize: 512
});

ReactDOM.render(
  <React.StrictMode>
    <DeckGL 
        layers={[tileLayer]} 
        initialViewState={INITIAL_VIEW_STATE} 
        controller={{dragRotate: false}}>
      </DeckGL>
  </React.StrictMode>,
  document.getElementById('root')
)
