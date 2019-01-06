var express = require("express");
var mysql = require("mysql");
var path = require("path");
var logger = require("morgan");
var ejs = require("ejs");
var context = require("request-context");
//var admin = require("firebase-admin");
var realtime = require("firebase-admin");
//var serviceAccount = require(__dirname+"/firebase_key/mili-b2581-firebase-adminsdk-o60lm-0c430ed0ef.json");
var serviceAccount1 = require(__dirname + "/firebase_key/test-6d54b-firebase-adminsdk-1fxtq-d4815dc7f4.json");
var routes = require("./controllers/admin/admin.js");
// var $ = require('jquery');
const bodyParser = require("body-parser");
const log = require('node-file-logger');


// routes for kitchen
var kitchenController = require("./controllers/kitchen/kitchenController");




// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: "https://mili-b2581.firebaseio.com"
// });

log.SetUserOptions({
    folderPath: './logs/',
    dateBasedFileNaming: true,
    fileNamePrefix: 'mili_',
    fileNameExtension: '.log',
    dateFormat: 'YYYY_MM_DD',
    timeFormat: 'hh:mm:ss.SSS',
    logLevel: 'debug',
    onlyFileLogging: false
});

realtime.initializeApp({
    credential: realtime.credential.cert(serviceAccount1),
    databaseURL: "https://test-6d54b.firebaseio.com"
});

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use("/miliadmin", routes);
app.use(logger('dev'));
app.use(express.static("./views"));
app.use(context.middleware("req"));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

var connection = mysql.createConnection({
    host: "miliprimarydbinstance.cezjp2cnertq.us-east-2.rds.amazonaws.com",
    user: "mili_dba",
    password: "YCombinator",
    multipleStatements: true
});

connection.connect(function (error) {
    if (!!error)
        log.Error("error");
    else
        log.Info("connected");
});


app.get('/getKitchenOrders', kitchenController.index);


//Get All Restaurant based on particular restaurant type
app.get("/getAllRestaurants", function (request, response) {
    var restaurantType = request.query.restaurantType.trim();
    console.log(restaurantType);
    var restaurantTypeQuery = "select * from mili_global_schema.global_restaurants where restaurant_type = ?";
    console.log(restaurantTypeQuery);
    connection.query(restaurantTypeQuery, restaurantType, function (error, result) {
        if (!!error) {
            log.Error("check query" + error);
        } else {
            response.json(result);
        }

    });
});


app.get("/getRestaurantOrder", function (request, response) {
    var restaurantId = request.query.restaurantId;
    var responseJson = [
        { 'order_Id ': 'break snacks', 'table_No': 'img/recype/recype-1.jpg', 'food_ID': 'name', 'food_name': '$32', 'food_category': 'desc', 'comments': '4' },
        { 'order_Id ': 'break snacks', 'table_No': 'img/recype/recype-1.jpg', 'food_ID': 'name', 'food_name': '$32', 'food_category': 'desc', 'comments': '4' }
    ];

    // connection.query("select * from mili_global_schema.mili_restaurants_order where restaurant_id = 101", function (error, rows, fields) {
    //     if (!!error) {
    //         log.Error("check query");
    //         responseJson["error"] = error;
    //     } else {
    //         log.Info(rows[0]);
    //         responseJson["success"] = rows[0];
    //         //$.e            
    //     }

    response.json(responseJson);
});

app.get("/sendRestaurant", function (request, response) {
    var isLogin = request.query.isLogin;
    var restaurantId = request.query.restaurantId;

    if (!!isLogin) {
        var responseJson = [
            { 'itemType': 'break snacks', 'img': 'img/recype/recype-1.jpg', 'itemName': 'name', 'price': '$32', 'descriptions': 'desc', 'rating': '4' },
            { 'itemType': 'snacks', 'img': 'img/recype/recype-2.jpg', 'itemName': 'name', 'price': '$32', 'descriptions': 'desc', 'rating': '4' }
        ];
        response.render("restaurantsFront", {
            jsondata: responseJson
        });
    } else {
        response.json({ "message": "Please check the credentials" });
    }
});

