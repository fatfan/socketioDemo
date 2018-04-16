var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server); //引入socket.io模块并绑定到服务器
var fs = require('fs'); // 引入fs模块
var http = require('http')

app.use('/', express.static(__dirname + '/www'));
server.listen(3002);
console.log('server started');

var users=[];
//socket部分
var io = require('socket.io')(server);
var ioredis = require("ioredis");
var redis = require('socket.io-redis');
io.adapter(redis({
  pubClient: new ioredis.Cluster([{
            port: 6390,
            host: '192.168.18.205'     
        }, {
            port: 6390,
            host: '192.168.18.206'
        }, {
            port: 6390,
            host: '192.168.18.207'    
        }
    ]),
  subClient: new ioredis.Cluster([{
            port: 6390,
            host: '192.168.18.205'     
        }, {
            port: 6390,
            host: '192.168.18.206'
        }, {
            port: 6390,
            host: '192.168.18.207'    
        }
    ]),
  subEvent: "messageBuffer"
}));
io.on('connection', function(socket) {
    //接收并处理客户端发送的foo事件
    socket.on('login', function(username) {
        //将消息输出到控制台
        console.log(username);
        var hasLogin = false;
        for (var i = 0; i < users.length; i++) {
        	if(username==users[i].username){
        		hasLogin = true;
        		break;
        	}
        }
        if(!hasLogin){
        	var user = {
	        	username:username,
	        	socket:socket
	        };
        	users.push(user);
        	var userList=[];
	        for (var i = 0; i < users.length; i++) {
	        	userList[i]=users[i].username;
	        }
	        io.sockets.emit('loginSuccess', userList);
        }        
    });
    socket.on('postMsg', function(msg) {
        //将消息输出到控制台
        var color = "f00";
        // socket.emit('loginSuccess');
        // socket.broadcast.emit('newMsg', msg, color);
        // socket.broadcast.emit('newMsg', "ff", msg, color);
        io.sockets.emit('newMsg', "", msg, 'login');
        // socket.emit('loginSuccess');
    });
    socket.on('privateMsg', function(fromUser,toUser,msg) {
        //将消息输出到控制台
        for (var i = 0; i < users.length; i++) {
        	console.log("privateMsg:"+msg);
        	if(toUser == users[i].username){
        		console.log("fromUser:"+fromUser);

        		users[i].socket.emit("newMsg", fromUser, msg, "privateMsg");
        		socket.emit("msgOK", toUser, "msg send ok");
        		var time = Date.now();
        		saveMsg(time, fromUser, toUser, msg);
        		break;
    		}
        }
    });
});

function saveMsg(time, fromUser, toUser, msg){
	var options = { 
		hostname: '192.168.18.63', 
		port: 8001, 
		path: '/webpc/test/msg.cgi', 
		method: 'POST' 
	};

	var req = http.request(options, function(res) { 
		// console.log('STATUS: ' + res.statusCode); 
		// console.log('HEADERS: ' + JSON.stringify(res.headers)); 
		res.setEncoding('utf8'); 
		res.on('data', function (chunk) { 
			console.log('BODY: ' + chunk); 
		}); 
	}); 

	req.on('error', function(e) { 
		console.log('problem with request: ' + e.message); 
	}); 

	// write data to request body 
	// req.write('data\n'); 
	var data="time="+time+"&fromUser="+fromUser+"&toUser="+toUser+"&msg="+msg;
	req.write(data); 
	req.end();
}

