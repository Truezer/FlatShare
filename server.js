// server.js

    // set up ========================
    var express  = require('express');
    var app      = express();                               // create our app w/ express
    const Database = require('better-sqlite3');
    var morgan = require('morgan');             // log requests to the console (express4)
    var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
    var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
	const session = require('express-session');
    const uuid = require('uuid/v4');
    var model = require("./private/model.js");
    // configuration =================
	// add & configure middleware
	app.use(session({
		genid: (req) => {
			return uuid() // use UUIDs for session IDs
		},
		cookie: { maxAge: 900000, httpOnly: false, secure: false },
		secret: 'keyboard cat',
		resave: true,
		saveUninitialized: true,
		maxAge: 900000
	}));
	
const db = new Database('./database/fs.db', { });
app.use(morgan('dev'));                                         // log every request to the console
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(methodOverride());

// routes ======================================================================
var path = __dirname + '/views/';
var router = express.Router();

app.use(express.static('public'));                 // set the static files location /public/img will be /img for users

// Sección de definición de sentencias SQL
let sql_login = db.prepare(`SELECT id, role FROM users u WHERE u.name = ? AND u.token = ?`);
let sql_users = db.prepare(`SELECT DISTINCT id, name FROM users u`);
let sql_main_users = db.prepare(`SELECT u.id Id, u.name Name, u.nombre Nombre, u.apellidos Apellidos, 
					                  (SELECT SUM(case when c.tipo = 0 then c.cantidad else -c.cantidad end) FROM contabilidad c WHERE c.usuario = u.id) Total,
						              (SELECT SUM(c.cantidad) FROM contabilidad c WHERE c.usuario = u.id AND c.tipo = 1) Gastos,
						              (SELECT SUM(c.cantidad) FROM contabilidad c WHERE c.usuario = u.id AND c.tipo = 0) Ingresos,
                                      (SELECT SUM(c.cantidad) FROM contabilidad c WHERE c.usuario = u.id AND c.tipo = 1 AND (SELECT COUNT(*) FROM contabilidad cc WHERE cc.superid = c.superid AND cc.usuario <> cc.propietario) > 0) Shared
				                         FROM users u`);	
let sql_contabilidad = db.prepare(`SELECT c.id Id, c.titulo Titulo, c.descripcion Descripcion, c.cantidad Cantidad, c.tipo Tipo, u.name userName, u.id userId, c.usuario Usuario, c.propietario Propietario, c.superid Superid, 
						                  (SELECT uu.name FROM users uu WHERE uu.id = c.propietario) PropietarioName,
						                  (SELECT Count(*) FROM contabilidad cc WHERE c.superid = cc.superid AND cc.usuario <> c.propietario) Shared, 
						                  (SELECT SUM(ccc.cantidad) FROM contabilidad ccc WHERE c.superid = ccc.superid) CantidadTotal FROM contabilidad c, users u WHERE c.usuario = u.id ORDER BY c.superid`);
let sql_contabilidad_filter = `SELECT c.id Id, c.titulo Titulo, c.descripcion Descripcion, c.cantidad Cantidad, c.tipo Tipo, u.name userName, u.id userId, c.usuario Usuario, c.propietario Propietario, c.superid Superid, 
						                  (SELECT uu.name FROM users uu WHERE uu.id = c.propietario) PropietarioName,
						                  (SELECT Count(*) FROM contabilidad cc WHERE c.superid = cc.superid AND cc.usuario <> c.propietario) Shared, 
						                  (SELECT SUM(ccc.cantidad) FROM contabilidad ccc WHERE c.superid = ccc.superid) CantidadTotal FROM contabilidad c, users u
                                    WHERE c.usuario = u.id {%filter%} ORDER BY c.superid`;
