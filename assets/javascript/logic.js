$('#upload').change(function (e) {
    var reader = new FileReader();

    reader.readAsArrayBuffer(e.target.files[0]);

    reader.onload = function (e) {
        var data = new Uint8Array(reader.result);
        var wb = XLSX.read(data, { type: 'array' });
        var first_sheet_name = wb.SheetNames[0];

        var htmlstr = XLSX.write(wb, { sheet: first_sheet_name, type: 'binary', bookType: 'html' });
        $('#sample').append(htmlstr);

        console.log(htmlstr);
    }
});

// var XLSX = require('xlsx');
// var workbook = XLSX.readFile('test.xlsx');
// var sheet_name_list = workbook.SheetNames;
// sheet_name_list.forEach(function(y) {
//     var worksheet = workbook.Sheets[y];
//     var headers = {};
//     var data = [];
//     for(z in worksheet) {
//         if(z[0] === '!') continue;
//         //parse out the column, row, and value
//         var tt = 0;
//         for (var i = 0; i < z.length; i++) {
//             if (!isNaN(z[i])) {
//                 tt = i;
//                 break;
//             }
//         };
//         var col = z.substring(0,tt);
//         var row = parseInt(z.substring(tt));
//         var value = worksheet[z].v;

//         //store header names
//         if(row == 1 && value) {
//             headers[col] = value;
//             continue;
//         }

//         if(!data[row]) data[row]={};
//         data[row][headers[col]] = value;
//     }
//     console.log(data);
// });