app.get('/', function (request, response) {
    response.render('home');
});
// Test page
app.get('/test', function (request, response) {
    response.render('test');
});
app.get('/restaurant_form', function (request, response) {
    response.render('restaurant_form');
});
app.get('/login', function (request, response) {
    response.render('login');
});
app.get('/staff', function (request, response) {
    response.render('staff');
});
app.get('/privacy', function (request, response) {
    response.render('privacy');
});
app.get('/dashboard', function (request, response) {
    response.render('dashboard');
});
app.get('/footer', function (request, response) {
    response.render('footer');
});
app.get('/menu', function (request, response) {
    response.render('menu');
});
app.get('/main', function (request, response) {
    response.render('main');
});
app.get('/kitchen1', function (request, response) {
    response.render('kitchen1');
});
app.get('/kitchen', function (request, response) {
    response.render('kitchen');
});
app.get('/signup', function (request, response) {
    response.render('signup');
});
app.get('/help', function (request, response) {
    response.render('help');
});
app.get('/addRestaurantDetails', function (request, response) {

    restaurant_name = request.query.restaurant_name;
    restaurant_address = request.query.restaurant_address;
    restaurant_sublocality = request.query.restaurant_sublocality;
    restaurant_locality = request.query.restaurant_locality;
    restaurant_landmark = request.query.restaurant_landmark;
    restaurant_city = request.query.restaurant_city;
    restaurant_State = request.query.restaurant_State;
    restaurant_contact = request.query.restaurant_contact;
    restaurant_zip_code = request.query.restaurant_zip_code;
    restaurant_email_id = request.query.restaurant_email_id;
    restaurant_start_time = request.query.restaurant_start_time;
    restaurant_end_time = request.query.restaurant_end_time;
    restaurant_cost_two = request.query.restaurant_cost_two;
    restaurant_description = request.query.restaurant_description;
    restaurant_is_pure_veg = request.query.restaurant_is_pure_veg;
    restaurant_type = request.query.restaurant_type;
    fssai_approved = request.query.fssai_approved;
    home_delivery = request.query.home_delivery;
    take_away = request.query.take_away;
    alcohol_in = request.query.alcohol_in;
    live_music = request.query.live_music;
    valet_parking = request.query.valet_parking;
    karaoke = request.query.karaoke;
    free_wifi = request.query.free_wifi;
    available_for_functions = request.query.available_for_functions;
    live_sports_screening = request.query.live_sports_screening;
    full_bar_available = request.query.full_bar_available;
    open_terrace = request.query.open_terrace;

    console.log(full_bar_available);

    if (restaurant_is_pure_veg.toString().trim() === 'no' || home_delivery.toString().trim() === 'no' || take_away.toString().trim() === 'no' || alcohol_in.toString().trim() === 'no' || live_music.toString().trim() === 'no' || valet_parking.toString().trim() === 'no' || karaoke.toString().trim() === 'no' || free_wifi.toString().trim() === 'no' || available_for_functions.toString().trim() === 'no' || live_sports_screening.toString().trim() === 'no' || open_terrace.toString().trim() === 'no') {
        restaurant_is_pure_veg = 0;
    } else {
        restaurant_is_pure_veg = 1;
    }
    var query_select = 'call mili_global_schema.add_res(002 , \'creamstone_00003\',   ?,   0.00000000 ,   0.00000000 ,  ?,   ? ,   ?,   ?,   ?,   ?,   ?,   ?,   ? ,   ?,   ?,   ? ,   5 ,   ?,   \'https\' ,   ? ,   ?,   \'2018-12-25 10:25:03\',   \'2018-12-25 10:25:03\',   \'10\',   \'20\',   ?,   ?,   ?,  ?,   ?,   ?,   ?,   ?,   ?,   ?,   ? ,   ?)';

    console.log(query_select);

    connection.query(query_select, [restaurant_name, restaurant_address, restaurant_sublocality, restaurant_locality, restaurant_landmark, restaurant_city, restaurant_State, restaurant_contact, restaurant_zip_code, restaurant_email_id, restaurant_start_time, restaurant_end_time, restaurant_cost_two, restaurant_description, restaurant_is_pure_veg, restaurant_type, fssai_approved, home_delivery, take_away, alcohol_in, live_music, valet_parking, karaoke, free_wifi, available_for_functions, live_sports_screening, full_bar_available, open_terrace], function (err, result) {

        if (err) throw err;
        else {
            console.log(result);
        }
    }

    );
});


