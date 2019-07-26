var express = require("express");
var mysql = require("mysql");
var path = require("path");
var logger = require("morgan");
var ejs = require("ejs");
var https = require("https");
var context = require("request-context");
var realtime = require("firebase-admin");
var serviceAccount1 = require(__dirname + "/firebase_key/test-6d54b-firebase-adminsdk-1fxtq-d4815dc7f4.json");
var routes = require("./controllers/admin/admin.js");
const bodyParser = require("body-parser");
const log = require("node-file-logger");
const jwtLogin = require("jwt-login");
const roles = require("user-groups-roles");
var AWS = require("aws-sdk");
AWS.config.loadFromPath("aws_config.json");
var multiparty = require("multiparty");
var http = require("http");
var util = require("util");
var fs = require("file-system");
var session = require("express-session");
var FCM = require("fcm-node");
var dateFormat = require("dateformat");
var server = http.createServer(app);
var socket = require("socket.io");
var pool = require("./Database/config");

//5/5/2019
var nodemailer = require("nodemailer");
const uniqueRandom = require("unique-random");
const random = uniqueRandom(1000, 9999);

//5/5/2019
const bcrypt = require("bcrypt");
const saltRounds = 10;

module.exports.nodemailerDef = nodemailer;
module.exports.randomDef = random;
module.exports.bcryptDef = bcrypt;
module.exports.saltRoundsDef = saltRounds;

// routes for kitchen
var kitchenController = require("./controllers/kitchen/kitchenController");

// routes for order
var orderController = require("./controllers/order/orderContriller");

// routes for menu
var menuController = require("./controllers/menu/menuController");

// routes for user
var userController = require("./controllers/users/userController");

// routes for restaurant
var restaurantController = require("./controllers/restaurant/restaurantController");

// routes for food
var foodController = require("./controllers/food/foodController");

// routes for food
var staffController = require("./controllers/staff/StaffController");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: "https://mili-b2581.firebaseio.com"
// });

log.SetUserOptions({
    folderPath: "./logs/",
    dateBasedFileNaming: true,
    fileNamePrefix: "mili_",
    fileNameExtension: ".log",
    dateFormat: "YYYY_MM_DD",
    timeFormat: "hh:mm:ss.SSS",
    logLevel: "debug",
    onlyFileLogging: false
});

realtime.initializeApp({
    credential: realtime.credential.cert(serviceAccount1),
    databaseURL: "https://test-6d54b.firebaseio.com"
});

//for https
const options = {
    cert: fs.readFileSync('./sslcert/fullchain.pem'),
    key: fs.readFileSync('./sslcert/privkey.pem')
};

var app = express();

var sess;

app.use(
    session({
        secret: "secretKey",
        saveUninitialized: false,
        resave: false,
        cookie: {
            maxAge: 6000000
        },
        rolling: true
    })
);

function requireLogin(request, response, next) {
    sess = request.session;
    if (sess.restaurantId) {
        next();
    } else {
        response.redirect("/");
    }
}

app.set("views", path.join(__dirname, "views"));

app.set("view engine", "ejs");

app.use("/miliadmin", routes);

app.use(logger("dev"));

app.use(express.static("./views"));

app.use(context.middleware("req"));

app.use(
    bodyParser.urlencoded({
        extended: true
    })
);

app.use(bodyParser.json());

var connection = mysql.createConnection({
    host: "miliprimarydbinstance.cezjp2cnertq.us-east-2.rds.amazonaws.com",
    user: "mili_dba",
    password: "YCombinator",
    multipleStatements: true
});

connection.connect(function (error) {
    if (!!error) log.Error("error");
    else log.Info("connected");
});

var fcm = new FCM(serviceAccount1);

module.exports.fcmDef = fcm;

var message = {
    //this may vary according to the message type (single recipient, multicast, topic, et cetera)
    to: "registration_token",

    notification: {
        title: "Title of your push notification",
        body: "Body of your push notification"
    },

    data: {
        //you can send only notification or only data(or include both)
        my_key: "my value",
        my_another_key: "my another value"
    }
};

app.get("/getStaff", staffController.getStaff);

app.get("/getKitchenOrders", kitchenController.index);

app.get("/getOrderDetials", orderController.index);

app.post("/addFoodInMenu", menuController.addFoodInMenu);

app.get("/deleteFoodFromMenu", menuController.deleteFoodFromMenu);

app.post("/updateFoodInMenu", menuController.updateFoodInMenu);

app.get("/getAllFoodName", menuController.listFoodName);

app.get("/getAllFoodNameByRestaurantId",
    menuController.listFoodNameByRestaurantId
);

app.post("/addNewUser", userController.addNewUser);

app.get("/getFoodAnalytics", orderController.getFoodAnalytics);

app.get("/showUsers", userController.showUsers);

app.get("/getGSTDetails", userController.getGSTDetails);

app.get("/getRestaurantOrder", orderController.getRestaurantOrder);

app.get("/sendRestaurant", restaurantController.sendRestaurant);

app.get("/", function (request, response) {
    sess = request.session;
    sess.restaurantId;
    response.render("home");
});

app.get("/home", function (request, response) {
    response.render("home");
});

app.get("/faq", function (request, response) {
    response.render("faqs");
});

// Test page
// app.get("/test", function (request, response) {
//     response.render("Analytics/testing");
// });

app.post("/restaurant_form", function (request, response) {
    response.render("restaurant_form");
});

app.get("/login", function (request, response) {
    response.render("login");
});

app.get("/Analytics", function (request, response) {
    response.render("dataAnalytics");
});

app.get("/databoard", function (request, response) {
    response.render("Analytics/databoard");
});

// 5/5/2019
app.post("/validateLogin", async function (req, res) {
    var email = req.body.login_email;
    var password = req.body.login_password;

    pool.query(
        "SELECT * FROM mili_global_schema.global_user_restaurant WHERE user_email = ?",
        [email],
        async function (error, results, fields) {
            if (error) {
                res.send({
                    code: 204,
                    data: "error ocurred"
                });
            } else {
                if (results.length > 0) {
                    bcrypt.compare(password, results[0].password, function (err, resp) {
                        if (resp) {
                            pool.query(
                                "SELECT email_id_verfied FROM mili_global_schema.global_user_restaurant WHERE user_email = ?",
                                [email],
                                function (error, results, fields) {
                                    if (error) {
                                        res.send({
                                            code: 204,
                                            data: "error ocurred"
                                        });
                                    } else {
                                        if (results[0].email_id_verfied == 1) {
                                            res.send({
                                                code: 400,
                                                success: "1"
                                            });
                                        } else {
                                            sess = req.session;
                                            sess.email = email;

                                            if (results[0].email_id_verfied == 0) {
                                                req.session.restaurantId = results[0].restaurant_id;
                                                res.send({
                                                    code: 400,
                                                    success: "0"
                                                });
                                            } else {
                                                res.send({
                                                    code: 400,
                                                    success: results
                                                });
                                            }
                                        }
                                    }
                                }
                            );
                        } else {
                            res.send({
                                code: 204,
                                data: "Email and password does not match"
                            });
                        }
                    });
                } else {
                    res.send({
                        code: 204,
                        data: "Email does not exits"
                    });
                }
            }
        }
    );
});

// 5/5/2019
// 5/12/2019
app.post("/resetPassword", async function (req, res) {
    var email = req.body.email;
    var secCode = req.body.secCode;
    var secPassword = req.body.secPassword;
    pool.query(
        "SELECT * FROM mili_global_schema.global_user_restaurant WHERE user_email = ?",
        [email],
        function (error, results, fields) {
            if (error) {
                res.send({
                    code: 400,
                    failed: "error ocurred"
                });
            } else {
                if (results.length > 0) {
                    sess = req.session;
                    if (secCode != "") {
                        if (sess.uid == secCode) {
                            var sql_query_1 =
                                "UPDATE mili_global_schema.global_user_restaurant SET password = ? WHERE user_email = ?";

                            bcrypt.hash(secPassword, saltRounds, function (err, hash) {
                                pool.query(sql_query_1, [hash, email], function (err, result) {
                                    if (err) {
                                        res.send({
                                            some: "json"
                                        });
                                        throw err;
                                    } else {
                                        res.send({
                                            code: 400,
                                            success: "2",
                                            data: "Password reset and sent to email address successfully"
                                        });
                                    }
                                });
                            });
                        } else {
                            res.send({
                                code: 400,
                                success: "0",
                                data: "Wrong security code"
                            });
                        }
                    } else {
                        // Create the transporter with the required configuration for Gmail
                        // change the user and pass !
                        var transporter = nodemailer.createTransport({
                            host: "smtp.zoho.com",
                            port: 465,
                            secure: true, // use SSL
                            auth: {
                                user: "support@ywait.in",
                                pass: "Time@123"
                            }
                        });

                        var uid = random();

                        // setup e-mail data
                        var mailOptions = {
                            from: "support@ywait.in", // sender address (who sends)
                            to: email, // list of receivers (who receives)
                            subject: "[Ywait] Please verify your email address",
                            text: "Hello world ", // plaintext body
                            html: "<b>Verify your email address</b><br> To verify your email address use this security code : " +
                                uid // html body
                        };

                        // send mail with defined transport object
                        transporter.sendMail(mailOptions, function (error, info) {
                            if (error) {
                                return console.log(error);
                            }
                        });

                        sess.uid = uid;

                        res.send({
                            code: 400,
                            success: "1",
                            data: "Security code sent to your email id"
                        });
                    }
                } else {
                    res.send({
                        code: 400,
                        success: "0",
                        data: "Email Id does not exist"
                    });
                }
            }
        }
    );
});

