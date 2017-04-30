var geocoder;
var map;
var markers = [];
var markers_id_counter = 0;
var goTo_marker;

//initilize the map and the starting values (centered on Israel) - Including autocomplete, directions and markers
function initialize() {
  directionsDisplay = new google.maps.DirectionsRenderer();
  geocoder = new google.maps.Geocoder();
  var latlng = new google.maps.LatLng(31.446566, 34.762248);
  var mapOptions = {
    zoom: 7,
    center: latlng
  }
  map = new google.maps.Map(document.getElementById('map'), mapOptions);
  //this directionsDisplay will be used to show the route of the requested directions
  directionsDisplay.setMap(map);
  // This event listener will call addMarker() when the map is clicked.
  map.addListener('click', function(event) {
    addMarker(event.latLng);
  });

  var input = document.getElementById('start');
  var searchBox_start = new google.maps.places.SearchBox(input);
  input = document.getElementById('end');
  var searchBox_end = new google.maps.places.SearchBox(input);

  // Bias the SearchBox results towards current map's viewport.
  map.addListener('bounds_changed', function() {
    searchBox_start.setBounds(map.getBounds());
    searchBox_end.setBounds(map.getBounds());
  });

  // Listen for the event fired when the user selects a prediction and retrieve
  // more details for that place.
  searchBox_start.addListener('places_changed', function() {
    var places = searchBox_start.getPlaces();

    if (places.length == 0) {
      return;
    }

    // For each place, get the icon, name and location.
    var bounds = new google.maps.LatLngBounds();
    places.forEach(function(place) {
      if (!place.geometry) {
        console.log("Returned place contains no geometry");
        return;
      }
      var icon = {
        url: place.icon,
        size: new google.maps.Size(71, 71),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17, 34),
        scaledSize: new google.maps.Size(25, 25)
      };

      if (place.geometry.viewport) {
        // Only geocodes have viewport.
        bounds.union(place.geometry.viewport);
      } else {
        bounds.extend(place.geometry.location);
      }
    });
    map.fitBounds(bounds);
  });

  searchBox_end.addListener('places_changed', function() {
    var places = searchBox_end.getPlaces();

    if (places.length == 0) {
      return;
    }

    // For each place, get the icon, name and location.
    var bounds = new google.maps.LatLngBounds();
    places.forEach(function(place) {
      if (!place.geometry) {
        console.log("Returned place contains no geometry");
        return;
      }
      var icon = {
        url: place.icon,
        size: new google.maps.Size(71, 71),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17, 34),
        scaledSize: new google.maps.Size(25, 25)
      };

      if (place.geometry.viewport) {
        // Only geocodes have viewport.
        bounds.union(place.geometry.viewport);
      } else {
        bounds.extend(place.geometry.location);
      }
    });
    map.fitBounds(bounds);
  });
}

/////////////////////////////////////////////////////////////////////////
//Everything that has to do with adding and removing MARKERS on the map//
/////////////////////////////////////////////////////////////////////////

//reads a location from the "adress" input field, centers the map on it and adds a marker
function goTo() {
  var address = document.getElementById('address').value;
  geocoder.geocode( { 'address': address}, function(results, status) {
    if (status == 'OK') {
      map.setCenter(results[0].geometry.location);
      var marker = new google.maps
      .Marker({
          map: map,
          position: results[0].geometry.location
      });
      if(goTo_marker!=null){
        goTo_marker.setMap(null);
      }
      goTo_marker=marker;
    } else {
      alert('Geocode was not successful for the following reason: ' + status);
    }
  });
}

//reads a list of markers from the "add-markers" input field and adds them to the map
function addMarkers() {
  var new_markers = document.getElementById('add-markers').value;
  var new_markers_arr = new_markers.split(/\s*;\s*/);
  if(new_markers_arr[new_markers_arr.length-1]==""){
    new_markers_arr.pop();
  }
  for(var i=0; i<new_markers_arr.length; i++){
      geocoder.geocode( { 'address': new_markers_arr[i]}, function(results, status) {
        if (status == 'OK') {
          addMarker(results[0].geometry.location);
        } else {
          alert('Geocode was not successful for the following reason: ' + status);
        }
      });
  }
}

// Adds a marker to the map and push to the array.
function addMarker(location) {
  var marker = new google.maps.Marker({
    position: location,
    map: map,
    icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
  });
  marker.setValues({id: markers_id_counter});//because all v3 objects extend MVCObject()
  marker.addListener('click', function() {
          deleteMarker(marker);
  });
  markers[marker.get("id")] = marker;
  markers_id_counter++;
  if(markers_id_counter%100 == 0){//maintaining a smaller array by removing deleted markers (happens every 100 markers)
      clean_null_markers();
  }
}

// Sets the map on all markers in the array.
function setMapOnAll(map) {
  for (var i = 0; i < markers.length; i++) {
    if(markers[i]!=null){
        markers[i].setMap(map);
    }
  }
}

// Removes the markers from the map, but keeps them in the array.
function clearMarkers() {
  setMapOnAll(null);
  markers_id_counter=0;
}

// Shows any markers currently in the array.
function showMarkers() {
  setMapOnAll(map);
}

// Deletes all markers in the array by removing references to them.
function deleteMarkers() {
  clearMarkers();
  markers = [];
}

//delete the given marker from the map and markers array
function deleteMarker(marker){
  marker.setMap(null);
  markers[marker.get("id")] = null;
}

//remove null markers from the array and reindex exisisting markers to prevent wasted cells
function clean_null_markers(){
  var temp = [];
  for(var i = 0; i<markers.length; i++){
    if(markers[i]!=null){
      temp.push(markers[i]);
      temp[temp.length-1].set("id" , temp.length-1);
    }
  }
  markers_id_counter = temp.length;
  markers = temp;
}

/////////////////////////////////////////////////////////////////////////
//Everything that has to do with getting directions and paths               //
/////////////////////////////////////////////////////////////////////////
var directionsDisplay;
var directionsService = new google.maps.DirectionsService();

function calcRoute() {
  var travelMode = document.getElementById('travelMode').value;
  if(travelMode=="NONE"){
      alert('Choose a valid transportation method to get directions');
      return;
  }
  var start = document.getElementById('start').value;
  var end = document.getElementById('end').value;
  var request = {
    origin: start,
    destination: end,
    travelMode: travelMode
  };
  directionsService.route(request, function(result, status) {
    if (status == 'OK') {
      directionsDisplay.setDirections(result);
    }
    else{
      alert('Route was not successful for the following reason: ' + status);
    }
  });
}
