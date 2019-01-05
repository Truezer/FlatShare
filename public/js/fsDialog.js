/* Tipo: libreria javascript
*  Nombre: fsDialog.js
*  Descripción: - Esta libreria se usa y usa la libreria javascript global de fs_engine: fs_engine.js 
*  					*/ 

// Lista de tipo Array que mantiene las referencias de los diálogos JqDialog creados a lo largo de la página
var fsDialogs = [];
/* Función: findDialog
* Descripción: Busca y devuelve un JqDialog en la lista de diálogos, se asigna el índice dentro de la lista. 
* 			   Devuelve undefined si no encuentra nada 
* Params: - JqDialogId, Id de un diálogo a buscar */ 
function findDialog(fsDialogId){
	for (var i = 0; i < fsDialogs.length; i++){
		var fsDialog = fsDialogs[i];
		if (fsDialog.id == fsDialogId){
			fsDialog.index = i;
			return fsDialog;
		}			   					
	}
	return undefined;
}	
/* Función: addDialog
* Descripción: Añade un diálogo a la lista de diálogos, devuelve el mismo diálogo 
* Params: - fsDialog */ 
function addDialog(fsDialog){  				   					
	if (!fs_engine.isEmptyVar(fsDialog)){
		// buscamos instancia anterior
		var preDialog = findDialog(fsDialog.id);
		if (preDialog){
			// 	Destruimos el objeto jquery de diálogo
			preDialog.d.dialog("destroy");
			// 	Destruimos el html asociado al diólogo anterior para que no haya duplicados
			preDialog.d.remove();
			fsDialogs.remove(preDialog.index);					
		}
		fsDialogs.push(fsDialog);
		return fsDialog;
	}
}

function clearDialogs(){
	for (var i = fsDialogs.length -1; i >= 0 ; i--){
		var dialog = fsDialogs[i];
		dialog.d.dialog("destroy");
		dialog.d.remove();
		fsDialogs.remove(dialog.index);
	}		
}

/* Función: JqDialog
* Descripción: Crea un diálogo, la función se crea mediante mecanismo de closure */ 

