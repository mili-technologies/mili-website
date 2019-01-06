var database = require('../../Database/config')

exports.index = function (req, res) {

    var connection = database.connect();
    var restaurantId = req.query.restaurantId;
    var query_select = 'select restaurant_schema_name from mili_global_schema.global_restaurants where restaurant_id = ?';

    connection.query(query_select, restaurantId, function (err, result) {
        if (err) { throw err; }
        else {
            var restaurantSchemaName = result[0].restaurant_schema_name;
            var sql_query_1 = "select * from " + restaurantSchemaName + ".order_detail";
            connection.query(sql_query_1, function (err, result) {
                if (!!err) {
                    res.json(err)

                } else {
                    res.json(result);
                }
            });


        }
    });
}

// var restaurantId = request.query.restaurantId;
// var orderID = request.query.orderID;
// var orderStatus = request.query.orderStatus;
// var responseJson = {};

// var query_select = 'select restaurant_schema_name from mili_global_schema.global_restaurants where restaurant_id = ?';

// connection.query(query_select, restaurantId, function (err, result) {
//     if (err) { throw err; }
//     else {
//         console.log(result);
//         var restaurantSchemaName = result[0].restaurant_schema_name;
//         var sql_query_1 = 'UPDATE ' + restaurantSchemaName + '.food_order_detail SET order_status = ? WHERE order_id = ?';
//         // var sql_query_2 = "select * from " + restaurantSchemaName + ".restaurant_offer";
//         // var sql_query_3 = "select * from " + restaurantSchemaName + ".user_review";

//         //connection.query(sql_query_1 + ";" + sql_query_2 + ";" + sql_query_3, function (err, result) {
//         console.log(sql_query_1 + orderID + orderStatus + restaurantSchemaName);
//         connection.query(sql_query_1, [orderStatus, orderID], function (err, result) {
//             console.log(sql_query_1);
//             if (err) { throw err; }
//             else {
//                 console.log(result);
//                 response.send(result);
//             }
//         });
//     }
// });