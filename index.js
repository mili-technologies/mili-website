var express = require("express");
var mysql = require("mysql");
var path = require("path");
var logger = require("morgan");
var ejs = require("ejs");
var context = require("request-context");
//var admin = require("firebase-admin");
var realtime = require("firebase-admin");
//var serviceAccount = require(__dirname+"/firebase_key/mili-b2581-firebase-adminsdk-o60lm-0c430ed0ef.json");
var serviceAccount1 = require(__dirname+"/firebase_key/test-6d54b-firebase-adminsdk-1fxtq-d4815dc7f4.json");
var routes = require("./controllers/admin/admin.js");
// var $ = require('jquery');
const bodyParser = require("body-parser");
const log = require('node-file-logger');

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

app.use("/miliadmin",routes);
app.use(logger('dev'));
app.use(express.static("./views"));
app.use(context.middleware("req"));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

var connection = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"root"   
});

connection.connect(function(error){
    if(!!error) 
        log.Error("error");
    else
        log.Info("connected");
});

app.get("/getRestaurantMenu",function(request,response){
    var restaurantId = request.query.restaurantId;
    var responseJson = {};
        
    connection.query("select * from mili_global_schema.mili_restaurants where restaurant_id = 101",function(error,rows,fields){
        if(!!error) {
            log.Error("check query");
            responseJson["error"] = error;
        } else {
            log.Info(rows[0]);
            responseJson["success"] = rows[0];
            //$.e            
        }
        response.json(responseJson);
    });
});

app.get("/sendRestaurant",function(request,response){
    var isLogin = request.query.isLogin;
    var restaurantId = request.query.restaurantId;
    
    if(!!isLogin) {
        var responseJson = [
            {'itemType':'break snacks','img':'img/recype/recype-1.jpg','itemName':'name','price':'$32','descriptions':'desc','rating':'4'},
            {'itemType':'snacks','img':'img/recype/recype-2.jpg','itemName':'name','price':'$32','descriptions':'desc','rating':'4'}
        ];
        response.render("restaurantsFront",{
            jsondata: responseJson
        });
    } else {
        response.json({"message":"Please check the credentials"});
    }
});

app.get('/', function(request, response){
    response.render('home');
});

app.post('/validateToken',function(request,response){
    var idToken = request.body.idToken;
    var restaurantName = request.body.restaurantName;
    var tableCount = request.body.tableCount;
    var lastname = request.body.lastname;
    var firstname = request.body.firstname;
    var res = "success";    
    log.Debug(idToken);
    log.Info("routed to login");
    realtime.auth().verifyIdToken(idToken).then(function(decodedToken) {
        var uid = decodedToken.uid;
        var uEmail = decodedToken.email;
        log.Debug(uid,decodedToken);
        setTimeout(function(){
            log.Debug("After 30 min call ",uEmail);
            realtime.auth().getUser(uid).then(function(userRecord){
                var email = userRecord.email;
                log.Debug(userRecord.emailVerified);
                if(userRecord.emailVerified == false) {
                    realtime.auth().deleteUser(uid).then(function() {
                        log.Info("Successfully deleted user", email);
                    }).catch(function(error) {
                        log.Error("Error deleting user:", error);
                    });
                } else {
                    log.Info("User is verified ", email);
                }
            }).catch(function(error){
                log.Error(error);
            });
        },1800000,{uid,uEmail});  
    }).catch(function(error) {
        log.Error(error.code,error.message);
        res = "failure";    
    });    
    response.send(res);
});

app.get('/login', function(request, response){   
    //context.set("req:user",idToken);
    log.Info("routed to login");
    response.render('login');
});

app.get('/aboutus', function(request, response){   
    //context.set("req:user",idToken);
    log.Info("routed to about");
    response.render('aboutus');
});

app.post('/login',function(request,response){
    var idToken = request.body.idToken;
    var res = "success";    
    log.Debug(idToken);
    realtime.auth().verifyIdToken(idToken).then(function(decodedToken) {
        var uid = decodedToken.uid;
        log.Debug(uid+" : "+decodedToken);
        log.Info("routed to admin");
    }).catch(function(error) {
        log.Error(error.code+ " : " +error.message ,"login","verifyIdToken");
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

app.post("/setBookedTable",function(request,response){
    var tableID = request.body.table;
    var user = request.body.user;
    var restaurantId = request.body.restaurantId;
    realtime.database().ref('/'+restaurantId).set({
        'tables': {tableID:{'status':'Booked','user':user}}
    });
});

app.listen(80,function(error){
    if(!!error)
        log.Error("error while starting server","app","listen");
    else
        log.Info("Server started and Listening to the port 80");
});

module.exports = app;