function fsDialog() {
    var getInstance = function () { return createInstance(); };

    var createInstance = function () {
        var fsDialog = {
            index: -1, // Index en el Array General de dm_enine
            id: null, // Id del diálogo
            d: null, // Selector Jquery del diálogo
            jg: null, // Id del diálogo
            mode: "", // Modo de entrada al formulario
            modal: true, // dialogo modal
            modeUI: null, // Selector Jquery que representa el modo de entrada para ser enviado al servidor						  					  
            applyUI: null, // Selector Jquery del botón de los eventos hacia el server
            refreshUI: null, // Selector Jquery del botón de los eventos hacia el server
            cancelUI: null, // Selector Jquery del botón de los eventos hacia el server						  
            formUI: null, // Selector Jquery del formulario de envio
            renderUI: null, // Selector Jquery del div del render
            toolUI: null, // Selector Jquery de las herramientas del diálogo
            autoOpen: false, // apertura automática del diálogo en la creacción
            draggable: true, // Boolean que representa si se puede mover el diálogo
            position: null, // Position inicial del diálogo
            width: 'auto', // Anchura del diálogo
            height: 'auto', // altura del diálogo, auto por defecto para que coja la altura de los componentes que tiene dentro
            parentDialog: null, // Diálogo Parent
            formMode: null,
            validationUI: null, // Selector del Elemento que representa si se encuentra validada la petición realizada
            focusControl: null,
            apply: null,
            errors: null,
            /* Función: toDialog
            * Descripción: función encarcaga de crear un diálogo*/
            toDialog: function (params) {
                // Rellenamos propiedades significativas
                if (fs_engine.isEmptyVar(params.id)) { // Id del diálogo, sino existe no creamos el diálogo
                    return undefined;
                }

                var _html = undefined;
                if (!fs_engine.isEmptyVar(params.url)) {
                    $.ajaxSetup({ async: false });
                    $.get(params.url, function (data) {
                        _html = data;
                    }, "html");
                    $.ajaxSetup({ async: true });
                }
                if (!fs_engine.isEmptyVar(params.render)) {
                    fsDialog.render = params.render;
                    _html = params.render(_html);
                }

                fsDialog.id = params.id;
                fsDialog.d = $("<div id='dialog_" + params.id + "'></div>").appendTo(fs_engine.mainUI);
                fsDialog.formUI = $("<form id='iForm_" + params.id + "'></form>").appendTo(fsDialog.d);
                fsDialog.renderUI = $("<div id='divRender_" + params.id + "'></div>").html(_html).appendTo(fsDialog.formUI);
                fsDialog.toolUI = $("<div id='divTools_" + params.id + "'></div>").appendTo(fsDialog.formUI);
                fsDialog.applyUI = $("<input id='butApply_" + params.id + "' type='button' value='Aceptar' style='display: none'/>").appendTo(fsDialog.toolUI);
                fsDialog.apply = params.apply;
                fsDialog.cancelUI = $("<input id='butCancel_" + params.id + "' type='button' value='Cancel' style='display: none'/>").appendTo(fsDialog.toolUI);
                fsDialog.refreshUI = $("<input id='butRefresh_" + params.id + "' type='button' value='Refresh' style='display: none'/>").appendTo(fsDialog.toolUI);
                if (!fs_engine.isEmptyVar(params.mode)) {
                    fsDialog.mode = params.mode;
                } else { fsDialog.mode = fs_engine.modes.query; }
                fsDialog.modeUI = $("<input id='inputMode_" + params.id + "' type='text' value='" + fsDialog.mode + "' style='display: none'/>").appendTo(fsDialog.toolUI);
                fsDialog.modeUI.val(fsDialog.mode);
                fsDialog.validationUI = $("<label id='labelValidation_" + params.id + "' style='display: none'></label").appendTo(fsDialog.toolUI);
                if (!fs_engine.isEmptyVar(params.modal)) {
                    fsDialog.modal = params.modal;
                } else { dialog.modal = true; }
                if (!fs_engine.isEmptyVar(params.autoOpen)) {
                    fsDialog.autoOpen = params.autoOpen;
                } else { fsDialog.autoOpen = false; }
                if (!fs_engine.isEmptyVar(params.draggable)) {
                    fsDialog.draggable = params.draggable;
                } else { fsDialog.draggable = true; }
                if (!fs_engine.isEmptyVar(params.position)) {
                    fsDialog.position = params.position;
                } else {
                    fsDialog.position = { my: "center", at: "center" }
                }
                if (!fs_engine.isEmptyVar(params.baseTitle)) {
                    fsDialog.baseTitle = params.baseTitle;
                } else { dialog.baseTitle = "Diálogo sin título"; }

                fsDialog.persistFields();
                fsDialog.loadOriginalData(params.data);
                fsDialog.loadFields();
                fsDialog.actualizaCampos();

                fsDialog.d.dialog({
                    modal: fsDialog.modal,
                    autoOpen: fsDialog.autoOpen,
                    draggable: fsDialog.draggable,
                    position: fsDialog.position,
                    width: params.width,
                    height: params.height,
                    scrollingRows: true,
                    buttons: {
                        "Aceptar": function () {
                            fsDialog.formMode = fs_engine.formMode.apply;
                            if (!fs_engine.isEmptyVar(fsDialog.apply)) {
                                if (fsDialog.apply(fsDialog, fsDialog.serializedFields)) {
                                    fs_engine.pushEvent({ tipo: fs_engine.eventTypes.closeDialog, dialogId: fsDialog.id }).handleEvents();
                                } else {
                                    if (!fs_engine.isEmptyVar(fsDialog.errors)) {
                                        fsDialog.validationUI.text(fsDialog.errors);
                                        fsDialog.validationUI.show();
                                        fsDialog.errors = null;
                                    }
                                }
                            } else {
                                fs_engine.pushEvent({ tipo: fs_engine.eventTypes.closeDialog, dialogId: fsDialog.id }).handleEvents();
                            }
                        },
                        "Cancelar": function () {
                            fsDialog.formMode = fs_engine.formMode.cancel;
                            fsDialog.cancelUI.click();
                            fs_engine.pushEvent({ tipo: fs_engine.eventTypes.closeDialog, dialogId: fsDialog.id }).handleEvents();
                            return false;
                        }
                    },
                    close: function (event, ui) {
                        // Cuando cerramos el diálogo reseteamos la variable mode  y el input asociado
                        fsDialog.modeUI.val(null);
                        fsDialog.mode = null;
                        fsDialog.formMode = null;
                        // Si se ha cerrado con la tecla esc recargamos los campos originales
                        if (event.originalEvent != undefined && event.originalEvent.originalEvent.keyIdentifier == 'U+001B') {
                            fsDialog.cancelUI.click();
                        }
                        fs_engine.pushEvent({ tipo: fs_engine.eventTypes.closeDialog, dialogId: fsDialog.id }).handleEvents();
                    }
                });

                addDialog(fsDialog);
                // Cambiamos título conforme al modo de pantalla
                fsDialog.d.dialog("option", "title", fsDialog.baseTitle);
                // Abrimos diálogo
                fsDialog.d.dialog("open");
                fsDialog.setupFocusHandler();
                fsDialog.autoFocus(false);
                return fsDialog;
            },
            /* Función: setupFocusHandler
        * Descripción: bindea el evento de focus a los inputs visibles del diálogo */
            setupFocusHandler: function () {
                // Selecciono los inputs y los selects que estén visibles y les asigno el evento focus
                fsDialog.d.find('input,select').not(':hidden').focus(function () {
                    // asigna el Id del control que tiene el foco		
                    fsDialog.focusControl = fsDialog.id;
                });
            },
            loadOriginalData: function (data) {
                if (!fs_engine.isEmptyVar(data)) {
                    for (var key in data) {
                        for (var i = 0; i < fsDialog.serializedFields.length; i++) {
                            if (fsDialog.serializedFields[i].element.id == key) {
                                fsDialog.serializedFields[i].element.val(data[key]);
                                fsDialog.serializedFields[i].value = data[key];
                                break;
                            }
                        }
                    }
                }
            },
            /* Función: closeDialog
        * Descripción: cierra el diálogo */
            closeDialog: function () {
                // Si ha fallado la validación no cerramos el formulario (solamente pasa si se ha pulsado el botón de apply
                // Cerramos el diálogo
                fsDialog.d.dialog("close");
                return fsDialog.d;
            },
            /* Función: isOpen
        * Descripción: devuelve si el diálogo se encuentra abierto */
            isOpen: function () {
                return fsDialog.d.dialog("isOpen");
            },
            /* Función: autoFocus 
            * Descripción: Hace focus sobre el primer input dependiendo de si ha fallado la validación o no
            * Params: - valFailer, Si ha habido fallo se hace focus sobre el primer control que ha fallado	*/
            autoFocus: function (valFailed) {
                fsDialog.focusControl = null;
                if (valFailed) {
                    fsDialog.focusControl = fsDialog.d.find('.validationFailed').first()[0].id;
                } else {
                    fsDialog.focusControl = $('input,select,textarea', fsDialog.d).not(':hidden').not('.deshab').first()[0].id;
                }
                if (fs_engine.isEmptyVar(fsDialog.focusControl)) {
                    return fs_engine.dmId(fsDialog.focusControl).focus();
                }
                return false;
            },
            // Campos del formulario serializados para su uso posterior
            serializedFields: [],
            // Recupera el valor del campo de la vista
            findField: function (_name) {
                var result = null;
                for (var i = 0; i < fsDialog.serializedFields.length; i++) {
                    if (fsDialog.serializedFields[i].element == _name) {
                        el = document.getElementById(fsDialog.serializedFields[i].element);
                        result = $(el).val();
                    }
                }
                return result;
            },
            /* Función: persistFields
            * Descripción: Función encargada de serializar los campos del formulario*/
            persistFields: function () {
                fsDialog.serializedFields = [];
                fsDialog.d.find(":input")
                    .not(":hidden")
                    .not(".deshab").each(function () {
                        var type = this.type, tag = this.tagName.toLowerCase(), field = null;
                        if (type == 'text' || type == 'password' || tag == 'textarea' || type == 'checkbox' || type == 'radio' || tag == 'select' || type == 'number')
                            field = { element: this.id, value: $(this).val() };
                        if (field)
                            fsDialog.serializedFields.push(field);
                    });
            },
            /* Función: loadFields
            * Descripción: Función encargada de cargar los datos serializados a cada componente correspondiente*/
            loadFields: function () {
                for (var i = 0; i < fsDialog.serializedFields.length; i++) {
                    el = document.getElementById(fsDialog.serializedFields[i].element);
                    $(el).val(fsDialog.serializedFields[i].value);
                }
            },
            /* Función: changedFields
            * Descripción: Comprobamos si ha cambiado algún campo del formulario*/
            changedFields: function () {
                // Solo comprobamos cambios en modo modificar
                if (!(fsDialog.mode == fs_engine.modes.mod))
                    return true;
                var result = true;
                for (var i = 0; i < fsDialog.serializedFields.length; i++) {
                    el = document.getElementById(fsDialog.serializedFields[i].element);
                    result = result && $(el).val() == fsDialog.serializedFields[i].value;
                    // Si ha cambiado algo
                    if (!result)
                        return true;
                }
                return false;
            },
            /* Función: clearFields
            * Descripción: Reseteamos los campos del formulario*/
            clearFields: function () {
                fsDialog.d.find(".campoAlta").find(":input").not(".perm").each(function () {
                    var type = this.type, tag = this.tagName.toLowerCase();
                    if (type == 'text' || type == 'password' || tag == 'textarea' || type == 'number')
                        this.value = '';
                    else if (type == 'checkbox' || type == 'radio')
                        this.checked = false;
                    else if (tag == 'select')
                        this.selectedIndex = 0;
                });
            },
            /* Función: decorateFields
            * Descripción: Decora los campos si ha habido un fallo de validación */
            decorateFields: function () {
                for (var i = 0; i < fsDialog.serializedFields.length; i++) {
                    var el = document.getElementById(fsDialog.serializedFields[i].element);
                    var message = $("[id='" + el.id + "Message']");
                    if (message.length > 0 && message.text()) {
                        $(el).addClass('validationFailed');
                        $(el).attr('title', message.text());
                    }
                }
            },
            /* Función: actualizaCampos
            * Descripción: Actualiza los campos del diálogo dependiendo del modo de entrada */
            actualizaCampos: function () {
                // Mostramos todos los campos para poder aplicarles disabled


                // Buscamos todos los campos de alta que no tengan clase "deshab" y los habilitamos
                fsDialog.d.find(".campoAlta").find(":input").not(".deshab").each(function () {
                    var type = this.type, tag = this.tagName.toLowerCase();
                    if (type == 'text' || type == 'password' || tag == 'textarea' || type == 'checkbox' || type == 'radio' || tag == 'select' || type == 'number')
                        this.disabled = false;
                });

                // Deshabilitamos todos los campos que tengan la clase "deshab"
                fsDialog.d.find(".deshab").each(function () {
                    var type = this.type, tag = this.tagName.toLowerCase();
                    if (type == 'text' || type == 'password' || tag == 'textarea' || type == 'checkbox' || type == 'radio' || tag == 'select' || type == 'number')
                        this.disabled = true;
                });

                /** Diferenciamos si venimos de:
                 * 
                 * 	Alta 	--> Ocultamos todos los campos modificación y baja que no sean también de alta y vacíamos los valores de los que son de alta
                 * 	Modif.	--> Ocultamos todos los campos alta y baja que no sean también de modificación
                 * 	Baja	--> Ocultamos todos los campos alta y modificación que no sean también de baja y deshabilitamos los que sean de baja
                 * 
                 */
                switch (fsDialog.mode) {
                    case fs_engine.modes.add:
                        fsDialog.d.find(".campoAlta").show();
                        fsDialog.d.find(".campoMod, .campoBaja").not(".campoAlta").hide();
                        // Si está abierto el díalogo y se ha llamado a esta función es porque ha habido un fallo de validación, limpiamos campos solo si está cerrado
                        if (!fsDialog.isValidationFail())
                            fsDialog.clearFields();
                        break;
                    case fs_engine.modes.mod:
                        fsDialog.d.find(".campoMod").show();
                        fsDialog.d.find(".campoAlta, .campoBaja").not(".campoMod").hide();
                        break;
                    case fs_engine.modes.del:
                        fsDialog.d.find(".campoBaja").show();
                        fsDialog.d.find(".campoAlta, .campoMod").not(".campoBaja").hide();
                        fsDialog.d.find(":input").each(function () {
                            var type = this.type, tag = this.tagName.toLowerCase();
                            if (type == 'text' || type == 'password' || tag == 'textarea' || type == 'checkbox' || type == 'radio' || tag == 'select' || type == 'number')
                                this.disabled = true;
                        });
                        break;
                    case fs_engine.modes.query:
                        fsDialog.d.find(":input").each(function () {
                            var type = this.type, tag = this.tagName.toLowerCase();
                            if (type == 'radio' || type == 'checkbox')
                                this.disabled = true;
                            if (type == 'text' || type == 'password' || tag == 'textarea' || tag == 'select' || type == 'number')
                                $(this).prop("readonly", true);
                        });
                        break;
                }

            },
            /* Función: isValidationFail
            *  Descripción: Devuelve si ha habido un fallo de validación */
            isValidationFail: function () {
                return fsDialog != null && !fs_engine.isEmptyVar(fsDialog.validationUI.text());
            }
        };
        return fsDialog;
    };
    return getInstance();
}