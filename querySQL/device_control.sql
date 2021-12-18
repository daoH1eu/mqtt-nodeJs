SELECT * FROM mydatabase.device_control;

update device_control set Device1 = 0 where Room = 'kitchen';
insert into device_control (Room, Device1, Device2,Device3,Device4) values ("kitchen", 1, 1, 1, 1) on duplicate key update
Room = values(Room), Device1=values(Device1), Device2=values(Device2), Device3=values(Device3);
select * from device_control where (Device1 = 1 or Device2 = 1 or Device3 = 1 or Device4 = 1);