let sql_contabilidad_maxsuperid = db.prepare(`SELECT MAX(superid) max_superid FROM contabilidad`);
let sql_contabilidad_insert = db.prepare(`INSERT INTO contabilidad (titulo, descripcion, tipo, cantidad, propietario, usuario, superid, fecha) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
let sql_contabilidad_update = db.prepare(`UPDATE contabilidad SET titulo = ?, descripcion = ?, tipo = ?, cantidad = ? WHERE superid = ? AND propietario = ? AND usuario = ?`);
let sql_contabilidad_delete_only = db.prepare(`DELETE FROM contabilidad WHERE superid = ? AND propietario = ? AND usuario = ?`);
let sql_contabilidad_delete_except = db.prepare(`DELETE FROM contabilidad WHERE superid = ? AND propietario = ? AND usuario <> ?`);
let sql_contabilidad_delete_group = db.prepare(`DELETE FROM contabilidad WHERE superid = ?`);

let sql_planificacion = db.prepare("SELECT p.id Id, p.titulo Titulo, p.descripcion Descripcion, u.id propietario, u.name PropietarioName, p.fechaInicio FechaInicio, p.fechaFin FechaFin, p.periodicidad Periodicidad FROM planificacion p, users u WHERE p.propietario = u.id");

let begin = db.prepare('BEGIN');
let commit = db.prepare('COMMIT');
let rollback = db.prepare('ROLLBACK');
// Higher order function - returns a function that always runs in a transaction
function asTransaction(func) {
    return function (...args) {
        begin.run();
        try {
            func(...args);
            commit.run();
        } finally {
            if (db.inTransaction) rollback.run();
        }
    };
}

var userList = sql_users.all();	
	
// api ---------------------------------------------------------------------

// Funciones de Login
// Login
router.post('/api/login', function (req, res) {
    model.usuarios.login(req, res, { db: db, sql_login: sql_login });
});
// Logout
router.post('/api/logout', function (req, res) {
    model.usuarios.logout(req, res);
});
// Login widget
router.get('/api/login_widget', function (req, res) {
    model.usuarios.widget(req, res, userList);
});

// Funciones de Planificacion
router('/plan', function (req, res) {
    model.planificacion.getSection(req, res, { sql_planificacion: sql_planificacion });
});

// Funciones de Pagos
// Devuelve la sección de contabilidad
router.get('/pagos', function (req, res) {
    model.contabilidad.getSection(req, res, { db: db, sql_contabilidad_filter: sql_contabilidad_filter, sql_contabilidad: sql_contabilidad }, true, false);
});
// Devuelve la sección de contabilidad
router.post('/api/contabilidad/filter', function (req, res) {
    model.contabilidad.getSection(req, res, { db: db, sql_contabilidad_filter: sql_contabilidad_filter, sql_contabilidad: sql_contabilidad }, false, false);
});
router.post('/api/contabilidad/filter/reset', function (req, res) {
    model.contabilidad.getSection(req, res, { db: db, sql_contabilidad_filter: sql_contabilidad_filter, sql_contabilidad: sql_contabilidad }, true, true);
});
// Añadir elemento a la contabilidad
router.post('/api/apunte/add', function (req, res) {
    model.contabilidad.add(req, res, { db: db, sql_contabilidad_maxsuperid: sql_contabilidad_maxsuperid, sql_contabilidad_insert: sql_contabilidad_insert });
});
// Modificar elemento de la contabilidad
router.post('/api/apunte/mod', function (req, res) {
    model.contabilidad.mod(req, res, { db: db, asTransaction: asTransaction, sql_contabilidad_insert: sql_contabilidad_insert, sql_contabilidad_update: sql_contabilidad_update, sql_contabilidad_delete_only: sql_contabilidad_delete_only, sql_contabilidad_delete_except: sql_contabilidad_delete_except });
});
// Borrar elemento de la contabilidad
router.post('/api/apunte/del', function (req, res) {
    model.contabilidad.del(req, res, { db: db, sql_contabilidad_delete_group: sql_contabilidad_delete_group });
});
	
// Funciones de Main
// Devuelve la sección de main
router.get('/main', function (req, res) {
    model.main.getSection(req, res, { db: db, sql_main_users: sql_main_users })
});

// application -------------------------------------------------------------
router.get('/', function (req, res) {
    model.SAP(req, res);
});

app.use("/", router);

// listen (start app with node server.js) ======================================
app.listen(8080);
console.log("App listening on port 8080");