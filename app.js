const express = require('express');
const session = require('express-session');
const path = require('path');
const { con } = require('./database');

const app = express();
const port = 6060;  

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

app.use(express.json());//parse data from body request
app.use(express.urlencoded({extended: true }));

app.use(express.static("public"));

app.engine('html', require('ejs').renderFile);//make the render engine accept html 
app.set('view engine', 'html');
app.set('views', path.join(__dirname, "/pages"));

app.listen(port, function(){
    console.log('Server started at: http://localhost:' + port);
})

function checkAuth(req, res, next) {
    if (!req.session.loggedin) {
        res.redirect('/log-in');
    } else {
        res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
        next();
    }
}

app.get('/', checkAuth, function(req,res){
    res.redirect('/pages/dashboard.html');
});

//Route parameter
app.get('/pages/:filename', checkAuth, function(req,res){
    res.render(req.params.filename);
});

app.get('/log-in', function(req, res){
    res.render("sign-in.html", {text : ""});
});

//handle form data
app.post('/log-in', function(req,res){
    let username = req.body.username;
    let password = req.body.password;
    let sqlQuery = "select * from accounts where username= '" + username + "' and passwords='" +password +"'";
    con.query(sqlQuery, function(err, result, fields){
        if(result.length > 0){
            req.session.loggedin = true;
            res.redirect('/');
        }else{
            res.render("sign-in.html", {text : "Incorrect Username and/or Password!"});
        }
        res.end();
    });
});

app.get('/log-out', function(req,res){
    req.session.destroy( function(err){
        if(err) throw err;
        res.redirect('/');
    });
});


// var data = {
//     "Temper": {
//         "value": 0,
//         "time": ""
//     },
//     "Humi": {
//         "value": 0,
//         "time": ""
//     },
//     "Co2": {
//         "value": 0,
//         "time": ""
//     },
//     "Gas": {
//         "value": 0,
//         "time": ""
//     },
//     "Dust": {
//         "value": 0,
//         "time": ""
//     }
// };
// socket.on("notifi_onclick", function () {
//     //callback chain function ^^
//     history_notifi_temper(function (value, time) {
//         data.Temper.value = value;
//         data.Temper.time = time;
//         history_notifi_humi(function (value, time) {
//             data.Humi.value = value;
//             data.Humi.time = time;
//             history_notifi_co2(function (value, time) {
//                 data.Co2.value = value;
//                 data.Co2.time = time;
//                 history_notifi_gas(function (value, time) {
//                     data.Gas.value = value;
//                     data.Gas.time = time;
//                     history_notifi_dust(function (value, time) {
//                         data.Dust.value = value;
//                         data.Dust.time = time;
//                         socket.emit("update_notifi", data);
//                     });
//                 });
//             });
//         });
//     });
// });

// /*---------------lưu thời gian hẹn giờ vào database-------------------------------*/
// socket.on("set_timer", function (data) {
//     var sqlQuery = "insert into device_timer (Room, Device, DateStart, SetTimeOn, SetTimeOff) values ('" + data.room + "', '" + data.device + "', '" + data.date + "', '" + data.timeOn + "','" + data.timeOff + "') on duplicate key update DateStart = values(DateStart), SetTimeOn = values(SetTimeOn), SetTimeOff = values(SetTimeOff);"
//     con.query(sqlQuery, function (err) {
//         if (err) throw err;
//         console.log("Insert " + data.room + " timer to device_timer table");
//     });
// });
// /*---------------xóa thời gian hẹn giờ ở database-------------------------------*/
// socket.on("delete_in_timer_table", function(data){
//     console.log(data);
//     con.query("delete from device_timer where Room = '" + data.Room + "' and Device = '" + data.Device + "';", function(err){
//         if(err) throw err;
//         console.log("Cancel device timer");
//     })
// });

// /*---------------update timer board, hiển thị thời gian đã hẹ--------------------------*/
// con.query("select * from device_timer", function (err, result) {
//     if (err) throw err;
//     socket.emit("update_timer_board", result);
// });


