const express = require('express');
const session = require('express-session');
const path = require('path');
const { con } = require('./database');
const mqtt = require('mqtt');

const app = express();
const port = 6060;

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

app.use(express.json());//parse data from body request
app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));

app.engine('html', require('ejs').renderFile);//make the render engine accept html 
app.set('view engine', 'html');
app.set('views', path.join(__dirname, "/pages"));

const server = app.listen(port, function () {
    console.log('Server started at: http://localhost:' + port);
})
const io = require('socket.io')(server);

function checkAuth(req, res, next) {
    if (!req.session.loggedin) {
        res.redirect('/log-in');
    } else {
        res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
        next();
    }
}

app.get('/', checkAuth, function (req, res) {
    res.redirect('/pages/dashboard.html');
});

//Route parameter
app.get('/pages/:filename', checkAuth, function (req, res) {
    res.render(req.params.filename);
});

app.get('/log-in', function (req, res) {
    res.render("sign-in.html", { text: "" });
});

//handle form data
app.post('/log-in', function (req, res) {
    let username = req.body.username;
    let password = req.body.password;
    let sqlQuery = "select * from accounts where username= '" + username + "' and passwords='" + password + "'";
    con.query(sqlQuery, function (err, result, fields) {
        if (result.length > 0) {
            req.session.loggedin = true;
            res.redirect('/');
        } else {
            res.render("sign-in.html", { text: "Incorrect Username and/or Password!" });
        }
        res.end();
    });
});

app.get('/log-out', function (req, res) {
    req.session.destroy(function (err) {
        if (err) throw err;
        res.redirect('/');
    });
});

//------------------------------------MQTT Listener-----------------------------
const host = "mqtt://broker.emqx.io:1883";
const clientID = "mqtt-nodeJs-sv/" + Math.random().toString().slice(4, 10);
const client = mqtt.connect(host, { clientID });
const topic = ["home/sensor", "sensor/state"];

client.on("connect", function () {
    console.log("MQTT connect: " + client.connected);
    client.subscribe(topic, function () {
        console.log("Subcribe to topic: " + topic);
    });
});

var sensor_state = "";
client.on("message", function (topic, message) {
    console.log("topic is " + topic);
    switch (topic) {
        case "home/sensor":
            let msg = JSON.parse(message);
            let sqlQuery = "insert into sensors (Temper,Humi,Lux,Co2,Gas,Vibrant,Dust) values ('" + msg.Temper + "','" + msg.Humi + "','" + msg.Lux + "','" + msg.Co2 + "','" + msg.Gas + "','" + msg.Vibrant + "','" + msg.Dust + "');"
            con.query(sqlQuery, function (err) {
                if (err) throw err;
                console.log("insert data sensor to table");
            });
            //display sensor value (overview page)
            sqlQuery = "select * from sensors order by ID desc limit 1;"
            con.query(sqlQuery, function (err, result) {//the result object is an array containing each row as an object.
                if (err) throw err;
                io.emit("sensor-data", result[0]);//hien thi gia tri cam bien
                io.emit("show_toastr", result[0]);//hien thi thong bao nhung gia tri vuot nguong
            });
            //(display to chart)
            sqlQuery = "select * from sensors order by ID desc limit 6;"
            con.query(sqlQuery, function (err, result) {//the result object is an array containing each row as an object.
                if (err) throw err;
                io.emit("sensor-data-chart", result);
            })
            //sensor-value (display to history table)
            sqlQuery = "select * from sensors order by ID desc limit 400;"
            con.query(sqlQuery, function (err, result) {//the result object is an array containing each row as an object.
                if (err) throw err;
                io.emit("sensor-data-table", result);
            })
            //moi lan server nhan dc gia tri cam bien, neu gia tri vuot nguong cai dat, thi luu lai vao datable (bulletin_table)
            update_bulletin_table(msg);
            console.log(message.toString());
            break;
        case "sensor/state":
            sensor_state = message.toString();
            io.emit("sensor-table", sensor_state);
            break;
        default:
            break;
    }
});