// place between resetPassword and checkUser function
// 5/15/2019
app.post("/resendSecurityCode", async function (req, res) {
    var email = req.body.email;
    pool.query(
        "SELECT * FROM mili_global_schema.global_user_restaurant WHERE user_email = ?",
        [email],
        function (error, results, fields) {
            if (error) {
                res.send({
                    code: 400,
                    failed: "error ocurred"
                });
            } else {
                if (results.length <= 0) {
                    sess = req.session;
                    // Create the transporter with the required configuration for Gmail
                    // change the user and pass !
                    var transporter = nodemailer.createTransport({
                        host: "smtp.zoho.com",
                        port: 465,
                        secure: true, // use SSL
                        auth: {
                            user: "support@ywait.in",
                            pass: "Time@123"
                        }
                    });

                    var uid = random();

                    // setup e-mail data
                    var mailOptions = {
                        from: "support@ywait.in", // sender address (who sends)
                        to: email, // list of receivers (who receives)
                        subject: "Verify your email addres",
                        text: "Hello world ", // plaintext body
                        html: "<html><body><b>Verify your email address</b><br> To verify your email address use this security code : " +
                            uid + "</body></html>" // html body
                    };

                    // send mail with defined transport object
                    transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            return console.log(error);
                        }
                    });

                    sess.uid = uid;

                    res.send({
                        code: 400,
                        success: "1",
                        data: "Security code sent to your email id"
                    });
                } else {
                    res.send({
                        code: 400,
                        success: "0",
                        data: "Email Id already exist"
                    });
                }
            }
        }
    );
});

// 5/15/2019
app.post("/resendSecurityCodelng", async function (req, res) {
    var email = req.body.email;
    pool.query(
        "SELECT * FROM mili_global_schema.global_user_restaurant WHERE user_email = ?",
        [email],
        function (error, results, fields) {
            if (error) {
                res.send({
                    code: 400,
                    failed: "error ocurred"
                });
            } else {
                if (results.length > 0) {
                    sess = req.session;
                    // Create the transporter with the required configuration for Gmail
                    // change the user and pass !
                    var transporter = nodemailer.createTransport({
                        host: "smtp.zoho.com",
                        port: 465,
                        secure: true, // use SSL
                        auth: {
                            user: "support@ywait.in",
                            pass: "Time@123"
                        }
                    });

                    var uid = random();

                    // setup e-mail data
                    var mailOptions = {
                        from: "support@ywait.in", // sender address (who sends)
                        to: email, // list of receivers (who receives)
                        subject: "Verify your email addres",
                        text: "Hello world ", // plaintext body
                        html: "<html><body><b>Verify your email address</b><br> To verify your email address use this security code : " +
                            uid + "</body></html>" // html body
                    };

                    // send mail with defined transport object
                    transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            return console.log(error);
                        }
                    });

                    sess.uid = uid;

                    res.send({
                        code: 400,
                        success: "1",
                        data: "Security code sent to your email id"
                    });
                } else {
                    res.send({
                        code: 400,
                        success: "0",
                        data: "Email Id does not exist"
                    });
                }
            }
        }
    );
});

async function checkUser(password, passwordHash) {
    bcrypt.genSalt(saltRounds, function (err, salt) {
        bcrypt.hash(password, salt, function (err, hash) {
            if (hash == passwordHash) return true;
            else return false;
        });
    });
}

// 5/5/2019
app.post("/validateSignIn", function (req, res) {
    var email = req.body.email;

    pool.query(
        "SELECT * FROM mili_global_schema.global_user_restaurant WHERE user_email = ?",
        [email],
        function (error, results, fields) {
            if (error) {
                res.send({
                    code: 400,
                    failed: "error ocurred"
                });
            } else {
                if (results.length > 0) {
                    res.send({
                        code: 400,
                        success: "0",
                        data: "Email Id already exits"
                    });
                } else {
                    sess = req.session;

                    if (sess.uid) {
                        res.send({
                            code: 400,
                            success: "2",
                            data: "Security code sent to your email id"
                        });
                    } else {
                        // Create the transporter with the required configuration for Gmail
                        // change the user and pass !
                        var transporter = nodemailer.createTransport({
                            host: "smtp.zoho.com",
                            port: 465,
                            secure: true, // use SSL
                            auth: {
                                user: "support@ywait.in",
                                pass: "Time@123"
                            }
                        });

                        var uid = random();

                        // setup e-mail data
                        var mailOptions = {
                            from: "support@ywait.in", // sender address (who sends)
                            to: email, // list of receivers (who receives)
                            subject: "Verify your email addres",
                            text: "Hello world ", // plaintext body
                            html: "<html><body><b>Verify your email address</b><br> To verify your email address use this security code : " +
                                uid + "</body></html>" // html body
                        };

                        // send mail with defined transport object
                        transporter.sendMail(mailOptions, function (error, info) {
                            if (error) {
                                return console.log(error);
                            }
                            console.log("Message sent: " + info.response);
                        });

                        sess.uid = uid;

                        res.send({
                            code: 400,
                            success: "1",
                            data: "Security code sent to your email id"
                        });
                    }
                }
            }
        }
    );
});

app.get("/header", function (request, response) {
    response.render("Ex-header");
});

app.get("/getStaffById", requireLogin, staffController.getStaffById);

app.post("/updateStaffById", requireLogin, staffController.updateStaffById);

app.post("/addStaff", requireLogin, staffController.addStaff);

app.get("/deleteStaffById", requireLogin, staffController.deleteStaffById);

app.get("/staff", function (request, response) {
    var resSession = request.session;
    var restaurantId = resSession.restaurantId;
    var responseJson = {};
    var restaurant_schema_name;
    var query_select =
        "select restaurant_schema_name from mili_global_schema.global_restaurants where restaurant_id = ?";
    pool.query(query_select, restaurantId, function (err, result) {
        if (err) {
            throw err;
        } else {
            var restaurantSchemaName = result[0].restaurant_schema_name;
            var sql_query_1 =
                "SELECT * FROM " + restaurantSchemaName + ".staff_restaurant";
            pool.query(sql_query_1, function (err, result) {
                if (err) {
                    throw err;
                } else {
                    console.log(result);
                    response.render("Analytics/test-staff", {
                        data: [{
                            t1: sess.restaurantId,
                            result: result
                        }]
                    });
                }
            });
        }
    });
});

app.get("/privacy", function (request, response) {
    response.render("privacy");
});

app.get("/about", function (request, response) {
    response.render("about_us");
});

app.get("/terms", function (request, response) {
    response.render("terms");
});

app.get("/success", function (request, response) {
    response.render("success");
});

app.get("/success", function (request, response) {
    response.render("success-verify");
});

//app.get("/resetPassword", function(request, response) {
//  response.render("success-verify");
//});

app.post("/dashboard", function (request, response) {
    sess = request.session;
    var userEmailId = request.body.login_email;
    var responseJson = {};
    var resResult;
    var query_select =
        "SELECT restaurant_id FROM mili_global_schema.global_user_restaurant where user_email = ?";
    var nowDate = new Date();
    var date =
        nowDate.getFullYear() +
        "-" +
        (nowDate.getMonth() + 1) +
        "-" +
        nowDate.getDate();
    pool.query(query_select, userEmailId, function (err, result) {
        if (err) throw err;
        else {
            if (result[0]) {
                request.session.restaurantId = result[0].restaurant_id;
                var restaurantId = sess.restaurantId;
                var query_select =
                    "select restaurant_schema_name from mili_global_schema.global_restaurants where restaurant_id = ?";
                pool.query(query_select, restaurantId, function (err, result) {
                    if (err) {
                        throw err;
                    } else {
                        var restaurantSchemaName = result[0].restaurant_schema_name;
                        pool.query(
                            "SELECT count(*) as countfood FROM " +
                            restaurantSchemaName +
                            ".restaurant_food_menu",
                            function (error, rows, fields) {
                                if (err) {
                                    throw err;
                                } else {
                                    console.log(rows);
                                    if (rows[0].countfood != 0) {
                                        var q1 =
                                            "SELECT * FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY sequence_no DESC) rn FROM " +
                                            restaurantSchemaName +
                                            ".order_detail order by order_id desc) v WHERE rn = 1";
                                        pool.query(q1, function (error, rows, fields) {
                                            if (!!error) {
                                                log.Error("check query" + error);
                                            } else {
                                                var ref = realtime.app().database().ref();
                                                var usersRef = ref.child(restaurantId);
                                                var userRef = usersRef.update({
                                                    user: rows
                                                });
                                                resResult = rows;
                                                console.log(resResult);
                                                response.render("Analytics/testing", {
                                                    data: [{
                                                        t1: sess.restaurantId,
                                                        result: resResult
                                                    }]
                                                });
                                            }
                                        });
                                    } else {
                                        response.redirect("/menu");
                                    }
                                }
                            }
                        );
                    }
                });
            } else {
                response.redirect("/restaurant_form");
            }
        }
    });
});

app.get("/dashboard", requireLogin, function (request, response) {
    var restaurantId = sess.restaurantId;
    var nowDate = new Date();
    var date =
        nowDate.getFullYear() +
        "-" +
        (nowDate.getMonth() + 1) +
        "-" +
        nowDate.getDate();
    var query_select =
        "SELECT restaurant_schema_name FROM mili_global_schema.global_restaurants where restaurant_id = ?";
    pool.query(query_select, restaurantId, function (err, result) {
        if (err) {
            throw err;
        } else {
            var restaurantSchemaName = result[0].restaurant_schema_name;
            var q1 =
                "SELECT * FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY sequence_no DESC) rn FROM " +
                restaurantSchemaName +
                ".order_detail order by order_id desc) v WHERE rn = 1";
            pool.query(q1, function (error, rows, fields) {
                if (!!error) {
                    log.Error("check query" + error);
                } else {
                    console.log(rows);
                    var ref = realtime.app().database().ref();
                    var usersRef = ref.child(restaurantId);
                    var userRef = usersRef.update({
                        user: rows
                    });
                    resResult = rows;
                    response.render("Analytics/testing", {
                        data: [{
                            t1: sess.restaurantId,
                            result: resResult
                        }]
                    });
                }
            });
        }
    });
});

