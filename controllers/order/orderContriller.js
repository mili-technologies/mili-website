var database = require('../../Database/config')

exports.index = function (req, res) {

    var connection = database.connect();
    var restaurantId = req.query.restaurantId;
    var query_select = 'select restaurant_schema_name from mili_global_schema.global_restaurants where restaurant_id = ?';

    connection.query(query_select, restaurantId, function (err, result) {
        if (err) { throw err; }
        else {
            var restaurantSchemaName = result[0].restaurant_schema_name;
            var sql_query_1 = "select DISTINCT fod.order_id, fod.order_food_cost, fod.table_id, fod.order_status, rfm.food_name from " + restaurantSchemaName + ".food_order_detail fod INNER JOIN " + restaurantSchemaName + ".restaurant_food_menu rfm ON " + restaurantSchemaName + ".fod.food_id=" + restaurantSchemaName + ".rfm.food_id";
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