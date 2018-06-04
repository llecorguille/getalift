/*	=====================================
 *		Backend Server for Get A Lift
 *	-------------------------------------
 *	This is the server-side of the Get A
 *	Lift app.
 *	-------------------------------------
 *	Author	: Argann Bonneau
 *	Date	: 03/07/17
 *	Version	: v0.2.1
 *	=====================================
 */


/* ==============
 *	Requirements
 * ==============
 */
// Express
var express = require("express");
var app = express();

// Mysql driver
var mysql = require("mysql");

// Body parser
var bodyParser = require("body-parser");

// Json web tokens
var jwt = require("jsonwebtoken");

// Configuration file
var config = require("./config");

// The google maps client, with the API key
var googleMapsClient = require("@google/maps").createClient({
	key: "AIzaSyBs8kWpOEQ4Qts0ZBP7hehi3cAhOwfyiH0"
});

var bcrypt = require("bcrypt");

/* ===============
 *	Configuration
 * ===============
 */

// Database connection configuration
var db_con = mysql.createConnection({
	host: "db",
	user: "gal_user",
	password: "gal_pwd",
	database: "gal_db",
	multipleStatements: true
});


//connection.db_con(function(err) {
//  if (err) throw err
//  console.log('You are now connected...')
//})

// Setting up the app super secret
app.set("superSecret", config.secret);


// Configuration for Body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


/* ========
 *	Routes
 * ========
 */

var router = express.Router();

// --- Main ---


// Route				: /api/
// URL Params		: None
// Body Params	: None
// Return				: {message: "Hello World !"}
// Description	:
//					This route just send back one very simple json object with "Hello world !".
// 					It can be used to check if the api is online.
router.get("/", function(req, res){
	res.json({message: "Hello World !"});
	console.log("Hello !");
});

// --- User Creation ---

// Route				: POST /api/users
// URL Params		: None
// Body Params	:
// 		- username			: The User's Username
// 		- password			: The User's Password
// 		- name					: His last name
// 		- surname				: His first name
// 		- email					: His email
// 		- mobileNumber	: His mobile number
// Return		:
// 		- success		: boolean that tell if the insertion is a success or not.
// 		- message		: string (if errror) the error message
// 		- errorCode	: int (if error) the error code
// 		- and what the mysql module returns.
// Description	:
//					We must not need a token in order to create an account, because when
//					someone want to create an account,
// 					he is not yet logged in

router.post("/users", function(req, res){
	// First, we check if the username already exists in the database.
	db_con.query("SELECT * FROM User WHERE username = ?", [req.body.username], function(err, result){
		if (err) throw err;
		if (result.length === 1){
			// If the username already exists, we send an error.
			res.json({
				success: 	false,
				message: 	"This Username already exists",
				errorCode:	1
			});
		} else {
			// Else, we hash the password in order to store it in the database.
			var passHash = bcrypt.hashSync(req.body.password, config.saltRounds);
			// And we launch the query that store everything in the db.
			db_con.query(
				"INSERT INTO User (username, password, name, surname, email, mobileNumber) VALUES (?, ?, ?, ?, ?, ?)",
				[req.body.username, passHash, req.body.name, req.body.surname, req.body.email, req.body.mobileNumber],
				function(err, result){
					if(err) throw err;
					// At the end, we respond with a success.
					result.success = true;
					res.json(result);
				}
			);
		}
	});

});

// --- Auth ---

// Route				: POST /api/auth
// URL Params		: None
// Body Params	:
// 		- username			: The User's Username
// 		- password			: The User's Password
// Return		:
// 		- success		: boolean that tell if the auth is a success or not.
// 		- message		: string the resulting message.
// 		- token			: string, if success, the token that is linked to this user.
// 		- user			: object, if success, the instance of the logged user.
// Description	:
//					This route must be used before any other request, in order to
//					get the token that allow the user to use the others API routes.
router.post("/auth", function(req, res){
	// Search for the correct user.
	db_con.query("SELECT * FROM User WHERE username = ?", [req.body.name], function(err, result){
		// If there is an error, throw it.
		if (err) throw err;
		// If there is one user with this username...
		if (result.length === 1){
			// We check if the password given is the good one.
			bcrypt.compare(req.body.password, result[0]["password"], function(err, bres){
				if(bres){
					// It's the good one !
					// We create the token based on this user and our super secret.
					var token = jwt.sign(result[0], app.get("superSecret"));
					// And we send it.
					res.json({ success: true, message: "Auth succeed !", token: token, user: result[0] });
				} else {
					// It's not...
					res.json({ success: false, message: "Auth failed. Wrong credentials." });
				}
			});
		} else {
			// If there is no correct user, we send a failure.
			res.json({ success: false, message: "Auth failed. Wrong username." });
		}
	});
});

