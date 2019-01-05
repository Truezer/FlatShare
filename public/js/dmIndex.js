        var dPrueba_js = null;
         	function dPrueba_launchDialog(data){
         		// Borramos anteriores instancias de los div existentes         		
					jd.openDialog(data.mode);
         	}
         	
         	jQuery(document).ready(function() {
            	#{cc.attrs.id}_launchDialog();
                });