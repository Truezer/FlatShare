// Añade al prototipo del Array la función de borrar elementos, si no se pasa el segundo parámetro solo borra una posición
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

String.prototype.hashCode = function() {
  var hash = 0, i, chr;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

function emRemToPx(value, scope, suffix) {
    if (!scope || value.toLowerCase().indexOf("rem") >= 0) {
        scope = 'body';
    }
    if (suffix === true) {
        suffix = 'px';
    } else {
        suffix = null;
    }
    var multiplier = parseFloat(value);
    var scopeTest = $('<div style="display: none; font-size: 1em; margin: 0; padding:0; height: auto; line-height: 1; border:0;">&nbsp;</div>').appendTo(scope);
    var scopeVal = scopeTest.height();
    scopeTest.remove();
    return Math.round(multiplier * scopeVal) + suffix;
};

var fs_engine = {
    waitUI: null,
    mainUI: null,
    toolUI: null,
    user: undefined,
    isMobile: false,
    lastPage: undefined,
    baseEditorConfig: {
        plugins: 'code fullpage searchreplace autolink directionality visualblocks visualchars fullscreen image link media template codesample table charmap hr anchor toc insertdatetime advlist lists textcolor imagetools colorpicker textpattern help',
        toolbar: 'bold italic strikethrough forecolor backcolor | link | alignleft aligncenter alignright alignjustify  | numlist bullist outdent indent  | removeformat',
        media_live_embeds: true
    },
    createEditors: function (data, mode) {
        var baseConf = fs_engine.baseEditorConfig;
        var selector;
        // Limpiar instancias anteriores de los editores
        for (var i = tinymce.editors.length - 1; i > -1; i--) {
            var ed_id = tinymce.editors[i].id;
            tinyMCE.execCommand("mceRemoveEditor", true, ed_id);
        }

        if (!fs_engine.isEmptyVar(data) && data.length > 0) {
            selector = data[0];
            for (var i = 1; i < data.length; i++) {
                selector = selector + "," + data[i];
            }
        } else {
            selector = 'textarea';
        }
        baseConf['selector'] = selector;
        tinymce.init(baseConf);
    },
    viewport: function () {
        var e = window, a = 'inner';
        if (!('innerWidth' in window)) {
            a = 'client';
            e = document.documentElement || document.body;
        }
        return { width: e[a + 'Width'], height: e[a + 'Height'] };
    },
    /* Función: jsfJQId
     * Descripción: Devuelve un objeto jQuery a partir de un id aunque sea del tipo: "form:edit1"
     * */
    isEmptyVar: function (data) {
        return data == null || data == undefined || data == "";
    },

    /* Función: jqId
     * Descripción: Devuelve un objeto jQuery a partir de un id
     * */
    dmId: function (_dmId) {
        return $("[id='" + _dmId + "']");
    },
    // Enumeración de los distintos modos de acceso a un diálogo			
    modes: {
        add: "add",
        mod: "mod",
        del: "del",
        query: "query"
    },
    // Enumeración de los tipos de acción de un diálogo
    formMode: { apply: "apply", cancel: "cancel" },
    // Enumeración de las acciones disponibles
    eventTypes: {
        butonize: "fs_butonize",
        closeDialog: "fs_closeDialog",
        openDialog: "fs_openDialog",
        loginWidget: "fs_loginWidget"
    },
    // Contendrá un array de eventos 
    events: [],
    /* Función: pushEvent
     * Descripción: Añade un nuevo evento al array y devuelve el objeto fs_engine para seguir encadenando eventos o llamar a handleEvents
     * Parámetros: data - es un objeto javascript, como propiedad fija siempre va tipo {tipo: 'selectRow', ...}  */
    pushEvent: function (data) {
        fs_engine.events.push(data);
        return fs_engine;
    },
    /* Función: handleEvents
     * Descripción: ejecuta los eventos que hay en el array empezando por el último, borrando los ya manejados
     * */
    handleEvents: function () {
        var max = fs_engine.events.length - 1;
        for (var i = max; i >= 0; i--) {
            var event = fs_engine.events[i];
            fs_engine.events.remove(i);
            switch (event.tipo) {
                /* Evento: butonize
                 * Descripción: skinea todos los botones de la página
                 * Parámetros adicionales: ninguno */
                case fs_engine.eventTypes.butonize:
                    $("input:submit, input:button, button, .butonize").button();
                    break;

                case fs_engine.eventTypes.openDialog:
                    var dialog = findDialog(event.dialog);
                    if (!fs_engine.isEmptyVar(dialog)) {
                        dialog.openDialog(fs_engine.isEmptyVar(event.mode) ? fs_engine.modes.query : event.mode);
                    } else {
                        if (!fs_engine.isEmptyVar(event.data)) {
                            dialog = fsDialog();
                            dialog.toDialog(event.data);

                        }
                    }
                    break;
                /* Evento: closeDialog
                                 * Descripción: cierra el diálogo pasado por parámetro
                                 * Parámetros adicionales: dialogId */
                case fs_engine.eventTypes.closeDialog:
                    var dialog = findDialog(event.dialogId);
                    if (!fs_engine.isEmptyVar(dialog)) {
                        if (dialog.isValidationFail() && dialog.formMode == fs_engine.formMode.apply) {
                            dialog.formMode = null;
                            dialog.decorateFields();
                            dialog.setupFocusHandler();
                            dialog.autoFocus(true);
                        } else {
                            dialog.d.dialog("destroy"); // destruye el objeto jQuery del diálogo
                            dialog.d.remove(); // borra el html asociado
                            fsDialogs.remove(dialog.index);	// borra el fsDialog del array general de diálogos																 
                        }
                    }
                    break;
                // Acciones de la capa de BBDD

                case fs_engine.eventTypes.loginWidget:
                    $.get("/api/login_widget", function (data) {
                        $("#dm_login_panel").html(data);
                        $("#dm_login_btn").on("click", function (e) {
                            e.preventDefault();
                            fs_engine.pushEvent({
                                tipo: fs_engine.eventTypes.openDialog,
                                data: {
                                    id: "dialogoLogin",
                                    baseTitle: "Página de Login",
                                    url: "/login.html",
                                    mode: fs_engine.modes.add,
                                    modal: true,
                                    autoOpen: false,
                                    position: {
                                        my: "center",                            
                                        at: fs_engine.viewport().width > 480 ? "center center": "center top",
                                        of: window 
                                    },
                                    width: "30em",
                                    apply: function (dialog, data) {
                                        var result = false;
                                        var errors = undefined;
                                        var _name = dialog.findField('dm_login_name');
                                        var _pass = dialog.findField('dm_login_pass');
                                        if (!fs_engine.isEmptyVar(_name) && !fs_engine.isEmptyVar(_pass)) {
                                            var _token = _name + _pass;
                                            _token = _token.hashCode();
                                            $.ajaxSetup({ async: false });
                                            $.post("/api/login", { name: _name, token: _token }, function (data) {
                                                if (!fs_engine.isEmptyVar(data)) {
                                                    if (data.autenticated) {
                                                        result = true;
                                                        fs_engine.user = _name;
                                                        fs_engine.pushEvent({ tipo: fs_engine.eventTypes.loginWidget }).handleEvents();
                                                        fs_engine.menuHandler(lastPage);
                                                    } else {
                                                        dialog.errors = data.message;
                                                    }
                                                }
                                            });
                                            $.ajaxSetup({ async: true });
                                        } else {
                                            dialog.errors = 'No puede haber campor vacios';
                                        }
                                        return result;
                                    }
                                }
                            }).handleEvents();
                        }).button();
                        $("#dm_logout_btn").on("click", function (e) {
                            e.preventDefault();
                            $.post("/api/logout", function (data) {
                                fs_engine.pushEvent({ tipo: fs_engine.eventTypes.loginWidget }).handleEvents();
                                fs_engine.menuHandler(lastPage);
                            });
                        }).button();

                    });
                    break;
                // Acción por defecto si el evento es de origen desconocido	
                default:
                    break;
            }
        }
        return fs_engine; // Devuelve el objeto fs_engine
    },
    /* Función: concatObjects
     * Descripción: Añade las propiedades de un objeto a otro sobrescribiendo las existentes en el de destino
     * */
    concatObjects: function (origen, destino) {
        var result = destino;
        for (var key in origen) {
            result[key] = origen[key];
        }
        return result;
    },
    openDialog: function (_dialog, _mode) {
        fs_engine.pushEvent({ tipo: fs_engine.eventTypes.openDialog, dialog: _dialog, mode: _mode }).handleEvents();
    },
    menuItems: [],
    addMenuItem: function (_section, _render) {
        var result = true;
        for (var i = 0; i <= fs_engine.menuItems.length - 1; i++) {
            result = result && fs_engine.menuItems.menu != _section;
        }
        if (result)
            fs_engine.menuItems.push({ section: _section, render: _render });
        return fs_engine;
    },
    renderMenu: function () {
        var _html = "<ul class='pageMenu'>";
        for (var i = fs_engine.menuItems.length - 1; i >= 0; i--) {
            var menu = fs_engine.menuItems[i];
            _html = _html + "<li><button id='" + menu.section + "_menuItem' title='" + menu.section + "' title='" + menu.section + "' class='menuItem " + (lastPage == menu.section ? "menuItemActive" : "") + "'>" + menu.section + "</button> </li>";
        }
        _html = _html + "</ul>";
        fs_engine.menuUI.html(_html);
            $(".menuItem").css("width", "5em");
        //(".menuItemActive").css("background-color", "blue");

        $(".menuItem").on("click", function (e) {
            e.preventDefault();
            fs_engine.menuHandler(this.title);
        }).button();;
    },
    menuHandler: function (section) {
        clearDialogs();
        lastPage = section;
        var result = false;
        for (var i = 0; i <= fs_engine.menuItems.length - 1; i++) {
            var menu = fs_engine.menuItems[i];
            if (menu.section == section) {
                $.get(menu.section, menu.render);
                fs_engine.renderMenu();
                result = true;
                break;
            }
        }
        if (!result) {
            $.get("empty", function (data) { fs_engine.mainUI.html(data); }, "html");
        }
        return result;
    },
    resize_funcs: [],
    resize: function () {
        for (var i = 0; i <= fs_engine.resize_funcs.length - 1; i++) {
            fs_engine.resize_funcs[i]();
        }
    }
};

$(document).ready(function () {
    // Inicializamos los eventos generales del Ajax de JSF  
    //jsf.ajax.addOnEvent(fs_engine.onEvent);
    //jsf.ajax.addOnError(fs_engine.onError);
    // Ejecutamos el evento de skinear los botones 
    // Adicionalmente llamamos a handleEvents para que se maneje la pila de eventos ahora
    $.widget("ui.dialog", $.ui.dialog, {
        _allowInteraction: function (event) {
            return !!$(event.target).closest(".mce-container").length || this._super(event);
        }
    });
    $.ajaxSetup({
        async: false,
        ///xhrFields: {withCredentials: true},
        crossDomain: true
    });
    fs_engine.waitUI = $("<div id='waitAjax' style='display: none'>cargando...</div>").appendTo('body');
    fs_engine.mainUI = fs_engine.dmId("mainBox");
    fs_engine.toolUI = fs_engine.dmId("toolBox");
    fs_engine.menuUI = $(".pageMenuContainer");
    // device detection
    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)
        || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0, 4))) {
        isMobile = true;
    }
    $(document).ajaxStart(function () {
        fs_engine.waitUI.show();
    });
    $(document).ajaxStop(function () {
        fs_engine.waitUI.hide();
    });

    $(window).resize(fs_engine.resize);
    // Inicializamos login
    fs_engine.pushEvent({ tipo: fs_engine.eventTypes.loginWidget })
        .handleEvents();

});	