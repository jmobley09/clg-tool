
const rABS = true; // true: readAsBinaryString ; false: readAsArrayBuffer

// main function loader for when file is selected for upload
function handleFile(e) {

    // defines variable for uploaded file
    const files = e.target.files, f = files[0];
    const reader = new FileReader();

    // Function that determines what to do with uploaded file
    reader.onload = function (e) {
        const data = e.target.result;

        if (!rABS) data = new Uint8Array(data);

        // variable to pull data and pasrse through xlsx.js library
        const workbook = XLSX.read(data, { type: rABS ? 'binary' : 'array' });
        const first_sheet_name = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[first_sheet_name];

        // end result. uploaded file formated into json
        const jsonSheet = XLSX.utils.sheet_to_json(worksheet, { raw: true });
        console.log(jsonSheet);
        
    };

    if (rABS) reader.readAsBinaryString(f); else reader.readAsArrayBuffer(f);
}

const upload = document.getElementById('upload');
upload.addEventListener('change', handleFile, false);