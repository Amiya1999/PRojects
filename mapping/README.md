<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Leaflet Map with Inputs and Markers</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.css" />
    <style>
        #map {
            height: 925px;
        }

        #form-container {
            margin-top: 15px;
        }
    </style>
</head>

<body>
    <div id="form-container">
        <label for="start">Start Location:</label>
        <input type="text" id="start" placeholder="Enter start location">

        <label for="end">End Location:</label>
        <input type="text" id="end" placeholder="Enter end location">

        <button onclick="submitLocations()">Submit</button>
        <button onclick="getCurrentLocation()">Get Current Location</button>
    </div>

    <div id="map"></div>

    <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
    <script src="https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.js"></script>
    <script>
        function generateUUID() {
            return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
                var r = (Math.random() * 16) | 0,
                    v = c === "x" ? r : (r & 0x3) | 0x8;
                return v.toString(16);
            });
        }

        document.addEventListener("DOMContentLoaded", function () {
            var mymap = L.map("map", {
                maxZoom: 18,
            }).setView([12.964508505099051, 77.71364106957832], 25);

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "© OpenStreetMap contributors",
            }).addTo(mymap);

            var searchControl = L.Control.geocoder({
                defaultMarkGeocode: false,
                collapsed: true,
                placeholder: "Search for places..."
            }).addTo(mymap);

            searchControl.on("markgeocode", function (event) {
                var latlng = event.geocode.center;
                mymap.setView(latlng, 15);

                var circle = L.circle(latlng, {
                    color: 'green',
                    fillColor: 'blue',
                    fillOpacity: 0.25,
                    radius: 5000
                }).addTo(mymap);
            });

            var satelliteLayer = L.tileLayer(
                "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
                {
                    attribution: "© Esri",
                }
            );

            var baseLayers = {
                Map: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                    attribution: "© OpenStreetMap contributors",
                }),
                Satellite: satelliteLayer
            };

            L.control.layers(baseLayers).addTo(mymap);

            window.submitLocations = function () {
                var startpoint = document.getElementById("start").value;
                var endpoint = document.getElementById("end").value;
                const map_id = generateUUID();

                var data = {
                    id: map_id,
                    startpoint: startpoint,
                    endpoint: endpoint,
                };

                fetch("/odata/v4/coordinate/coordinates", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(data),
                })
                    .then((response) => response.json())
                    .then((result) => {
                        console.log("Data saved successfully:", result);

                        var length = calculateDistance(data.startpoint, data.endpoint);
                        var dataa = {
                            id: generateUUID(),
                            length: length,
                            coordinate_id: map_id
                        };

                        fetch("/odata/v4/polyline/getinfo", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify(dataa),
                        }).then((response) => response.json())
                            .then((result) => {
                                console.log("Data saved successfully:", result);
                            });

                        fetchAndDrawPolylines();
                    })
                    .catch((error) => {
                        console.error("Error:", error);
                    });
            };

            function calculateDistance(startpoint, endpoint) {
                const [lat1, lon1] = startpoint.split(",").map(Number);
                const [lat2, lon2] = endpoint.split(",").map(Number);

                const R = 6371;
                const dLat = (lat2 - lat1) * (Math.PI / 180);
                const dLon = (lon2 - lon1) * (Math.PI / 180);

                const a =
                    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

                const distance = R * c * 1000;
                return distance;
            }

            function fetchAndDrawPolylines() {
                mymap.eachLayer((layer) => {
                    if (layer instanceof L.Polyline || layer instanceof L.Marker) {
                        mymap.removeLayer(layer);
                    }
                });

                fetch("/odata/v4/coordinate/coordinates")
                    .then((response) => response.json())
                    .then((data) => {
                        var greenIcon = new L.Icon({
                            iconUrl: "https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
                            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.0.0/images/marker-shadow.png",
                            iconSize: [25, 41],
                            iconAnchor: [12, 41],
                            popupAnchor: [1, -34],
                            shadowSize: [41, 41],
                        });

                        var redIcon = new L.Icon({
                            iconUrl: "https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
                            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.0.0/images/marker-shadow.png",
                            iconSize: [25, 41],
                            iconAnchor: [12, 41],
                            popupAnchor: [1, -34],
                            shadowSize: [41, 41],
                        });

                        data.value.forEach((coordinate) => {
                            var startpoint = coordinate.startpoint.split(",").map(Number);
                            var endpoint = coordinate.endpoint.split(",").map(Number);

                            var startMarker = L.marker(startpoint, {
                                icon: greenIcon,
                            }).addTo(mymap);

                            var endMarker = L.marker(endpoint, { icon: redIcon }).addTo(mymap);

                            var polyline = L.polyline([startpoint, endpoint], {
                                color: "blue",
                            }).addTo(mymap);

                            polyline.addEventListener("click", function () {
                                fetch("/odata/v4/polyline/getinfo")
                                    .then((response) => response.json())
                                    .then((data) => {
                                        data.value.forEach((point) => {
                                            if (point.coordinate_id === coordinate.id) {
                                                polyline.bindPopup(
                                                    `<b>Pipe Info</b>Name: ${point.name}<br>Length: ${point.length}<br>Coordinate ID: ${point.coordinate_id}`
                                                );
                                            }
                                        });
                                    });
                            });
                        });
                    })
                    .catch((error) => {
                        console.error("Error fetching data:", error);
                    });
            }

            window.getCurrentLocation = function () {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        function (position) {
                            var latlng = [position.coords.latitude, position.coords.longitude];
                            mymap.setView(latlng, 15);
                            var customIcon = new L.Icon({
                                iconUrl: 'https://cdn4.iconfinder.com/data/icons/proglyphs-traveling/512/Current_Location-512.png',
                                iconSize: [64, 64],
                                iconAnchor: [16, 32],
                                popupAnchor: [0, -32],
                            });
                            L.marker(latlng, { icon: customIcon }).addTo(mymap);
                        },
                        function (error) {
                            console.error("Error getting location:", error);
                        }
                    );
                } else {
                    alert("Geolocation is not supported by this browser.");
                }
            };

            fetchAndDrawPolylines();
        });
    </script>
