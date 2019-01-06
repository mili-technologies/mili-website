//Insert new food in menu

var database = require('../../Database/config')

exports.addFoodInMenu = function (request, response) {
    console.log(request.query);

    var connection = database.connect();
    var restaurantId = 1000000000;
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

    var query_select2= 'select food_global_id from mili_global_schema.global_food_items where food_name = ?';

    connection.query(query_select + ';' + query_select2, [restaurantId,food_name], function (err, result) {
        if (err) { throw err; }
        else {
            console.log(result[0]);
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
                    response.json(result);
                }
            });
        }
    });
}

    
// app.get("/insertFoodInMenu", function (request, response) {
//     console.log(request.query);

//     var restaurantId = 1000000000;
//     var food_name = request.query.food_name;
//     var food_price = request.query.food_price;
//     var food_quantity = request.query.food_quantity;
//     var is_veg = request.query.is_veg;
//     var menu_category = request.query.menu_category;
//     var is_customizable = request.query.is_customizable;
//     var food_description = request.query.food_description;
//     var ready_in = request.query.ready_in;

//     var responseJson = {};

//     var query_select = 'select restaurant_schema_name from mili_global_schema.global_restaurants where restaurant_id = ?';

//     var query_select2= 'select food_global_id from mili_global_schema.global_food_items where food_name = ?';

//     connection.query(query_select + ';' + query_select2, [restaurantId,food_name], function (err, result) {
//         if (err) { throw err; }
//         else {
//             console.log(result[0]);
//             var restaurantSchemaName = result[0].restaurant_schema_name;
//             var sql_query_1 = 'INSERT INTO ' + restaurantSchemaName + '.restaurant_food_menu ( food_name, food_price, food_quantity, is_veg, menu_category, is_customizable, food_description, ready_in) VALUES (?, ?, ?, ?,  ?, ?, ?, ? )';
//             // var sql_query_2 = "select * from " + restaurantSchemaName + ".restaurant_offer";
//             // var sql_query_3 = "select * from " + restaurantSchemaName + ".user_review";

//             //connection.query(sql_query_1 + ";" + sql_query_2 + ";" + sql_query_3, function (err, result) {
//             // console.log(sql_query_1 + orderID + orderStatus + restaurantSchemaName);
//             connection.query(sql_query_1, [food_name, food_price, food_quantity, is_veg, menu_category, is_customizable, food_description, ready_in], function (err, result) {
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


// //update old food items in menu
// app.get("/updateFoodInMenu", function (request, response) {
//     console.log(request.query);
//     var restaurant_food_menu_id = request.query.restaurant_food_menu_id;
//     var restaurantId = request.query.restaurantId;
//     var food_name = request.query.food_name;
//     var food_price = request.query.food_price;
//     var food_quantity = request.query.food_quantity;
//     var is_veg = request.query.is_veg;
//     var menu_category = request.query.menu_category;
//     var is_customizable = request.query.is_customizable;
//     var food_description = request.query.food_description;
//     var ready_in = request.query.ready_in;

//     var responseJson = {};

//     var query_select = 'select restaurant_schema_name from mili_global_schema.global_restaurants where restaurant_id = ?';

//     connection.query(query_select, restaurantId, function (err, result) {
//         if (err) { throw err; }
//         else {
//             console.log(result);
//             var restaurantSchemaName = result[0].restaurant_schema_name;
//             var sql_query_1 = 'UPDATE ' + restaurantSchemaName + '.restaurant_food_menu set  food_name=?, food_price=?, food_quantity=?, is_veg=?, menu_category=?, is_customizable=?, food_description=?, ready_in=? where restaurant_food_menu_id=?';
//             // var sql_query_2 = "select * from " + restaurantSchemaName + ".restaurant_offer";
//             // var sql_query_3 = "select * from " + restaurantSchemaName + ".user_review";

//             //connection.query(sql_query_1 + ";" + sql_query_2 + ";" + sql_query_3, function (err, result) {
//             // console.log(sql_query_1 + orderID + orderStatus + restaurantSchemaName);
//             connection.query(sql_query_1, [food_name, food_price, food_quantity, is_veg, menu_category, is_customizable, food_description, ready_in, restaurant_food_menu_id], function (err, result) {
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



// //Delete food items from menu
// app.get("/deleteFoodFromMenu", function (request, response) {

//     var restaurant_food_menu_id = request.query.food_resturant_id;
//     var restaurantId = request.query.restaurantId;
//     var responseJson = {};

//     var query_select = 'select restaurant_schema_name from mili_global_schema.global_restaurants where restaurant_id = ?';

//     console.log("----------------" + query_select + restaurantId);

//     connection.query(query_select, restaurantId, function (err, result) {
//         if (err) {
//             throw err;
//         }
//         else {
//             console.log(result);
//             var restaurantSchemaName = result[0].restaurant_schema_name;
//             var sql_query_1 = 'Delete From ' + restaurantSchemaName + '.restaurant_food_menu where restaurant_food_menu_id=?';
//             // var sql_query_2 = "select * from " + restaurantSchemaName + ".restaurant_offer";
//             // var sql_query_3 = "select * from " + restaurantSchemaName + ".user_review";

//             //connection.query(sql_query_1 + ";" + sql_query_2 + ";" + sql_query_3, function (err, result) {
//             // console.log(sql_query_1 + orderID + orderStatus + restaurantSchemaName);
//             connection.query(sql_query_1, [restaurant_food_menu_id], function (err, result) {
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