app.post('/validateToken', function (request, response) {
    var idToken = request.body.idToken;
    var restaurantName = request.body.restaurantName;
    var tableCount = request.body.tableCount;
    var lastname = request.body.lastname;
    var firstname = request.body.firstname;
    var res = "success";
    log.Debug(idToken);
    log.Info("routed to login");
    realtime.auth().verifyIdToken(idToken).then(function (decodedToken) {
        var uid = decodedToken.uid;
        var uEmail = decodedToken.email;
        log.Debug(uid, decodedToken);
        setTimeout(function () {
            log.Debug("After 30 min call ", uEmail);
            realtime.auth().getUser(uid).then(function (userRecord) {
                var email = userRecord.email;
                log.Debug(userRecord.emailVerified);
                if (userRecord.emailVerified == false) {
                    realtime.auth().deleteUser(uid).then(function () {
                        log.Info("Successfully deleted user", email);
                    }).catch(function (error) {
                        log.Error("Error deleting user:", error);
                    });
                } else {
                    log.Info("User is verified ", email);
                }
            }).catch(function (error) {
                log.Error(error);
            });
        }, 1800000, { uid, uEmail });
    }).catch(function (error) {
        log.Error(error.code, error.message);
        res = "failure";
    });
    response.send(res);
});


// Get Api for getting menu details
app.get("/getRestaurantMenu", function (request, response) {
    var restaurantId = request.query.restaurantId;
    var responseJson = {};
    var restaurant_schema_name;

    var query_select = 'select restaurant_schema_name from mili_global_schema.global_restaurants where restaurant_id = ?';

    connection.query(query_select, restaurantId, function (err, result) {
        if (err) { throw err; }
        else {
            console.log(result);
            var restaurantSchemaName = result[0].restaurant_schema_name;
            var sql_query_1 = "select * from " + restaurantSchemaName + ".restaurant_food_menu";
            // var sql_query_2 = "select * from " + restaurantSchemaName + ".restaurant_offer";
            // var sql_query_3 = "select * from " + restaurantSchemaName + ".user_review";

            //connection.query(sql_query_1 + ";" + sql_query_2 + ";" + sql_query_3, function (err, result) {
            connection.query(sql_query_1, function (err, result) {
                if (err) { throw err; }
                else {
                    response.send(result);
                }
            });
        }
    });
});



// Get Api for getting menu details
app.get("/getGlobalRestaurantMenu", function (request, response) {
    //var restaurantId = request.query.restaurantId;
    var responseJson = {};
    var restaurant_schema_name;

    var query_select = 'SELECT * FROM mili_global_schema.global_food_items';

    connection.query(query_select, function (err, result) {
        if (err) { throw err; }
        else {
            console.log(result);
            response.send(result);
        }
    });
});


// // Api to update order status in table
// app.get("/updateOrderStatus", function (request, response) {
//     var restaurantId = request.query.restaurantId;
//     var orderID = request.query.orderID;
//     var orderStatus = request.query.orderStatus;
//     var responseJson = {};

//     var query_select = 'select restaurant_schema_name from mili_global_schema.global_restaurants where restaurant_id = ?';

