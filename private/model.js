const tools = require("./tools.js");
const mtools = require("./model_tools.js");
const render = require("./render.js");
const fs = require("fs");
const Database = require('better-sqlite3');

module.exports = {
    contabilidad: {
        getSection: function (req, res, dbQuerys, readonly, reset) {
            var user = req.session.user, params = req.body, rows;
            if (req.session.lastPage != "pagos" || reset) {
                mtools.filter.resetFilter(req);
            }
            req.session.lastPage = "pagos";
            if (mtools.filter.isActiveFilter(req) || !readonly) {
                console.log(mtools.filter.buildFilter(params, req, readonly));
                let sql_filter = dbQuerys.db.prepare(dbQuerys.sql_contabilidad_filter.replace("{%filter%}", mtools.filter.buildFilter(params, req, readonly)));
                rows = sql_filter.all();
            } else {
                rows = dbQuerys.sql_contabilidad.all();
            }
            res.setHeader("Content-Type", "charset=utf-8");
            res.write(render.renderContabilidad(req, rows));
            res.end();
            res.send();
        },
        add: function (req, res, dbQuerys) {
            var user = req.session.user, params = req.body;
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            if (!tools.isLogged(user)) {
                res.json({ forbidden: true });
                return false;
            }
            if (params.titulo != undefined && params.cantidad != undefined && params.tipo != undefined) {
                var result_maxsuperid = dbQuerys.sql_contabilidad_maxsuperid.get();
                var new_superid = result_maxsuperid.max_superid + 1;
                if (params.childs != undefined && params.childs.length > 0) {
                    for (var i = 0; i <= params.childs.length - 1; i++) {
                        if (params.childs[i].sharedValue > 0)
                            dbQuerys.sql_contabilidad_insert.run(params.titulo, params.descripcion, params.tipo, params.childs[i].sharedValue, user.id, params.chiñds[i].userid, new_superid, (new Date()).getTime());
                    }
                } else {
                    const info_insert = dbQuerys.sql_contabilidad_insert.run(params.titulo, params.descripcion, params.tipo, params.cantidad, user.id, user.id, new_superid, (new Date()).getTime());
                    if (info_insert.changes == 0)
                        res.json({ inserted: false });
                }
                res.json({ inserted: true });
            } else {
                res.json({ inserted: false });
            }
        },
        mod: function (req, res, dbQuerys) {
            var user = req.session.user, params = req.body;
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            if (!tools.isLogged(user)) {
                res.json({ forbidden: true });
                return false;
            }
            if (params.superid != undefined && params.titulo != undefined && params.cantidad != undefined && params.tipo != undefined) {

                var modifyTransaction = dbQuerys.asTransaction(function () {
                    console.log(params.childs);
                    if (params.childs!= undefined && params.childs.length > 0) {
                        var changes = 0;
                        
                        for (var i = 0; i <= params.childs.length - 1; i++) {
                            var row = params.childs[i];
                            if (row.sharedValue > 0) {
                                const info_update = dbQuerys.sql_contabilidad_update.run(params.titulo, params.descripcion, params.tipo, row.sharedValue, params.superid, params.propietario, row.userid);
                                if (info_update.changes == 0) {
                                    const info_insert = dbQuerys.sql_contabilidad_insert.run(params.titulo, params.descripcion, params.tipo, row.sharedValue, params.propietario, row.userid, params.superid, (new Date()).getTime());
                                    if (info_insert.changes > 0) {
                                        changes = changes + 1;
                                    }
                                } else {
                                    changes = changes + 1;
                                }
                            } else {
                                const info_delete = dbQuerys.sql_contabilidad_delete_only.run(params.superid, user.id, row.id);
                            }
                        }
                        if (changes > 0) {
                            res.json({ updated: true });
                        } else {
                            res.json({ updated: false });
                        }
                    } else {
                        var usuario = params.usuario;
                        if (params.usuario == undefined) {
                            usuario = params.propietario;
                        }
                        const info_delete_alt = dbQuerys.sql_contabilidad_delete_except.run(params.superid, params.propietario, usuario);
                        const info_update = dbQuerys.sql_contabilidad_update.run(params.titulo, params.descripcion, params.tipo, params.cantidad, params.superid, params.propietario, usuario);
                        if (info_update.changes == 0) {
                            const info_insert = dbQuerys.sql_contabilidad_insert.run(params.titulo, params.descripcion, params.tipo, params.cantidad, params.propietario, usuario, params.superid, (new Date()).getTime());
                            if (info_insert.changes > 0) {
                                res.json({ updated: true });
                            } else {
                                res.json({ updated: false });
                            }
                        } else {
                            res.json({ updated: true });
                        }
                    }                    

                });
                modifyTransaction();
            
            } else {
                res.json({ updated: false, badParams: true });
            }

        },
        del: function (req, res, dbQuerys) {
            var user = req.session.user, params = req.body;
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            if (!tools.isLogged(user)) {
                res.json({ forbidden: true });
                return false;
            }
            if (params.superid != undefined) {

                const info_delete = dbQuerys.sql_contabilidad_delete_group.run(params.superid);
                if (info_delete.changes > 0) {
                    res.json({ deleted: true });
                } else {
                    res.json({ deleted: false });
                }
            }

        }

    },
    planificacion: {
        getSection: function (req, res, dbQuerys) {
            var rows = dbQuerys.sql
            mtools.resetFilter(req);
            req.session.lastPage = "plan";
            res.setHeader("Content-Type", "charset=utf-8");
            res.write(render.renderPlanificacion(req, rows));
            res.end();
            res.send();
        },
        add: {},
        mod: {},
        del: {}
    },
    main: {
        getSection: function (req, res, dbQuery) {
            var user = req.session.user, rows = dbQuery.sql_main_users.all();
            mtools.filter.resetFilter(req);
            req.session.lastPage = "main";

            res.setHeader("Content-Type", "charset=utf-8");
            res.write(render.renderMain(req, rows));
            res.end();
            res.send();
        }
    },
    usuarios: {
        login: function (req, res, dbQuerys) {
            var user = req.session.user, params = req.body;
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.header("Access-Control-Allow-Credentials", "true");
            if (!tools.isLogged(user)) {
                var auth = dbQuerys.sql_login.get(params.name, params.token);
                if (auth != undefined) {
                    req.session.user = { autenticated: true, id: auth.id, role: auth.role, name: params.name, token: params.token };
                    req.session.save();
                    res.json({ autenticated: true });
                    console.log(params.name + ' Logged');
                } else {
                    console.log('Failed to Login');

                    res.json({ autenticated: false, message: 'Failed login attempt' });
                }
            } else {
                res.json({ autenticated: true });
                console.log('Already Autenticated');
            }
        },
        logout: function (req, res) {
            req.session.user = undefined;
            req.session.save();
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.json({ autenticated: false, message: 'not logged in' });
            console.log("logout");
        },
        widget: function (req, res, userList) {
            var user = req.session.user;
            res.setHeader("Content-Type", "charset=utf-8");
            res.write(render.renderLoginWidget(user, userList));
            res.end();
            res.send();
        }

    },
    SAP: function (req, res) {
        var str = fs.readFileSync("./views/index.html", "utf8");
        var reload = req.session.lastPage != undefined ? "<script> var last_reload = '" + req.session.lastPage + "'; </script>" : "<script> var last_reload = undefined; </script>";
        var html = str.replace("{%reload%}", reload);
        res.writeHead(200, { "Content-type": "text/html" });
        res.write(html);
        res.end();

    }
}