module.exports = {
    roles: {
        admin: 1,
        normal: 0
    },
    operators: {
        equal: 0,
        more: 1,
        less: 2
    },
    isLogged: function (user) {
        return user != null && user != undefined && user.autenticated;
    },
    hasAdminRole: function (user) {
        return this.isLogged(user) && user.role == this.roles.admin;
    },
    isEmptyVar: function (data) {
        return data == null || data == undefined || data == "";
    }
}