app.post("/dashboardFilter", requireLogin, function (request, response) {
    var restaurantId = sess.restaurantId;
    var order_status_filter = request.body.order_status_filter;
    var payment_status_filter = request.body.payment_status_filter;
    var table_no_filter = request.body.table_no_filter;

    var query_select =
        "select restaurant_schema_name from mili_global_schema.global_restaurants where restaurant_id = ?";

    pool.query(query_select, restaurantId, function (err, result) {
        if (err) {
            throw err;
        } else {
            var restaurantSchemaName = result[0].restaurant_schema_name;

            var q1 =
                "SELECT * FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY sequence_no DESC) rn FROM " +
                restaurantSchemaName +
                ".order_detail ";

            if (payment_status_filter != "all" && payment_status_filter != "") {
                if (q1.search("WHERE") == -1) {
                    q1 = q1 + "WHERE payment_status = '" + payment_status_filter + "'";
                } else {
                    q1 = q1 + " and payment_status = '" + payment_status_filter + "'";
                }
            }

            if (order_status_filter != "all" && order_status_filter != "") {
                if (q1.search("WHERE") == -1) {
                    q1 = q1 + "WHERE order_status = '" + order_status_filter + "'";
                } else {
                    q1 = q1 + " and order_status = '" + order_status_filter + "'";
                }
            }

            if (table_no_filter != "") {
                if (q1.search("WHERE") == -1) {
                    q1 = q1 + "WHERE table_id = '" + table_no_filter + "'";
                } else {
                    q1 = q1 + " and table_id = '" + table_no_filter + "'";
                }
            }

            q1 = q1 + " order by order_id desc) v WHERE rn = 1";

            pool.query(q1, function (error, rows, fields) {
                if (!!error) {
                    log.Error("check query" + error);
                } else {
                    resResult = rows;
                    response.render("Analytics/testing", {
                        data: [{
                            t1: sess.restaurantId,
                            result: resResult
                        }]
                    });
                }
            });
        }
    });
});

app.get("/getOrderById", requireLogin, function (request, response) {
    var resSession = request.session;
    var restaurantId = resSession.restaurantId;
    var orderId = request.query.orderId;
    var query_select =
        "select restaurant_schema_name from mili_global_schema.global_restaurants where restaurant_id = ?";
    pool.query(query_select, restaurantId, function (err, result) {
        if (err) {
            throw err;
        } else {
            var restaurantSchemaName = result[0].restaurant_schema_name;
            var q1 =
                "SELECT * FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY sequence_no DESC) rn FROM " +
                restaurantSchemaName +
                ".order_detail where order_id=?) v WHERE rn = 1";
            pool.query(q1, [orderId], function (error, rows, fields) {
                if (!!error) {
                    log.Error("check query" + error);
                } else {
                    var ref = realtime.app().database().ref();
                    var usersRef = ref.child(restaurantId);
                    var userRef = usersRef.update({
                        user: rows
                    });
                    resResult = rows;
                    response.send(resResult);
                }
            });
        }
    });
});

app.get("/demo-page", function (request, response) {
    response.render("demo-page");
});

app.get("/signout", function (request, response) {
    response.render("signup");
});

app.get("/tutorial", function (request, response) {
    response.render("tutorial");
});

app.get("/footer", function (request, response) {
    response.render("footer");
});

function bindrestaurantSchemaNameAndQuery(restaurantSchemaName, query) {
    var arr = query.split("restaurantSchemaName");
    return arr[0] + restaurantSchemaName + arr[1];
}

function getrestaurantSchemaNameAndQuery(result) {
    return result[0].restaurant_schema_name;
}

app.get("/menu", requireLogin, function (request, response) {
    sess = request.session;
    var restaurantId = sess.restaurantId;
    var responseJson = {};
    var resResult;
    let query = fs.readFileSync("Database/query.json");
    var restaurantSchemaNameQuery = JSON.parse(query).restaurantSchemaNameQuery;
    pool.query(restaurantSchemaNameQuery, restaurantId, function (err, result) {
        if (err) {
            throw err;
        } else {
            var restaurantSchemaName = getrestaurantSchemaNameAndQuery(result);
            var getRestaurantMenu = bindrestaurantSchemaNameAndQuery(
                restaurantSchemaName,
                JSON.parse(query).getRestaurantMenu
            );
            pool.query(getRestaurantMenu, function (err, result) {
                if (err) {
                    throw err;
                } else {
                    resResult = result;
                    response.render("Analytics/test-menu", {
                        data: [{
                            t1: sess.restaurantId,
                            result: resResult
                        }]
                    });
                }
            });
        }
    });
});

app.get("/main", function (request, response) {
    response.render("main");
});

app.get("/kitchen", requireLogin, function (request, response) {
    sess = request.session;
    var nowDate = new Date();
    var date =
        nowDate.getFullYear() +
        "-" +
        (nowDate.getMonth() + 1) +
        "-" +
        nowDate.getDate();
    var restaurantId = sess.restaurantId;
    var resResult;
    var query_select =
        "select restaurant_schema_name from mili_global_schema.global_restaurants where restaurant_id = ?";
    pool.query(query_select, restaurantId, function (err, result) {
        if (err) {
            throw err;
        } else {
            var restaurantSchemaName = result[0].restaurant_schema_name;
            pool.query(
                "SELECT T3.order_id, T3.token_no, T3.order_status AS order_status_main, T1.food_order_id, T1.food_order_sequence_no, T1.order_id, T1.order_food_cost, T1.user_identifier, T1.table_id, T1.order_status, T1.offer_id, T1.restaurant_food_id, T1.food_customization_comments, T1.food_order_priority, T1.food_count, T1.order_id, T1.user_created, T1.user_updated,T2.restaurant_food_menu_id, T2.food_id, T2.food_name, T2.food_price, T2.food_quantity, T2.is_veg, T2.menu_category_id, T2.menu_category, T2.is_customizable,T2.food_description, T2.is_special_for_today, T2.ready_in, T2.food_likes, T2.is_available FROM " +
                restaurantSchemaName +
                ".food_order_detail AS T1 inner join " +
                restaurantSchemaName +
                ".restaurant_food_menu AS T2 ON T1.restaurant_food_id = T2.restaurant_food_menu_id inner join " +
                restaurantSchemaName +
                ".order_detail AS T3 ON T1.order_id = T3.order_id and T1.created_time Like '%' ORDER BY T1.food_order_sequence_no ASC",
                date,
                function (error, rows, fields) {
                    if (!!error) {
                        log.Error("check query" + error);
                    } else {
                        var ref = realtime.app().database().ref();
                        var usersRef = ref.child(restaurantId);
                        var userRef = usersRef.update({
                            order: rows
                        });
                        resResult = rows;
                        response.render("Analytics/test-kitchen", {
                            data: [{
                                t1: sess.restaurantId,
                                result: resResult
                            }]
                        });
                    }
                }
            );
        }
    });
});

app.post("/kitchenFilter", requireLogin, function (request, response) {
    sess = request.session;
    var nowDate = new Date();
    var date =
        nowDate.getFullYear() +
        "-" +
        (nowDate.getMonth() + 1) +
        "-" +
        nowDate.getDate();
    var restaurantId = sess.restaurantId;
    var resResult;
    var order_status_filter = request.body.order_status_filter;
    var table_no_filter = request.body.table_no_filter;
    var token_no_filter = request.body.token_no_filter;

    var query_select =
        "select restaurant_schema_name from mili_global_schema.global_restaurants where restaurant_id = ?";

    pool.query(query_select, restaurantId, function (err, result) {
        if (err) {
            throw err;
        } else {
            var restaurantSchemaName = result[0].restaurant_schema_name;

            var q1 =
                "SELECT T3.order_id, T3.token_no, T1.food_order_id, T1.food_order_sequence_no, T1.order_id, T1.order_food_cost, T1.user_identifier, T1.table_id, T1.order_status, T1.offer_id, T1.restaurant_food_id, T1.food_customization_comments, T1.food_order_priority, T1.food_count, T1.order_id, T1.user_created, T1.user_updated,T2.restaurant_food_menu_id, T2.food_id, T2.food_name, T2.food_price, T2.food_quantity, T2.is_veg, T2.menu_category_id, T2.menu_category, T2.is_customizable,T2.food_description, T2.is_special_for_today, T2.ready_in, T2.food_likes, T2.is_available FROM " +
                restaurantSchemaName +
                ".food_order_detail AS T1 inner join " +
                restaurantSchemaName +
                ".restaurant_food_menu AS T2 ON T1.restaurant_food_id = T2.restaurant_food_menu_id inner join " +
                restaurantSchemaName +
                ".order_detail AS T3 ON T1.order_id = T3.order_id";

            if (order_status_filter != "all" && order_status_filter != "") {
                q1 = q1 + " and T1.order_status = '" + order_status_filter + "'";
            }

            if (table_no_filter != "") {
                q1 = q1 + " and T1.table_id = '" + table_no_filter + "'";
            }
            if (token_no_filter != "") {
                q1 = q1 + " and T3.token_no = '" + token_no_filter + "'";
            }

            q1 =
                q1 +
                " and T1.created_time Like '%' ORDER BY T1.food_order_sequence_no ASC";

            console.log(q1);

            pool.query(q1, date, function (error, rows, fields) {
                if (!!error) {
                    log.Error("check query" + error);
                } else {
                    resResult = rows;
                    response.render("Analytics/test-kitchen", {
                        data: [{
                            t1: sess.restaurantId,
                            result: resResult
                        }]
                    });
                }
            });
        }
    });
});

app.get("/signup", function (request, response) {
    response.render("signup");
});

app.get("/help", function (request, response) {
    response.render("help");
});

app.post("/addRestaurantDetails", restaurantController.addRestaurantDetails);