//     connection.query(query_select, restaurantId, function (err, result) {
//         if (err) { throw err; }
//         else {
//             console.log(result);
//             var restaurantSchemaName = result[0].restaurant_schema_name;
//             var sql_query_1 = 'UPDATE ' + restaurantSchemaName + '.food_order_detail SET order_status = ? WHERE order_id = ?';
//             // var sql_query_2 = "select * from " + restaurantSchemaName + ".restaurant_offer";
//             // var sql_query_3 = "select * from " + restaurantSchemaName + ".user_review";

//             //connection.query(sql_query_1 + ";" + sql_query_2 + ";" + sql_query_3, function (err, result) {
//             console.log(sql_query_1 + orderID + orderStatus + restaurantSchemaName);
//             connection.query(sql_query_1, [orderStatus, orderID], function (err, result) {
//                 console.log(sql_query_1);
//                 if (err) { throw err; }
//                 else {
//                     console.log(result);
//                     response.send(result);
//                 }
//             });
//         }
//     });

// });


//get orderstatus
app.get("/updateOrderStatus", function (request, response) {

    var restaurantId = request.query.restaurantId;
    var orderID = request.query.order_id;
    var orderStatus = request.query.order_status;
    var responseJson = {};

    var query_select = 'select restaurant_schema_name from mili_global_schema.global_restaurants where restaurant_id = ?';

    connection.query(query_select, restaurantId, function (err, result) {
        if (err) { throw err; }
        else {
            console.log(result);
            var restaurantSchemaName = result[0].restaurant_schema_name;
            var sql_query_1 = 'UPDATE ' + restaurantSchemaName + '.food_order_detail SET order_status = ? WHERE order_id = ?';
            // var sql_query_2 = "select * from " + restaurantSchemaName + ".restaurant_offer";
            // var sql_query_3 = "select * from " + restaurantSchemaName + ".user_review";

            //connection.query(sql_query_1 + ";" + sql_query_2 + ";" + sql_query_3, function (err, result) {
            console.log("*************** " + sql_query_1 + orderID + orderStatus + restaurantSchemaName);
            console.log("******************** ");
            connection.query(sql_query_1, [orderStatus, orderID], function (err, result) {
                console.log(sql_query_1);
                console.log(orderStatus);
                if (err) { throw err; }
                else {
                    console.log(result);
                    response.send(result);
                }
            });
        }
    });

});


//Insert new food in menu
app.get("/insertFoodInMenu", function (request, response) {
    console.log(request.query);

    var restaurantId = request.query.restaurantId;
    var food_name = request.query.food_name;
    var food_price = request.query.food_price;
    var food_quantity = request.query.food_quantity;
    var is_veg = request.query.is_veg;
    var menu_category = request.query.menu_category;
    var is_customizable = request.query.is_customizable;
    var food_description = request.query.food_description;
    var ready_in = request.query.ready_in;

    var responseJson = {};

    var query_select = 'select restaurant_schema_name from mili_global_schema.global_restaurants where restaurant_id = ?';

    connection.query(query_select, restaurantId, function (err, result) {
        if (err) { throw err; }
        else {
            console.log(result);
            var restaurantSchemaName = result[0].restaurant_schema_name;
            var sql_query_1 = 'INSERT INTO ' + restaurantSchemaName + '.restaurant_food_menu ( food_name, food_price, food_quantity, is_veg, menu_category, is_customizable, food_description, ready_in) VALUES (?, ?, ?, ?,  ?, ?, ?, ? )';
            // var sql_query_2 = "select * from " + restaurantSchemaName + ".restaurant_offer";
            // var sql_query_3 = "select * from " + restaurantSchemaName + ".user_review";

            //connection.query(sql_query_1 + ";" + sql_query_2 + ";" + sql_query_3, function (err, result) {
            // console.log(sql_query_1 + orderID + orderStatus + restaurantSchemaName);
            connection.query(sql_query_1, [food_name, food_price, food_quantity, is_veg, menu_category, is_customizable, food_description, ready_in], function (err, result) {
                console.log(sql_query_1);
                if (err) { throw err; }
                else {
                    console.log(result);
                    response.send(result);
                }
            });
        }
    });

});


