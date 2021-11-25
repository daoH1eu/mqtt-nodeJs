SELECT * FROM mydatabase.settings;
drop table settings;
create unique index UX_setting_id on settings (ID);
insert into settings(ID) values(1);
insert into settings(Temper, Humi) values(1,56) on duplicate key update Temper=values(Temper),Humi=values(Humi);
delete from settings where Co2 = 0;