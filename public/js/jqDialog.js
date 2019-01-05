/* Tipo: libreria javascript
*  Nombre: jsfDialog.js
*  Descripción: - Contiene las funciones y variables necesarias para gestionar un diálogo en JSF 2.0
*  				- Esta es una libreria de apoyo al componente JSF: dialog.xhtml
*  				- Tiene relaciones con el componente JSF: jsfGrid.xhtml
*  				- Esta libreria se usa y usa la libreria javascript global de gesipla: gesiplajsf.js 
*  					*/ 

// Lista de tipo Array que mantiene las referencias de los diálogos JsfDialog creados a lo largo de la página
var jsfDialogs = [];
/* Función: findDialog
* Descripción: Busca y devuelve un JsfDialog en la lista de diálogos, se asigna el índice dentro de la lista. 
* 			   Devuelve undefined si no encuentra nada 
* Params: - jsfDialogId, Id de un diálogo a buscar */ 
function findDialog(jsfDialogId){
	for (var i = 0; i < jsfDialogs.length; i++){
		var jsfDialog = jsfDialogs[i];
		if (jsfDialog.id == jsfDialogId){
			jsfDialog.index = i;
			return jsfDialog;
		}			   					
	}
	return undefined;
}	
/* Función: addDialog
* Descripción: Añade un diálogo a la lista de diálogos, devuelve el mismo diálogo 
* Params: - jsfDialog */ 
function addDialog(jsfDialog){  				   					
	if (jsfDialog){
		// buscamos instancia anterior
		var preDialog = findDialog(jsfDialog.id);
		if (preDialog){
			// 	Destruimos el objeto jquery de diálogo
			preDialog.d.dialog("destroy");
			// 	Destruimos el html asociado al diólogo anterior para que no haya duplicados
			preDialog.d.remove();
			jsfDialogs.remove(preDialog.index);					
		}
		jsfDialogs.push(jsfDialog);
		return jsfDialog;
	}
}

/* Función: JsfDialog
* Descripción: Crea un diálogo, la función se crea mediante mecanismo de closure */ 