// /*---------------điều khiển thiết bị, lưu vào database----------------*/
// socket.on("livingroom_control", function (data) {
//     con.query("insert into device_control (Room, Device1, Device2, Device3, Device4) values ('livingroom','" + data[0] + "','" + data[1] + "', '" + data[2] + "','" + data[3] + "') on duplicate key update Device1 = values(Device1), Device2 = values(Device2), Device3 = values(Device3), Device4 = values(Device4);", function (err) {
//         if (err) throw err;
//         console.log("Insert data to device_control table");
//     });
// });
// socket.on("kitchen_control", function (data) {
//     con.query("insert into device_control (Room, Device1, Device2, Device3, Device4) values ('kitchen','" + data[0] + "','" + data[1] + "', '" + data[2] + "','" + data[3] + "') on duplicate key update Device1 = values(Device1), Device2 = values(Device2), Device3 = values(Device3), Device4 = values(Device4);", function (err) {
//         if (err) throw err;
//         console.log("Insert data to device_control table");
//     });
// });
// socket.on("bedroom1_control", function (data) {//parent room
//     con.query("insert into device_control (Room, Device1, Device2, Device3, Device4) values ('bedroom1','" + data[0] + "','" + data[1] + "', '" + data[2] + "','" + data[3] + "') on duplicate key update Device1 = values(Device1), Device2 = values(Device2), Device3 = values(Device3), Device4 = values(Device4);", function (err) {
//         if (err) throw err;
//         console.log("Insert data to device_control table");
//     });
// });
// socket.on("bedroom2_control", function (data) {//child room
//     con.query("insert into device_control (Room, Device1, Device2, Device3, Device4) values ('bedroom2','" + data[0] + "','" + data[1] + "', '" + data[2] + "','" + data[3] + "') on duplicate key update Device1 = values(Device1), Device2 = values(Device2), Device3 = values(Device3), Device4 = values(Device4);", function (err) {
//         if (err) throw err;
//         console.log("Insert data to device_control table");
//     });
// });

// /*---------------lấy các trạng thái thiết bị đã đc lưu, đẩy cho client xử lý----------------*/
// update_device_state(socket);
// });

// function update_device_state(socketId) {
// /*---------------lấy các trạng thái thiết bị đã đc lưu, đẩy cho client xử lý----------------*/
// con.query("select * from device_control", function (err, result) {
//     if (err) throw err;
//     socketId.emit("all_device_state", result);
// });
// }

// /* -------------------------------------------------------------------- */
// function history_notifi_temper(callback) {
// con.query("select * from bulletin_board where Temper > '0' order by Time desc limit 1;", function (err, result) {
//     if (err) throw err;
//     callback(result[0].Temper, result[0].Time);
// });
// };

// function history_notifi_humi(callback) {
// con.query("select * from bulletin_board where Humi > '0' order by Time desc limit 1;", function (err, result) {
//     if (err) throw err;
//     callback(result[0].Humi, result[0].Time);
// });
// };

// function history_notifi_co2(callback) {
// con.query("select * from bulletin_board where Co2 > '0' order by Time desc limit 1;", function (err, result) {
//     if (err) throw err;
//     callback(result[0].Co2, result[0].Time);
// });
// };

// function history_notifi_gas(callback) {
// con.query("select * from bulletin_board where Gas > '0' order by Time desc limit 1;", function (err, result) {
//     if (err) throw err;
//     callback(result[0].Gas, result[0].Time);
// });
// };

// function history_notifi_dust(callback) {
// con.query("select * from bulletin_board where Dust > '0' order by Time desc limit 1;", function (err, result) {
//     if (err) throw err;
//     callback(result[0].Dust, result[0].Time);
// });
// };
// /*------------------------- bật tắt, hẹn giờ các thiết bị ------------------------ */
// function update_device_column(column_value, flag) {
// switch (column_value) {
//     case 1:
//         if (flag === 'on')
//             con.query("update device_control set Device1 = 1 where Room = 'livingroom';", function (err) {
//                 if (err) throw err;
//             });
//         else
//             con.query("update device_control set Device1 = 0 where Room = 'livingroom';", function (err) {
//                 if (err) throw err;
//             });
//         break;
//     case 2:
//         if (flag === 'on')
//             con.query("update device_control set Device2 = 1 where Room = 'livingroom';", function (err) {
//                 if (err) throw err;
//             });
//         else
//             con.query("update device_control set Device2 = 0 where Room = 'livingroom';", function (err) {
//                 if (err) throw err;
//             });
//         break;
//     case 3:
//         if (flag === 'on')
//             con.query("update device_control set Device3 = 1 where Room = 'livingroom';", function (err) {
//                 if (err) throw err;
//             });
//         else
//             con.query("update device_control set Device3 = 0 where Room = 'livingroom';", function (err) {
//                 if (err) throw err;
//             });
//         break;
//     case 4:
//         if (flag === 'on')
//             con.query("update device_control set Device4 = 1 where Room = 'livingroom';", function (err) {
//                 if (err) throw err;
//             });
//         else
//             con.query("update device_control set Device4 = 0 where Room = 'livingroom';", function (err) {
//                 if (err) throw err;
//             });
//         break;
// }
// }
// //giá trị timer đc set tại device_timer table, khi kích hoạt thì cập nhật giá tri sang device_control table
// function update_device_control_table(tableRow, flag, callback) {
// switch (tableRow.Room) {
//     case "livingroom":
//         update_device_column(tableRow.Device, flag);
//         break;
//     case "kitchen":
//         update_device_column(tableRow.Device, flag);
//         break;
//     case "bedroom1":
//         update_device_column(tableRow.Device, flag);
//         break;
//     case "bedroom2":
//         update_device_column(tableRow.Device, flag);
//         break;
//     default:
//         break;
// }
// //ham call back update phia client
// callback(io);
// }