io.on("connection", function (socket) {
    console.log("a user connected");
    //sensor-table
    socket.emit("sensor-table", sensor_state);

    //sensor-value
    var sqlQuery = "select * from sensors order by ID desc limit 1;"
    con.query(sqlQuery, function (err, result) {//the result object is an array containing each row as an object.
        if (err) throw err;
        socket.emit("sensor-data", result[0]);
    })

    //sensor-value (display to chart)
    sqlQuery = "select * from sensors order by ID desc limit 6;"
    con.query(sqlQuery, function (err, result) {//the result object is an array containing each row as an object.
        if (err) throw err;
        socket.emit("sensor-data-chart", result);
    })

    //sensor-value (display to history table)
    sqlQuery = "select * from sensors order by ID desc limit 400;"
    con.query(sqlQuery, function (err, result) {//the result object is an array containing each row as an object.
        if (err) throw err;
        socket.emit("sensor-data-table", result);
    })

    //hien thi icon tren House Overview
    sqlQuery = "select * from device_control where (Device1 = 1 or Device2 = 1 or Device3 = 1 or Device4 = 1);"
    con.query(sqlQuery, function(err, result){
        if(err) throw err;
        socket.emit("update_houseOV", result);
    });
    
    //hien thi lich su thong bao gui cho client
    var data = {
        "Temper": {
            "value": 0,
            "time": ""
        },
        "Humi": {
            "value": 0,
            "time": ""
        },
        "Co2": {
            "value": 0,
            "time": ""
        },
        "Gas": {
            "value": 0,
            "time": ""
        },
        "Dust": {
            "value": 0,
            "time": ""
        }
    };
    socket.on("notifi_onclick", function () {
        //callback chain function @@
        history_notifi_temper(function (value, time) {
            data.Temper.value = value;
            data.Temper.time = time;
            history_notifi_humi(function (value, time) {
                data.Humi.value = value;
                data.Humi.time = time;
                history_notifi_co2(function (value, time) {
                    data.Co2.value = value;
                    data.Co2.time = time;
                    history_notifi_gas(function (value, time) {
                        data.Gas.value = value;
                        data.Gas.time = time;
                        history_notifi_dust(function (value, time) {
                            data.Dust.value = value;
                            data.Dust.time = time;
                            socket.emit("update_notifi", data);
                        });
                    });
                });
            });
        });
    });

    //nhan gia tri nguong va luu vao database
    socket.on("change-setting", function (data) {
        var sqlQuery = "insert into settings(Temper, Humi ,Co2, Gas, Dust) values(" + data.Temper + "," + data.Humi + "," + data.Co2 + "," + data.Gas + "," + data.Dust + ") on duplicate key update Temper=values(Temper),Humi=values(Humi),Co2=values(Co2),Gas=values(Gas),Dust=values(Dust);"
        con.query(sqlQuery, function (err) {
            if (err) throw err;
            console.log("Save setting to database");
        });
    });

    //gui gia tri nguong tu database cho client (de hien thi-thong bao)
    socket.on("dropdownSettingMenu_onlick", function () {//update onclick
        con.query("select * from settings", function (err, result) {
            if (err) throw err;
            socket.emit("update_setting", result[0]);
        })
    });
    con.query("select * from settings", function (err, result) {//update onload
        if (err) throw err;
        socket.emit("update_setting", result[0]);
    });

    //on/off notification
    sqlQuery = "select * from bulletin_board where Mode != 'null' order by Time desc limit 1;"
    con.query(sqlQuery, function (err, result) {
        if (err) throw err;
        socket.emit("notifi_mode", result[0].Mode);//**Note: how to send notifi mode to all client ? 
    });
    socket.on("turnOn_notifi", function () {
        sqlQuery = "insert into bulletin_board (Mode) values('on');"
        con.query(sqlQuery, function (err) {
            if (err) throw err;
            socket.emit("notifi_mode", "on");
        });
    });
    socket.on("turnOff_notifi", function () {
        sqlQuery = "insert into bulletin_board (Mode) values('off');"
        con.query(sqlQuery, function (err) {
            if (err) throw err;
            socket.emit("notifi_mode", "off");
        });
    });
    /*---------------lưu thời gian hẹn giờ vào database-------------------------------*/
    socket.on("set_timer", function (data) {
        var sqlQuery = "insert into device_timer (Room, Device, DateStart, SetTimeOn, SetTimeOff) values ('" + data.room + "', '" + data.device + "', '" + data.date + "', '" + data.timeOn + "','" + data.timeOff + "') on duplicate key update DateStart = values(DateStart), SetTimeOn = values(SetTimeOn), SetTimeOff = values(SetTimeOff);"
        con.query(sqlQuery, function (err) {
            if (err) throw err;
            console.log("Insert " + data.room + " timer to device_timer table");
        });
        // console.log(data);
    });
    /*---------------hiển thị thời gian đã hẹn (client)--------------------------*/
    con.query("select * from device_timer", function (err, result) {
        if (err) throw err;
        socket.emit("timer-table", result);
    });
    // /*---------------xóa thời gian hẹn giờ ở database-------------------------------*/
    socket.on("delete_timer", function (data) {
        // console.log(data);
        con.query("delete from device_timer where Room = '" + data.Room + "' and Device = '" + data.Device + "';", function (err) {
            if (err) throw err;
            console.log("deleted a timer");
        })
    });
    // /*---------------điều khiển thiết bị, lưu vào database----------------*/
    socket.on("device_control", function (data) {
        con.query("insert into device_control (Room, Device1, Device2, Device3, Device4) values ('" + data.Room + "','" + data.Device[0] + "','" + data.Device[1] + "', '" + data.Device[2] + "','" + data.Device[3] + "') on duplicate key update Device1 = values(Device1), Device2 = values(Device2), Device3 = values(Device3), Device4 = values(Device4);", function (err) {
            if (err) throw err;
            console.log("Insert data to device_control table");
        });
    });
    // /*---------------trạng thái thiết bị đã đc lưu, cập nhật trạng thái nút nhấn----------------*/
    update_device_state(socket);

    /*------------------Camea URL--------------------------------- */
    socket.on("save_camera_url", function (data) {
        var sqlQuery = "insert into camera_url (Room, Url) values ('" + data.Room + "', '" + data.Url + "') on duplicate key update Room=values(Room), Url=values(Url);"
        con.query(sqlQuery, function (err) {
            if (err) throw err;
            console.log("Save camera URL");
        });
    });
    sqlQuery = "select * from camera_url;"
    con.query(sqlQuery, function (err, result) {
        if (err) throw err;
        socket.emit("camera_url", result);
    });
});