function JsfDialog() {
    var getInstance = function() {return createInstance(); };

	var createInstance = function() {
		var jsfDialog = {index: -1, // Index en el Array General de gesipla
						 creating: true,
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
						  autoOpen: false, // apertura automática del diálogo en la creacción
						  draggable: true, // Boolean que representa si se puede mover el diálogo
						  position: null, // Position inicial del diálogo
						  width: 'auto', // Anchura del diálogo
						  height: 'auto', // altura del diálogo, auto por defecto para que coja la altura de los componentes que tiene dentro
						  parentDialog: null, // Diálogo Parent
						  formMode: null,
						  validationId: null, // Selector del Elemento que representa si se encuentra validada la petición realizada
						  focusControl: null,
						  childGrids: null,
						  /* Función: toDialog
						  * Descripción: función encarcaga de crear un diálogo*/ 
						  toDialog: function(){							  
							  		jsfDialog.childGrids = this.d.find('.tableGrid');
							  		jsfDialog.d.dialog({modal:this.modal,
												   autoOpen: jsfDialog.autoOpen,
												   draggable: jsfDialog.draggable,
												   position: jsfDialog.position,
												   width: jsfDialog.width,
												   height: jsfDialog.height,
												   scrollingRows:true,
											       buttons: {
											            	"Aceptar": function() {
											            			if (jsfDialog.changedFields()){
											            				jsfDialog.formMode = gesipla.formMode.apply;
											            				gesipla.pushEvent({tipo: gesipla.eventTypes.closeDialog, dialogId: jsfDialog.id});		
											            				jsfDialog.applyUI.click();
											            			}else
											            				alert("cambia algo coño");
											            			return false;
											            			},
											            	"Cancelar": function() {
											            			jsfDialog.formMode = gesipla.formMode.cancel;
											            			gesipla.pushEvent({tipo: gesipla.eventTypes.closeDialog, dialogId: jsfDialog.id});
											            			jsfDialog.cancelUI.click();
											            			return false;
											            			}
											        },											        
												   close: function(event, ui) {
													   var jsfGrid = findGrid(jsfDialog.jg); 
														if (jsfGrid && jsfDialog.formMode == gesipla.formMode.apply)
															if (jsfDialog.mode == gesipla.modes.add || jsfDialog.mode == gesipla.modes.del)
																gesipla.pushEvent({tipo: gesipla.eventTypes.selectRow, jsfGridId: jsfGrid.id, selectedId: undefined}).handleEvents();
															else 
																gesipla.pushEvent({tipo: gesipla.eventTypes.selectRow, jsfGridId: jsfGrid.id, selectedId: jsfGrid.selectedId}).handleEvents();
														// Cuando cerramos el diálogo reseteamos la variable mode  y el input asociado
														jsfDialog.modeUI.val(null);									
														jsfDialog.mode = null;	
														jsfDialog.formMode = null;
														// Si se ha cerrado con la tecla esc recargamos los campos originales
														if (event.originalEvent != undefined && event.originalEvent.originalEvent.keyIdentifier == 'U+001B')
															jsfDialog.cancelUI.click();
												   }
												  });									
									$(jsfDialog.d).parent().appendTo(jsfDialog.formUI);
									return jsfDialog.d;
								},
  					    /* Función: setupFocusHandler
						* Descripción: bindea el evento de focus a los inputs visibles del diálogo */ 								
						setupFocusHandler: function(){
							// Selecciono los inputs y los selects que estén visibles y les asigno el evento focus
							jsfDialog.d.find('input,select').not(':hidden').focus(function() {
							      // asigna el Id del control que tiene el foco		
								  jsfDialog.focusControl = this.id;
							  });																				
						},
  					    /* Función: closeDialog
						* Descripción: cierra el diálogo */						
						closeDialog: function(){
		                				// Si ha fallado la validación no cerramos el formulario (solamente pasa si se ha pulsado el botón de apply
										// Cerramos el diálogo
										jsfDialog.d.dialog("close");
										return jsfDialog.d;
									 },
  					    /* Función: isOpen
						* Descripción: devuelve si el diálogo se encuentra abierto */									 
						isOpen: function(){
									return jsfDialog.d.dialog("isOpen");
						},
  					    /* Función: openDialog
						* Descripción: Abre el diálogo
						* Params: - mode: modo del diálogo, están definidos en gesipla.modes  */						
						openDialog: function(mode){
										if (jsfDialog.creating && !jsfDialog.autoOpen){
											jsfDialog.creating = false;
											return false;
										}
										var launch = true;
										/* Recuperamos el objeto jsfGrid para determinar si se puede lanzar el diálogo
										 * si no tiene grid asociado se lanza el diálogo normalmente
										 * El díalogo se lanza si está seleccionada una fila en el grid o el el modo es añadir */ 
										var grid = findGrid(jsfDialog.jg); 
										if (grid)
											launch = grid.selectedId || mode == gesipla.modes.add; 
										 
										if (launch){
											// Incializamos modo
											jsfDialog.mode = mode;
											jsfDialog.modeUI.val(mode);
											// Actualizamos el estado de los campos del formulario
											// Cambiamos título conforme al modo de pantalla
											jsfDialog.changeTitle();
											// Abrimos diálogo
											jsfDialog.d.dialog("open");
											gesipla.pushEvent({tipo: gesipla.eventTypes.resizeGrid, dialog: this});
											jsfDialog.refreshUI.trigger('click');											
											jsfDialog.setupFocusHandler();
											jsfDialog.autoFocus(false, true);
				   			   				// Seleccionamos el primer control editable disponible que no esté oculto
				   			   								   			   				
											return jsfDialog.d;
										}else{
											alert('No se puede editar sin seleccionar un registro');
										}	
									},
					    /* Función: adjustChildGridsSize 
						* Descripción: Ajusta el tamaño de los Grids que están dentro del diálogo */									
						adjustChildGridsSize: function(){
							for (var i=0; i<jsfDialog.childGrids.length; i++){
								j = 0;
								var jsfGrid = findGrid(jsfDialog.childGrids[i].id.replace(/:datatable/, "")); 
								jsfGrid.adjustGridSize();
							}							
						},
					    /* Función: autoFocus 
						* Descripción: Hace focus sobre el primer input dependiendo de si ha fallado la validación o no
						* Params: - valFailer, Si ha habido fallo se hace focus sobre el primer control que ha fallado	*/															
						autoFocus: function(valFailed){
										jsfDialog.focusControl = null; 
										if (valFailed){
											jsfDialog.focusControl = jsfDialog.d.find('.validationFailed').first()[0].id;
										}else{
		   			   						jsfDialog.focusControl = $('input,select', jsfDialog.d).not(':hidden').not('.deshab').first()[0].id; 											
										}
										if (jsfDialog.focusControl){
		   			   						return $("[id='" + jsfDialog.focusControl + "']").focus();
										}
										return false;
						},
					    /* Función: changeTitle
						* Descripción: Cambia el título dependiendo del modo del diálogo, si no hay modo el título se queda igual*/						
						changeTitle: function(){									
			                			switch(jsfDialog.mode){
			                				case gesipla.modes.add:
			                					title = jsfDialog.baseTitle + " - Añadir";
			                					break;
			                				case gesipla.modes.mod:
			                					title = jsfDialog.baseTitle + " - Modificar";
			                					break;
			                				case gesipla.modes.del:
			                					title = jsfDialog.baseTitle + " - Borrar";
			                					break;
			                				case gesipla.modes.query:
			                					title = jsfDialog.baseTitle + " - Consulta";
			                					break;
			    		   			   		default:
			    		   			   			title = jsfDialog.baseTitle;
			    			   			   		break;			                					
			                			}
			                			jsfDialog.d.dialog("option", "title", title);
									},
						// Campos del formulario serializados para su uso posterior
						serializedFields: [],
					    /* Función: persistFields
						* Descripción: Función encargada de serializar los campos del formulario*/						
						persistFields: function(){
							jsfDialog.serializedFields = [];						
							jsfDialog.d.find(".campoAlta").find(":input")
													 .not("[type='hidden']")
													 .not(".deshab").each(function() {
														 var type = this.type, tag = this.tagName.toLowerCase(), field = null;							      
														 if (type == 'text' || type == 'password' || tag == 'textarea' || type == 'checkbox' || type == 'radio' || tag == 'select')
															 field = {element: this.id, value: $(this).val()};
														 if (field)
															 jsfDialog.serializedFields.push(field);
							}); 
						},
					    /* Función: loadFields
						* Descripción: Función encargada de cargar los datos serializados a cada componente correspondiente*/												
						loadFields: function(){
		   					for (var i = 0; i < jsfDialog.serializedFields.length; i++){
								el = document.getElementById(jsfDialog.serializedFields[i].element);
								$(el).val(jsfDialog.serializedFields[i].value);
							}
						},
					    /* Función: changedFields
						* Descripción: Comprobamos si ha cambiado algún campo del formulario*/												
						changedFields: function(){
							// Solo comprobamos cambios en modo modificar
							if (!(jsfDialog.mode == gesipla.modes.mod))
								return true;
							var result = true;								
							for (var i = 0; i < jsfDialog.serializedFields.length; i++){
								el = document.getElementById(jsfDialog.serializedFields[i].element);
								result = result && $(el).val() == jsfDialog.serializedFields[i].value;
								// Si ha cambiado algo
								if (!result)
									return true;
							}
							return false;
						},
					    /* Función: clearFields
						* Descripción: Reseteamos los campos del formulario*/						
						clearFields: function(){
							jsfDialog.d.find(".campoAlta").find(":input").not(".perm").each(function() {
							      var type = this.type, tag = this.tagName.toLowerCase();
							      if (type == 'text' || type == 'password' || tag == 'textarea')
							        this.value = '';
							      else if (type == 'checkbox' || type == 'radio')
							        this.checked = false;
							      else if (tag == 'select')
							        this.selectedIndex = 0;
							    });
						},
					    /* Función: decorateFields
						* Descripción: Decora los campos si ha habido un fallo de validación */												
						decorateFields: function(){
							for (var i = 0; i < jsfDialog.serializedFields.length; i++){
								var el = document.getElementById(jsfDialog.serializedFields[i].element);
								var message = $("[id='" + el.id + "Message']");
								if (message.length>0 && message.text()){
									$(el).addClass('validationFailed');
									$(el).attr('title', message.text());
								}	
							}
						},
					    /* Función: actualizaCampos
						* Descripción: Actualiza los campos del diálogo dependiendo del modo de entrada */																		
						actualizaCampos: function(){
							// Mostramos todos los campos para poder aplicarles disabled

							
							// Buscamos todos los campos de alta que no tengan clase "deshab" y los habilitamos
							jsfDialog.d.find(".campoAlta").find(":input").not(".deshab").each(function() {
							      var type = this.type, tag = this.tagName.toLowerCase();
							      if (type == 'text' || type == 'password' || tag == 'textarea' || type == 'checkbox' || type == 'radio' || tag == 'select')
							        this.disabled = false;
							    });
							
							// Deshabilitamos todos los campos que tengan la clase "deshab"
							jsfDialog.d.find(".deshab").each(function() {
							      var type = this.type, tag = this.tagName.toLowerCase();
							      if (type == 'text' || type == 'password' || tag == 'textarea' || type == 'checkbox' || type == 'radio' || tag == 'select')
							        this.disabled = true;
							    });
							
							/** Diferenciamos si venimos de:
							 * 
							 * 	Alta 	--> Ocultamos todos los campos modificación y baja que no sean también de alta y vacíamos los valores de los que son de alta
							 * 	Modif.	--> Ocultamos todos los campos alta y baja que no sean también de modificación
							 * 	Baja	--> Ocultamos todos los campos alta y modificación que no sean también de baja y deshabilitamos los que sean de baja
							 * 
							 */ 
							switch (jsfDialog.mode){
								case gesipla.modes.add:
									jsfDialog.d.find(".campoAlta").show();															
									jsfDialog.d.find(".campoMod, .campoBaja").not(".campoAlta").hide();
									// Si está abierto el díalogo y se ha llamado a esta función es porque ha habido un fallo de validación, limpiamos campos solo si está cerrado
									if (!jsfDialog.isValidationFail())
										jsfDialog.clearFields();
							 break;
								case gesipla.modes.mod:
									jsfDialog.d.find(".campoMod").show();
									jsfDialog.d.find(".campoAlta, .campoBaja").not(".campoMod").hide(); 
								break;
								case gesipla.modes.del:
									jsfDialog.d.find(".campoBaja").show();									
									this.d.find(".campoAlta, .campoMod").not(".campoBaja").hide();
									/*jsfDialog.d.find(":input").each(function() {
									      var type = this.type, tag = this.tagName.toLowerCase();
									      if (type == 'text' || type == 'password' || tag == 'textarea' || type == 'checkbox' || type == 'radio' || tag == 'select')
									        this.disabled = true;
									    });*/ 
								break;
							}
							
						},
					    /* Función: isValidationFail
						* Descripción: Devuelve si ha habido un fallo de validación */																								
						isValidationFail: function (){
							return $("[id='" + jsfDialog.validationId + "']").length > 0;
						}
				};
		return jsfDialog;
	};
	return getInstance();
}