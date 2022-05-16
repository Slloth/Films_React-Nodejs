const https = require("https");
const http = require("http");
const zlib = require("zlib");
const fs = require("fs");
const url = require("url");
const argjson = require("argjson");
const {Server} = require("socket.io");
const mariadb = require('mariadb');
const FILMS = [];

const pool = mariadb.createPool({
  host: "127.0.0.1", 
  user: "root", 
  password: "",
  database: "Alocine"
});

pool.getConnection().then((connection) =>{
  connection.query("SELECT * FROM films").then((rows) =>{
    FILMS.push(rows);
  });
}).catch((err) =>{
  console.log(err);
});

const CONTENTTYPE = {
  'bmp': 'image/bmp',
  'css': 'text/css',
  'gif': 'image/gif',
  'html': 'text/html',
  'ico': 'image/x-icon',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'js': 'application/javascript',
  'json': 'application/json',
  'png': 'image/png',
  'pdf': 'application/pdf',
  'svg': 'image/svg+xml',
  'txt': 'text/plain'
}

var sname = process.pid;
var options={};

function handler(req, res) {
  var baseURL = 'http://' + req.headers.host + '/';
  var requrl = new URL(req.url, baseURL);
  if (requrl.pathname=="/socket.io/") {
    requrl.pathname="/";
    requrl.search="";
  }
  var output=(req.headers['x-forwarded-for'] || req.socket.remoteAddress)+"|"+req.headers['user-agent']+"|http"+req.httpVersion+"|"+req.method+"|"+requrl.href+"|";
  if (requrl.pathname.charAt(requrl.pathname.length - 1) === "/")
  requrl.pathname += "index.html";
  var localfile = url.fileURLToPath(url.pathToFileURL(argv.folder) + requrl.pathname);
  //console.log(localfile);
  var ext = localfile.substr(localfile.lastIndexOf(".") + 1);
  if (req.method==="PUT" || req.method==="PATCH" || req.method==="DELETE") {
    if (argv.verbose) console.log(output+"401|"+localfile);
    res.writeHead(401, { 'content-Type': 'text/html', 'charset': 'utf-8' });
    res.write("<head><style>div{ text-align: center; font-size: 10em; text-shadow: 0 0 1em blue, 0 0 0.2em blue;color:#C00000;} section{ text-align: right; font-size: small;} </style></head><body><div>401<br>Unauthorized</div><section>900 Webserver </section></body>");
    res.end();
  }
  else if (req.method==="TRACE") {
    if (argv.verbose) console.log(output+"405|"+localfile);
    res.writeHead(405, { 'content-Type': 'text/html', 'charset': 'utf-8' });
    res.write("<head><style>div{ text-align: center; font-size: 10em; text-shadow: 0 0 1em blue, 0 0 0.2em blue;color:#C00000;} section{ text-align: right; font-size: small;} </style></head><body><div>405<br>Method Not Allowed</div><section>900 Webserver </section></body>");
    res.end();
  }
  else if (requrl.pathname.charAt(requrl.pathname.lastIndexOf("/")+1) === '.') {
    if (argv.verbose) console.log(output+"403|"+localfile);
    res.writeHead(403, { 'content-Type': 'text/html', 'charset': 'utf-8' });
    res.write("<head><style>div{ text-align: center; font-size: 10em; text-shadow: 0 0 1em blue, 0 0 0.2em blue;color:#C00000;} section{ text-align: right; font-size: small;} </style></head><body><div>403<br>Forbidden</div><section>900 Webserver </section></body>");
    res.end();
  }
  else if (req.method==="GET" || req.method==="POST" || req.method==="HEAD") {
    var raw = fs.createReadStream(localfile);
    var acceptEncoding = req.headers['accept-encoding'];
    if (!acceptEncoding) acceptEncoding = '';
    
    raw.on('open', () => {
      if (argv.verbose) console.log(output+"200|"+localfile);
      if (!(ext in CONTENTTYPE)) ext = 'txt';
      if (acceptEncoding.match(/\bdeflate\b/)) {
        res.writeHead(200, { 'content-encoding': 'deflate', 'content-Type': CONTENTTYPE[ext], 'charset': 'utf-8' });
        if (req.method==="HEAD") res.end();
        else raw.pipe(zlib.createDeflate()).pipe(res);
      } else if (acceptEncoding.match(/\bgzip\b/)) {
        res.writeHead(200, { 'content-encoding': 'gzip', 'content-Type': CONTENTTYPE[ext], 'charset': 'utf-8' });
        if (req.method==="HEAD") res.end();
        else raw.pipe(zlib.createGzip()).pipe(res);
      } else {
        res.writeHead(200, { 'content-Type': CONTENTTYPE[ext], 'charset': 'utf-8' });
        if (req.method==="HEAD") res.end();
        else raw.pipe(res);
      }
    });
    
    raw.on('error', (e) => {
      if (argv.verbose) console.log(output+"404|"+localfile);
      res.writeHead(404, { 'content-Type': 'text/html', 'charset': 'utf-8' });
      res.write("<head><style>div{ text-align: center; font-size: 10em; text-shadow: 0 0 1em blue, 0 0 0.2em blue;} section{ text-align: right; font-size: small;} </style></head><body><div>404<br>Not Found</div><section>900 Webserver </section></body>");
      res.end();
    });
  }
  else {
    if (argv.verbose) console.log(output+"400|"+localfile);
    res.writeHead(400, { 'content-Type': 'text/html', 'charset': 'utf-8' });
    res.write("<head><style>div{ text-align: center; font-size: 10em; text-shadow: 0 0 1em blue, 0 0 0.2em blue;} section{ text-align: right; font-size: small;} </style></head><body><div>400<br>Bad Request</div><section>900 Webserver </section></body>");
    res.end();
  }
}

argv=argjson.add({
  arg:"folder",
  short:"f",
  description:"the folder to serve",
  default:"client/build"
}).add({
  arg:"port",
  short:"p",
  description:"the port to listen",
  default:"5000"
}).add({
  arg:"key",
  short:"k",
  description:"a file containing the key certificate",
  default:"key.pem"
}).add({
  arg:"chain",
  short:"c",
  description:"a file containig the chain certificate",
  default:"chain.pem"
}).add({
  arg:"name",
  short:'n',
  description:"choose a nome for your serveur",
  default:"PID"
}).add({
  arg:"verbose",
  short:'v',
  description:"verbose for debug or log",
  default:false
}).parse();

if (argv.name=="PID") argv.name="";
argv.name=argv.name+":"+process.pid;

try {
  options = {
    key: fs.readFileSync(argv.key),
    cert: fs.readFileSync(argv.chain)
  }
}
catch (error) {
  options = {};
  console.warn("certificate files error [" + error.name + "] " + error.message);
  console.warn("run with no certificate");
}


var server;
if (Object.keys(options).length == 0)
server = http.createServer(handler);
else
server = https.createServer(options, handler);
server.listen(argv.port, function () {
  console.info("serveur [" + argv.name + "] started for " + argv.folder + " on " + argv.port + " STARTED");
});

const io = new Server(server);

io.on("connection",(socket) =>{
  socket.emit('hello',FILMS[0]);
});