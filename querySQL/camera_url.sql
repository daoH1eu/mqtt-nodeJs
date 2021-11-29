select*from mydatabase.camera_url;
create table if not exists camera_url (Time datetime not null default current_timestamp, Room varchar(255) not null, Url varchar(255) not null); 
create unique index UX_camrea_room on camera_url (Room);
insert into camera_url (Room, Url) values ("livingroom", 1562348) on duplicate key update Room=values(Room), Url=values(Url);