//function
function history_notifi_temper(callback) {
    con.query("select * from bulletin_board where Temper > '0' order by Time desc limit 1;", function (err, result) {
        if (err) throw err;
        callback(result[0].Temper, result[0].Time);
    });
};

function history_notifi_humi(callback) {
    con.query("select * from bulletin_board where Humi > '0' order by Time desc limit 1;", function (err, result) {
        if (err) throw err;
        callback(result[0].Humi, result[0].Time);
    });
};

function history_notifi_co2(callback) {
    con.query("select * from bulletin_board where Co2 > '0' order by Time desc limit 1;", function (err, result) {
        if (err) throw err;
        callback(result[0].Co2, result[0].Time);
    });
};

function history_notifi_gas(callback) {
    con.query("select * from bulletin_board where Gas > '0' order by Time desc limit 1;", function (err, result) {
        if (err) throw err;
        callback(result[0].Gas, result[0].Time);
    });
};

function history_notifi_dust(callback) {
    con.query("select * from bulletin_board where Dust > '0' order by Time desc limit 1;", function (err, result) {
        if (err) throw err;
        callback(result[0].Dust, result[0].Time);
    });
};

//moi lan server nhan dc gia tri cam bien, neu gia tri vuot nguong cai dat, thi luu lai vao datable (bulletin_table)
function update_bulletin_table(data) {
    //table setting co 1 dong duy nhat
    con.query("select * from settings", function (err, result) {//update onload
        if (err) throw err;
        //gia tri nguong cai dat truoc do
        var setting_list = { "Temper": result[0].Temper, "Humi": result[0].Humi, "Co2": result[0].Co2, "Gas": result[0].Gas, "Dust": result[0].Dust };
        //gia tri cam bien moi neu vuot nguong
        var overload_list = { "Temper": 0, "Humi": 0, "Co2": 0, "Gas": 0, "Dust": 0 };
        var flag = false;
        if (data.Temper >= setting_list.Temper) {
            overload_list.Temper = data.Temper;
            flag = true;
        }
        if (data.Humi >= setting_list.Humi) {
            overload_list.Humi = data.Humi;
            flag = true;
        }
        if (data.Co2 >= setting_list.Co2) {
            overload_list.Co2 = data.Co2;
            flag = true;
        }
        if (data.Gas >= setting_list.Gas) {
            overload_list.Gas = data.Gas;
            flag = true;
        }
        if (data.Dust >= setting_list.Dust) {
            overload_list.Dust = data.Dust;
            flag = true;
        }
        if (flag) {
            //luu gia tri vuot nguong vao database
            var sqlQuery = "insert into bulletin_board (Temper, Humi, Co2, Gas, Dust) values (" + overload_list.Temper + "," + overload_list.Humi + "," + overload_list.Co2 + "," + overload_list.Gas + "," + overload_list.Dust + ");"
            con.query(sqlQuery, function (err) {
                if (err) throw err;
                console.log("insert overload value to bulletin table");
            });
        }
    });
}


