// Functions responsible to download and send data to server

//----Funkcja zwraca działkę po kliknięciu
function pickPlot(picker, parc, args) {
    //const args = ["id", "parcel", "voivodeship","powiat", "gmina", "region", "geom_wkt"];
    let location = picker + ',4326';

    let result = {}; //Defined result
    advAJAX.post({
        url : "https://uldk.gugik.gov.pl/",parameters : {request:"GetParcelByXY",xy:location,result:String(args),srid:4326},
        onSuccess : function(obj) {
            let lines = obj.responseText.split('\n');
            
            //Validator
            if(lines[0]!=0){
                alert("Error! " + lines[0]);
                return 0;
            }
            let fields = lines[1].split('|');
            let x = fields.length;
            for(let j=0;j<x;j++){
                result[args[j]] = fields[j];
            }
            result["geom_wkt"] = wktToPts(result["geom_wkt"]);

            if (parc) {
                parc.removePolygon();
                parc = null;
            }

            for (const [key, value] of Object.entries(primaryEditArgs)) {
                result[key] = value;
            }
            
            parc = new Parcel(map, result);
            parc.createPolygon(true);
        }
    });
}


//---- Search plot by TERYT
function searchPlot(teryt, parc, args) {

    //----Validator
    if (teryt.length<13&&teryt.search(' ')==-1||teryt==""){
        alert("Fraza zbyt krótka");
        return 0;
    }

    //const args = ["id", "parcel", "voivodeship","powiat", "gmina", "region", "geom_wkt"];
    let result = {};    //Defined result
    advAJAX.post({
        url : "https://uldk.gugik.gov.pl/",parameters : {request:"GetParcelById",id:teryt,result:String(args),srid:4326},
        onSuccess : function(obj) {
            let lines = obj.responseText.split('\n');

            // Validator
            if(lines[0]!=0){
                alert("There's no such parcel");
                return 0;
            }

            let fields = lines[1].split('|');
            let x = fields.length;
            for(let j=0;j<x;j++){
                result[args[j]] = fields[j];
            }
            result["geom_wkt"] = wktToPts(result["geom_wkt"]);

            if (parc) {
                parc.removePolygon();
                parc = null;
            }

            for (const [key, value] of Object.entries(primaryEditArgs)) {
                result[key] = value;
            }

            parc = new Parcel(map, result);
            parc.createPolygon(true);
        }
    });
}


//----Convert wkt to points
function wktToPts(wkt){
    let points = new Array();

    geom=wkt;
    geom=geom.replace('SRID=4326;','');
    geom=geom.replace('POLYGON((','');
    geom=geom.replace('))','');
    geom=geom.replace('\r','');
    
    let p = geom.split(',');
    for(let i=0;i<p.length;i++){
        let pt = p[i].split(' ');
        points.push(new Array(pt[1], pt[0]));
    }

    return points;
}


//----Save -> Send data to server
function save(data) {
    let dt = JSON.stringify(data)
    fetch(save_url, {
        method: "POST",
        body:dt,
        headers: {
        "Content-Type": "application/json"
        }
    })
    .then(res => res.text())
    .then(res => {
        alert(res);
    });
}


//----Delete -> Delete data from server
function del(data) {
    let dt = JSON.stringify(data)
    fetch(delete_url, {
        method: "POST",
        body:dt,
        headers: {
        "Content-Type": "application/json"
        }
    })
    .then(res => res.text())
    .then(res => {
        alert(res);
    });
}

//Get parcels in database
function getParcels() {
    fetch(parcel_url, {
        method: "POST"
    })
    .then(res => res.json())
    .then(res => {
        let len = res.length
        for(let i=0;i<len;i++) {
            new Parcel(map, res[i]).createPolygon(false);
        }
    });
}