// =======================================================================
//	Warning : Every route defined before these lines doesn't need a token
//	to be accessible.
// =======================================================================

// This is an ExpressJS middleware. This code is executed before every route
// defined after. It check if the given token with the request is correct.
router.use(function(req, res, next){
	// We get the token in any of the possible location.
	var token = req.body.token || req.query.token || req.headers["x-access-token"];
	// If there is a token...
	if(token){
		// We check it with jsonwebtoken
		jwt.verify(token, app.get("superSecret"), function(err, decoded){
			if(err){
				// If the token is not valid, we send an error.
				return res.json({ success: false, message: "Failed to auth token." });
			} else {
				// Else, everything is fine, so we call the route that the user wants
				// to access.
				req.decoded = decoded;
				next();
			}
		});
	} else {
		// If there is no token provided, we send an error.
		return res.status(403).send({
			success: false,
			message: "No token provided"
		});
	}
});

// =======================================================================
//	Warning : Every route defined after these lines must need a token to
// 	be accessible. You can define it for example in the header of your
//	HTTP query, with the key "x-access-token".
// =======================================================================

// --- Users ---

// /!\ The creation of a user is before the "auth" method. /!\

// Route				: GET /api/users
// URL Params		: None
// Body Params	: None
// Return		:
// 		- the mysql result object
// Description	:
//					This route send back every public informations about every users.
//					It can be a bit heavy with a lot of users.
router.get("/users", function(req, res){
	db_con.query("SELECT `id`, `username`, `name`, `surname`, `email`, `mobileNumber`, `isVerified` FROM User", function(err, result){
		if(err) throw err;
		res.json(result);
	});
});

// Route				: GET /api/users/:usrid
// URL Params		:
//		- usrid					: The ID of the user you want to retrieve the info.
// Body Params	: None
// Return		:
// 		- the mysql object for this user.
// Description	:
//					This route send back the public informations about the chosen user.
router.get("/users/:usrid", function(req, res){
	db_con.query("SELECT `id`, `username`, `name`, `surname`, `email`, `mobileNumber`, `isVerified` FROM User WHERE id = ?", [req.params.usrid], function(err, result){
		if(err) throw err;
		res.json(result);
	});
});

// Route				: PUT /api/users/:usrid
// URL Params		:
//		- usrid					: The ID of the user you want to edit the info.
// Body Params	:
// 		- username			: The User's Username
// 		- password			: The User's Password
// 		- name					: His first name
// 		- surname				: His last name
// 		- email					: His email
// 		- mobileNumber	: His mobile number
//		- isVerified		: Is the user is verified ?
// Return		:
// 		- the mysql object for this user.
// Description	:
//					This route update the information about the chosen user.
router.put("/users/:usrid", function(req, res){
	db_con.query("UPDATE User SET username = ?, password = ?, name = ?, surname = ?, email = ?, mobileNumber = ?, isVerified = ? WHERE id = ?",
		[req.body.username, bcrypt.hashSync(req.body.password, config.saltRounds),
			req.body.name, req.body.surname, req.body.email, req.body.mobileNumber,
			req.body.isVerified, req.params.usrid],
		function(err, result){
			if(err) throw err;
			res.json(result);
		}
	);
});

// Route				: DELETE /api/users/:usrid
// URL Params		:
//		- usrid					: The ID of the user you want to delete.
// Body Params	: None
// Return		:
// 		- the mysql return object.
// Description	:
//					This route deletes the chosen user.
router.delete("/users/:usrid", function(req, res){
	db_con.query("DELETE FROM User WHERE id = ?", [req.params.usrid], function(err, result){
		if(err) throw err;
		res.json(result);
	});
});

