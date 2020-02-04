const { NewId } = require('../utils/random');

const Excel = require('exceljs');

const excel = {};

excel.load = async (path, expectedColumns) => {
    const columns = [];
    const workbook = new Excel.Workbook();
    await workbook.xlsx.readFile(__dirname + '\\..\\..\\data\\' + path);
    const worksheet = workbook.worksheets[0];
    for (var c = 0; c < worksheet.columns.length; c++) {
        const value = worksheet.getCell(1, c + 1).value;
        const columnResult = value
            ? value.toString().trim().replace(/  /gi, ' ').replace(/ /gi, '.').toUpperCase()
            : null;

        if (expectedColumns.some(col => col == columnResult))
            columns.push({ index: c + 1, name: columnResult });
    }

    if (expectedColumns) {
        for (var c = 0; c < expectedColumns.length; c++) {
            if (!columns.some(col => col.name == expectedColumns[c]))
                return null;
        }
    }

    return { columns, worksheet };
}

excel.readLine = (worksheet, columns, index) => {
    const lineRows = {};
    for (var c = 0; c < columns.length; c++) {
        const column = columns[c];
        const text = worksheet.getCell(index, column.index).text;
        const value = worksheet.getCell(index, column.index).value;
        if (!value || !text) {
            lineRows[column.name] = null;
            continue;
        }

        if (value instanceof Date) {
            lineRows[column.name] = value;
            continue;
        }

        lineRows[column.name] = text.toString().trim();
    }

    return lineRows;
}

module.exports = {
    Excel: excel
}