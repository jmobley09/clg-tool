
const rABS = true; // true: readAsBinaryString ; false: readAsArrayBuffer

function handleFile(e) {
    const files = e.target.files, f = files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
        const data = e.target.result;

        if (!rABS) data = new Uint8Array(data);
        const workbook = XLSX.read(data, { type: rABS ? 'binary' : 'array' });

        const first_sheet_name = workbook.SheetNames[0];
        /* Get worksheet */
        const worksheet = workbook.Sheets[first_sheet_name];
        console.log(XLSX.utils.sheet_to_json(worksheet, { raw: true }));
    };
    if (rABS) reader.readAsBinaryString(f); else reader.readAsArrayBuffer(f);
}

const upload = document.getElementById('upload');
upload.addEventListener('change', handleFile, false);