//update old food items in menu
app.get("/updateFoodInMenu", function (request, response) {
    console.log(request.query);
    var restaurant_food_menu_id = request.query.restaurant_food_menu_id;
    var restaurantId = request.query.restaurantId;
    var food_name = request.query.food_name;
    var food_price = request.query.food_price;
    var food_quantity = request.query.food_quantity;
    var is_veg = request.query.is_veg;
    var menu_category = request.query.menu_category;
    var is_customizable = request.query.is_customizable;
    var food_description = request.query.food_description;
    var ready_in = request.query.ready_in;

    var responseJson = {};

    var query_select = 'select restaurant_schema_name from mili_global_schema.global_restaurants where restaurant_id = ?';

    connection.query(query_select, restaurantId, function (err, result) {
        if (err) { throw err; }
        else {
            console.log(result);
            var restaurantSchemaName = result[0].restaurant_schema_name;
            var sql_query_1 = 'UPDATE ' + restaurantSchemaName + '.restaurant_food_menu set  food_name=?, food_price=?, food_quantity=?, is_veg=?, menu_category=?, is_customizable=?, food_description=?, ready_in=? where restaurant_food_menu_id=?';
            // var sql_query_2 = "select * from " + restaurantSchemaName + ".restaurant_offer";
            // var sql_query_3 = "select * from " + restaurantSchemaName + ".user_review";

            //connection.query(sql_query_1 + ";" + sql_query_2 + ";" + sql_query_3, function (err, result) {
            // console.log(sql_query_1 + orderID + orderStatus + restaurantSchemaName);
            connection.query(sql_query_1, [food_name, food_price, food_quantity, is_veg, menu_category, is_customizable, food_description, ready_in, restaurant_food_menu_id], function (err, result) {
                console.log(sql_query_1);
                if (err) { throw err; }
                else {
                    console.log(result);
                    response.send(result);
                }
            });
        }
    });

});



//Delete food items from menu
app.get("/deleteFoodFromMenu", function (request, response) {

    var restaurant_food_menu_id = request.query.food_resturant_id;
    var restaurantId = request.query.restaurantId;
    var responseJson = {};

    var query_select = 'select restaurant_schema_name from mili_global_schema.global_restaurants where restaurant_id = ?';

    console.log("----------------" + query_select + restaurantId);

    connection.query(query_select, restaurantId, function (err, result) {
        if (err) {
            throw err;
        }
        else {
            console.log(result);
            var restaurantSchemaName = result[0].restaurant_schema_name;
            var sql_query_1 = 'Delete From ' + restaurantSchemaName + '.restaurant_food_menu where restaurant_food_menu_id=?';
            // var sql_query_2 = "select * from " + restaurantSchemaName + ".restaurant_offer";
            // var sql_query_3 = "select * from " + restaurantSchemaName + ".user_review";

            //connection.query(sql_query_1 + ";" + sql_query_2 + ";" + sql_query_3, function (err, result) {
            // console.log(sql_query_1 + orderID + orderStatus + restaurantSchemaName);
            connection.query(sql_query_1, [restaurant_food_menu_id], function (err, result) {
                console.log(sql_query_1);
                if (err) { throw err; }
                else {
                    console.log(result);
                    response.send(result);
                }
            });
        }
    });

});


