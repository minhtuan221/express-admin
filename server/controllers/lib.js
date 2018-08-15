exports.createPermitTable = function (listpermit) {
    // body...
    listpermit = listpermit.sort()
    let permitTable = {
        'view': [],
        'add': [],
        'delete': [],
        'edit': [],
        'download': [],
    }

    for (let i = 0; i < listpermit.length; i++) {
        let permission = listpermit[i];
        if (permission.startsWith('view')) {
            permitTable['view'].push(permission)
            // console.log('view:' + permitTable);
        }
        if (permission.startsWith('add') || permission === 'admin') {
            permitTable['add'].push(permission)
        }
        if (permission.startsWith('delete')) {
            permitTable['delete'].push(permission)
        }
        if (permission.startsWith('edit')) {
            permitTable.edit.push(permission)
        }
        if (permission.startsWith('download')) {
            permitTable.download.push(permission)
        }
    }
    return permitTable
}

exports.convertToPermitTable = function (allroles) {
    // body...
    res = []
    for (let i = 0; i < allroles.length; i++) {
        let roles = allroles[i];
        roles['permitTable'] = exports.createPermitTable(roles['permission'])
        res.push(roles)
    }
    return res
}