const width = .9 * window.innerWidth
const height = .96 * window.innerHeight - 180
const timestampMin = '2007-10-01T00:00:00Z'

$(document).ready(() => {
  // helping functions
  const featureToTimeFrom = f => moment(f.properties.validFrom)
  const featureToTimeTo = f => moment(f.properties.validTo)
  
  // map
  const map = L.map('map', {zoomControl: false, zoomSnap: 0, scrollWheelZoom: false, touchZoom: false, boxZoom: false, doubleClickZoom: false, dragging: false})
  new L.StamenTileLayer('toner').setOpacity(.14).addTo(map)
  mapPreventDrag('timeslider')
  
  // draw changes
  var svgLayers = []
  var json2 = null
  const redrawFunction = json => {
    return m => {
      if (json === null) return
      const json2b = R.filter(f => moment(f.properties.validFrom).isSameOrBefore(m) && moment(f.properties.validTo).isAfter(m))(topojson.getObject(json).geometries)
      if (json2 == json2b) return
      json2 = json2b
      for (const l of svgLayers) l.removeFrom(map)
      const geoJson = {type:"FeatureCollection", features: json2.map(o => topojson.feature(json, o)).filter(f => f.geometry !== null) }
      // ??? if (geoJson.features.length === 0) return
      svgLayers = [L.geoJSON(geoJson, {color: colorPrimaryDark, fillColor: colorPrimaryDark, fillOpacity: .4}).addTo(map)]
      /* // rendering nodes like this is too slow for many features
      const drawNodes = cs => {
        if (cs instanceof Array) {
          if (cs[0] instanceof Array) R.forEach(drawNodes, cs)
          else svgLayers.push(L.circleMarker(R.reverse(cs), {color: colorPrimaryDark, fillColor: 'white', fillOpacity: 1, radius: 2, weight: 2}).addTo(map))
        }
      }
      geoJson.features.forEach(feature => drawNodes(feature.geometry.coordinates))
      */
    }
  }
  
  // slider
  var slider = new SliderTime({
    min: moment(timestampMin),
    max: moment(),
    width: width,
    playingHide: false,
    playingSpeed: 10000,
    playingRestartOnEnd: false,
  })
  
  // options panel
  new OptionsPanel({
    elements: [
      {
        type: 'radio',
        name: 'data',
        values: [
          ['hd-schloss', { label: 'Schloss', selected: true } ],
          ['hd-oldtown', { label: 'Altstadt', selected: false } ],
        ],
      },
    ],
    onStoreUpdate: store => $.getJSON(`../data/tmp/${store.data}.topojson`, json => {
      // fit bounds of the map
      map.fitBounds(topojson.getBounds(json), {padding: [-(window.innerWidth - width) / 2, -(window.innerHeight - height) / 2]})
      
      // update redraw function
      slider.setCallback(redrawFunction(json))
      
      // replace slider
      $("#timeslider > *").remove()
      const getTime = (featureToTime, f, tToCompare) => R.compose(R.reduce(f(t => t.unix()), tToCompare), R.map(featureToTime))(topojson.getObject(json).geometries)
      slider.options.min = getTime(featureToTimeFrom, R.minBy, moment())
      slider.options.max = getTime(featureToTimeTo, R.maxBy, moment(0))
      slider = new SliderTime(slider.options)
      slider.stopPlaying()
      slider.setFrom(
        moment.add(slider.options.min, moment.duration(slider.options.max.diff(slider.options.min)))
      )
    })
  })
  
  // page
  initPage({
    infoDescription: 'OSM data is modified to reflect changes of the environment, or to improve the quality of the data. These modifications are interesting to examine for an area to illustrate how the OSM data is changing over time.',
    infoIdea: [franzBenjaminMocnik],
    infoProgramming: [franzBenjaminMocnik, martinRaifer],
    infoData: [heigitDB()],
    infoLibraries: libsDefault.concat([
      libIonRangeSlider,
      libMomentRound,
      libTopoJSON,
    ]),
    init: () => {
      initTooltip({
        selector: 'input[name="data"]:first',
        text: 'Choose different areas to examine.',
        positionMy: 'bottom left',
        positionAt: 'top center',
      })
      initTooltip({
        selector: `.irs-slider`,
        text: 'Drag to change the point in time',
        positionMy: 'bottom left',
        positionAt: 'top center',
      })
      initTooltip({
        selector: '.timesliderPlaying',
        text: 'Click here to animate time',
        positionMy: 'bottom right',
        positionAt: 'top right',
      })
    },
  })
})