//Insert order details
app.get("/insertOrderDetails", function (request, response) {
    console.log(request.query);
    var offer_indicator = request.query.offer_indicator;
    var payment_status = request.query.payment_status;
    var order_type = request.query.order_type;
    var payment_mode = request.query.payment_mode;
    var table_id = request.query.table_id;
    var order_offer_id = request.query.order_offer_id;
    var restaurantId = request.query.restaurantId;
    var responseJson = {};

    var query_select = 'select restaurant_schema_name from mili_global_schema.global_restaurants where restaurant_id = ?';

    connection.query(query_select, restaurantId, function (err, result) {
        if (err) { throw err; }
        else {
            console.log(result);
            var restaurantSchemaName = result[0].restaurant_schema_name;
            var sql_query_1 = 'Insert into ' + restaurantSchemaName + '.order_detail (offer_indicator, payment_status, order_type, payment_mode,  table_id, order_offer_id) VALUES (?,?,?,?,?,?)';
            // var sql_query_2 = "select * from " + restaurantSchemaName + ".restaurant_offer";
            // var sql_query_3 = "select * from " + restaurantSchemaName + ".user_review";

            //connection.query(sql_query_1 + ";" + sql_query_2 + ";" + sql_query_3, function (err, result) {
            // console.log(sql_query_1 + orderID + orderStatus + restaurantSchemaName);
            connection.query(sql_query_1, [offer_indicator, payment_status, order_type, payment_mode, table_id, order_offer_id], function (err, result) {
                console.log(sql_query_1);
                if (err) { throw err; }
                else {
                    console.log(result);
                    response.send(result);
                }
            });
        }
    });

});

app.get('/login', function (request, response) {
    //context.set("req:user",idToken);
    log.Info("routed to login");
    response.render('login');
});

app.get('/aboutus', function (request, response) {
    //context.set("req:user",idToken);
    log.Info("routed to about");
    response.render('aboutus');
});

app.post('/login', function (request, response) {
    var idToken = request.body.idToken;
    var res = "success";
    log.Debug(idToken);
    realtime.auth().verifyIdToken(idToken).then(function (decodedToken) {
        var uid = decodedToken.uid;
        log.Debug(uid + " : " + decodedToken);
        log.Info("routed to admin");
    }).catch(function (error) {
        log.Error(error.code + " : " + error.message, "login", "verifyIdToken");
        res = "failure";
    });
    response.send(res);
});

// app.post('/', function(request, response){
//     response.render('login.ejs');
// });

// app.get("/miliadmin",function(request,response){
//     //var restaurantId = request.
//     response.render('mili.admin.ejs');
// });

app.get("/setRestaurantSchema", function (request, response) {

    var restaurant_schema_name = request.query.restaurantSchemaName;
    var responseJson = {};

    var query_select = 'CALL mili_global_schema.create_res_schema(?)';

    connection.query(query_select, [restaurant_schema_name], function (err, result) {

        if (err) throw err;
        else {
            console.log(result);
        }
    }

    );
})

//Get Restaurant details based on restaurant ID
app.get("/getRestaurantDetails", function (request, response) {
    var restaurantId = request.query.restaurantId;
    var responseJson = {};
    var restaurant_schema_name;

    var query_select = 'select restaurant_schema_name from mili_global_schema.global_restaurants where restaurant_id = ?';

    connection.query(query_select, restaurantId, function (err, result) {
        if (err) { throw err; }
        else {
            console.log(result);

            //response.send(result[0].restaurant_schema_name);

            var restaurantSchemaName = result[0].restaurant_schema_name;
            var sql_query_1 = "select * from " + restaurantSchemaName + ".food_price_list";
            var sql_query_2 = "select * from " + restaurantSchemaName + ".restaurant_offer";
            var sql_query_3 = "select * from " + restaurantSchemaName + ".user_review";

            connection.query(sql_query_1 + ";" + sql_query_2 + ";" + sql_query_3, function (err, result) {

                if (err) { throw err; }
                else {
                    response.send(result);
                }
            });
        }
    });
});



app.post("/setBookedTable", function (request, response) {
    var tableID = request.body.table;
    var user = request.body.user;
    var restaurantId = request.body.restaurantId;
    realtime.database().ref('/' + restaurantId).set({
        'tables': { tableID: { 'status': 'Booked', 'user': user } }
    });
});

app.listen(8080, function (error) {
    if (!!error)
        log.Error("error while starting server", "app", "listen");
    else
        log.Info("Server started and Listening to the port 80");
});

module.exports = app;