function update_device_state(socketId) {
    /*---------------lấy các trạng thái thiết bị đã đc lưu, đẩy cho client xử lý----------------*/
    con.query("select * from device_control", function (err, result) {
        if (err) throw err;
        socketId.emit("button_state", result);
    });
}

// /* -------------------------------------------------------------------- */
/*------------------------- bật tắt, hẹn giờ các thiết bị ------------------------ */
function update_device_column(column_value, room, flag) {
    switch (column_value) {
        case 1:
            if (flag === 'on')
                con.query("update device_control set Device1 = 1 where Room = '" + room + "';", function (err) {
                    if (err) throw err;
                });
            else
                con.query("update device_control set Device1 = 0 where Room = '" + room + "';", function (err) {
                    if (err) throw err;
                });
            break;
        case 2:
            if (flag === 'on')
                con.query("update device_control set Device2 = 1 where Room = '" + room + "';", function (err) {
                    if (err) throw err;
                });
            else
                con.query("update device_control set Device2 = 0 where Room = '" + room + "';", function (err) {
                    if (err) throw err;
                });
            break;
        case 3:
            if (flag === 'on')
                con.query("update device_control set Device3 = 1 where Room = '" + room + "';", function (err) {
                    if (err) throw err;
                });
            else
                con.query("update device_control set Device3 = 0 where Room = '" + room + "';", function (err) {
                    if (err) throw err;
                });
            break;
        case 4:
            if (flag === 'on')
                con.query("update device_control set Device4 = 1 where Room = '" + room + "';", function (err) {
                    if (err) throw err;
                });
            else
                con.query("update device_control set Device4 = 0 where Room = '" + room + "';", function (err) {
                    if (err) throw err;
                });
            break;
    }
}
//giá trị timer đc set tại device_timer table, khi kích hoạt thì cập nhật giá tri sang device_control table
function update_device_control_table(tableRow, flag, callback) {
    switch (tableRow.Room) {
        case "livingroom":
            update_device_column(tableRow.Device, "livingroom", flag);
            break;
        case "kitchen":
            update_device_column(tableRow.Device, "kitchen", flag);
            break;
        case "bedroom1":
            update_device_column(tableRow.Device, "bedroom1", flag);
            break;
        case "bedroom2":
            update_device_column(tableRow.Device, "bedroom2", flag);
            break;
        default:
            break;
    }
    //ham call back update trang thai nut nhan
    callback(io);
}