app.post("/validateToken", function (request, response) {
    var idToken = request.body.idToken;
    // var restaurantName = request.body.restaurantName;
    // var tableCount = request.body.tableCount;
    // var lastname = request.body.lastname;
    // var firstname = request.body.firstname;
    var res = "success";
    log.Debug(idToken);
    log.Info("routed to login");
    realtime
        .auth()
        .verifyIdToken(idToken)
        .then(function (decodedToken) {
            var uid = decodedToken.uid;
            var uEmail = decodedToken.email;
            log.Debug(uid, decodedToken);
            setTimeout(
                function () {
                    log.Debug("After 30 min call ", uEmail);
                    realtime
                        .auth()
                        .getUser(uid)
                        .then(function (userRecord) {
                            var email = userRecord.email;
                            log.Debug(userRecord.emailVerified);
                            if (userRecord.emailVerified == false) {
                                realtime
                                    .auth()
                                    .deleteUser(uid)
                                    .then(function () {
                                        log.Info("Successfully deleted user", email);
                                    })
                                    .catch(function (error) {
                                        log.Error("Error deleting user:", error);
                                    });
                            } else {
                                log.Info("User is verified ", email);
                            }
                        })
                        .catch(function (error) {
                            log.Error(error);
                        });
                },
                86400000, {
                    uid,
                    uEmail
                }
            );
        })
        .catch(function (error) {
            log.Error(error.code, error.message);
            res = "failure";
        });
    response.send(res);
});

// Get Api for getting menu details
app.get("/getRestaurantMenu1", restaurantController.getRestaurantMenu);

// Get Api for getting menu details
app.get("/getRestaurantMenu", function (request, response) {
    var restaurantId = request.query.restaurantId;
    var responseJson = {};
    var restaurant_schema_name;

    var query_select =
        "select restaurant_schema_name from mili_global_schema.global_restaurants where restaurant_id = ?";

    pool.query(query_select, restaurantId, function (err, result) {
        if (err) {
            throw err;
        } else {
            console.log(result);
            var restaurantSchemaName = result[0].restaurant_schema_name;
            var sql_query_1 =
                "select * from " + restaurantSchemaName + ".restaurant_food_menu";

            pool.query(sql_query_1, function (err, result) {
                if (err) {
                    throw err;
                } else {
                    response.json(result);
                }
            });
        }
    });
});

// Get Api for getting menu details
app.get("/getRestaurantFood", restaurantController.getRestaurantFood);

// Get Api for getting menu details
app.get(
    "/getGlobalRestaurantMenu",
    restaurantController.getGlobalRestaurantMenu
);

// Reset Restaurant Token
app.get("/resetRestaurantToken", restaurantController.updatetoken);

// Reset Restaurant Token
app.get("/getToken", restaurantController.getToken);

// Reset Restaurant Token
app.get("/getOrderCount", restaurantController.getOrderCount);

// Reset Restaurant Token
app.get("/getTotalOrderCost", restaurantController.getTotalOrderCost);

// Reset Restaurant Token
app.get("/getTotalOrderPAID", restaurantController.getTotalOrderPAID);

//get orderstatus
app.get("/updateFoodOrderStatus", orderController.updateFoodOrderStatus);

//get orderstatus
app.get("/updateOrderStatus", orderController.updateOrderStatus);

//get orderstatus
app.get("/updateOrderPayStatus", orderController.updateOrderPayStatus);

//get foodstatus
app.get("/updateFoodStatus", requireLogin, foodController.updateFoodStatus);

//get FoodRecommeded
app.get(
    "/updateFoodRecommended",
    requireLogin,
    foodController.updateFoodRecommended
);

//Insert order details
app.get("/insertOrderDetails", orderController.insertOrderDetails);

app.get("/login", function (request, response) {
    //context.set("req:user",idToken);
    log.Info("routed to login");
    response.render("login");
});

app.get("/aboutus", function (request, response) {
    //context.set("req:user",idToken);
    log.Info("routed to about");
    response.render("aboutus");
});

app.post("/login", function (request, response) {
    var idToken = request.body.idToken;
    var res = "success";
    log.Debug(idToken);
    realtime
        .auth()
        .verifyIdToken(idToken)
        .then(function (decodedToken) {
            var uid = decodedToken.uid;
            log.Debug(uid + " : " + decodedToken);
            log.Info("routed to admin");
        })
        .catch(function (error) {
            log.Error(error.code + " : " + error.message, "login", "verifyIdToken");
            res = "failure";
        });
    response.send(res);
});

app.get("/setRestaurantSchema", restaurantController.setRestaurantSchema);

app.get("/getUserStatus", userController.getUserStatus);

app.get("/updateUserStatus", userController.updateUserStatus);

//Get Restaurant details based on restaurant ID
app.get("/getRestaurantDetails", restaurantController.getRestaurantDetails);

//Get Restaurant details based on restaurant ID
app.get("/getRestaurantToken", restaurantController.getRestaurantToken);

//Get Restaurant details based on restaurant ID
app.get(
    "/getRestaurantTokenForUi",
    restaurantController.getRestaurantTokenForUi
);

//Get Restaurant details based on restaurant ID
app.get("/getRestaurantId", restaurantController.getRestaurantId);

//Get Restaurant details based on restaurant ID
app.get("/getFoodByorderId", orderController.getFoodByorderId);

//Get Restaurant details based on restaurant ID
app.get("/getFoodById", orderController.getFoodByOrder);

app.post("/upload", function (request, response) {
    var multiparty = require("multiparty");
    var form = new multiparty.Form();

    var s3 = new AWS.S3();

    let fileData = fs.readFileSync(form.parse.files.upload[1].path);
    var params = {
        Bucket: bucketName,
        Key: key,
        Body: fileData,
        ACL: "public-read"
    };
    s3.putObject(params, function (perr, pres) {
        if (perr) {
            console.log("Error uploading image: ", perr);
        } else {
            console.log("uploading image successfully");
        }
    });
});

app.post("/setBookedTable", function (request, response) {
    var tableID = request.body.table;
    var user = request.body.user;
    var restaurantId = request.body.restaurantId;
    realtime.database().ref("/" + restaurantId).set({
        tables: {
            tableID: {
                status: "Booked",
                user: user
            }
        }
    });
});

app.get("/logout", requireLogin, function (request, response) {
    console.log("***************");
    request.session.destroy(function (err) {
        if (err) {
            console.log(err);
        } else {
            response.redirect("/");
        }
    });
});

app.get("/logout", requireLogin, function (request, response) {
    console.log("***************");
    request.session.destroy(function (err) {
        if (err) {
            console.log(err);
        } else {
            response.redirect("/");
        }
    });
});

//Get Food Placed Details based on user email and order id and restaurant id
app.get("/getHistoryOrderDetailsByOrderId", function (request, response) {
    var orderId = request.query.order_id;
    var restaurantId = request.query.restaurant_id;
    var emailId = request.query.email_id;

    var restaurantSchemaName;
    var queryGetRestaurantSchemaName =
        "Select restaurant_schema_name FROM mili_global_schema.global_restaurants WHERE restaurant_id = ?";

    pool.query(queryGetRestaurantSchemaName, [restaurantId], async function (
        error,
        result
    ) {
        if (error) {
            response.json("Cannot Fetch Data Now Please Try again later");
        } else {
            try {
                restaurantSchemaName = result[0].restaurant_schema_name;
                var getFoodItemsByOrderIdQuery =
                    "SELECT T1.food_order_id, T1.order_food_cost, T1.food_customization_comments, T1.food_order_sequence_no,  T1.table_id, T1.order_status, T1.restaurant_food_id, T1.food_count, T1.order_id,  T2.restaurant_food_menu_id, T2.food_name, T2.is_veg, T2.menu_category FROM " +
                    restaurantSchemaName +
                    ".food_order_detail AS T1 inner join " +
                    restaurantSchemaName +
                    ".restaurant_food_menu AS T2 ON T1.restaurant_food_id =T2.restaurant_food_menu_id and T1.order_id = ? and T1.user_identifier = ?";
                var foodRows = await pool.query(getFoodItemsByOrderIdQuery, [
                    orderId,
                    emailId
                ]);
                response.json({
                    food_details: foodRows
                });
            } catch (error) {
                console.log("Error for Order is " + error);
            }
        }
    });
});

