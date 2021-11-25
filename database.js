const mySql = require('mysql');

var con = mySql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '1234',
    database: 'myDatabase',
    dateStrings: true
});

module.exports.con = con;

con.connect(function (err) {
    if (err) throw err;
    console.log("Database connected");

    var sqlQuery = "CREATE TABLE IF NOT EXISTS accounts (id int(10) not null primary key auto_increment, username varchar(50) not null, passwords varchar(50) not null)";
    con.query(sqlQuery, function (err) {
        if (err) throw err;
        console.log("Account table is created");
    });

    sqlQuery = "CREATE TABLE IF NOT EXISTS sensors (ID int(10) not null primary key auto_increment, Time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, Temper int(3) not null, Humi int(3) not null, Lux int(3) not null, Co2 int(3) not null, Gas int(3) not null, Vibrant int(3) not null, Dust int(3) not null);";
    con.query(sqlQuery, function (err) {
        if (err) throw err;
        console.log("Sensors table is created");
    })

    sqlQuery = "CREATE TABLE IF NOT EXISTS settings (ID int(10) not null primary key auto_increment, Time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, Temper int(3) not null default '0', Humi int(3) not null default '0', Co2 int(3) not null default '0', Gas int(3) not null default '0',  Dust int(3) not null default '0');";
    con.query(sqlQuery, function (err) {
        if (err) throw err;
        console.log("Settings table is created");
    })

    sqlQuery = "CREATE TABLE IF NOT EXISTS bulletin_board (ID int(10) not null primary key auto_increment, Time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, Temper int(3) not null default '0', Humi int(3) not null default '0', Co2 int(3) not null default '0', Gas int(3) not null default '0',  Dust int(3) not null default '0', Mode varchar(255));";
    con.query(sqlQuery, function (err) {
        if (err) throw err;
        console.log("bulletin_board table is created");
    })

    sqlQuery = " create table if not exists device_timer (Time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP ,  Room varchar(255) not null, Device int(5) not null,  DateStart date not null, SetTimeOn time not null, SetTimeOff time not null);";
    //Note: must set unique key between Room and Device column
    con.query(sqlQuery, function (err) {
        if (err) throw err;
        console.log("device_timer table is created");
        // con.query("create unique index UX_devicetimer_RoomDevice on device_timer (Room, Device);", function (err) {
        //     if (err) throw err;
        //     console.log("Create unique key for column Room & Device in device_timer table");
        // });
    });

    sqlQuery = "create table if not exists device_control (Time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP ,  Room varchar(255) not null, Device1 int(5) not null, Device2 int(5) not null, Device3 int(5) not null, Device4 int(5) not null);"
    //Note: must set unique key Room column
    con.query(sqlQuery, function(err){
        if(err) throw err;
        console.log("device_control table is created");
    });
});

