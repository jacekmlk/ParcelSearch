# ParcelSearch
Map web app for land buyers.
### Description:
Applicattion designed to easy locate piece of land and retrieve geoportal information.\
Searches can be stored in user database.

![Mapshowcase](/img/mainimg.png)

Frontend: HTML, CSS, JS, JQuery, Jinja2.\
Backend: Python, Flask
### Dependiences:
Sqlite3\
Python dependiences in requirements.txt
### Usage:
In parent directory run:
```
flask run
```
App will show screen to Log-in. If You don't have account just register.
Basic funcionality of loging/registering is the same as in CS50 finance.

Every parcel in Poland have his own unique id called TERYT. On right upper corner there's search bar. Just paste here TERYT name and app will show you parcel.
In case You don't have id You can pick parcel manually on map. TERYT will be uploaded manually.

![Usage](/img/tools.png)

If You click choosen parcel, window will appear. you can simple fill additional information and save to database. To delete from database click delete.

![Save and Delete](/img/save_delete.png)

Funcionality above were mainly written in Javascript. Communication with server and database using AJAX.
### How it's work:
Main framework, server side is made using Flask.

I'm wrote ```makedb.py``` and ```makemap.sql``` to create map database.

```helpers.py``` comes form finance. There's function handling server errors and decorator for login.

```app.py``` is main server side file. 

**Let's start from client-side.**\
In templates folder there's ```apology.html login.html register.html registerpass.html```. All of them are for logging/register/errorhandling purposes and comes from CS50 finance.

The main funcionality is in ```map.html```. Site responsible for showing the map. This file loads all necessary scripts.

In file: ```static/js/mapObjects.js``` - function ```loadMap()``` is responsible for loading all content to the map: 
- background - OSM from leaflet
- scalebar
- buttons and giving them funcionality
- parcels saved in databese. rendered by use function ```getParcels()```

Also there's defined class Parcel to store information of any parcel entity, geometry, and class methods:
- ```createPolygon()``` - responsible for creating geometry on map.
- ```removePolygon()``` - used to remove geometry from the map.
- ```opis()``` - responsible for creating infill of each polygon pupup.

Buttons fire events connected with functions in ```static/js/mapDownload.js``` file. Functions responsible for communication with servers:

- ```searchPlot()``` - function responsible for searching plot typed in search bar. Fuction use AJAX server call to public service [https://uldk.gugik.gov.pl/](https://uldk.gugik.gov.pl/) to get geometry and data of the parcel. Geometry comes in WKT form and must be converted to list of points using ```wktToPts()``` function. Then plot to map by ```createPolygon()```.
- ```pickPlot()``` - function responsible for showing picked plot. Fuction use AJAX server call to public service [https://uldk.gugik.gov.pl/](https://uldk.gugik.gov.pl/) to get geometry and data of the parcel. Geometry comes in WKT form and must be converted to list of points using ```wktToPts()``` function. Then plot to map by ```createPolygon()```
- ```save()``` - function send data to server using AJAX call. Fired by buttonevent save.
- ```delete()``` - function delete data in server using AJAX call. Fired by buttonevent delete.

On server side there's one file ```app.py```.
At the begining  of file there's database and server configuration. Then starts main funcionality:
- ```get_db, close_connection, query_db, insert_db ```are shortcuts necessary to connect with database. 
- ```index()``` after login render map in start place. When called POST mode render map centered into choosen point.
- ```listParcel()``` get information from database and render ```list.html```. It's list of all stored parcels. There's use custom filter ```ntobr``` to print multiline data in html.
- ```login(), logout(), register()``` comes from CS50 finance and are responsible for login/logout/register process. Are rewritten to avoid using training wheels.
- ```saveParcel()``` fired by js ```save()``` function save data to user database.
- ```deleteParcel()``` fired by js ```delete()``` function save data to user database.
- ```getParcel()``` runs as querying tool to retrieve data. Fired by ```getParcels()``` on frontside.

All other files are dependiences.

### Credits:
Site framework [Bootstrap](https://getbootstrap.com/)\
Map app: [Leaflet](https://leafletjs.com/)\
Leaflet plugins: [L.EasyButton](https://github.com/CliffCloud/Leaflet.EasyButton), [Leaflet Coordinates Control](https://github.com/zimmicz/Leaflet-Coordinates-Control)\
Server side: [Flask](https://flask.palletsprojects.com/en/3.0.x/)\
Maps: [OpenStreetMap contributors](https://www.openstreetmap.org/copyright)\
Datasource and API: [Geoportal.gov.pl](https://www.geoportal.gov.pl/), [Uldk](https://uldk.gugik.gov.pl/)
JS framework: [jQuery](https://jquery.com/)
 