app.post("/createNewOrder", async function (request, response) {
    var order_details_parsed = JSON.parse(request.body.order_cart_details);
    var total_order_cost = request.body.order_transaction_amount;
    var user_id = request.body.user_identifier;
    var payment_mode = request.body.payment_mode;
    var payment_status = request.body.payment_status;
    var order_type = request.body.order_type;
    var order_status = request.body.order_status;
    var table_no = request.body.table_no;
    var restaurant_id = request.body.restaurant_id;
    console.log(
        "----------------- " + total_order_cost,
        total_order_cost,
        user_id,
        payment_mode,
        payment_status,
        order_type,
        order_status,
        table_no,
        restaurant_id
    );
    var foodOrderValues = [];
    var orderValues = [];
    var globalOrderValues = [];

    var transaction_no;
    var total_order_count = 0;
    var total_order_price = 0;
    var order_id = null;
    var responseJson;

    var token_no;
    var restaurantSchemaName;
    var today = new Date().getTime();
    var date = new Date();
    order_time =
        date.toISOString().split("T")[0] + " " + date.toTimeString().split(" ")[0];
    console.log("order_time " + order_time);
    var rows;
    var queryGetToken =
        "select token from mili_global_schema.global_restaurants where restaurant_id = ?";
    var queryGetRestaurantSchemaName =
        "select restaurant_schema_name from mili_global_schema.global_restaurants where restaurant_id = ?";
    var updateToken =
        "UPDATE mili_global_schema.global_restaurants SET token = ? WHERE restaurant_id = ?";

    try {
        rows = await pool.query(queryGetToken, restaurant_id).catch(err => {
            console.log("caught it 1" + err);
            response.send("something failed");
        });
    } catch (err) {
        console.log("caught it 1" + err);
    }
    token_no = rows[0].token;
    token_no++;
    try {
        var update = await pool
            .query(updateToken, [token_no, restaurant_id])
            .catch(err => {
                console.log("caught it 2" + err);
                response.send({
                    message: update
                });
            });
    } catch (err) {
        console.log("caught it 2" + err);
    }

    token_no = token_no - 1;
    try {
        rows = await pool
            .query(queryGetRestaurantSchemaName, restaurant_id)
            .catch(err => {
                console.log("caught it 3" + err);
                response.send("something failed");
            });
    } catch (err) {
        console.log("caught it 3" + err);
    }

    console.log("Restaurant Schema" + rows[0].restaurant_schema_name);
    restaurantSchemaName = rows[0].restaurant_schema_name;
    transaction_no = today + order_type + restaurantSchemaName + token_no;
    orderValues.push([
        total_order_cost,
        total_order_count,
        0,
        payment_status,
        order_type,
        payment_mode,
        table_no,
        0,
        user_id,
        token_no,
        transaction_no,
        order_status,
        0,
        total_order_cost,
        order_time
    ]);
    var insertNewOrder =
        "INSERT INTO " +
        restaurantSchemaName +
        ".order_detail(total_order_cost,total_order_count,offer_indicator, payment_status, order_type,payment_mode,table_id,order_offer_id,user_identifier, token_no, transaction_no, order_status,sequence_no,current_order_cost, order_time) VALUES ?";

    try {
        rows = await pool.query(insertNewOrder, [orderValues]).catch(err => {
            console.log("caught it 4" + err);
            response.send("something failed");
        });
    } catch (err) {
        console.log("caught it 4" + err);
        response.send("Insert Order failed");
        return;
    }

    order_id = rows.insertId;

    for (var i = 0; i < order_details_parsed.length; i++) {
        if (order_details_parsed[i].offerId !== 0) {
            offer_indicator = 1;
        }
        total_order_count =
            total_order_count + order_details_parsed[i].quantityInCart;
        total_order_price =
            total_order_price + parseFloat(order_details_parsed[i].foodPrice);
        foodOrderValues.push([
            order_details_parsed[i].foodPrice,
            table_no,
            order_status,
            order_details_parsed[i].offerId,
            order_details_parsed[i].restaurantFoodId,
            order_details_parsed[i].customizationComments,
            order_details_parsed[i].foodPriority,
            order_details_parsed[i].quantityInCart,
            user_id,
            order_id,
            user_id,
            user_id,
            0
        ]);

        console.log(
            "Food Restaurant Id " + order_details_parsed[i].restaurantFoodId
        );
    }

    var insertNewFoodOrder =
        "Insert into " +
        restaurantSchemaName +
        ".food_order_detail(order_food_cost,  table_id, order_status, offer_id, restaurant_food_id, food_customization_comments, food_order_priority, food_count, user_identifier, order_id, user_created, user_updated,food_order_sequence_no) VALUES ?";

    try {
        var insertDone = await pool
            .query(insertNewFoodOrder, [foodOrderValues])
            .catch(err => {
                console.log("caught it food insert" + err);
                response.send({
                    "something failed": insertDone
                });
            });
    } catch (err) {
        console.log("caught it 4" + err);
    }
    try {
        responseJson = {
            transaction_no: transaction_no,
            token_no: token_no,
            order_status: order_status,
            order_id: order_id,
            order_time: order_time
        };

        io.sockets.emit("broadcast", {
            transaction_no: transaction_no,
            token_no: token_no,
            order_status: order_status,
            order_id: order_id,
            restaurant_id: restaurant_id,
            restaurant_schema: restaurantSchemaName,
            sequence_no: 0
        });

        console.log(responseJson);
        response.send(responseJson);
    } catch (Error) {
        console.log(Error);
    }
});

app.post("/updatePaymentStatus", async function (request, response) {
    var user_id = request.body.user_identifier;
    var payment_mode = request.body.payment_mode;
    var payment_status = request.body.payment_status;
    var order_id = request.body.order_id;
    var restaurant_id = request.body.restaurant_id;

    var queryGetRestaurantSchemaName =
        "SELECT restaurant_schema_name from mili_global_schema.global_restaurants where restaurant_id = ?";
    console.log(
        user_id + payment_mode + payment_status + order_id + restaurant_id
    );
    var rows = await pool
        .query(queryGetRestaurantSchemaName, restaurant_id)
        .catch(err => {
            console.log("caught it 3" + err);
            response.send("something failed");
        });
    restaurantSchemaName = rows[0].restaurant_schema_name;
    var queryGetHighestSequence =
        "SELECT user_identifier, max(sequence_no) as sequence_no FROM " +
        restaurantSchemaName +
        ".order_detail where order_id = ?";
    var rows = await pool.query(queryGetHighestSequence, order_id).catch(err => {
        console.log("caught it 1" + err);
        response.send({
            message: "order_id exists"
        });
    });

    highestSequence = rows[0].sequence_no;

    currentUser = rows[0].user_identifier;
    if (currentUser != user_id) {
        response.send({
            message: "User is not same you cannot make the payment"
        });
    }

    var queryUpdatePaymentStatus =
        "UPDATE " +
        restaurantSchemaName +
        ".order_detail SET payment_status = ?, payment_mode = ? WHERE order_id = ? and sequence_no = ?";
    var queryUpdateGlobalPaymentStatus =
        "UPDATE mili_global_schema.global_order_detail set payment_status = ?, payment_mode = ? WHERE order_id = ? and restaurant_schema_name = ?";

    var rows = await pool
        .query(queryUpdatePaymentStatus, [
            payment_status,
            payment_mode,
            order_id,
            highestSequence
        ])
        .catch(err => {
            console.log("caught it 2" + err);
            console.log(
                user_id + payment_mode + payment_status + order_id + restaurant_id
            );
            response.send({
                message: "order_id exists"
            });
        });

    var globalRows = await pool
        .query(queryUpdateGlobalPaymentStatus, [
            payment_status,
            payment_mode,
            order_id,
            restaurantSchemaName
        ])
        .catch(err => {
            console.log("caught it Global error 4" + err);
            console.log(
                user_id +
                payment_mode +
                payment_status +
                order_id +
                restaurantSchemaName
            );
            response.send({
                message: "order_id exists"
            });
        });
    response.json({
        payment_updated: true
    });
    console.log(rows.affectedRows + " record(s) updated");
});

// Get Api for getting menu details
app.get("/getRestaurantReviews", function (request, response) {
    var restaurantId = request.query.restaurantId;

    var queryGetRestaurantSchemaName =
        "SELECT restaurant_schema_name from mili_global_schema.global_restaurants where restaurant_id = ?";

    pool.query(queryGetRestaurantSchemaName, restaurantId, function (err, result) {
        if (err) {
            throw err;
        } else {
            console.log(result);
            var restaurantSchemaName = result[0].restaurant_schema_name;
            var sql_query = "select * from " + restaurantSchemaName + ".user_review";

            pool.query(sql_query, function (err, result) {
                if (err) {
                    throw err;
                } else {
                    response.json(result);
                }
            });
        }
    });
});

app.post("/addLoginUser", async function (request, response) {
    var user_details = JSON.parse(request.body.user_details);
    var user_email = user_details.userEmail;
    var register_type = user_details.registerType;
    var restaurant_entity = user_details.restaurantEntity;
    var user_role = user_details.userRole;
    var email_verified = user_details.emailVerified;
    var fcm_key = user_details.fcmKey;
    var full_name = user_details.fullName;
    var mobile_number = user_details.mobileNumber;
    var is_existing = user_details.isExistingUser


    var insertNewUser = 'INSERT INTO mili_global_schema.global_user(mobile_number, user_email,verfication_type,user_role,fcm_key,full_name) VALUES (?,?,?,?,?,?);'
    var updateUser = 'UPDATE mili_global_schema.global_user SET user_email = ?, full_name = ? WHERE mobile_number = ?'

    if (is_existing == 0) {

        var checkIfEmailIdIsTaken = "SELECT * FROM mili_global_schema.global_user WHERE user_email=?"
        var rows = await pool.query(checkIfEmailIdIsTaken, [user_email]);
        if (rows.length > 0) {
            response.json({
                message: "Email Already Used Please Use New Email"
            });
        } else {
            pool.query(insertNewUser, [mobile_number, user_email, register_type, user_role, fcm_key, full_name], function (err, result) {
                if (err) {
                    console.log("Insert failed " + err);
                    response.json({
                        message: "user insert failed added" + err
                    });
                } else {
                    console.log("user added");
                    response.json({
                        message: "user added"
                    });
                }
            });
        }
    } else {
        pool.query(
            updateUser,
            [user_email, full_name, mobile_number],
            function (err, result) {
                if (err) {
                    console.log("Insert failed " + err);
                    response.json({
                        message: "user insert failed added" + err
                    });
                } else {
                    console.log("user added");
                    response.json({
                        message: "user added"
                    });
                }
            }
        );
    }

});