// --- Routes ---

// Route				: GET /api/routes
// URL Params		: None
// Body Params	: None
// Return		:
// 		- the mysql result object
// Description	:
//					This route send back every informations about all the routes.
//					It can be a bit heavy with a lot of routes.
router.get("/routes", function(req, res){
	db_con.query("SELECT * FROM Route", function(err, result){
		if(err) throw err;
		res.json(result);
	});
});

// Route				: GET /api/routes/:routeid
// URL Params		:
//		- routeid					: The ID of the route you want to retrieve the info.
// Body Params	: None
// Return		:
// 		- the mysql object for this route.
// Description	:
//					This route send back the public informations about the chosen route.
router.get("/routes/:routeid", function(req, res){
	db_con.query("SELECT * FROM Route WHERE id = ?", [req.params.routeid], function(err, result){
		if(err) throw err;
		res.json(result);
	});
});

router.get("/driverroutes/:driverid", function(req, res){
	db_con.query("SELECT * FROM Route, RouteDate WHERE (Route.id = RouteDate.route) AND (Route.driver = ?)", [req.params.driverid], function(err, result){
		if(err) throw err;
		res.json(result);
	});
});

// RouteDate				: GET /api/routedate/:routeid
// URL Params		:
//		- routeid					: The ID of the route you want to retrieve the info.
// Body Params	: None
// Return		:
// 		- the mysql object for this route.
// Description	:
//					This routedate send back the public informations about the chosen routedate.
router.get("/routedate/:routeid", function(req, res){
	db_con.query("SELECT * FROM RouteDate WHERE route = ?", [req.params.routeid], function(err, result){
		if(err) throw err;
		res.json(result);
	});
});

router.get("/routedate", function(req, res){
	db_con.query("SELECT * FROM RouteDate", function(err, result){
		if(err) throw err;
		res.json(result);
	});
});


// Route				: GET /api/routes/search
// URL Params		:
// 		- startLat			: The Latitude of the starting point
// 		- startLng			: The Longitude of the starting point
// 		- endLat				: The Latitude of the end point
// 		- endLng				: The Longitude of the end point
// 		- startDate			: The starting datetime of the route
// 		- endDate				: The end datetime of the route
//		- maxWaitingSeconds : The max number of seconds that the user can wait.
// Body Params	: None
// Return		:
// 		- An array with every routes that match the parameters.
// Description	:
//		This route can be used in order to search for a route that match specific
//		parameters. Each of these must be provided, none can be null.
router.get("/searchT", function(req, res){
	// We retrieve the parameters in custom vars
	var startDate = req.param("date");
	var startLatitude = parseFloat(req.param("startLat"));
	var startLongitude = parseFloat(req.param("startLng"));
	var endLatitude = parseFloat(req.param("endLat"));
	var endLongitude = parseFloat(req.param("endLng"));
	//var maxWaitingSeconds = req.param("maxWaitingSeconds");

	// then, we simply launch this heavy query into the database.
	db_con.query(
		"SELECT starting_point.`id` as start_p, end_point.`id` as end_p FROM "+
			"(SELECT RP.`route`, RP.`point_rank`, RP.`id` FROM `RoutePoints` RP "+
				"INNER JOIN `Route` R ON R.`id` = RP.`route` "+
				"INNER JOIN `RouteDate`RD ON R.`id` = RD.`route` "+
			"WHERE "+
				"DAYOFWEEK(STR_TO_DATE(?, '%Y-%m-%d %k:%i:%s')) = DAYOFWEEK(`route_date`) "+
			"ORDER BY "+
				"ST_Distance(`point`, ST_GeomFromText('Point(? ?)'))) as starting_point, "+
		"WHERE "+
			"starting_point.`route` = end_point.`route` "+
			"AND "+
			"starting_point.`point_rank` < end_point.`point_rank`; "
		, [startDate, startLatitude, startLongitude, endLatitude, endLongitude],
		function(err, result){
			if(err) throw err;

			res.json(result);
		});
});

