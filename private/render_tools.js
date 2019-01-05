const tools = require("./tools.js");

module.exports = {
    formatters: {
        jsonToVarHtml: function (varNames, data) {
            var result = "";
            if (varNames.length > 0) {
                result = "<script> ";
                for (var i = 0; i <= varNames.length - 1; i++) {
                    result = result + " var " + varNames[i] + " = " + JSON.stringify(data[i]) + "; ";
                }
                result = result + " </script>";
            }
            return result; 
        }
    }

}