app.post("/checkUserExists", async function (request, response) {
    var user_details = JSON.parse(request.body.user_details);
    var fcm_token = user_details.fcmKey;
    var mobile_number = user_details.mobileNumber;
    var user_email;
    var full_name;

    var checkUserExistsQuery =
        "SELECT mobile_number, full_name, user_email FROM mili_global_schema.global_user WHERE mobile_number = ?";

    try {
        var rows = await pool.query(checkUserExistsQuery, [mobile_number]);
        if (rows.length > 0) {
            user_email = rows[0].user_email;
            full_name = rows[0].full_name;
            var upadateFCMKey =
                "UPDATE mili_global_schema.global_user set fcm_key = ? where mobile_number = ? ";
            pool.query(upadateFCMKey, [fcm_token, mobile_number], async function (
                error,
                result
            ) {
                if (error) {
                    response.json({
                        id: "failed"
                    });
                    throw error;
                } else {
                    var getGlobalPendingPaymentOrderQuery =
                        "SELECT order_id,order_status,last_sequence_no,restaurant_schema_name from mili_global_schema.global_order_detail where user_email = ?  and (payment_status = null or payment_status = 'NOT PAID')";
                    try {
                        var rows = await pool.query(getGlobalPendingPaymentOrderQuery, [
                            user_email
                        ]);
                        if (rows.length > 0) {
                            restaurantSchemaName = rows[0].restaurant_schema_name;
                            order_id = rows[0].order_id;
                            try {
                                var getLastSequenceByOrderIdQuery =
                                    "SELECT order_id,order_status, sequence_no,token_no,order_time,total_order_cost,payment_status,payment_mode,order_type FROM( SELECT *, ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY sequence_no DESC) rn FROM mili_001.order_detail where order_id = ?) v WHERE rn = 1";
                                var getFoodItemsForPendingPaymentByRestaurantQuery =
                                    "SELECT T1.food_order_id, T1.order_food_cost, T1.food_customization_comments, T1.food_order_sequence_no, T1.created_time, T1.user_identifier, T1.table_id, T1.order_status, T1.restaurant_food_id, T1.food_count, T1.order_id, T1.user_created, T2.restaurant_food_menu_id, T2.food_name, T2.is_veg, T2.menu_category FROM " +
                                    restaurantSchemaName +
                                    ".food_order_detail AS T1 inner join " +
                                    restaurantSchemaName +
                                    ".restaurant_food_menu AS T2 ON T1.restaurant_food_id =T2.restaurant_food_menu_id and T1.order_id = ? and T1.user_identifier = ?";
                                var getRestaurantIdQuery =
                                    "SELECT * FROM mili_global_schema.global_restaurants where restaurant_schema_name = ?";
                                var restaurantData = await pool.query(getRestaurantIdQuery, [
                                    restaurantSchemaName
                                ]);
                                var orderRow = await pool.query(getLastSequenceByOrderIdQuery, [
                                    order_id
                                ]);
                                var foodRows = await pool.query(
                                    getFoodItemsForPendingPaymentByRestaurantQuery,
                                    [order_id, user_email]
                                );

                                response.json({
                                    food_orders: foodRows,
                                    order_row: orderRow,
                                    restaurant_data: restaurantData,
                                    id: "existing",
                                    full_name: full_name,
                                    email_id: user_email
                                });
                            } catch (Error) {
                                console.log("Inner Error " + Error);
                            }
                        } else {
                            response.json({
                                food_orders: [],
                                order_row: [],
                                restaurant_data: [],
                                id: "existing",
                                full_name: full_name,
                                email_id: user_email
                            });
                        }
                    } catch (Error) {
                        console.log("Parent Error before update send" + Error);
                    }
                }
            });
        } else {
            response.json({
                food_orders: [],
                order_row: [],
                restaurant_data: [],
                id: "new"
            });
        }
    } catch (error) {
        console.log("User Check query failed " + error);
        response.json({
            id: "failed"
        });
    }
});

app.post("/updateOrder", async function (request, response) {
    var order_details_parsed = JSON.parse(request.body.order_cart_details);
    var total_order_cost = request.body.order_transaction_amount;
    var user_id = request.body.user_identifier;
    var payment_mode = request.body.payment_mode;
    var payment_status = request.body.payment_status;
    var order_status = request.body.order_status;
    var table_no = request.body.table_no;
    var order_id = request.body.order_id;
    var transaction_no = request.body.transaction_no;
    var restaurant_id = request.body.restaurant_id;
    var token_no = request.body.token_no;
    var current_order_cost = request.body.current_order_cost;
    var order_type = request.body.order_type;
    var restaurantSchemaName;
    var highestSequence;
    var currentUser;
    var total_order_count = 0;
    var total_order_price = 0;
    var orderValues = [];
    var foodOrderValues = [];
    console.log("Order Details order_id " + order_id);

    var date = new Date(),
        order_time =
            date.toISOString().split("T")[0] +
            " " +
            date.toTimeString().split(" ")[0];

    var queryGetRestaurantSchemaName =
        "SELECT restaurant_schema_name FROM mili_global_schema.global_restaurants where restaurant_id = ?";
    var rows = await pool
        .query(queryGetRestaurantSchemaName, restaurant_id)
        .catch(err => {
            console.log("caught it 1" + err);
            response.send("something failed");
        });
    restaurantSchemaName = rows[0].restaurant_schema_name;
    var queryGetHighestSequence =
        "SELECT user_identifier, max(sequence_no) as sequence_no FROM " +
        restaurantSchemaName +
        ".order_detail where order_id = ?";
    rows = await pool.query(queryGetHighestSequence, order_id).catch(err => {
        console.log("caught it 2" + err);
        response.send({
            message: "order_id exists"
        });
    });

    highestSequence = rows[0].sequence_no;
    highestSequence++;
    console.log("Highest Sequence " + highestSequence);
    currentUser = rows[0].user_identifier;
    if (currentUser != user_id) {
        response.send({
            message: "User is not same need place a new order"
        });
    }

    orderValues.push([
        order_time,
        order_id,
        total_order_cost,
        total_order_count,
        0,
        payment_status,
        order_type,
        payment_mode,
        table_no,
        0,
        user_id,
        token_no,
        transaction_no,
        order_status,
        highestSequence,
        current_order_cost
    ]);
    var insertNewSequenceOrderDetails =
        "INSERT INTO " +
        restaurantSchemaName +
        ".order_detail(order_time,order_id,total_order_cost,total_order_count,offer_indicator, payment_status, order_type,payment_mode,table_id,order_offer_id,user_identifier, token_no, transaction_no, order_status,sequence_no,current_order_cost) VALUES ?";
    try {
        var result = await pool.query(insertNewSequenceOrderDetails, [orderValues]);

        console.log("result after inserting new order seq ------ " + result);
        for (var i = 0; i < order_details_parsed.length; i++) {
            if (order_details_parsed[i].offerId !== 0) {
                offer_indicator = 1;
            }
            total_order_count =
                total_order_count + order_details_parsed[i].quantityInCart;
            total_order_price =
                total_order_price + parseFloat(order_details_parsed[i].foodPrice);
            foodOrderValues.push([
                order_details_parsed[i].foodPrice,
                table_no,
                order_status,
                order_details_parsed[i].offerId,
                order_details_parsed[i].restaurantFoodId,
                order_details_parsed[i].customizationComments,
                order_details_parsed[i].foodPriority,
                order_details_parsed[i].quantityInCart,
                user_id,
                order_id,
                user_id,
                user_id,
                highestSequence
            ]);
            console.log(
                " Restaurant Food Id " + order_details_parsed[i].restaurantFoodId
            );
        }
        var insertNewFoodOrder =
            "Insert into " +
            restaurantSchemaName +
            ".food_order_detail (order_food_cost, table_id, order_status, offer_id, restaurant_food_id, food_customization_comments, food_order_priority, food_count, user_identifier, order_id, user_created, user_updated,food_order_sequence_no) VALUES ?";
        var insertDone = await pool
            .query(insertNewFoodOrder, [foodOrderValues])
            .catch(err => {
                console.log("caught it 4" + err);
                console.log("insert data " + err);
                response.send({
                    "something failed": insertDone
                });
            });

        responseJson = {
            transaction_no: transaction_no,
            token_no: token_no,
            order_status: order_status,
            order_id: order_id,
            sequence_no: highestSequence
        };
        console.log(responseJson);
        response.send(responseJson);

        io.sockets.emit(
            (
                "broadcast", {
                    transaction_no: transaction_no,
                    token_no: token_no,
                    order_status: order_status,
                    order_id: order_id,
                    restaurant_id: restaurant_id,
                    restaurant_schema: restaurantSchemaName
                }
            )
        );
    } catch (error) {
        console.log("Parent Try and Error " + error);
    }
});

app.get("/getTime", function (request, response) {
    var d = new Date();
    finalDate =
        d.toISOString().split("T")[0] + " " + d.toTimeString().split(" ")[0];
    console.log(finalDate); //2018-09-28 16:19:34 --example output
    response.json(finalDate);
});

app.get("/getLiveNews", function (request, response) {
    var lastNewsReceivedTime = request.query.lastNewsUpdateTime;

   
    var getNewsQuery =
        "SELECT * FROM mili_global_schema.feeds_news where id_feeds_news >= ?";

    pool.query(getNewsQuery, lastNewsReceivedTime, function (error, results) {
        if (error) { } else {
            var totalNewsItemCount = results.length;

            response.json({
                total_count: totalNewsItemCount,
                food_feeds: results
            });
        }
    });
});
//GET ALL RESTAURANT REGISTERED WITH MILI
app.get("/getAllRestaurants", function (request, response) {
    var allRestaurantQuery =
        "SELECT restaurant_start_time,restaurant_end_time,restaurant_id,restaurant_name,restaurant_locality,restaurant_city,restaurant_cost_two,restaurant_rating,cuisines,restaurant_images_url,restaurant_is_pure_veg FROM mili_global_schema.global_restaurants";

    pool.query(allRestaurantQuery, function (error, result) {
        if (error) {
            log.Error("check query" + error);
        } else {
            response.json(result);
        }
    });
});

app.get("/getRestaurantsForGlobalFood", async function (request, response) {
    var food_id = request.query.foodid;
    var restaurantSchemaName;
    var foodPrice;
    var restaurantDetails = [];
    var getAllRelatedRestaurantsForFoodId =
        "SELECT restaurant_schema_name, food_restaurant_item_price from mili_global_schema.global_restaurant_food_item  where global_food_id = ?";
    console.log("User EMail " + food_id);
    try {
        var rows = await pool.query(getAllRelatedRestaurantsForFoodId, [food_id]);
        if (rows.length > 0) {
            for (var i = 0; i < rows.length; i++) {
                restaurantSchemaName = rows[i].restaurant_schema_name;
                foodPrice = rows[i].food_restaurant_item_price;
                try {
                    var getRestaurantDetails =
                        "SELECT restaurant_start_time,restaurant_id,restaurant_city,restaurant_end_time,restaurant_name,restaurant_address,restaurant_sublocality,restaurant_locality,restaurant_landmark,restaurant_rating,restaurant_is_pure_veg FROM mili_global_schema.global_restaurants where restaurant_schema_name = ?";

                    var restaurantData = await pool.query(getRestaurantDetails, [
                        restaurantSchemaName
                    ]);
                    restaurantData.map(item => (item.food_price = foodPrice));
                    restaurantDetails.push(restaurantData[0]);
                    console.log(
                        "restaurant data " + foodPrice + restaurantDetails.toString
                    );
                } catch (Error) {
                    console.log("Inner Error " + Error);
                }
            }
            response.json(restaurantDetails);
        } else {
            response.json([]);
        }
    } catch (Error) {
        console.log("Outer error " + Error);
    }
});

