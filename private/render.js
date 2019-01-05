var rtools = require("./render_tools.js");
var mtools = require("./model_tools.js");
var tools = require("./tools.js");
var dateFormat = require('dateformat');

module.exports = {
    renderMain: function (req, rows) {
        var _html = "", user = req.session.user;
        if (tools.isLogged(user)) {
            _html = _html + "<div id='fs_main_tools'>Logged</div>";
        }

        var pie1_data = [], pie2_data = [], pie3_data = [];
        var pie1_colors = [], pie2_colors = [], pie3_colors = [];
        var pie1_labels = [], pie2_labels = [], pie3_labels = [];
        var totalIngresos = 0;
        var totalGastos = 0;
        var totalShared = 0;
        _html = _html + "<div id='fs_main_contenedor' style='position: relative; min-width: 0px;'> <div class='mainContainer'><div style='text-align: center'> <h2 style='margin-bottom: 0.5em;'> Habitantes de la casa </h2></div>";
        rows.forEach((row) => {
            _html = _html + "<div id='fs_main_habitantes_" + row.Id + "' title='" + row.Id + "' style='padding: 0.5em; display: block; border: 1px solid black;" + (row.Total > 0 ? " background-color: #b7f7b4;" : " background-color: #f7c1bb;") + "'> " + row.Name + ": " + row.Nombre + ", " + row.Apellidos + " (" + row.Total + "€) </div>";
            totalShared = totalShared + row.Shared;
            totalGastos = totalGastos + row.Gastos;
            if (row.Gastos > 0) {
                pie3_data.push(row.Gastos);
                pie3_colors.push('#' + (Math.random() * 0xFFFFFF << 0).toString(16));
                pie3_labels.push(row.Name);
            }
            totalIngresos = totalIngresos + row.Ingresos;
            if (row.Ingresos > 0) {
                pie2_data.push(row.Ingresos);
                pie2_colors.push('#' + (Math.random() * 0xFFFFFF << 0).toString(16));
                pie2_labels.push(row.Name);
            }
        });
        _html = _html + "</div>";
        var totalNotShared = totalGastos - totalShared;
        rows.forEach((row) => {
            console.log("shared: " + row.Shared + ", ingresos: " + row.Ingresos + ", gastos: " + row.Gastos);
            if (row.Shared > 0) {
                var morosidad = row.Shared - (row.Ingresos - (row.Gastos - row.Shared));
                if (morosidad > 0) {
                    pie1_data.push(morosidad);
                    pie1_colors.push('#' + (Math.random() * 0xFFFFFF << 0).toString(16));
                    pie1_labels.push(row.Name);
                }

            }
        });
        _html = _html + "<div class='mainContainer'>";
        var names = [], datas = [];
        // Pie 1 (Morosidad)
        if (pie1_data.length > 0) {
            _html = _html + "<div class='roundedContainer' style='display: inline-block; text-align: center;'><div><h3 style='margin-bottom: 0em;'>Morosidad (1)</h3></div><div class='canvasContainer'><canvas id='myChart1'></canvas></div></div>";
            names.push("pie1_data"); names.push("pie1_labels");
            datas.push({ data: pie1_data, label: pie1_data, backgroundColor: pie1_colors }); datas.push(pie1_labels);
        }
        // Pie 2 (Ingresos)
        if (pie2_data.length > 0) {
            _html = _html + "<div class='roundedContainer' style='display: inline-block; text-align: center;'><div><h3 style='margin-bottom: 0em;'>Ingresos</h3></div><div class='canvasContainer'><canvas id='myChart2'></canvas></div></div>";
            names.push("pie2_data"); names.push("pie2_labels");
            datas.push({ data: pie2_data, label: pie2_data, backgroundColor: pie2_colors }); datas.push(pie2_labels);
        }
        // Pie 2 (Gastos)
        if (pie3_data.length > 0) {
            _html = _html + "<div class='roundedContainer' style='display: inline-block; text-align: center;'><div><h3 style='margin-bottom: 0em;'>Gastos</h3></div><div class='canvasContainer'><canvas id='myChart3'></canvas></div></div>";
            names.push("pie3_data"); names.push("pie3_labels");
            datas.push({ data: pie3_data, label: pie3_data, backgroundColor: pie3_colors }); datas.push(pie3_labels);
        }
        if (pie1_data.length > 0)
            _html = _html + "<div> <span> (1) La morosidad solo tiene en cuenta los gastos compartidos con otros habitantes de la casa</span></div>";
        _html = _html + rtools.formatters.jsonToVarHtml(names, datas);
        _html = _html + "</div>";
        return _html;
    },
    renderContabilidad: function (req, rows) {
        var _html = "", total = 0, main_rows = [], user = req.session.user;

        _html = _html + "<div id='fs_pagos_contenedor' style='position: relative; min-width: 0px;'> <div class='libroContainer'><div style='text-align: center'> <h2 style='margin-bottom: 0.5em;'> Libro de Contabilidad </h2></div>";
        _html = _html + "<div id='fs_pagos_tools' style='margin-bottom: 1em; position: absolute; left; 2em; top: 1em; height: 1.5em;'>";
        _html = _html + "<button id='but_filter_apuntes' class='but_filter' title='Filtrar'><img class='butContaToolImage' src='" + (mtools.filter.isActiveFilter(req) ? "css/images/filled-filter.png" : "css/images/filter.png") + "'/></button>";
        if (mtools.filter.isActiveFilter(req)) {
            _html = _html + "<button id='but_reset_filter_apuntes' class='but_reset_filter' title='Resetear filtro' style='margin-left: 0.1em;'><img class='butContaToolImage' src='css/images/clear-filter.png'/></button>";
            _html = _html + rtools.formatters.jsonToVarHtml(["filter"], [req.session.filter]);
        } else {
            _html = _html + rtools.formatters.jsonToVarHtml(["filter"], [{}]);
        }
        if (tools.isLogged(user)) {
            _html = _html + "<button id='but_add_apunte' class='but_add' title='Añadir apunte' style='margin-left: 1em;'><img class='butContaToolImage' src='css/images/add.png'/></button>";
        }
        _html = _html + "</div>";
        _html = _html + "<div>";
        _html = _html + "<div class='listaHead listaHeadTitulo'><span class='contabilidadTituloHead'> Concepto </span></div>";
        _html = _html + "<div class='listaHead listaHeadUsuario'><span class='contabilidadUsuarioHead'> Usuario </span></div>";
        _html = _html + "<div class='listaHead listaHeadCantidad'><span class='contabilidadCantidadHead'> Cantidad (€) </span></div>";
        _html = _html + "</div>";
        var contabilidad = [];
        var lastParent = undefined;
        var index = 0;
        rows.forEach((row) => {
            if (row.Shared == 0) {
                _html = _html + "<div class='lista_row lista_parent'><div id='fs_contabilidad_" + row.Id + "'><div class='listaAnchor' style='display: none'></div>";
                _html = _html + "<div class='listaExp'><span class='contabilidadIndex' style='display: none'>" + index + "</span></div>";
                _html = _html + "<div class='listaTitulo listaItem'><span class='contabilidadTitulo'>" + row.Titulo + "</span></div>";
                _html = _html + "<div class='listaUsuario'><span class='contabilidadUsuario'>" + row.userName + "</span></div>";
                _html = _html + "<div class='listaCantidad'><span class='contabilidadCantidad'>" + row.Cantidad + "</span><img class ='listaTipo' src='css/images/" + (row.Tipo == 0 ? "ingreso" : "gasto") + ".png'/></div>";
                _html = _html + "<div class='listaTools' style='display: inline-block; background-color: white;'>";
                _html = _html + "<button class='but_query_apunte listaToolsBut' title='Consulta apunte'><img src='css/images/query.png' class='listaToolImage'/></button>";
                if (tools.isLogged(user) && (user.id == row.Propietario || tools.hasAdminRole(user))) {                    
                    _html = _html + "<button class='but_mod_apunte listaToolsBut' title='Modificar apunte'><img src='css/images/edit.png' class='listaToolImage'/></button><button class='but_del_apunte listaToolsBut' title='Borrar apunte'><img src='css/images/delete.png' class='listaToolImage'/></button>";
                }
                _html = _html + "</div></div></div>";
                contabilidad.push({
                    index: index, id: row.Id, userid: row.Usuario, superid: row.Superid, propietario: row.Propietario, propietarioName: row.PropietarioName,
                    titulo: row.Titulo, descripcion: row.Descripcion, userName: row.UserName, tipo: row.Tipo, cantidad: row.Cantidad, shared: false
                });
                index++;
            } else {
                if (!main_rows.includes(row.Superid)) {
                    main_rows.push(row.Superid);
                    _html = _html + "<div class='lista_row lista_parent contabilidadParent_" + row.Id + "'><div id='fs_contabilidad_main" + row.Id + "'><div class='listaAnchor' style='display: none'></div>";
                    _html = _html + "<div class='listaExp'><span class='contabilidadIndex' style='display: none'>" + index + "</span><img style='margin-right: 0.4em; vertical-align: text-bottom;' src='css/images/plus.png' class='imageExpand'/></div>";
                    _html = _html + "<div class='listaTitulo listaItem'><span class='contabilidadTitulo'>" + row.Titulo + "</span></div>";
                    _html = _html + "<div class='listaUsuario'><span class='contabilidadUsuario'></span></div>";
                    _html = _html + "<div class='listaCantidad'><span class='contabilidadCantidad'>" + row.CantidadTotal + "</span><img class ='listaTipo' src='css/images/" + (row.Tipo == 0 ? "ingreso" : "gasto") + ".png'/></div>";
                    _html = _html + "<div class='listaTools' style='display: inline-block; background-color: white;'>";
                    _html = _html + "<button class='but_query_apunte listaToolsBut' title='Consulta apunte'><img src='css/images/query.png' class='listaToolImage'/></button>";
                    if (tools.isLogged(user) && (user.id == row.Propietario || tools.hasAdminRole(user))) {                        
                        _html = _html + "<button class='but_mod_apunte listaToolsBut' title='Modificar apunte'><img src='css/images/edit.png' class='listaToolImage'/></button><button class='but_del_apunte listaToolsBut' title='Borrar apunte'><img src='css/images/delete.png' class='listaToolImage'/></button>";
                    }
                    _html = _html + "</div></div></div>";
                    lastParent = {
                        index: index, superid: row.Superid, propietario: row.Propietario, propietarioName: row.PropietarioName,
                        titulo: row.Titulo, descripcion: row.Descripcion, tipo: row.Tipo, cantidad: row.CantidadTotal, shared: true, childs: []
                    };
                    contabilidad.push(lastParent);
                    index++;
                }
                _html = _html + "<div class='lista_row lista_child contabilidadChild_" + row.Superid + "' style='display: none;'><div id='fs_contabilidad_child_" + row.Id + "'><div class='listaAnchor' style='display: none'></div>";
                _html = _html + "<div class='listaExp'></div>";
                _html = _html + "<div class='listaTitulo'><span class='contabilidadTitulo'></span></div>";
                _html = _html + "<div class='listaUsuario'><span class='contabilidadUsuario'>" + row.userName + "</span></div>";
                _html = _html + "<div class='listaCantidad'><span class='contabilidadCantidad_Child'>" + row.Cantidad + "</span></div>";
                _html = _html + "<div class='listaTools' style='display: inline-block; background-color: white;'></div>";
                _html = _html + "</div></div>";

                lastParent.childs.push({
                    index: index, id: row.Id, userid: row.userId, userName: row.UserName, parent: row.superid, parent: row.superid,
                    titulo: row.Titulo, tipo: row.Tipo, cantidad: row.Cantidad
                });
            }
            total = total + (row.Tipo == 0 ? row.Cantidad : -row.Cantidad);
        });
        _html = _html + rtools.formatters.jsonToVarHtml(["contabilidad"], [contabilidad]);
        _html = _html + "</div><div> Balance neto: " + total + "€ </div></div>";
        return _html;
    },
    renderPlanificacion: function (req, rows) {
        var _html = "", total = 0, main_rows = [], user = req.session.user, planificacion = [];

        _html = _html + "<div id='fs_plan_contenedor' style='position: relative; min-width: 0px;'> <div class='planContainer'><div style='text-align: center'> <h2 style='margin-bottom: 0.5em;'> Planificación </h2></div>";
        _html = _html + "<div class='listaTools' style='display: inline-block; background-color: white;'>";
        if (tools.isLogged(user)) {
            _html = _html + "<button id='but_add_plan' class='but_add' title='Añadir planificacion' style='margin-left: 1em;'><img class='butContaToolImage' src='css/images/add.png'/></button>";
        }
        _html = _html + "</div>";
        rows.forEach((row) => {
            _html = _html + "<div class='listaRow'>";
            _html = _html + "<div class='listaTitulo'><span class='planificacionTitulo'>" + row.Titulo + "</span></div>";
            _html = _html + "<div class='lista'><span class='planificacionPeriodicidad'>" + (row.Periodicidad == 0 ? "Única" : (row.Periodicidad == 1 ? "Semanal" : (row.Periodicidad == 2 ? "Mensual" : (row.Periodicidad == 3 ? "Anual" : "Desconocida")))) + "</span></div>";
            _html = _html + "<div class='lista'><span class='planificacionFechaInicio'>" + dateFormat(row.FechaInicio, "dd/mm/yyyy") + "</span></div>";
            _html = _html + "<div class='lista'><span class='planificacionFechaFin'>" + dateFormat(row.FechaFin, "dd/mm/yyyy") + "</span></div>";
            _html = _html + "<div class='lista'><span class='planificacionCantidad'>" + row.Cantidad + "</span></div>";
            _html = _html + "<div class='listaTools' style='display: inline-block; background-color: white;'>";
            _html = _html + "<button class='but_query_plan listaToolsBut' title='Consulta apunte'><img src='css/images/query.png' class='listaToolImage'/></button>";
            if (tools.isLogged(user) && (user.id == row.Propietario || tools.hasAdminRole(user))) {
                _html = _html + "<button class='but_mod_plan listaToolsBut' title='Modificar apunte'><img src='css/images/edit.png' class='listaToolImage'/></button><button class='but_del_plan listaToolsBut' title='Borrar apunte'><img src='css/images/delete.png' class='listaToolImage'/></button>";
            }
            _html = _html + "</div></div>";
            planificacion.push({
                id: row.Id, titulo: row.Titulo, descripcion: row.Descripcion, periodicidad: row.Periodicidad, fechaInicio: row.FechaInicio,
                fechaFin: row.FechaFin, propietario: row.Propietario, propietarioName: row.propietarioName, cantidad: row.Cantidad
            });
        });
        _html = _html + rtools.formatters.jsonToVarHtml(["planificacion"], [planificacion]);
        _html = _html + "</div></div>";
        return _html;
    },
    renderLoginWidget: function (user, userList) {
        var _html = "", loogedUser = undefined;
        if (!tools.isLogged(user)) {
            _html = _html + "<button id='dm_login_btn' class='butWidget' style='padding-top: 0.2em; padding-right: 0.2em; padding-left: 0em; padding-bottom: 0em;'><img src='css/images/login.png' style='width: 1.5em; height: 1.5em;'/></button>";
        } else {
            loogedUser = user.name;
            _html = _html + "<button id='dm_logout_btn' class='butWidget' style='padding-top: 0.2em; padding-right: 0.2em; padding-left: 0em; padding-bottom: 0em;'> <img src='css/images/logout.png' style='width: 1.5em; height: 1.5em;'/></button><span id='lblUsername' class='ui-button labelUser disabled' style='padding: 0.2em;'>" + user.name + "</span>";
        }
        _html = _html + rtools.formatters.jsonToVarHtml(["userList", "loggedUser"], [userList, loogedUser]);
        return _html;
    }

}