// Route				: GET /api/routes/search
// URL Params		:
// 		- startLat			: The Latitude of the starting point
// 		- startLng			: The Longitude of the starting point
// 		- endLat				: The Latitude of the end point
// 		- endLng				: The Longitude of the end point
// 		- startDate			: The starting datetime of the route
// 		- endDate				: The end datetime of the route
//		- maxWaitingSeconds : The max number of seconds that the user can wait.
// Body Params	: None
// Return		:
// 		- An array with every routes that match the parameters.
// Description	:
//		This route can be used in order to search for a route that match specific
//		parameters. Each of these must be provided, none can be null.
router.get("/search/", function(req, res){
	// We retrieve the parameters in custom vars
	var routeDate = req.param("date");
	//var startLatitude = parseFloat(req.param("startLat"));
	//var startLongitude = parseFloat(req.param("startLng"));
	//var endLatitude = parseFloat(req.param("endLat"));
	//var endLongitude = parseFloat(req.param("endLng"));
	//var maxWaitingSeconds = req.param("maxWaitingSeconds");

	// then, we simply launch this heavy query into the database.
	db_con.query("SELECT * FROM Route, RouteDate "+
                 "WHERE (Route.id = RouteDate.route) AND (RouteDate.route_date > ?) "+
                 "ORDER BY RouteDate.route_date"
                 , [routeDate], function(err, result){
			if(err) throw err;
			res.json(result);
		});
});

router.get("/search2/", function(req, res){
	// We retrieve the parameters in custom vars
	var routeDate = req.param("date");
	var startLatitude = parseFloat(req.param("startLat"));
	var startLongitude = parseFloat(req.param("startLng"));
	var endLatitude = parseFloat(req.param("endLat"));
	var endLongitude = parseFloat(req.param("endLng"));
	//var maxWaitingSeconds = req.param("maxWaitingSeconds");

	// then, we simply launch this heavy query into the database.
	db_con.query("SELECT * FROM Route, RouteDate WHERE (Route.id = RouteDate.route) AND ((RouteDate.route_date >= ?) OR ( RouteDate.weekly_repeat= 1 AND DAYOFWEEK(?) = DAYOFWEEK(`route_date`) )) ORDER BY RouteDate.route_date AND ( ST_Distance(Route.startingPoint, ST_GeomFromText('Point(? ?)')) AND ST_Distance(Route.startingPoint, ST_GeomFromText('Point(? ?)')) )"
                 , [routeDate, routeDate, startLatitude, startLongitude, endLatitude, endLongitude], function(err, result){
			if(err) throw err;
			res.json(result);
		});
});