</body>
</html>














namespace Map;


entity Coordinates{

key id :UUID;
startpoint:String;
endpoint:String;
}

entity PipeInfo {
    key id :UUID;
    name:String;
    length:Double;
    coordinate:Association to Coordinates;
}














using Map from '../db/schema';

service coordinate {

    entity coordinates as projection on Map.Coordinates

}

service polyline{
    entity getinfo as projection on Map.PipeInfo
}



























module.exports = async (srv) => {
  const db = await cds.connect.to({
    kind: 'postgres',
    credentials: {
      "host": "localhost", "port": 5432,
      "user": "postgres",
      "password": "Tathagat@231299",
      "database": "postgres",
      "schemas":"public"
    }
  });
  

  srv.on("CREATE", "coordinates", async (req) => {
    const { data } = req;
 
    console.log("coordinates", data);
    try {
      const query = `INSERT INTO map_coordinates
        (id,startpoint,endpoint)
        VALUES($1, $2, $3)
        RETURNING *`;
 
      const values = [data.id, data.startpoint, data.endpoint];
      const result = await db.run(query, values);
      return result;
    } catch (error) {
      console.error("Error creating city", error);
      throw error;
    }
  });

  srv.on('READ', 'coordinates', async (req) => {
    try {
      const result = await db.run(
        SELECT.from('map_coordinates')
      );
      return result;
    } catch (err) {
      console.error('Error registering user:', err);
      throw err;
    }
  });

  srv.on('READ','getinfo',async(req)=>{
    try{
      const result = await db.run(
        SELECT.from('map_pipeinfo')
      );
      return result;
    }catch(err){
      console.error('Error registering user:', err);
      throw err;
    }
  });
  srv.on('CREATE','getinfo',async(req)=>{
    const {data} = req;
    try{
      const query = `INSERT INTO map_pipeinfo
        (id,length,coordinate_id)
        VALUES($1, $2, $3)
        RETURNING *`;
        const values = [data.id, data.length, data.coordinate_id];

        const result = await db.run(query, values);
      return result;
    }catch(err){
      console.error('Error registering user:', err);
      throw err;
    }
  });

};












{
    "requires": {
      "db": {
        "[pg]": {
          "kind": "postgres",
          "credentials": {
            "host": "localhost", "port": 5432,
            "user": "postgres",
            "password": "Tathagat@231299",
            "database": "postgres"
              }
        }
      }
    }
  }

  