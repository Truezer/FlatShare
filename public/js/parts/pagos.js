

function contabilidad_getvalues(dialog) {
    var result = {};
    result.titulo = { selector: "#input_concepto", value: dialog.d.find("#input_concepto").val() };
    result.descripcion = { selector: "#textarea_descripcion", value: dialog.d.find("#textarea_descripcion").val() };
    result.tipo = { selector: "#radio_ingresos", value: dialog.d.find("#radio_ingresos").prop('checked') ? 0: 1 };
    result.cantidad = { selector: "#input_cantidad", value: dialog.d.find("#input_cantidad").val() };
    result.sharing = { selector: "#check_gastoscompartidos", value: dialog.d.find("#check_gastoscompartidos").prop('checked') };
    if (result.sharing.value) {
        result.childs = { selector: ".sharedValue", values: [] }
        result.suma = 0;
        $("#lista_sharing > div").each(function () {
            var sharedValue = $(this).find(".sharedValue").val();
            result.childs.values.push({ userid: $(this).find(".userID").val(), sharedValue: sharedValue })
            result.suma = result.suma + parseFloat(sharedValue, 10);
        });
    }
    return result;
}


function contabilidad_validation(values) {
    var result = [];
    if (fs_engine.isEmptyVar(values.titulo.value))
        result.push("El concepto no puede quedarse vacio");
    if (fs_engine.isEmptyVar(values.cantidad.value) && values.cantidad.value <= 0)
        result.push("La cantidad no puede estar vacia ni ser 0 ó Negativo");
    if (values.sharing.value) {
        if (values.suma != values.cantidad.value)
            result.push("Las partes no suman lo mismo que el total");
    }
    return result;
}

function moveElement(element, anchor, width) {
    if (width != undefined) {
        $(element).css("width", width);
    }
    $(element).each(function () {
        var _anchor = $(this).parent().find(anchor);
        $(this).detach();
        $(this).insertAfter(_anchor);
    });
}

fs_engine.resize_funcs.push(function () {
    if ($("#fs_pagos_contenedor").length > 0) {
        var tools_wd = ($($(".listaTools")[0]).width() + ($($(".listaTools")[0]).css("padding") != null ? parseFloat($($(".listaTools")[0]).css("padding"), 10) : 0) * 2) / parseFloat($("html").css("font-size"), 10);
        if (window.screen.width > 480) {
            $(".listaHead").show();
            $(".listaHeadTitulo").css("width", (41 - tools_wd) + "em");
            $(".listaHeadUsuario").css("width", "7em");
            $(".listaHeadCantidad").css("width", "7em");
            moveElement(".listaExp", ".listaAnchor", "2em");
            moveElement(".listaTitulo", ".listaExp", (38.5 - tools_wd) + "em");
            moveElement(".listaUsuario", ".listaTitulo", "7em");
            moveElement(".listaCantidad", ".listaUsuario", "7em");
            moveElement(".listaTools", ".listaCantidad", undefined);
            $(".filterTipo").css("width", "15.5em");
        } else {
            $(".listaHead").hide();
            moveElement(".listaTitulo", ".listaAnchor", "28em");
            moveElement(".listaExp", ".listaTitulo", "2em");
            moveElement(".listaTools", ".listaExp", undefined);
            moveElement(".listaUsuario", ".listaTools", (19 - tools_wd) + "em");
            moveElement(".listaCantidad", ".listaUsuario", "7.35em");
            $(".filterTipo").css("width", "15em");
        }
    }
});

