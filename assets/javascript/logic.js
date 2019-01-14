
const rABS = true; // true: readAsBinaryString ; false: readAsArrayBuffer

// main function loader for when file is uploaded for length calculation
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

        

        for (let i = 0; i < jsonSheet.length; i ++) {

            // Pulls remote and local locations and breaks into Arrays
            const LocalArr = jsonSheet[i]['L. Location'].split('.');
            const RemoteArr = jsonSheet[i]['R. Location'].split('.');
            const LocalPort = jsonSheet[i]['L. Port'].split('/');
            const RemotePort = jsonSheet[i]['L. Port'].split('/');

            console.log(LocalArr);

            // Object to hold all data of First Location
            const Localobj = {
                Location: LocalArr[0] + '.' + LocalArr[1] + '.' + LocalArr[2],
                Hall: LocalArr[4],
                Row: LocalArr[5],
                Cab: LocalArr[6],
                RU: LocalArr[7],
                Port: LocalPort
            };
            console.log("--- LOCAL OBJECT ---");
            console.log(Localobj);
            // Object to hold all data of Second Location
            const Remoteobj = {
                Location: RemoteArr[0] + '.' + RemoteArr[1] + '.' + RemoteArr[2],
                Hall: RemoteArr[4],
                Row: RemoteArr[5],
                Cab: RemoteArr[6],
                RU: RemoteArr[7],
                Port: RemotePort
            };
            console.log("--- REMOTE OBJECT ---");
            console.log(Remoteobj);
            console.log('______________________');

            // Calculations for length
            const ruWidth = 2;
        }
        
    };

    if (rABS) reader.readAsBinaryString(f); else reader.readAsArrayBuffer(f);
}

const upload = document.getElementById('upload');
upload.addEventListener('change', handleFile, false);