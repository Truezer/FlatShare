
fs_engine.resize_funcs.push(function () {
});

$(document).ready(function () {
    fs_engine.addMenuItem('plan', function (data) {
        // Asignamos el html al mainUI
        fs_engine.mainUI.html(data);
        $(window).resize();

    }
 });
