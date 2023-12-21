// Definitions of objects on map

class Parcel {
    constructor(map, dat) {
        this.dat = dat;
        this.map = map;
        this.geometry = null;
    }

    createPolygon(center) {
        let send = this.dat;
        let bounds = L.latLngBounds(send["geom_wkt"]);
        if(center) {
            map.fitBounds(bounds,{animate:false});
        }

        let geom = L.featureGroup();

        let polygon = L.polygon([send["geom_wkt"]]).addTo(geom);

        let latitude = (bounds["_northEast"]["lat"] + bounds["_southWest"]["lat"]) / 2;
        let longitude = (bounds["_northEast"]["lng"] + bounds["_southWest"]["lng"]) / 2;
        let mar = L.marker([latitude, longitude]).addTo(geom);
        geom.addTo(map);

        //Create popoup fulfilment
        let div = document.createElement("div");

        div.innerHTML = this.opis();

        mar.bindPopup(div);
        polygon.bindPopup(div);

        let buttonSave = document.createElement("button");
            buttonSave.innerHTML = "Save";
            buttonSave.onclick = function() {
                let ln = editArgs.length;
                for(let j=0;j<ln;j++){
                    send[editArgs[j]] = document.getElementById(editArgs[j]).value;
                }
                save(send);
            }
        div.appendChild(buttonSave);

        let buttonDelete = document.createElement("button");
            buttonDelete.innerHTML = "Delete";
            buttonDelete.onclick = function() {
                del(send);
                geom.remove();
        }
        div.appendChild(buttonDelete);

        mar.bindPopup(div);
        polygon.bindPopup(div);

        this.geometry = geom;
        return this.geometry
    }

    removePolygon() {
        this.geometry.remove();
        this.geometry = null;
    }

    opis() {
        let line = "<div>"
        let len = args.length - 1;
        for(let i=0;i<len;i++){
            line = line + "<b>" + args[i] + ':</b> ' + this.dat[args[i]] + '<br>';
        }

        line = line + '<input type="date" id="date" value="' + this.dat["date"] + '"></input><br>';

        for(let j=1;j<=2;j++){
            line = line + '<input type="text" id="' + editArgs[j] + '" value="' + this.dat[editArgs[j]] + '"></input>';
        }
        line = line + '<textarea rows="1" id="' + editArgs[3] + '">' + this.dat[editArgs[3]] + '</textarea>';
        line = line + '<textarea rows="4" id="' + editArgs[4] + '">' + this.dat[editArgs[4]] + '</textarea>';
        line += "</div>";

        return line;
    }
}


//Create map
let map = null;
let tempParcel = null;
const args = ["id", "parcel", "voivodeship","powiat", "gmina", "region", "geom_wkt"];
const editArgs  = ["date", "price", "link", "contact", "comment"];
const primaryEditArgs = {"price":"Price", "link":"Link", "contact":"Contact info", "comment":"Comment"};


