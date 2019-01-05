const tools = require("./tools.js");

module.exports = {
    filter: {
        buildFilter: function (params, req, readonly) {
            var _titulo, _tipo, _op, _cantidad, _sharing;
            if (readonly) {
                var _titulo = req.session.filter.titulo, _tipo = req.session.filter.tipo, _op = req.session.filter.op, _cantidad = req.session.filter.cantidad, _sharing = req.session.filter.sharing;
            } else {
                var _titulo = params.titulo, _tipo = params.tipo, _op = params.op, _cantidad = params.cantidad, _sharing = params.sharing;
            }
            if (!readonly)
                req.session.filter = {};
            var filter = "";
            if (!tools.isEmptyVar(_titulo)) {
                filter = filter + " AND UPPER(c.titulo) LIKE UPPER('%" + _titulo + "%') ";
                if (!readonly)
                    req.session.filter["titulo"] = _titulo;
            }
            if (!tools.isEmptyVar(_tipo)) {
                filter = filter + " AND c.tipo = " + _tipo;
                if (!readonly)
                    req.session.filter["tipo"] = _tipo;
            }
            if (!tools.isEmptyVar(_cantidad) && _cantidad > 0) {
                switch (_op) {
                    case tools.operators.equal:
                        filter = filter + " AND c.cantidad = '" + _cantidad + "'";
                        break;
                    case tools.operators.more:
                        filter = filter + " AND c.cantidad >= '" + _cantidad + "'";
                        break;
                    case tools.operators.less:
                        filter = filter + " AND c.cantidad <= '" + _cantidad + "'";
                        break;
                    default:
                }
                if (!readonly) {
                    req.session.filter["op"] = _op;
                    req.session.filter["cantidad"] = _cantidad;
                }
            }
            if (!tools.isEmptyVar(_sharing)) {
                filter = filter + " AND (SELECT COUNT(*) FROM contabilidad c_s WHERE c_s.superid = c.superid AND c_s.usuario <> c_s.propietario) > 0";
            }
            return filter;
        },
        resetFilter: function (req) {
            req.session.filter = undefined;
        },
        isActiveFilter: function (req) {
            var result = true;
            if (!tools.isEmptyVar(req.session.filter) && Object.keys(req.session.filter).length > 0) {
                for (var key in req.session.filter) {
                    result = result && (!tools.isEmptyVar(req.session.filter[key]));
                }
            } else {
                result = false;
            }
            return result;
        }
    }

}