// Route				: PUT /api/routes/
// URL Params		: None
// Body Params	:
// 		- startLat			: The Latitude of the starting point
// 		- startLng			: The Longitude of the starting point
// 		- endLat				: The Latitude of the end point
// 		- endLng				: The Longitude of the end point
// 		- dates					: The array of dates for this route.
// 		- driverId			: The User ID of the driver
// Return		:
// 		- the mysql object for this query.
// Description	:
//		This route create a new Route in the database. It search the optimal
//		directions with the google maps API, in order to store the best route.
router.put("/routes", function(req, res){
	// We store every parameters in custom vars.
	var startLat = parseFloat(req.body.startLat);
	var startLng = parseFloat(req.body.startLng);
	var endLat = parseFloat(req.body.endLat);
	var endLng = parseFloat(req.body.endLng);
    
    var origin = req.body.origin
    var destination = req.body.destination
    var distance = req.body.distance
    var duration = req.body.duration

	var dates = req.body.dates.split(";");

	//console.log(req.body.dates)
	//console.log(dates);


	var driverId = req.body.driverId;

	var query = "";

	// We get the directions between the two points with the google maps api.
	googleMapsClient.directions({
		origin: ""+startLat+","+startLng,
		destination: ""+endLat+","+endLng
	}, function(error, response){
		// If there is an error with the GM API request, we send it back.
		if(error){
			res.json(error);
		} else {
			// If there is no error, we put the new route into the database.
			db_con.query("INSERT INTO `Route` (`id`, `startingPoint`, `endPoint`, `driver`,`originAdress`,`destinationAdress`,`distance`,`duration`) VALUES (NULL, ST_GeomFromText('POINT(? ?)'), ST_GeomFromText('POINT(? ?)'), ?,? ,? ,? , ?);",
				[startLat, startLng, endLat, endLng, driverId, origin, destination, distance, duration],
				function(err, result){
					if(err) throw err;
					// Next, we store the weekly repeat in the database.
					// Each line of the RouteMeta table store a date, and an time interval from this date.
					for (var i = 0; i < dates.length-1; i=i+2){
						query += mysql.format(
							"INSERT INTO `RouteDate` (`id`, `route`, `route_date`, `weekly_repeat`) VALUES (NULL, ?, ?, ?);",
							[result.insertId, dates[i], dates[i+1]]
						);
					}

					// Finally, we store the points in the table RoutePoints, that we got from the Google Maps Directions API
					var steps = response.json.routes[0].legs[0].steps;
					var seconds_from_start = 0;
					for (var j = 0; j < steps.length; j++){
						if (j === 0){
							// If it's the first step, we need to store the starting point adding to the end point.
							query += mysql.format(
								"INSERT INTO `RoutePoints` (`id`, `route`, `point_rank`, `point`, `seconds_from_start`) VALUES (NULL, ?, ?, ST_GeomFromText('POINT(? ?)'), ?);",
								[result.insertId, 0, steps[0].start_location.lat, steps[0].start_location.lng, seconds_from_start]
							);
						}

						seconds_from_start += parseInt(steps[j].duration.value);
						// Then we store the end points for each steps into the database.
						query += mysql.format(
							"INSERT INTO `RoutePoints` (`id`, `route`, `point_rank`, `point`, `seconds_from_start`) VALUES (NULL, ?, ?, ST_GeomFromText('POINT(? ?)'), ?);",
							[result.insertId, j+1, steps[j].end_location.lat, steps[j].end_location.lng, seconds_from_start]
						);
					}
					// Then, we launch the query into the database.
					db_con.query(query, [], function(e, r){
						if(e) throw e;
						res.json(r);
					});
				});
		}
	});

});

// Route				: DELETE /api/routes/:routeid
// URL Params		:
//		- routeid					: The ID of the route you want to delete.
// Body Params	: None
// Return		:
// 		- the mysql return object.
// Description	:
//					This route deletes the chosen route.
router.delete("/routes/:routeid", function(req, res){
	db_con.query("DELETE FROM Route WHERE id = ?", [req.params.routeid], function(err, result){
		if(err) throw err;
		res.json(result);
	});

});

// --- Rides ---

// Route				: GET /api/rides
// URL Params		: None
// Body Params	: None
// Return		:
// 		- the mysql result object
// Description	:
//					This route send back every informations about all the rides.
//					It can be a bit heavy with a lot of rides.
router.get("/rides", function(req, res){
	db_con.query("SELECT * FROM Ride", function(err, result){
		if(err) throw err;
		res.json(result);
	});
});

// Route				: GET /api/rides/:rideid
// URL Params		:
//		- usrid					: The ID of the ride you want to retrieve the info.
// Body Params	: None
// Return		:
// 		- the mysql object for this ride.
// Description	:
//					This route send back the public informations about the chosen ride.
router.get("/rides/:rideid", function(req, res){
	db_con.query("SELECT * FROM Ride WHERE id = ?", [req.params.rideid], function(err, result){
		if(err) throw err;
		res.json(result);
	});
});

// Route				: POST /api/rides/
// URL Params		: None
// Body Params	:
//		- route : the id of the route you want to link to this ride.
// Return		:
// 		- the mysql object for this ride.
// Description	:
//					This route can create a ride in the database.
router.post("/rides", function(req, res){
	db_con.query("INSERT INTO Ride (route) VALUES (?)",
		[req.body.route],
		function(err, result){
			if(err) throw err;
			res.json(result);
		}
	);
});

// Route				: PUT /api/rides/:rideid
// URL Params		:
//		- rideid					: The ID of the ride you want to edit the info.
// Body Params	:
// 		- route : the id of the route you want to link to this ride.
// Return		:
// 		- the mysql object for this ride.
// Description	:
//					This route update the information about the chosen ride.
router.put("/rides/:rideid", function(req, res){
	db_con.query("UPDATE Ride SET route = ? WHERE id = ?",
		[req.body.route, req.params.rideid],
		function(err, result){
			if(err) throw err;
			res.json(result);
		}
	);
});