function trigger_timer() {
    var date = new Date();
    var currentDate = date.getFullYear() + '-' + (date.getMonth() + 1).toString().padStart(2, '0') + '-' + date.getDate().toString().padStart(2, '0');
    var currentTime = date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0') + ':00';
    var timer_board_flag = false;
    con.query("select * from device_timer;", function (err, result) {
        if (err) throw err;

        for (let i in result) {
            timer_board_flag = false;

            if (result[i].DateStart == currentDate) {
                if (result[i].SetTimeOff == '00:00:00') {
                    if (result[i].SetTimeOn <= currentTime) {
                        update_device_control_table(result[i], "on", update_device_state);
                        // console.log("Trigger devive: ON");
                        con.query("delete from device_timer where Room = '" + result[i].Room + "' and Device = '" + result[i].Device + "';", function (err) {
                            if (err) throw err;
                            console.log("Trigger timer & deleted this device-row");
                        });
                        //set flag to update timer board
                        timer_board_flag = true;
                    }
                }
                else {
                    if (result[i].SetTimeOn <= currentTime && result[i].SetTimeOff > currentTime) {
                        // console.log("Trigger devive: ON");
                        update_device_control_table(result[i], "on", update_device_state);
                    }
                    if (result[i].SetTimeOff <= currentTime) {
                        // console.log("Trigger devive: OFF");
                        update_device_control_table(result[i], "off", update_device_state);
                        con.query("delete from device_timer where Room = '" + result[i].Room + "' and Device = '" + result[i].Device + "';", function (err) {
                            if (err) throw err;
                            console.log("Trigger timer & deleted this device-row");
                        });
                        timer_board_flag = true;
                    }
                }
            }
            //cap nhat lai timer table
            if (timer_board_flag) {
                con.query("select * from device_timer", function (err, result) {
                    if (err) throw err;
                    io.emit("timer-table", result);
                });
            }
        }
    });
}
setInterval(trigger_timer, 5000);

function trigger_device() {
    var device_list = { "kitchen": [0, 0, 0, 0], "living": [0, 0, 0, 0], "bed1": [0, 0, 0, 0], "bed2": [0, 0, 0, 0] };
    con.query("select * from device_control", function (err, result) {
        if (err) throw err;
        // io.emit
        for (let i in result) {
            switch (result[i].Room) {
                case 'livingroom':
                    device_list.living[0] = result[i].Device1;
                    device_list.living[1] = result[i].Device2;
                    device_list.living[2] = result[i].Device3;
                    device_list.living[3] = result[i].Device4;
                    break;
                case 'kitchen':
                    device_list.kitchen[0] = result[i].Device1;
                    device_list.kitchen[1] = result[i].Device2;
                    device_list.kitchen[2] = result[i].Device3;
                    device_list.kitchen[3] = result[i].Device4;
                    break;
                case 'bedroom1':
                    device_list.bed1[0] = result[i].Device1;
                    device_list.bed1[1] = result[i].Device2;
                    device_list.bed1[2] = result[i].Device3;
                    device_list.bed1[3] = result[i].Device4;
                    break;
                case 'bedroom2':
                    device_list.bed2[0] = result[i].Device1;
                    device_list.bed2[1] = result[i].Device2;
                    device_list.bed2[2] = result[i].Device3;
                    device_list.bed2[3] = result[i].Device4;
                    break;
                default: break;
            }
        }
        client.publish("home/device", JSON.stringify(device_list));
        // console.log(JSON.stringify(device_list));
    });
}
setInterval(trigger_device, 2000);