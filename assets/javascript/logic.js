
$('#NextModal').modal({ show: false });

// required modules
requirejs.config({
    //Pass the top-level main.js/index.js require
    //function to requirejs so that node modules
    //are loaded relative to the top-level JS file.
    nodeRequire: require
});

requirejs(['./liu_sql.js'],
function   (foo,   bar) {
    //foo and bar are loaded according to requirejs
    //config, but if not found, then node's require
    //is used to load the module.
});

console.log(sql.results);

// console.log(constructors);

const rABS = true; // true: readAsBinaryString ; false: readAsArrayBuffer

// main function loader for when file is uploaded for length calculation
function handleFile(e) {

    // defines variable for uploaded file
    const files = e.target.files, f = files[0];
    const reader = new FileReader();
    const fileName = files[0].name;

    // Function that determines what to do with uploaded file
    reader.onload = function (e) {
        const data = e.target.result;
        if (!rABS) data = new Uint8Array(data);

        // variable to pull data and pasrse through xlsx.js library
        const workbook = XLSX.read(data, { type: rABS ? 'binary' : 'array' });
        const first_sheet_name = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[first_sheet_name];

        // end result. uploaded file formated into json
        let jsonSheet = XLSX.utils.sheet_to_json(worksheet);
        console.log(jsonSheet);
        // For loop to iterate through each object that is made. Each line in the speadsheet is an object
        for (let i = 0; i < jsonSheet.length; i++) {

            // var to change number to correct cell, used @ type convert function
            const cellNum = i + 2;

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
                };
            };
            CableType();

            // Object to hold all data of First Location
            const Localobj = {
                Location: LocalArr[0] + '.' + LocalArr[1] + '.' + LocalArr[2],
                Hall: LocalArr[4],
                Row: parseFloat(LocalArr[5]),
                Cab: parseFloat(LocalArr[6]),
                RU: parseFloat(LocalArr[7]),
                Port: LocalPort,
                Type: cableType
            };

            // Object to hold all data of Second Location
            const Remoteobj = {
                Location: RemoteArr[0] + '.' + RemoteArr[1] + '.' + RemoteArr[2],
                Hall: RemoteArr[4],
                Row: parseFloat(RemoteArr[5]),
                Cab: parseFloat(RemoteArr[6]),
                RU: parseFloat(RemoteArr[7]),
                Port: RemotePort,
                Type: cableType
            };

            // Calculations for length
            // All variables stored in Inches
            const ruWidth = 2; // each RU is 2 in
            const topCopper = 24; // from top RU to copper tray is 24in
            const topFiber = 30; // from top RU to fiber tray is 10in
            const cabWidth = 27; // each cab is 2ft 3 in wide
            const cabLiu = 12; // from cab 1  or cab 35 to the liu tray at the end of the row
            const slack = 24; // extra 1 foot of slack for dressing;
            const cabGap = 48; // every cab gap is 4 FT & they are located between cabs 10-11 & 25-26

            let inCabLength = 0;
            let outCabLength = 0;

            if (jsonSheet[i]['R. Port'] == 'NextAvailable') {
                $('#NextModal').modal('show');
                console.log('test');
                throw " ";
            }

            // Code block calculating In Cab Copper Connections
            const CabCalc = () => {

                // Calculates the number of cabs apart, and returns only positive numbers
                let cabLength = 0;
                const cabLengthCalc = () => {

                    if (Localobj.Cab > Remoteobj.Cab) {
                        cabLength = (Localobj.Cab - Remoteobj.Cab) * cabWidth;
                        return cabLength;
                    } else if (Remoteobj.Cab > Localobj.Cab) {
                        cabLength = (Remoteobj.Cab - Localobj.Cab) * cabWidth;
                        return cabLength;
                    } else if (Remoteobj.Cab == Localobj.Cab) {
                        cabLength = (Remoteobj.Cab - Localobj.Cab) * cabWidth;
                        return cabLength;
                    };
                };
                cabLengthCalc();

                // Vars to be used in calculations 
                const fistRU = (52 - Localobj.RU) * ruWidth;
                const secondRU = (52 - Remoteobj.RU) * ruWidth;

                // Adds the necessary gaps between the rows that have them
                let LengthIn = 0;
                const GapAdder = () => {
                    if (Localobj.Cab <= 10 && (Remoteobj.Cab >= 11 && Remoteobj.Cab <= 25)) {
                        LengthIn = (cabLength + fistRU + secondRU + slack + (topCopper * 2)) + cabGap;
                        return LengthIn;
                    } else if ((Localobj.Cab >= 11 && Localobj.Cab <= 25) && Remoteobj.Cab >= 26) {
                        LengthIn = (cabLength + fistRU + secondRU + slack + (topCopper * 2)) + cabGap;
                        return LengthIn;
                    } else if (Localobj.Cab <= 10 && Remoteobj.Cab >= 26) {
                        LengthIn = (cabLength + fistRU + secondRU + slack + (topCopper * 2)) + (cabGap * 2);
                        return LengthIn;
                    } else {
                        LengthIn = cabLength + fistRU + secondRU + slack + (topCopper * 2);
                        return LengthIn;
                    };
                };
                GapAdder();

                // take length in inches and converts to feet
                const inCabLength = Math.ceil(LengthIn / 12);
                const inCabMeter = Math.ceil(inCabLength * .3048);

                // takes in type of cable and adds to json object along with length
                const typeConvert = () => {
                    if (Localobj.Type == "Copper") {
                        jsonSheet[i]['Cable Type'] = "Copper";
                        jsonSheet[i]['Run1'] = inCabLength + 'ft';
                    } else if (Localobj.Type == "Fiber") {
                        jsonSheet[i]['Cable Type'] = "Fiber";
                        jsonSheet[i]['Run1'] = inCabMeter + 'm';
                    }
                }
                typeConvert();
            };
            CabCalc();
        }; // end of for loop
        // 
        // Beginning of code to write info to new workbook and trigger a download
        // 
        const filename = "SS_" + fileName;
        const ws_name = "SS_CablePlan";
        console.log(jsonSheet);
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(jsonSheet);

        /* add worksheet to workbook */
        XLSX.utils.book_append_sheet(wb, ws, ws_name);

        /* write workbook */
        XLSX.writeFile(wb, filename);

    };

    if (rABS) reader.readAsBinaryString(f); else reader.readAsArrayBuffer(f);
};

const upload = document.getElementById('upload');
upload.addEventListener('change', handleFile, false);