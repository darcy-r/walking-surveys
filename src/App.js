import React from 'react';
import { MapContainer, TileLayer, useMap, CircleMarker, Popup } from 'react-leaflet'
import ScatterPlot from './Plot.js';
import streetGeometries from './street_locations.json';
import streetAttributes from './street_attributes.json';
import chartData from './chart_data.json';
import './App.css';
import 'leaflet/dist/leaflet.css';

const sorted = (l, ascending) => {
  let c = [...l];
  c.sort();
  if (!ascending) {
    c.reverse()
  }
  return c;
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedSite: null,
      hoveredNode: null,
    };
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(ID) {
    this.setState({selectedSite: ID});
  }

  render() {
    return (
      <div className="App">
        <SiteLocationsMap circleOnClick={(ID) => this.handleChange(ID)} />
        <div id="visualisation-pane">
          <div id="visualisation-pane-content">
            <h1>Walking surveys</h1>
            {this.state.selectedSite && <SiteTitle site={this.state.selectedSite} />}
            {this.state.selectedSite && <ScatterPlot data={chartData[this.state.selectedSite]} />}
            <StreetSectionText site={this.state.selectedSite} />
            <DatasetInfoText/>
          </div>
        </div>
      </div>
    );
  }
}

function SiteLocationsMap(props) {
  return (
    <div>
      <MapContainer id="map-pane" center={[-33.87319087719761, 151.20681949733816]} zoom={13} zoomControl={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors, <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      {
        streetGeometries.map((d) => {
          return (
            <CircleMarker
              center={[d.latitude, d.longitude]}
              radius={6} fillColor="#009800" fillOpacity={0.8} weight={0}
              eventHandlers={{
                click: () => props.circleOnClick(d.street_section_id),
              }}
              key={d.street_section_id}>
              <Popup>Street section ID: {d.street_section_id}</Popup>
            </CircleMarker>
          )
        })
      }
      </MapContainer>
    </div>
  );
}

function SiteTitle(props) {
  const s = streetAttributes[props.site];
  return (
    <p><i>
      {s.street_name} between {s.cross_street_a} and {s.cross_street_b}.
    </i></p>
  );
}

function StreetSectionText(props) {
  if (!props.site) {
    return (
      <div>
        <p><i>
          Select a street section by clicking on a green circle marker on the
          map to view more information about walking movements at that site.
        </i></p>
      </div>
    );
  }
  const minFlow = Math.min(...chartData[props.site].map((d) => d.pph));
  const maxFlow = Math.max(...chartData[props.site].map((d) => d.pph));
  const nUniqueDates = (new Set(chartData[props.site].map((d) => d.date))).size;
  const nUniqueDays = (new Set(chartData[props.site].map((d) => d.day_of_week))).size;
  const earliestHour = sorted(chartData[props.site].map((d) => d.time), true)[0].substring(0, 2);
  const latestHour = parseInt(sorted(chartData[props.site].map((d) => d.time), false)[0].substring(0, 2)) + 1;
  return (
    <div>
      <p>
        Between {minFlow} and {maxFlow} people per hour have been surveyed
        walking through this street section. Surveys have been undertaken
        across {nUniqueDates} date{nUniqueDates > 1? 's' : ''},
        including {nUniqueDays} day{nUniqueDates > 1? 's' : ''} of the week,
        between the hours of {earliestHour}:00 and {latestHour}:00.
      </p>
    </div>
  );
}

function DatasetInfoText(props) {
  const csvLink = "https://public-life-observations.s3.ap-southeast-2.amazonaws.com/datasets_csv.zip";
  const parquetLink = "https://public-life-observations.s3.ap-southeast-2.amazonaws.com/datasets_parquet.zip";
  const ccaLink = "https://creativecommons.org/licenses/by/4.0/legalcode";
  return (
    <div>
      <p>
        The entire dataset, including disaggregations by footpath and direction,
        is available to download as <a href={csvLink}>csv</a> or <a href={parquetLink}>parquet</a> files
        as open data under a <a href={ccaLink} target="_blank">Creative Commons Attribution 4.0</a> licence.
      </p>
    </div>
  );
}

export default App;
