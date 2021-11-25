SELECT * FROM mydatabase.device_timer;
drop table device_timer;
create unique index UX_devicetimer_RoomDevice on device_timer (Room, Device);