$(document).ready(function () {
    fs_engine.addMenuItem('pagos', function (data) {
        // Asignamos el html al mainUI
        fs_engine.mainUI.html(data);
        $(window).resize();

        $(".imageExpand").on("click", function () {
            var superid = contabilidad[$(this).parent().parent().find(".contabilidadIndex").text()].superid;
            if ($(this).prop("src").endsWith("css/images/plus.png")) {
                $(this).prop("src", "css/images/minus.png");
                $(".contabilidadChild_" + superid).show();
            } else {
                $(this).prop("src", "css/images/plus.png");
                $(".contabilidadChild_" + superid).hide();
            }
        });
        fs_engine.mainUI.on("click", "#but_add_apunte", function (e) {
            e.preventDefault();
            fs_engine.pushEvent({
                tipo: fs_engine.eventTypes.openDialog,
                data: {
                    id: "dialogoApunte",
                    baseTitle: "Añadir Apunte contable",
                    url: "/conta.html",
                    mode: fs_engine.modes.add,
                    width: "30em",
                    modal: true,
                    autoOpen: false,
                    position: {
                        my: "center",
                        at: fs_engine.viewport().width > 480 ? "center center" : "center top",
                        of: window
                    },
                    render: function (html) {
                        var renderSharingList = "";
                        for (var i = 0; i <= userList.length - 1; i++) {
                            renderSharingList = renderSharingList + "<div> <div class='dialog_label'> <input class='userID' type='text' style='display: none' value='" + userList[i].id + "'/> <span value='" + userList[i].id + "'> " + userList[i].name + " </span></div> <div class='dialog_value'> <input style='width: 15em; text-align: right;' class='sharedValue' type='number' min='0' step='1'/> € </div> </div>";
                        }
                        return html.replace('{%usuario%}', loggedUser)
                            .replace('{%sharingList%}', renderSharingList)
                            .replace("{%gastos_compartidos%}", "")
                            .replace("{%modo_visible%}", "display: none")
                            .replaceAll("{%sharing_visible%}", "display: none")
                            .replace("{%equals%}", "checked='true'")
                            .replace("{%ingresos%}", "checked='true'")
                            .replace("{%cantidad%}", "")
                            .replace("{%descripcion%}", "")
                            .replace("{%titulo%}", "");
                    },
                    apply: function (dialog, data) {
                        var result = false;
                        var values = contabilidad_getvalues(dialog);
                        var errors = contabilidad_validation(values);
                        if (errors.length == 0) {
                            var post_object = { titulo: values.titulo.value, descripcion: values.descripcion.value, tipo: values.tipo.value, cantidad: values.cantidad.value };
                            if (values.childs != undefined) {
                                post_object["childs"] = values.childs.values;
                            } 

                            $.ajaxSetup({ async: false });
                            $.post("/api/apunte/add", post_object, function (data) {
                                if (data.inserted) {
                                    result = true;
                                    fs_engine.menuHandler("pagos");
                                } else {
                                    errors.push("se ha producido un error al insertar el apunte");
                                    dialog.errors = errors;
                                }
                            });
                            $.ajaxSetup({ async: true });
                            result = true;
                        } else {
                            dialog.errors = errors;
                        }
                        return result;
                    }
                }
            }).handleEvents();
        });
        fs_engine.mainUI.on("click", ".but_mod_apunte", function (e) {
            e.preventDefault();
            var button = this;
            fs_engine.pushEvent({
                tipo: fs_engine.eventTypes.openDialog,
                data: {
                    id: "dialogoApunte",
                    baseTitle: "Modificar apunte contable",
                    url: "/conta.html",
                    mode: fs_engine.modes.mod,
                    width: "30em",
                    modal: true,
                    autoOpen: false,
                    position: {
                        my: "center",
                        at: fs_engine.viewport().width > 480 ? "center center" : "center top",
                        of: window
                    },
                    render: function (html) {
                        var renderSharingList = "";
                        var changed = false;

                        var row = contabilidad[parseInt($(button).parent().parent().find(".contabilidadIndex").text(), 10)];

                        if (row.childs != undefined && row.childs.length > 0) {
                            var lastVal = undefined;
                            for (var i = 0; i <= userList.length - 1; i++) {
                                var child = undefined;
                                for (var j = 0; j <= row.childs.length - 1; j++) {
                                    if (userList[i].id == row.childs[j].userid) {
                                        child = row.childs[j];
                                    }
                                }
                                if (child == undefined) {
                                    child.userName = userList[i].name;
                                    child.cantidad = 0;
                                    child.userid = userList[i].id;
                                }

                                renderSharingList = renderSharingList + "<div class='dialogo_row_lista'> <div class='dialog_label'> <input class='userID' type='text' style='display: none' value='" + child.userid + "'/> <span value='" + child.userid + "'> " + child.userName + " </span></div> <div class='dialog_value'> <input style='width: 15em; text-align: right;' class='sharedValue' type='number' min='0' step='1' value='" + child.cantidad + "' {%readonly%}/> € </div> </div>";
                                if (lastVal == undefined) {
                                    lastVal = child;
                                } else {
                                    changed = changed || !(lastVal.cantidad == child.cantidad);
                                    lastVal = child;
                                }
                            }
                        } else {
                            for (var i = 0; i <= userList.length - 1; i++) {
                                renderSharingList = renderSharingList + "<div class='dialogo_row_lista'> <div class='dialog_label'> <input class='userID' type='text' style='display: none' value='" + userList[i].id + "'/> <span value='" + userList[i].id + "'> " + userList[i].name + " </span></div> <div class='dialog_value'> <input style='width: 15em; text-align: right;' class='sharedValue' type='number' min='0' step='1' readonly='true'/> € </div> </div>";
                            }
                        }
                        renderSharingList = renderSharingList.replaceAll("{%readonly%}", (!changed) ? "readonly='true'" : "");

                        return html.replace('{%usuario%}', row.propietarioName)
                            .replace('{%sharingList%}', renderSharingList)
                            .replace("{%gastos_compartidos%}", row.childs != undefined ? "checked='checked'" : "")
                            .replace("{%equals%}", !changed ? "checked='true'" : "")
                            .replace("{%fixed%}", changed ? "checked='true'" : "")
                            .replace("{%ingresos%}", row.tipo == 0 ? "checked='true'" : "")
                            .replace("{%gastos%}", row.tipo == 1 ? "checked='true'" : "")
                            .replace("{%modo_visible%}", (row.tipo == 1) ? "display: block;" : "display: none")
                            .replaceAll("{%sharing_visible%}", row.childs != undefined ? "display: block" : "display: none")
                            .replace("{%cantidad%}", row.cantidad)
                            .replace("{%descripcion%}", row.descripcion)
                            .replace("{%titulo%}", row.titulo);
                    },
                    apply: function (dialog, data) {
                        var result = false;
                        var row = contabilidad[parseInt($(button).parent().parent().find(".contabilidadIndex").text(), 10)];
                        var values = contabilidad_getvalues(dialog);
                        var errors = contabilidad_validation(values);
                        if (errors.length == 0) {
                            var post_object = { superid: row.superid, usuario: row.userid, propietario: row.propietario, titulo: values.titulo.value, descripcion: values.descripcion.value, tipo: values.tipo.value, cantidad: values.cantidad.value };

                            if (values.childs != undefined) {
                                post_object["childs"] = values.childs.values;
                            } else {
                                post_object["usuario"] = row.userid;
                            }
                            
                            $.ajaxSetup({ async: false });
                            $.post("/api/apunte/mod", post_object, function (data) {
                                if (data.updated) {
                                    result = true;
                                    fs_engine.menuHandler("pagos");
                                } else {
                                    errors.push("se ha producido un error al actualizar el apunte");
                                    dialog.errors = errors;
                                }
                            });
                            $.ajaxSetup({ async: true });
                        } else {
                            dialog.errors = errors;
                        }
                        return result;
                    }
                }
            }).handleEvents();

        });
        fs_engine.mainUI.on("click", ".but_del_apunte", function (e) {
            e.preventDefault();
            var button = this;
            fs_engine.pushEvent({
                tipo: fs_engine.eventTypes.openDialog,
                data: {
                    id: "dialogoApunte",
                    baseTitle: "Borrar apunte contable",
                    url: "/conta.html",
                    mode: fs_engine.modes.del,
                    width: "30em",
                    modal: true,
                    autoOpen: false,
                    position: {
                        my: "center",
                        at: fs_engine.viewport().width > 480 ? "center center" : "center top",
                        of: window
                    },
                    render: function (html) {
                        var renderSharingList = "";
                        var changed = false;

                        var row = contabilidad[parseInt($(button).parent().parent().find(".contabilidadIndex").text(), 10)];

                        if (row.childs != undefined && row.childs.length > 0) {
                            var lastVal = undefined;
                            for (var i = 0; i <= userList.length - 1; i++) {
                                var child = undefined;
                                for (var j = 0; j <= row.childs.length - 1; j++) {
                                    if (userList[i].id == row.childs[j].userid) {
                                        child = row.childs[j];
                                    }
                                }
                                if (child == undefined) {
                                    child.userName = userList[i].name;
                                    child.cantidad = 0;
                                    child.userid = userList[i].id;
                                }

                                renderSharingList = renderSharingList + "<div class='dialogo_row_lista'> <div class='dialog_label'> <input class='userID' type='text' style='display: none' value='" + child.userid + "'/> <span value='" + child.userid + "'> " + child.userName + " </span></div> <div class='dialog_value'> <input style='width: 15em; text-align: right;' class='sharedValue' type='number' min='0' step='1' value='" + child.cantidad + "' {%readonly%}/> € </div> </div>";
                                if (lastVal == undefined) {
                                    lastVal = child;
                                } else {
                                    changed = changed || !(lastVal.cantidad == child.cantidad);
                                    lastVal = child;
                                }
                            }
                        } else {
                            for (var i = 0; i <= userList.length - 1; i++) {
                                renderSharingList = renderSharingList + "<div class='dialogo_row_lista'> <div class='dialog_label'> <input class='userID' type='text' style='display: none' value='" + userList[i].id + "'/> <span value='" + userList[i].id + "'> " + userList[i].name + " </span></div> <div class='dialog_value'> <input style='width: 15em; text-align: right;' class='sharedValue' type='number' min='0' step='1' readonly='true'/> € </div> </div>";
                            }
                        }
                        renderSharingList = renderSharingList.replaceAll("{%readonly%}", (!changed) ? "readonly='true'" : "");

                        return html.replace('{%usuario%}', row.propietarioName)
                            .replace('{%sharingList%}', renderSharingList)
                            .replace("{%gastos_compartidos%}", row.childs != undefined ? "checked='checked'" : "")
                            .replace("{%equals%}", !changed ? "checked='true'" : "")
                            .replace("{%fixed%}", changed ? "checked='true'" : "")
                            .replace("{%ingresos%}", row.tipo == 0 ? "checked='true'" : "")
                            .replace("{%gastos%}", row.tipo == 1 ? "checked='true'" : "")
                            .replace("{%modo_visible%}", (row.tipo == 1) ? "display: block;" : "display: none")
                            .replaceAll("{%sharing_visible%}", row.childs != undefined ? "display: block" : "display: none")
                            .replace("{%cantidad%}", row.cantidad)
                            .replace("{%descripcion%}", row.descripcion)
                            .replace("{%titulo%}", row.titulo);
                    },
                    apply: function (dialog, data) {
                        var result = false;
                        var errors = [];
                        var row = contabilidad[parseInt($(button).parent().parent().find(".contabilidadIndex").text(), 10)];
                        if (fs_engine.isEmptyVar(row.superid))
                            errors.push("Imposible borrar un apunte con SuperID vacio");
                        if (errors.length == 0) {
                        var _superid = row.superid;
                            var post_object = { superid: _superid };
                            $.ajaxSetup({ async: false });
                            $.post("/api/apunte/del", post_object, function (data) {
                                if (data.deleted) {
                                    result = true;
                                    fs_engine.menuHandler("pagos");
                                } else {
                                    errors.push("se ha producido un error al borrar el apunte");
                                    dialog.errors = errors;
                                }
                            });
                            $.ajaxSetup({ async: true });

                        } else {
                            dialog.errors = errors;
                        }
                        return result;
                    }
                }
            }).handleEvents();
        });

        fs_engine.mainUI.on("click touch tap", ".but_query_apunte", function (e) {
            e.preventDefault();
            var button = this;
            fs_engine.pushEvent({
                tipo: fs_engine.eventTypes.openDialog,
                data: {
                    id: "dialogoApunte",
                    baseTitle: "Consulta de Apunte contable",
                    url: "/conta.html",
                    mode: fs_engine.modes.query,
                    width: "30em",
                    modal: true,
                    autoOpen: false,
                    position: {
                        my: "center",
                        at: fs_engine.viewport().width > 480 ? "center center" : "center top",
                        of: window
                    },
                    render: function (html) {
                        var renderSharingList = "";
                        var changed = false;

                        var row = contabilidad[parseInt($(button).parent().parent().find(".contabilidadIndex").text(), 10)];

                        if (row.childs != undefined && row.childs.length > 0) {
                            var lastVal = undefined;
                            for (var i = 0; i <= userList.length - 1; i++) {
                                var child = undefined;
                                for (var j = 0; j <= row.childs.length - 1; j++) {
                                    if (userList[i].id == row.childs[j].userid) {
                                        child = row.childs[j];
                                    }
                                }
                                if (child == undefined) {
                                    child.userName = userList[i].name;
                                    child.cantidad = 0;
                                    child.userid = userList[i].id;
                                }

                                renderSharingList = renderSharingList + "<div class='dialogo_row_lista'> <div class='dialog_label'> <input class='userID' type='text' style='display: none' value='" + child.userid + "'/> <span value='" + child.userid + "'> " + child.userName + " </span></div> <div class='dialog_value'> <input style='width: 15em; text-align: right;' class='sharedValue' type='number' min='0' step='1' value='" + child.cantidad + "' {%readonly%}/> € </div> </div>";
                                if (lastVal == undefined) {
                                    lastVal = child;
                                } else {
                                    changed = changed || !(lastVal.cantidad == child.cantidad);
                                    lastVal = child;
                                }
                            }
                        } else {
                            for (var i = 0; i <= userList.length - 1; i++) {
                                renderSharingList = renderSharingList + "<div class='dialogo_row_lista'> <div class='dialog_label'> <input class='userID' type='text' style='display: none' value='" + userList[i].id + "'/> <span value='" + userList[i].id + "'> " + userList[i].name + " </span></div> <div class='dialog_value'> <input style='width: 15em; text-align: right;' class='sharedValue' type='number' min='0' step='1' readonly='true'/> € </div> </div>";
                            }
                        }
                        renderSharingList = renderSharingList.replaceAll("{%readonly%}", (!changed) ? "readonly='true'" : "");

                        return html.replace('{%usuario%}', row.propietarioName)
                            .replace('{%sharingList%}', renderSharingList)
                            .replace("{%gastos_compartidos%}", row.childs != undefined ? "checked='checked'" : "")
                            .replace("{%equals%}", !changed ? "checked='true'" : "")
                            .replace("{%fixed%}", changed ? "checked='true'" : "")
                            .replace("{%ingresos%}", row.tipo == 0 ? "checked='true'" : "")
                            .replace("{%gastos%}", row.tipo == 1 ? "checked='true'" : "")
                            .replace("{%modo_visible%}", (row.tipo == 1) ? "display: block;" : "display: none")
                            .replaceAll("{%sharing_visible%}", row.childs != undefined ? "display: block" : "display: none")
                            .replace("{%cantidad%}", row.cantidad)
                            .replace("{%descripcion%}", row.descripcion)
                            .replace("{%titulo%}", row.titulo);
                    },
                    apply: function (dialog, data) {
                        return true;
                    }
                }
            }).handleEvents();
        });

        fs_engine.mainUI.on("click", "#but_filter_apuntes", function (e) {
            e.preventDefault();
            fs_engine.pushEvent({
                tipo: fs_engine.eventTypes.openDialog,
                data: {
                    id: "dialogoFilter",
                    baseTitle: "Filtrado",
                    url: "/filter.html",
                    mode: fs_engine.modes.add,
                    modal: true,
                    autoOpen: false,
                    position: {
                        my: "center",
                        at: fs_engine.viewport().width > 480 ? "center center" : "center top",
                        of: window
                    },
                    width: "30em",
                    render: function (html) {
                            if (!fs_engine.isEmptyVar(filter.titulo)) {
                                html = html.replace("{%titulo%}", filter.titulo);
                            } else {
                                html = html.replace("{%titulo%}", "");
                            }
                            if (!fs_engine.isEmptyVar(filter.tipo)) {
                                html = html.replace("{%tipo1%}", filter.tipo == undefined ? " selected " : "")
                                    .replace("{%tipo2%}", filter.tipo == 0 ? " selected " : "")
                                    .replace("{%tipo3%}", filter.tipo == 1 ? " selected " : "")
                            } else {
                                html = html.replace("{%tipo1%}", " selected ")
                                    .replace("{%tipo2%}", "")
                                    .replace("{%tipo3%}", "")
                            }
                                                            
                            if (!fs_engine.isEmptyVar(filter.cantidad)) {
                                html = html.replace("{%op1%}", filter.op == 0 ? " selected " : "")
                                    .replace("{%op2%}", filter.op == 1 ? " selected " : "")
                                    .replace("{%op3}", filter.op == 2 ? " selected " : "")
                                    .replace("{%cantidad%}", filter.cantidad);
                            } else {
                                html = html.replace("{%op1%}", "")
                                    .replace("{%op2%}", " selected ")
                                    .replace("{%op3}", "")
                                    .replace("{%cantidad%}", "");
                            }
                            if (!fs_engine.isEmptyVar(filter.sharing)) {
                                html = html.replace("{%sharing%}", filter.sharing ? "true" : "");
                            } else {
                                html = html.replace("{%sharing%}", filter.sharing ? "false" : "");
                            }
                        return html;
                    },
                    apply: function (dialog, data) {
                        var result = false, errors = undefined, post_object = {};
                        var _titulo = dialog.d.find(".filterTitulo").val();
                        var _tipo = dialog.d.find(".filterTipo").val();
                        var _op = dialog.d.find(".filterOp").val();
                        var _cantidad = dialog.d.find(".filterCantidad").val();
                        var _sharing = dialog.d.find(".filterSharing").val();

                        if (!fs_engine.isEmptyVar(_titulo)) post_object["titulo"] = _titulo;
                        if (!fs_engine.isEmptyVar(_tipo)) post_object["tipo"] = _tipo;
                        if (!fs_engine.isEmptyVar(_cantidad) && _cantidad > 0) {
                            post_object["op"] = _op;
                            post_object["cantidad"] = _cantidad;
                        }
                        if (_tipo == 1) {
                            post_object["sharing"] = _sharing;
                        }
                        $.ajaxSetup({ async: false });
                        $.post("/api/contabilidad/filter", post_object, function (data) {
                            fs_engine.mainUI.html(data);
                            result = true;
                        });
                        $.ajaxSetup({ async: true });
                        return result;
                    }
                }
            }).handleEvents();

        });
        fs_engine.mainUI.on("click", "#but_reset_filter_apuntes", function (e) {
            e.preventDefault();
            $.ajaxSetup({ async: false });
            $.post("/api/contabilidad/filter/reset", {}, function (data) {
                fs_engine.mainUI.html(data);
            });
            $.ajaxSetup({ async: true });
        });
    });
});