// Route				: DELETE /api/rides/:rideid
// URL Params		:
//		- rideid					: The ID of the ride you want to delete.
// Body Params	: None
// Return		:
// 		- the mysql return object.
// Description	:
//					This route deletes the chosen ride.
router.delete("/rides/:rideid", function(req, res){
	db_con.query("DELETE FROM Ride WHERE id = ?", [req.params.rideid], function(err, result){
		if(err) throw err;
		res.json(result);
	});
});

// --- Passengers ---

// Route				: GET /api/passengers
// URL Params		: None
// Body Params	: None
// Return		:
// 		- the mysql result object
// Description	:
//					This route send back every informations about all the passengers.
//					It can be a bit heavy with a lot of passengers.
router.get("/passengers", function(req, res){
	db_con.query("SELECT * FROM Passenger", function(err, result){
		if(err) throw err;
		res.json(result);
	});
});

// Route				: GET /api/passengers/:passid
// URL Params		:
//		- usrid					: The ID of the passenger you want to retrieve the info.
// Body Params	: None
// Return		:
// 		- the mysql object for this passenger.
// Description	:
//					This route send back the public informations about the chosen passenger.
router.get("/passengers/:passid", function(req, res){
	db_con.query("SELECT * FROM Passenger WHERE id = ?", [req.params.passid], function(err, result){
		if(err) throw err;
		res.json(result);
	});
});

// Route				: POST /api/passenger/
// URL Params		: None
// Body Params	:
//		- ride 			: the id of the ride you want to link to this passenger.
//		- passenger : the id of the user you want to link to this passenger.
// Return		:
// 		- the mysql object for this passenger.
// Description	:
//					This route can create a passenger in the database.
router.post("/passenger", function(req, res){
	db_con.query("INSERT INTO Passenger (ride, passenger) VALUES (?, ?)",
		[req.body.ride, req.body.passenger],
		function(err, result){
			if(err) throw err;
			res.json(result);
		}
	);
});

// Route				: PUT /api/passenger/:passid
// URL Params		:
//		- passid					: The ID of the passenger you want to edit the info.
// Body Params	:
//		- ride 			: the id of the ride you want to link to this passenger.
//		- passenger : the id of the user you want to link to this passenger.
// Return		:
// 		- the mysql object for this ride.
// Description	:
//					This route update the information about the chosen ride.
router.put("/passenger/:passid", function(req, res){
	db_con.query("UPDATE Passenger SET ride = ?, passenger = ? WHERE id = ?",
		[req.body.ride, req.body.passenger, req.params.passid],
		function(err, result){
			if(err) throw err;
			res.json(result);
		}
	);
});

// Route				: DELETE /api/passenger/:passid
// URL Params		:
//		- passid					: The ID of the passenger you want to delete.
// Body Params	: None
// Return		:
// 		- the mysql return object.
// Description	:
//					This route deletes the chosen passenger.
router.delete("/passenger/:passid", function(req, res){
	db_con.query("DELETE FROM Passenger WHERE id = ?", [req.params.passid], function(err, result){
		if(err) throw err;
		res.json(result);
	});
});

// --- Ratings ---

// Route				: GET /api/ratings
// URL Params		: None
// Body Params	: None
// Return		:
// 		- the mysql result object
// Description	:
//					This route send back every informations about all the ratings.
//					It can be a bit heavy with a lot of rates.
router.get("/ratings", function(req, res){
	db_con.query("SELECT * FROM Rating", function(err, result){
		if(err) throw err;
		res.json(result);
	});
});

// Route				: GET /api/ratings/:rateid
// URL Params		:
//		- usrid					: The ID of the rate you want to retrieve the info.
// Body Params	: None
// Return		:
// 		- the mysql object for this rate.
// Description	:
//					This route send back the public informations about the chosen rate.
router.get("/ratings/:rateid", function(req, res){
	db_con.query("SELECT * FROM Rating WHERE id = ?", [req.params.rateid], function(err, result){
		if(err) throw err;
		res.json(result);
	});
});

