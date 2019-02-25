$('#NextModal').modal({ show: false });
$('#PortModal').modal({ show: false });

const rABS = true; // true: readAsBinaryString ; false: readAsArrayBuffer

// main function loader for when file is uploaded for length calculation
function handleFile(e) {

    // defines variable for uploaded file
    const files = e.target.files || e.dataTransfer.files, f = files[0];
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

        // Variables for storing labels and lengths. Used to write Json data to excel file
        let labelSheet = [];
        let lengthSheet = [];
        console.log(jsonSheet);

        // Variables for storing the cable types
        const consCables = [];
        const mgmtCables = [];
        const uplinkCables = [];
        const smfibCables = [];
        const mmfibCables = [];


        // For loop to iterate through each object that is made. Each line in the speadsheet is an object
        for (let i = 0; i < jsonSheet.length; i++) {

            if (jsonSheet[i]['R. Port'] == 'NextAvailable') {
                $('#NextModal').modal('show');
                throw " ";
            };
            
            // Pulls local locations and breaks into Arrays
            const LocalArr = jsonSheet[i]['L. Location'].split('.') || jsonSheet[i]['Location'].split('.');
            const LocalPort = jsonSheet[i]['L. Port'].split('/') || jsonSheet[i]['Port'].split('/');
            const LocalSlot = jsonSheet[i]['L. Slot'].split(' ') || jsonSheet[i]['Slot'].split(' ');

            if (typeof jsonSheet[i]['L. Port'] == "string") {
                RemotePort = jsonSheet[i]['L. Port'].split('/');
            } else if (typeof jsonSheet[i]['L. Port'] == "number") {
                RemotePort = ['Ethernet' + jsonSheet[i]['L. Port']];
            }

            // Pulls remote locations and breaks into Arrays
            const RemoteArr = jsonSheet[i]['R. Location'].split('.');
            const RemoteSlot = jsonSheet[i]['R. Slot'].split(' ');
            let RemotePort = jsonSheet[i]['R. Port'];

            if (typeof jsonSheet[i]['R. Port'] == "string") {
                RemotePort = jsonSheet[i]['R. Port'].split('/');
            } else if (typeof jsonSheet[i]['R. Port'] == "number") {
                RemotePort = ['Ethernet' + jsonSheet[i]['R. Port']];
            }
            
            console.log(RemotePort);

            let cableType = 'Cable';
            
            // Finds the correct cable type and changes it as needed
            const CableType = () => {
                
                // determines management cables 
                if (LocalPort.includes('Management') || RemotePort.includes('Management') && jsonSheet[i]['Port Type'] == '1G' || jsonSheet[i]['Port Type'] == '10G') {
                    cableType = 'mgmt';
                    // determines console cables 
                } else if (LocalPort.includes('console') || RemotePort.includes('console') && jsonSheet[i]['Port Type'] == '1G' || jsonSheet[i]['Port Type'] == '10G') {
                    cableType = 'cons';
                    // determines all copper uplinks to port 49
                } else if (LocalPort.includes('Ethernet49') || RemotePort.includes('Ethernet49') && jsonSheet[i]['Port Type'] == '1G' || jsonSheet[i]['Port Type'] == '10G') {
                    cableType = 'uplink';
                    // determines all copper uplinks to port 51
                } else if (LocalPort.includes('Ethernet51') || RemotePort.includes('Ethernet51') && jsonSheet[i]['Port Type'] == '1G' || jsonSheet[i]['Port Type'] == '10G') {
                    cableType = 'uplink';
                    // determines single mode fiber
                } else if (jsonSheet[i]['Port Type'] == '100G' || LocalSlot != '1' || RemoteSlot != '1') {
                    cableType = 'smfib';
                } else {
                    cableType = 'mmfib';
                }
            };
            CableType();
            
            // Object to hold all data of First Location
            const Localobj = {
                Location: LocalArr[0] + '.' + LocalArr[1] + '.' + LocalArr[2],
                Hall: LocalArr[4],
                Row: parseFloat(LocalArr[5]),
                Cab: parseFloat(LocalArr[6]),
                RU: parseFloat(LocalArr[7]),
                Slot: LocalSlot[1] || 1,
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
                Slot: RemoteSlot[1] || 1,
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

                function mdfCalc() {

                }

                // takes in type of cable and adds to json object along with length
                const typeConvert = () => {
                    if (Localobj.Type == "cons") {
                        jsonSheet[i]['Cable Type'] = "Copper";
                        jsonSheet[i]['Run1'] = inCabLength + 'ft';
                        consCables.push(inCabLength);
                    } else if (Localobj.Type == "mgmt") {
                        jsonSheet[i]['Cable Type'] = "Copper";
                        jsonSheet[i]['Run1'] = inCabLength + 'ft';
                        mgmtCables.push(inCabLength);
                    } if (Localobj.Type == "uplink") {
                        jsonSheet[i]['Cable Type'] = "Copper";
                        jsonSheet[i]['Run1'] = inCabLength + 'ft';
                        uplinkCables.push(inCabLength);
                    } else if (Localobj.Type == "smfib") {
                        jsonSheet[i]['Cable Type'] = "Fiber";
                        jsonSheet[i]['Run1'] = inCabMeter + 'm';
                        smfibCables.push(inCabMeter);
                        mdfCalc();
                    } else if (Localobj.Type == "mmfib") {
                        jsonSheet[i]['Cable Type'] = "Fiber";
                        jsonSheet[i]['Run1'] = inCabMeter + 'm';
                        mmfibCables.push(inCabMeter);
                        mdfCalc();
                    }
                }
                typeConvert();
            };
            CabCalc();

            // sorts all the lengths that were added into either the ft length array or the meter length arr
            // creates a second array with total of each instance of the unique values
            function addlengths(arr) {
                let a = [];
                let b = [];
                let prev;

                arr.sort();
                for (let i = 0; i < arr.length; i++) {
                    if (arr[i] !== prev) {
                        a.push(arr[i]);
                        b.push(1);
                    } else {
                        b[b.length - 1]++;
                    }
                    prev = arr[i];
                }

                return [a, b];
            };

            // Creates the label for each row and appends to sheet
            function createLabel() {

                // ---------------------- Defined Variables
                let labelobj = {};
                let labelobj2 = {};

                let srcPort = '';
                let rmtPort = '';

                let srcname = Localobj.Port[0].split('');
                let srcintro = srcname[0] + srcname[1] + srcname[2] + srcname[srcname.length - 1];

                let rmtname = Remoteobj.Port[0].split('');
                let rmtintro = rmtname[0] + rmtname[1] + rmtname[2] + rmtname[rmtname.length - 1];

                // ----------------------

                // defines what will be used from objects to generate the source side of the label
                // correct port so that the label will print easier to read for source
                let srcLabel = Localobj.Hall + '.' + Localobj.Row + '.' + Localobj.Cab + ' U' + Localobj.RU;

                if (Localobj.Port == "Management1" || Localobj.Port == 'Management') {
                    srcPort = 'Mgmt';
                } else if (Localobj.Port == 'Management2') {
                    srcPort = 'Mgmt' + srcname[srcname.length - 1];
                } else if (Localobj.Port == 'Console2') {
                    srcPort = 'Con' + srcname[srcname.length - 1];
                } else if (Localobj.Port == 'Console' || Localobj.Port == 'Console1') {
                    srcPort = 'Con';
                } else if (srcname.length == 10) {
                    srcPort = srcname[0] + srcname[1] + srcname[2] + srcname[srcname.length - 2] + srcname[srcname.length - 1];
                } else if (Localobj.Slot == "Null" || Localobj.Slot == "Undefined" || Localobj.Slot == "1") {
                    srcPort = srcintro;
                } else if (Localobj.Port.length == 2 && Localobj.Port != "Management1" || Localobj.Port != 'Management2' || Localobj.Port != 'Console1' || Localobj.Port != 'Console2') {
                    srcPort = srcintro + '/' + Localobj.Port[1];
                } else if (Localobj.Port.length > 2) {
                    srcPort = Localobj.Slot + '/' + srcname[srcname.length - 1];
                }

                // defines what will be used from objects to generate the destination side of the label
                // correct port so that the label will print easier to read for destination
                let rmtLabel = Remoteobj.Hall + '.' + Remoteobj.Row + '.' + Remoteobj.Cab + ' U' + Remoteobj.RU;

                if (Remoteobj.Port == 'Management1' || Remoteobj.Port == 'Management') {
                    rmtPort = 'Mgmt';
                } else if (Remoteobj.Port == 'Management2') {
                    rmtPort = 'Mgmt' + rmtname[rmtname.length - 1];
                } else if (Remoteobj.Port == 'Console2') {
                    rmtPort = 'Con' + rmtname[rmtname.length - 1];
                } else if (Remoteobj.Port == 'Console1' || Remoteobj.Port == 'Console') {
                    rmtPort = 'Con';
                } else if (rmtname.length == 10) {
                    rmtPort = rmtname[0] + rmtname[1] + rmtname[2] + rmtname[rmtname.length - 2] + rmtname[rmtname.length - 1];
                } else if (Remoteobj.Slot == "Null" || Remoteobj.Slot == "Undefined" || Remoteobj.Slot == "1") {
                    rmtPort = rmtintro;
                } else if (Remoteobj.Port.length == 2 && Remoteobj.Port != "Management1" || Remoteobj.Port != 'Management2' || Remoteobj.Port != 'Console1' || Remoteobj.Port != 'Console2') {
                    rmtPort = rmtintro + '/' + Remoteobj.Port[1];
                } else if (Remoteobj.Port.length > 2) {
                    rmtPort = Remoteobj.Slot + '/' + rmtname[rmtname.length - 1];
                }

                // Objects that will be used to print to sheet
                labelobj.srcLabel = srcLabel;
                labelobj.srcPort = srcPort;
                labelobj.rmtLabel = rmtLabel + ' ' + rmtPort;

                labelobj2.srcLabel = rmtLabel;
                labelobj2.srcPort = rmtPort;
                labelobj2.rmtLabel = srcLabel + ' ' + srcPort;

                let n = 1;
                let j = 0;

                // Logic to paste sheet to appropiate row without overwriting the current row
                if (i == 0) {
                    n = i + 1;
                    labelSheet[i] = labelobj;
                    labelSheet[n] = labelobj2;
                } else {
                    let j = i + i;
                    n = j + 1;
                    labelSheet[j] = labelobj;
                    labelSheet[n] = labelobj2;
                }
            }
            createLabel();

        }; // end of for loop

        // Variable to hold the JSON to append to sheet for lengths
        const lenData = [];

        // Calls function to seperate total of lengths into two seperate arrays
        // Array 0 holds the unique length & array 1 holds the # of times it is repeated
        const conlengths = addlengths(consCables);
        const mgmtlengths = addlengths(mgmtCables);
        const uplengths = addlengths(uplinkCables);
        const smlengths = addlengths(smfibCables);
        const mmlengths = addlengths(mmfibCables);

        // Template for creating the objects to be added to the json
        const template = {
            'GRN-C6': 0,
            'GRN-QTY': 0,
            'GRY-C6': 0,
            'GRY-QTY': 0,
            'BLU-C6': 0,
            'BLU-QTY': 0,
            'SM-LCLC': 0,
            'SM-QTY': 0,
            'MM-LCLC': 0,
            'MM-QTY': 0
        };

        // var to the length of the array for each cable type and the var to find the longest array
        // used to determine the number of times to add objects to the json
        const arrlengths = [
            conlengths[0].length,
            mgmtlengths[0].length,
            uplengths[0].length,
            smlengths[0].length,
            mmlengths[0].length,
        ];

        const inumerate = Math.max.apply(Math, arrlengths);

        // creates each object to add to the json
        function objectcreate() {
            for (let i = 0; i < inumerate; i++) {

                const lenobj = Object.create(template);

                if (conlengths[0].length > 0) {
                    lenobj['GRN-C6'] = conlengths[0][i];
                    lenobj['GRN-QTY'] = conlengths[1][i];
                }
                if (mgmtlengths[0].length > 0) {
                    lenobj['GRY-C6'] = mgmtlengths[0][i];
                    lenobj['GRY-QTY'] = mgmtlengths[1][i];
                }
                if (uplengths[0].length > 0) {
                    lenobj['BLU-C6'] = uplengths[0][i];
                    lenobj['BLU-QTY'] = uplengths[1][i];
                }
                if (smlengths[0].length > 0) {
                    lenobj['SM-LCLC'] = smlengths[0][i];
                    lenobj['SM-QTY'] = smlengths[1][i];
                }
                if (mmlengths[0].length > 0) {
                    lenobj['MM-LCLC'] = mmlengths[0][i];
                    lenobj['MM-QTY'] = mmlengths[1][i];
                }
                lenData.push(lenobj);
            }
        }
        objectcreate();

        // 
        // Beginning of code to write info to new workbook and trigger a download
        // 
        const filename = "SS_" + fileName;
        const ws_name = "SS_CablePlan";
        const ws_name_label = "Labels";
        const ws_name_length = 'Lengths';



        // Variables to convert data into sheets
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(jsonSheet);
        const ws_labels = XLSX.utils.json_to_sheet(labelSheet);
        const ws_lengths = XLSX.utils.json_to_sheet(lenData);

        //add worksheets to workbook
        XLSX.utils.book_append_sheet(wb, ws, ws_name);
        XLSX.utils.book_append_sheet(wb, ws_labels, ws_name_label);
        XLSX.utils.book_append_sheet(wb, ws_lengths, ws_name_length);

        //writes workbook
        // XLSX.writeFile(wb, filename);

    };

    if (rABS) reader.readAsBinaryString(f); else reader.readAsArrayBuffer(f);
};

/*

From this point on all pretains to calling the appropiate function for when one of the following happens:
    Speadsheet is dropped to page
    Speadsheet is dragged to page
    Speadsheet is uploaded to page

*/
const upload = document.getElementById('upload');
upload.addEventListener('change', handleFile, false);

const drop = document.getElementById('Drop');
(function () {
    if (!drop.addEventListener) return;

    function handleDrop(e) {
        e.stopPropagation();
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        handleFile(e);
    }

    function handleDragover(e) {
        e.stopPropagation();
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        handleFile(e);
    }

    drop.addEventListener('dragenter', handleDragover, false);
    drop.addEventListener('dragover', handleDragover, false);
    drop.addEventListener('drop', handleDrop, false);
})();