// function trigger_timer() {
// var date = new Date();
// var currentDate = date.getFullYear() + '-' + (date.getMonth() + 1).toString().padStart(2, '0') + '-' + date.getDate().toString().padStart(2, '0');
// var currentTime = date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0') + ':00';
// var timer_board_flag = false;
// con.query("select * from device_timer;", function (err, result) {
//     if (err) throw err;

//     for (let i in result) {
//         timer_board_flag = false;
//         if (result[i].DateStart == currentDate) {
//             if (result[i].SetTimeOff == '00:00:00') {
//                 if (result[i].SetTimeOn <= currentTime) {
//                     update_device_control_table(result[i], "on", update_device_state);
//                     // console.log("Trigger devive: ON");
//                     con.query("delete from device_timer where Room = " + "'" + result[i].Room + "' and Device = '" + result[i].Device + "';", function (err) {
//                         if (err) throw err;
//                         console.log("Trigger timer & deleted this device-row");
//                     });
//                     //set flag to update timer board
//                     timer_board_flag = true;
//                 }
//             }
//             else {
//                 if (result[i].SetTimeOn <= currentTime && result[i].SetTimeOff > currentTime) {
//                     // console.log("Trigger devive: ON");
//                     update_device_control_table(result[i], "on", update_device_state);
//                 }
//                 if (result[i].SetTimeOff <= currentTime) {
//                     // console.log("Trigger devive: OFF");
//                     update_device_control_table(result[i], "off", update_device_state);
//                     con.query("delete from device_timer where Room = " + "'" + result[i].Room + "' and Device = '" + result[i].Device + "';", function (err) {
//                         if (err) throw err;
//                         console.log("Trigger timer & deleted this device-row");
//                     });
//                     timer_board_flag = true;
//                 }
//             }
//         }
//         if (timer_board_flag) {
//             con.query("select * from device_timer", function (err, result) {
//                 if (err) throw err;
//                 io.emit("update_timer_board", result);
//             });
//         }
//     }
// });
// }
// setInterval(trigger_timer, 5000);

// function trigger_device() {
// var device_list = { "kitchen": [0, 0, 0, 0], "living": [0, 0, 0, 0], "bed1": [0, 0, 0, 0], "bed2": [0, 0, 0, 0] };
// con.query("select * from device_control", function (err, result) {
//     if (err) throw err;
//     for (let i in result) {
//         switch (result[i].Room) {
//             case 'livingroom':
//                 device_list.living[0] = result[i].Device1;
//                 device_list.living[1] = result[i].Device2;
//                 device_list.living[2] = result[i].Device3;
//                 device_list.living[3] = result[i].Device4;
//                 break;
//             case 'kitchen':
//                 device_list.kitchen[0] = result[i].Device1;
//                 device_list.kitchen[1] = result[i].Device2;
//                 device_list.kitchen[2] = result[i].Device3;
//                 device_list.kitchen[3] = result[i].Device4;
//                 break;
//             case 'bedroom1':
//                 device_list.bed1[0] = result[i].Device1;
//                 device_list.bed1[1] = result[i].Device2;
//                 device_list.bed1[2] = result[i].Device3;
//                 device_list.bed1[3] = result[i].Device4;
//                 break;
//             case 'bedroom2':
//                 device_list.bed2[0] = result[i].Device1;
//                 device_list.bed2[1] = result[i].Device2;
//                 device_list.bed2[2] = result[i].Device3;
//                 device_list.bed2[3] = result[i].Device4;
//                 break;
//             default: break;
//         }
//     }
//     client.publish("home/device", JSON.stringify(device_list));
//     console.log(JSON.stringify(device_list));
// });
// }
// setInterval(trigger_device, 3000);