// Get Payment Pending Orders by User Id if any

app.get("/getPendingPaymentOrders", async function (request, response) {
    var user_email = request.query.userEmail;
    var restaurantSchemaName;
    var order_id;
    var getGlobalPendingPaymentOrderQuery =
        "SELECT order_id,last_sequence_no,restaurant_schema_name from mili_global_schema.global_order_detail  where user_email = ?  and (payment_status = null or payment_status = 'NOT PAID')";
    console.log("User EMail " + user_email);
    try {
        var rows = await pool.query(getGlobalPendingPaymentOrderQuery, [
            user_email
        ]);
        if (rows.length > 0) {
            restaurantSchemaName = rows[0].restaurant_schema_name;
            order_id = rows[0].order_id;
            try {
                var getLastSequenceByOrderIdQuery =
                    "SELECT order_id,order_status, sequence_no,token_no,order_time,total_order_cost,payment_status,payment_mode,order_type FROM( SELECT *, ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY sequence_no DESC) rn FROM mili_001.order_detail where order_id = ?) v WHERE rn = 1";
                var getFoodItemsForPendingPaymentByRestaurantQuery =
                    "SELECT T1.food_order_id, T1.order_food_cost, T1.food_customization_comments, T1.food_order_sequence_no, T1.created_time, T1.user_identifier, T1.table_id, T1.order_status, T1.restaurant_food_id, T1.food_count, T1.order_id, T1.user_created, T2.restaurant_food_menu_id, T2.food_name, T2.is_veg, T2.menu_category FROM " +
                    restaurantSchemaName +
                    ".food_order_detail AS T1 inner join " +
                    restaurantSchemaName +
                    ".restaurant_food_menu AS T2 ON T1.restaurant_food_id =T2.restaurant_food_menu_id and T1.order_id = ? and T1.user_identifier = ?";
                var getRestaurantIdQuery =
                    "SELECT * FROM mili_global_schema.global_restaurants where restaurant_schema_name = ?";
                var restaurantData = await pool.query(getRestaurantIdQuery, [
                    restaurantSchemaName
                ]);
                var orderRow = await pool.query(getLastSequenceByOrderIdQuery, [
                    order_id
                ]);
                var foodRows = await pool.query(
                    getFoodItemsForPendingPaymentByRestaurantQuery,
                    [order_id, user_email]
                );

                response.json({
                    food_orders: foodRows,
                    order_row: orderRow,
                    restaurant_data: restaurantData
                });
            } catch (Error) {
                console.log("Inner Error " + Error);
            }
        } else {
            response.json({
                food_orders: [],
                order_row: [],
                restaurant_data: []
            });
        }
    } catch (Error) {
        console.log("Parent Error " + Error);
    }
});

//GET ALL FOOD ITEMS
app.get("/getAllFoodItems", function (request, response) {
    var globalFoodQuery =
        "SELECT food_ingredients,food_taste,cuisine,is_veg,food_global_id, food_likes,food_description, food_img_url,food_name, food_taste, alternate_names,other_facts,origin_place,origin_date FROM mili_global_schema.global_food_items ORDER BY food_likes desc LIMIT 20";
    pool.query(globalFoodQuery, function (error, result) {
        if (error) {
            log.Error("Error is " + error);
        } else {
            console.log("data from result " + result);
            response.json(result);
        }
    });
});

app.post("/updateFcmToken", function (request, response) {
    var user_details = JSON.parse(request.body.user_details);
    var fcm_token = user_details.fcmKey;
    var user_email = user_details.userEmail;

    var upadateFCMKey =
        "UPDATE mili_global_schema.global_user set fcm_key = ? where user_email = ? ";
    pool.query(upadateFCMKey, [fcm_token, user_email], function (error, result) {
        if (error) {
            response.json({
                id: "failed"
            });
            console.log("insode update token error " + error);
            throw error;
        } else {
            console.log("inside else of update fcm");
            var getGlobalPendingPaymentOrderQuery =
                "SELECT order_id,order_status,last_sequence_no,restaurant_schema_name from mili_global_schema.global_order_detail  where user_email = ?  and (payment_status = null or payment_status = 'NOT PAID')";
            try {
                pool.query(
                    getGlobalPendingPaymentOrderQuery,
                    [user_email],
                    async function (error, result) {
                        console.log("values in rows for update fcm token " + result);
                        if (result.length > 0) {
                            restaurantSchemaName = result[0].restaurant_schema_name;
                            order_id = result[0].order_id;
                            console.log("initial data " + restaurantSchemaName + order_id);

                            var getLastSequenceByOrderIdQuery =
                                "SELECT order_id,order_status, sequence_no,token_no,order_time,total_order_cost,payment_status,payment_mode,order_type FROM( SELECT *, ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY sequence_no DESC) rn FROM mili_001.order_detail where order_id = ?) v WHERE rn = 1";
                            var getFoodItemsForPendingPaymentByRestaurantQuery =
                                "SELECT T1.food_order_id, T1.order_food_cost, T1.food_customization_comments, T1.food_order_sequence_no,  T1.table_id, T1.order_status, T1.restaurant_food_id, T1.food_count, T1.order_id,  T2.restaurant_food_menu_id, T2.food_name, T2.is_veg, T2.menu_category FROM " +
                                restaurantSchemaName +
                                ".food_order_detail AS T1 inner join " +
                                restaurantSchemaName +
                                ".restaurant_food_menu AS T2 ON T1.restaurant_food_id =T2.restaurant_food_menu_id and T1.order_id = ? and T1.user_identifier = ?";
                            var getRestaurantIdQuery =
                                "SELECT * FROM mili_global_schema.global_restaurants where restaurant_schema_name = ?";

                            try {
                                var restaurantData = await pool.query(getRestaurantIdQuery, [
                                    restaurantSchemaName
                                ]);
                                var orderRow = await pool.query(getLastSequenceByOrderIdQuery, [
                                    order_id
                                ]);
                                var foodRows = await pool.query(
                                    getFoodItemsForPendingPaymentByRestaurantQuery,
                                    [order_id, user_email]
                                );

                                var getFullName =
                                    "SELECT full_name FROM mili_global_schema.global_user where user_email = ?";
                                var userFullName = await pool.query(getFullName, [user_email]);
                                var fullName = userFullName[0].full_name;

                                response.json({
                                    food_orders: foodRows,
                                    order_row: orderRow,
                                    restaurant_data: restaurantData,
                                    id: "updated",
                                    full_name: fullName
                                });
                            } catch (Error) {
                                console.log("Inner Error " + Error);
                            }
                        } else {
                            var getFullName =
                                "SELECT full_name FROM mili_global_schema.global_user where user_email = ?";
                            var userFullName = await pool.query(getFullName, [user_email]);
                            var fullName = userFullName[0].full_name;
                            console.log(fullName + "the else of all");
                            response.json({
                                food_orders: [],
                                order_row: [],
                                restaurant_data: [],
                                id: "updated",
                                full_name: fullName
                            });
                        }
                    }
                );
            } catch (Error) {
                console.log("Parent Error " + Error);
            }
        }
    });
});

//Get Restaurant details based on restaurant ID
app.get("/getRestaurantBasicDetails", function (request, response) {
    var restaurantId = request.query.restaurantId;

    var query_select =
        "SELECT * from mili_global_schema.global_restaurants WHERE restaurant_id = ?";

    pool.query(query_select, restaurantId, function (err, result) {
        if (err) {
            throw err;
        } else {
            console.log(result);
            response.json(result);
        }
    });
});

//Get Restaurant details for All passed restaurants
app.post("/getUpdatesForExistingRestaurant", async function (request, response) {
    console.log("existing.................");
    var restaurants = JSON.parse(request.body.restaurants);
    var restaurantDetails = [];
    console.log("Resraurant "+restaurants);
    var getLatestDataForRestaurant =
        "SELECT * from mili_global_schema.global_restaurants WHERE restaurant_id = ? AND last_update_id > ?";
    try {
        var restaurantData = await pool.query(getLatestDataForRestaurant, [restaurants[0].restaurantId, restaurants[0].lastUpdatedId]);
        response.json(restaurantData);
    } catch (Error) {
	    console.log("existing "+Error);
        response.json(restaurantDetails);
    }
});
//Get Restaurants based on text search
app.get("/searchQueryResults", async function (request, response) {
    var resultItems = [];
    var searchQuery = request.query.searchQuery;
    var getRestaurants =
        "SELECT restaurant_id,restaurant_name,restaurant_locality,restaurant_city,restaurant_cost_two,restaurant_rating,cuisines,restaurant_images_url,restaurant_is_pure_veg FROM mili_global_schema.global_restaurants WHERE  restaurant_name like " +
        pool.escape("%" + searchQuery + "%") +
        " or restaurant_locality like " +
        pool.escape("%" + searchQuery + "%") +
        " or cuisines like " +
        pool.escape("%" + searchQuery + "%");
    var getFoodItems =
        "SELECT cuisine,is_veg,food_ingredients,food_global_id, food_likes, food_description, food_img_url, food_name, food_taste, alternate_names,other_facts, origin_place, origin_date FROM mili_global_schema.global_food_items WHERE food_name like " +
        pool.escape("%" + searchQuery + "%") +
        " or cuisine like " +
        pool.escape("%" + searchQuery + "%");

    try {
        var restaurantData = await pool.query(getRestaurants);
        var foodData = await pool.query(getFoodItems);

        resultItems.push(restaurantData);
        resultItems.push(foodData);
        response.json(resultItems);
    } catch (Error) {
        console.log(" something went wrong for generic search " + Error);
        response.json(resultItems);
    }
});

//Get Restaurant details based on restaurant ID
app.get("/getGlobalFoodName", function (request, response) {
    var query_select =
        "SELECT food_name FROM mili_global_schema.global_food_items";
    pool.query(query_select, function (err, result) {
        if (err) {
            throw err;
        } else {
            response.json(result);
        }
    });
});