// Route				: POST /api/ratings/
// URL Params		: None
// Body Params	:
//		- author : the id of the user that creates this rating.
//		- target : the id of the user that is the target of this rating.
//		- ride	 : the id of the ride that is linked to this rating.
//		- stars	 : the number of stars that are linked to this rating.
//		- comment: the text linked to this rating.
//		- postDate: the datetime of this rating.
// Return		:
// 		- the mysql object for this ride.
// Description	:
//					This route can create a ride in the database.
router.post("/ratings", function(req, res){
	db_con.query("INSERT INTO Rating (author, target, ride, stars, comment, postDate) VALUES (?, ?, ?, ?, ?, ?)",
		[req.body.author, req.body.target, req.body.ride, req.body.stars, req.body.comment, req.body.postDate],
		function(err, result){
			if(err) throw err;
			res.json(result);
		}
	);
});

// Route				: PUT /api/ratings/:rateid
// URL Params		:
//		- rateid					: The ID of the rate you want to edit the info.
// Body Params	:
//		- author : the id of the user that creates this rating.
//		- target : the id of the user that is the target of this rating.
//		- ride	 : the id of the ride that is linked to this rating.
//		- stars	 : the number of stars that are linked to this rating.
//		- comment: the text linked to this rating.
//		- postDate: the datetime of this rating.
// Return		:
// 		- the mysql object for this rate.
// Description	:
//					This route update the information about the chosen rating.
router.put("/ratings/:rateid", function(req, res){
	db_con.query("UPDATE Rating SET author = ?, target = ?, ride = ?, stars = ?, comment = ?, postDate = ? WHERE id = ?",
		[req.body.author, req.body.target, req.body.ride, req.body.stars, req.body.comment, req.body.postDate, req.params.rateid],
		function(err, result){
			if(err) throw err;
			res.json(result);
		}
	);
});

// Route				: DELETE /api/ratings/:rateid
// URL Params		:
//		- rateid					: The ID of the rating you want to delete.
// Body Params	: None
// Return		:
// 		- the mysql return object.
// Description	:
//					This route deletes the chosen rate.
router.delete("/ratings/:rateid", function(req, res){
	db_con.query("DELETE FROM Rating WHERE id = ?", [req.params.rateid], function(err, result){
		if(err) throw err;
		res.json(result);
	});

});










router.get("/favoriteRoute/:userId", function(req, res){
	db_con.query("SELECT * FROM FavoriteRoute, Route WHERE ((FavoriteRoute.userId = ?) AND (FavoriteRoute.routeId = Route.id))", [req.params.userId], function(err, result){
		if(err) throw err;
		res.json(result);
	});
});


router.get("/favoriteRoute", function(req, res){
    var userId = req.param("userId")
    var routeId = req.param("routeId")
	db_con.query("SELECT * FROM FavoriteRoute WHERE FavoriteRoute.userId = ? AND FavoriteRoute.routeId = ?", [userId, routeId], function(err, result){
		if(err) throw err;
		res.json(result);
	});
});


router.post("/favoriteRoute", function(req, res){
	db_con.query("INSERT INTO FavoriteRoute (routeId, userId) VALUES (?,?)",
		[req.body.routeId, req.body.userId],
		function(err, result){
			if(err) throw err;
			res.json(result);
		}
	);
});

router.delete("/favoriteRoute/:routeId", function(req, res){
	db_con.query("DELETE FROM FavoriteRoute WHERE routeId = ?", [req.params.routeId], function(err, result){
		if(err) throw err;
		res.json(result);
	});

});


/* Ne fonctionne pas 
router.delete("/favoriteRouteDoublons", function(req, res){
	db_con.query("DELETE FROM FavoriteRoute LEFT OUTER JOIN (SELECT MIN(FavoriteRoute.id) as (routeId, userId) FROM FavoriteRoute GROUP BY (FavoriteRoute.routeId, FavoriteRoute.userId)) as t1 ON FavoriteRoute.id = t1.id WHERE t1.id IS NULL", function(err, result){
		if(err) throw err;
		res.json(result);
	});

});

*/





/* ==================
 *	Server listening
 * ==================
 */
app.use("/api", router);

app.listen(3000, function () {
	console.log("[S] Server is listening on port 3000.");
});
