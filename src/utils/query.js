const query = {};

query.get = (insert, rows) => {
    if (!rows || rows.length === 0)
        return 'select 0;';

    const resultTable = [];
    for (let r in rows) {
        const resultRow = [];
        for (let c in rows[r])
            resultRow.push(query.castCell(rows[r][c]));
        resultTable.push(resultRow);
    }

    resultScipt = resultTable.map(row => {
        return '(' + row.map(cell => cell ? `'${cell}'` : 'NULL').join(',') + ')';
    }).join(', ') + ';';

    return insert + ' values ' + resultScipt;
}

query.castCell = (value) => {
    if (value instanceof Date) {
        return value.getFullYear() + '-' + (value.getMonth() + 1) + '-' + value.getDate();
    }

    const type = typeof value;
    if (type === 'boolean') return value ? 1 : 0;
    if (type === 'string') return value
        .replace(/'/gi, '"')
        .replace(/[🙏,😘,😉,🏼,🌹]/gi, '')
        .replace(/\\/gi, '\\\\').slice(0, 1500);
    return value;
}

module.exports = {
    Query: query
}