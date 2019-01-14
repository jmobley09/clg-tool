
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

        // For loop to iterate through each object that is made. Each line in the speadsheet is an object
        for (let i = 0; i < jsonSheet.length; i++) {

            // Pulls remote and local locations and breaks into Arrays
            const LocalArr = jsonSheet[i]['L. Location'].split('.');
            const RemoteArr = jsonSheet[i]['R. Location'].split('.');
            const LocalPort = jsonSheet[i]['L. Port'].split('/');
            const RemotePort = jsonSheet[i]['L. Port'].split('/');
            let cableType = 'Cable';

            // Finds the correct cable type and changes it as needed
            const CableType = () => {
                if (jsonSheet[i]['Port Type'] == '100G' || jsonSheet[i]['Port Type'] == '40G' && LocalPort != 'Ethernet 1' || RemotePort != 'Ethernet 1') {
                    cableType = 'Fiber';
                } else if (jsonSheet[i]['Port Type'] == '10G' || jsonSheet[i]['Port Type'] == '1G' || jsonSheet[i]['Port Type'] == '10G' && LocalPort == 'Ethernet 1' || RemotePort == 'Ethernet 1') {
                    cableType = 'Copper';
                }
            }
            CableType();

            // Object to hold all data of First Location
            const Localobj = {
                Location: LocalArr[0] + '.' + LocalArr[1] + '.' + LocalArr[2],
                Hall: LocalArr[4],
                Row: LocalArr[5],
                Cab: LocalArr[6],
                RU: LocalArr[7],
                Port: LocalPort,
                Type: cableType
            };

            // Object to hold all data of Second Location
            const Remoteobj = {
                Location: RemoteArr[0] + '.' + RemoteArr[1] + '.' + RemoteArr[2],
                Hall: RemoteArr[4],
                Row: RemoteArr[5],
                Cab: RemoteArr[6],
                RU: RemoteArr[7],
                Port: RemotePort,
                Type: cableType
            };

            // Calculations for length
            // All variables stored in Inches
            const ruWidth = 2; // each RU is 2 in
            const topCopper = 12; // from top RU to copper tray is 10in
            const topFiber = 18; // from top RU to fiber tray is 10in
            const cabWidth = 27; // each cab is 2ft 3 in wide
            const cabLiu = 12; // from cab 1  or cab 35 to the liu tray at the end of the row
            const slack = 12; // extra 1 foot of slack for dressing;

            let inCabLength = 0;
            let outCabLength = 0;

            // Code block calculating Fiber connections that go out of cab
            const outCabCalc = () => {
                if (Localobj.Row !== Remoteobj.Row && Localobj.Type == "Fiber") {
                    console.log(outCabLength + 'Fiber Connection');
                }
            }
            outCabCalc();

            // Code block calculating In Cab Copper Connections
            const inCabCalc = () => {
                if (Localobj.Row == Remoteobj.Row && Localobj.Type == "Copper") {
                    const cabLength = Localobj.Cab - Remoteobj.Cab;
                    const fistRU = (52 - Localobj.RU) * 2; 
                    const secondRU = (52 - Remoteobj.RU) * 2; 
                    console.log(inCabLength + 'Copper Connection');
                }
            }
            inCabCalc();
        }

    };

    if (rABS) reader.readAsBinaryString(f); else reader.readAsArrayBuffer(f);
}

const upload = document.getElementById('upload');
upload.addEventListener('change', handleFile, false);