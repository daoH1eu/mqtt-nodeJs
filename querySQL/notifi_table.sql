SELECT * FROM mydatabase.bulletin_board;

select * from bulletin_board where Mode != 'null' order by Time desc limit 1;
insert into bulletin_board (Mode) values('on');