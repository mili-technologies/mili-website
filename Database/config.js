var mysql = require("mysql");



getConnection = function () {
    var connection = mysql.createConnection({
        host: "miliprimarydbinstance.cezjp2cnertq.us-east-2.rds.amazonaws.com",
        user: "mili_dba",
        password: "YCombinator",
        multipleStatements: true
    });
    return connection;
}

exports.connect = function () {
    var connection = getConnection();


    connection.connect(function (error) {
        if (!!error)
            console.log("error occured ", error);

        else
            console.log("Connected Succesfully ");
    });
    return connection;
}