app.get("/placeOrder", requireLogin, function (request, response) {
    sess = request.session;
    var restaurantId = sess.restaurantId;
    var responseJson = {};
    var resResult;
    let query = fs.readFileSync("Database/query.json");
    var restaurantSchemaNameQuery = JSON.parse(query).restaurantSchemaNameQuery;
    pool.query(restaurantSchemaNameQuery, restaurantId, function (err, result) {
        if (err) {
            throw err;
        } else {
            var restaurantSchemaName = getrestaurantSchemaNameAndQuery(result);
            var getRestaurantMenu = bindrestaurantSchemaNameAndQuery(
                restaurantSchemaName,
                JSON.parse(query).getRestaurantMenu
            );
            pool.query(getRestaurantMenu, function (err, result) {
                if (err) {
                    throw err;
                } else {
                    resResult = result;
                    console.log(resResult);
                    response.render("Analytics/test-placeOrder", {
                        data: [{
                            t1: sess.restaurantId,
                            result: resResult
                        }]
                    });
                }
            });
        }
    });
});

//Get Restaurant details based on restaurant ID web portal
//5/18/2019
app.get("/getRestaurantBasicDetailsWebPortal", function (request, response) {
    sess = request.session;
    var email = sess.email;

    var query_select =
        "SELECT * FROM mili_global_schema.global_user_restaurant where user_email = ?";

    pool.query(query_select, email, function (err, result) {
        if (err) {
            throw err;
        } else {
            response.json(result);
        }
    });
});

app.get("/suggestMe", function (request, response) {
    var query_select = "SELECT * FROM `mili_global_schema`.`suggestMe`";
    pool.query(query_select, function (err, result) {
        if (err) {
            throw err;
        } else {
            response.render("suggestMe", {
                data: result
            });
        }
    });
});

app.post("/suggestMeCommentReplyPrev", function (request, response) {
    var suggestMeId = request.body.suggestMeId;
    var query_select =
        "SELECT * FROM `mili_global_schema`.`suggestMe` WHERE idsuggestMe = ?";
    pool.query(query_select, [suggestMeId], function (err, result) {
        if (err) {
            throw err;
        } else {
            response.send(result);
        }
    });
});

app.post("/suggestMePost", function (request, response) {
    var suggestMe = request.body.suggestMe;
    var suggestMeComment = request.body.suggestMeComment;
    var query_select =
        "INSERT INTO `mili_global_schema`.`suggestMe`(`suggestMe`,`suggestMeComments`) VALUES (?,?)";
    pool.query(query_select, [suggestMe, suggestMeComment], function (
        err,
        result
    ) {
        if (err) {
            throw err;
        } else {
            var query_select = "SELECT * FROM `mili_global_schema`.`suggestMe`";
            pool.query(query_select, function (err, data) {
                if (err) {
                    throw err;
                } else {
                    response.render("suggestMe", {
                        data: data
                    });
                }
            });
        }
    });
});

app.post("/suggestMeCommentReply", function (request, response) {
    var suggestMeId = request.body.suggestMeId;
    var CommentReply = request.body.CommentReply;
    var query_select =
        "SELECT * FROM `mili_global_schema`.`suggestMe` WHERE idsuggestMe = ?";
    pool.query(query_select, [suggestMeId], function (err, result) {
        if (err) {
            throw err;
        } else {
            var suggestMeAnswerCount =
                parseInt(result[0].suggestMeAnswerCount, 0) + 1;
            if (result[0].suggestMeAnswer != null) {
                var suggestMeAnswer = result[0].suggestMeAnswer + ";" + CommentReply;
            } else {
                var suggestMeAnswer = CommentReply;
            }
            var query_select =
                "UPDATE `mili_global_schema`.`suggestMe` SET suggestMeAnswer = ?, suggestMeAnswerCount = ? WHERE idsuggestMe = ?";
            pool.query(
                query_select,
                [suggestMeAnswer, suggestMeAnswerCount, suggestMeId],
                function (err, row) {
                    if (err) {
                        throw err;
                    } else {
                        var query_select =
                            "SELECT * FROM `mili_global_schema`.`suggestMe` WHERE idsuggestMe = ?";
                        pool.query(query_select, [suggestMeId], function (err, data) {
                            if (err) {
                                throw err;
                            } else {
                                response.send(data);
                            }
                        });
                    }
                }
            );
        }
    });
});

app.post("/suggestMeAddLike", function (request, response) {
    var suggestMeId = request.body.suggestMeId;
    var query_select =
        "SELECT * FROM `mili_global_schema`.`suggestMe` WHERE idsuggestMe = ?";
    pool.query(query_select, [suggestMeId], function (err, result) {
        if (err) {
            throw err;
        } else {
            var suggestMeLike = parseInt(result[0].suggestMeLike, 0) + 1;
            var query_select =
                "UPDATE `mili_global_schema`.`suggestMe` SET suggestMeLike = ? WHERE idsuggestMe = ?";
            pool.query(query_select, [suggestMeLike, suggestMeId], function (
                err,
                row
            ) {
                if (err) {
                    throw err;
                } else {
                    var query_select =
                        "SELECT * FROM `mili_global_schema`.`suggestMe` WHERE idsuggestMe = ?";
                    pool.query(query_select, [suggestMeId], function (err, data) {
                        if (err) {
                            throw err;
                        } else {
                            response.send(data);
                        }
                    });
                }
            });
        }
    });
});

app.post("/suggestMeVoteYes", function (request, response) {
    var suggestMeId = request.body.suggestMeId;
    var vote = request.body.vote;
    console.log(vote);
    var query_select =
        "SELECT * FROM `mili_global_schema`.`suggestMe` WHERE idsuggestMe = ?";
    pool.query(query_select, [suggestMeId], function (err, result) {
        if (err) {
            throw err;
        } else {
            var suggestMeVoteYes, query_select;
            if (vote == "true") {
                suggestMeVoteYes = parseInt(result[0].suggestMeVoteYes, 0) + 1;
                query_select =
                    "UPDATE `mili_global_schema`.`suggestMe` SET suggestMeVoteYes = ? WHERE idsuggestMe = ?";
            } else {
                suggestMeVoteYes = parseInt(result[0].suggestMeVoteYes, 0) - 1;
                query_select =
                    "UPDATE `mili_global_schema`.`suggestMe` SET suggestMeVoteYes = ? WHERE idsuggestMe = ?";
            }
            pool.query(query_select, [suggestMeVoteYes, suggestMeId], function (
                err,
                row
            ) {
                if (err) {
                    throw err;
                } else {
                    var query_select =
                        "SELECT * FROM `mili_global_schema`.`suggestMe` WHERE idsuggestMe = ?";
                    pool.query(query_select, [suggestMeId], function (err, data) {
                        if (err) {
                            throw err;
                        } else {
                            response.send(data);
                        }
                    });
                }
            });
        }
    });
});

app.post("/suggestMeVoteNo", function (request, response) {
    var suggestMeId = request.body.suggestMeId;
    var vote = request.body.vote;
    console.log(vote);
    var query_select =
        "SELECT * FROM `mili_global_schema`.`suggestMe` WHERE idsuggestMe = ?";
    pool.query(query_select, [suggestMeId], function (err, result) {
        if (err) {
            throw err;
        } else {
            var suggestMeVoteNo, query_select;
            if (vote == "true") {
                suggestMeVoteNo = parseInt(result[0].suggestMeVoteNo, 0) + 1;
                query_select =
                    "UPDATE `mili_global_schema`.`suggestMe` SET suggestMeVoteNo = ? WHERE idsuggestMe = ?";
            } else {
                suggestMeVoteNo = parseInt(result[0].suggestMeVoteNo, 0) - 1;
                query_select =
                    "UPDATE `mili_global_schema`.`suggestMe` SET suggestMeVoteNo = ? WHERE idsuggestMe = ?";
            }
            pool.query(query_select, [suggestMeVoteNo, suggestMeId], function (
                err,
                row
            ) {
                if (err) {
                    throw err;
                } else {
                    var query_select =
                        "SELECT * FROM `mili_global_schema`.`suggestMe` WHERE idsuggestMe = ?";
                    pool.query(query_select, [suggestMeId], function (err, data) {
                        if (err) {
                            throw err;
                        } else {
                            response.send(data);
                        }
                    });
                }
            });
        }
    });
});

app.get("/suggestMeChat", function (request, response) {
    var query_select =
        "SELECT * FROM `mili_global_schema`.`suggestMeChatRoom` order by idsuggestMeChatRoom desc";
    pool.query(query_select, function (err, result) {
        if (err) {
            throw err;
        } else {
            response.render("suggestMeChatRoom", {
                data: result
            });
        }
    });
});

app.post("/suggestMeChatRoomMsg", function (request, response) {
    var msg = request.body.msg;
    var query_select =
        "INSERT INTO `mili_global_schema`.`suggestMeChatRoom`(`suggestMeChatRoomMsg`) VALUES(?)";
    pool.query(query_select, [msg], function (err, row) {
        if (err) {
            throw err;
        } else {
            io.sockets.emit("broadcastSuggestMeChatRoomGetMsg", {
                msg: msg
            });
            response.send(msg);
        }
    });
});

app.get("/blog", function (request, response) {
    response.render("blog");
});

/*for https running on port 8080
var servercreate = app.listen(8080, function(error) {
 if (!!error) log.Error("error while starting server", "app", "listen");
 else log.Info("Server started and Listening to the port 80");
 if (process.send) {
   process.send("online");
 }
});*/



// for https
var servercreate = http.createServer(function (req, res) {
    res.writeHead(301, {
        "Location": "https://" + req.headers['host'] + req.url
    });
    res.end();
}).listen(80);


app.use(function (req, res, next) {
    if (req.secure) {
        // request was via https, so do no special handling
        next();
    } else {
        // request was via http, so redirect to https
        res.redirect('https://' + req.headers.host + req.url);
    }
});

// for https
servercreate = https.createServer(options, app).listen(443);

var io = socket(servercreate);

module.exports.socketDef = io;

io.on("connection", function (socket) {
    socket.on("disconnect", function () {
        io.sockets.emit("broadcast", {
            description: "clients"
        });
    });
});

module.exports = app;
