$(document).ready(function () {
    fs_engine.addMenuItem('main', function (data) {
        // Asignamos el html al mainUI
        fs_engine.mainUI.html(data);
        // Opciones generales de los charts
        var pieOptions = {
            responsive: true,
            maintainAspectRatio: false,
            events: false,
            animation: {
                duration: 500,
                easing: "easeOutQuart",
                onComplete: function () {
                    var ctx = this.chart.ctx;
                    ctx.font = Chart.helpers.fontString(Chart.defaults.global.defaultFontFamily, 'normal', Chart.defaults.global.defaultFontFamily);
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'bottom';

                    this.data.datasets.forEach(function (dataset) {

                        for (var i = 0; i < dataset.data.length; i++) {
                            var model = dataset._meta[Object.keys(dataset._meta)[0]].data[i]._model,
                                total = dataset._meta[Object.keys(dataset._meta)[0]].total,
                                mid_radius = model.innerRadius + (model.outerRadius - model.innerRadius) / 2,
                                start_angle = model.startAngle,
                                end_angle = model.endAngle,
                                mid_angle = start_angle + (end_angle - start_angle) / 2;

                            var x = mid_radius * Math.cos(mid_angle);
                            var y = mid_radius * Math.sin(mid_angle);
                            var viewport_wd = fs_engine.viewport().width;
                            if (viewport_wd > 480) {
                                ctx.font = "1em Verdana";
                            } else { ctx.font = "1.5em Verdana"; }
                            ctx.fillStyle = '#fff';
                            if (i == 3) { // Darker text color for lighter background
                                ctx.fillStyle = '#444';
                            }
                            var percent = String(Math.round(dataset.data[i] / total * 100)) + "%";
                            ctx.fillText(dataset.data[i] + "€", model.x + x, model.y + y);
                            // Display percent in another line, line break doesn't work for fillText
                            ctx.fillText(percent, model.x + x, model.y + y + emRemToPx(viewport_wd > 480 ? "1em" : "1.5em"));
                        }
                    });
                }
            }
        };

        //var viewport_wd = fs_engine.viewport().width;
        //$("canvas").prop('width', emRemToPx(viewport_wd > 480 ? "20em" : "10em"));
        //$("canvas").prop('height', emRemToPx(viewport_wd > 480 ? "20em" : "20em"));
        //$("canvas").css('width', '13em');
        //$("canvas").css('height', '13em');
        if (typeof pie1_data !== 'undefined') {
            var ctx = $("#myChart1");
            new Chart(ctx, {
                type: 'pie',
                data: {
                    datasets: [pie1_data],
                    labels: pie1_labels

                },
                options: fs_engine.concatObjects(pieOptions, { legend: { labels: { fontSize: fs_engine.viewport().width > 480 ? 25 : 35 } } })

            });
        }
        if (typeof pie2_data !== 'undefined') {
            var ctx = $("#myChart2");
            new Chart(ctx, {
                type: 'pie',
                data: {
                    datasets: [pie2_data],
                    labels: pie2_labels

                },
                options: fs_engine.concatObjects(pieOptions, { legend: { labels: { fontSize: fs_engine.viewport().width > 480 ? 25 : 35 } } })

            });
        }
        if (typeof pie3_data !== 'undefined') {
            var ctx = $("#myChart3");
            new Chart(ctx, {
                type: 'pie',
                data: {
                    datasets: [pie3_data],
                    labels: pie3_labels

                },
                options: fs_engine.concatObjects(pieOptions, { legend: { labels: { fontSize: fs_engine.viewport().width > 480 ? 25 : 35 } } })
            });
        }
        for (var id in Chart.instances) {
            Chart.instances[id].resize()
        }
       

    });
    if (!fs_engine.isEmptyVar(last_reload)) {
        fs_engine.menuHandler(last_reload);
    } else {
        fs_engine.menuHandler('main');
    }
    fs_engine.renderMenu();
});