function loadMap(){
    //---- Check if theres get with location
    const doc = $('#my-data').data();
    const lat = doc.lat;
    const lng = doc.lng;
    const zoom = doc.zoom;

    //---- Add basemaps
    let osm = new L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, &copy; <a href="https://www.geoportal.gov.pl/">geoportal.gov.pl</a> resources',
        label: 'OpenStreetMap',
        minZoom: 7,
        maxZoom: 19,
    });

    let otf = L.tileLayer.wms('https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMS/StandardResolution', {
        layers: 'Raster',
        minZoom: 7,
        maxZoom: 19,
        format: 'image/jpeg'
    });


    //---- Add overlays
    var kieg = L.tileLayer.wms('https://integracja.gugik.gov.pl/cgi-bin/KrajowaIntegracjaEwidencjiGruntow', {
        layers: 'geoportal,dzialki,numery_dzialek,budynki',
        minZoom: 10,
        zoomOffset: -1,
        maxZoom: 19, 
        format: 'image/png', 
        transparent: true,
    });

    var kiut = L.tileLayer.wms('https://integracja.gugik.gov.pl/cgi-bin/KrajowaIntegracjaUzbrojeniaTerenu', {
        layers: 'przewod_urzadzenia,przewod_niezidentyfikowany,przewod_specjalny,przewod_telekomunikacyjny,przewod_cieplowniczy,przewod_gazowy,przewod_elektroenergetyczny,przewod_kanalizacyjny,przewod_wodociagowy',
        minZoom: 10,
        zoomOffset: -1,
        maxZoom: 19, 
        format: 'image/png', 
        transparent: true,
    });

    //---- Create map 
    map = L.map('map', {
        layers: [osm]
    }).setView([lat, lng], zoom);

    let baseMaps = {
        "OpenStreetMap": osm,
        "Ortofoto":otf
    };

    let overlayMaps = {
        "Ewidencja gruntów": kieg,
        "Sieci": kiut
    };

    //---- Add layerControl
    let layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);

    //---- Download parcels from server and show on site
    getParcels();

    //----Scale
    L.control.scale().addTo(map);

    //----Left hand side control - LOG OUT
    L.easyButton({
        states:[
            {
            icon: 'fa-right-from-bracket',
            title: 'Log out',
            onClick: function(){window.open("/logout", "_self");}
            }
        ]
    }).addTo(map);

    //----  Add elements to the map     ----    
    //----  Right hand side control     ----

    //----Inputfield for TERYT
    L.Control.textInput = L.Control.extend({
        options: {
            position: 'topright',
            title: 'Give teryt number'
        },
        onAdd: function() {
            var inp = L.DomUtil.create('input');
            inp.type = "text";
            inp.id = "lteryt";
            inp.value = "Input Teryt code";
            return inp;
        }
    });


    //Allow options 
    L.control.textInput = function(opts) {
        return new L.Control.textInput(opts);
    }
    let tinput = L.control.textInput().addTo(map);


    //----Submit button for TERYT
    let terytbutton = L.easyButton({
        position: 'topright',      
        leafletClasses: true,     
        states:[{                 
            stateName: 'get-center',
            onClick: () => {
                searchPlot(tinput.getContainer().value, tempParcel, args);
            },
            title: 'Click to launch TERYT check',
            icon: 'fa-magnifying-glass'
        }]
    });
    terytbutton.addTo(map);


    //----Button for ParcelPicker
    var stateChangingButton = L.easyButton({
        position: 'topright',
        states: [{
                stateName: 'disable',        
                icon:      'fa-magnifying-glass-location',               
                title:     'Turn on parcel search',      
                onClick: function(btn, map) {       
                    L.DomUtil.addClass(map._container,'crosshair-cursor-enabled');
                    btn.state('entable');    
                }
            }, {
                stateName: 'entable',
                icon:      'fa-solid fa-location-pin',
                title:     'Turn off parcel search',
                onClick: function(btn, map) {
                    L.DomUtil.removeClass(map._container,'crosshair-cursor-enabled');
                    btn.state('disable');
                }
        }]
    });
    stateChangingButton.addTo(map);


    //---- ParcelPicker
    c = new L.Control.Coordinates();
    c.addTo(map);
    function onMapClick(e) {
        c.setCoordinates(e);
        if(stateChangingButton._currentState.stateName == "entable"){
            let coords = e.latlng.lng + ',' + e.latlng.lat;
            pickPlot(coords, tempParcel, args);
            stateChangingButton.state("disable");
            L.DomUtil.removeClass(map._container,'crosshair-cursor-enabled');
        }
    }
    map.on('click', onMapClick);


    //----List button
    L.easyButton({
        position: 'topright',
        states:[
            {
            icon: 'fa-list',
            title: 'Open list of saved parcels',
            onClick: function(){window.open("/list", "_self");}
            }
        ]
    }).addTo(map);

}




