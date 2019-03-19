$('#NextModal').modal({ show: false });
$('#PortModal').modal({ show: false });
$.ajaxSetup({ async: false });


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
        let run2labels = [];
        let additonalRun = false;
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

            let LocalArr = '';

            if (jsonSheet[i]['Location']) {
                LocalArr = jsonSheet[i]['Location'].split('.');
            } else if (jsonSheet[i]['L. Location']) {
                LocalArr = jsonSheet[i]['L. Location'].split('.');
            };

            let LocalPort = '';

            if (jsonSheet[i]['Port'] && typeof jsonSheet[i]['Port'] == 'string') {
                LocalPort = jsonSheet[i]['Port'].split('/');
            } else if (jsonSheet[i]['Port'] && typeof jsonSheet[i]['Port'] == 'number') {
                LocalPort = ['Ethernet' + jsonSheet[i]['Port']];
            } else if (jsonSheet[i]['L. Port'] && typeof jsonSheet[i]['L. Port'] == 'string') {
                LocalPort = jsonSheet[i]['L. Port'].split('/');
            } else if (jsonSheet[i]['L. Port'] && typeof jsonSheet[i]['L. Port'] == 'number') {
                LocalPort = ['Ethernet' + jsonSheet[i]['L. Port']];
            }

            let LocalSlot = '';

            if (jsonSheet[i]['Slot']) {
                LocalSlot = jsonSheet[i]['Slot'].split(' ');
            } else if (jsonSheet[i]['L. Slot']) {
                LocalSlot = jsonSheet[i]['L. Slot'].split(' ');
            }

            // Pulls remote locations and breaks into Arrays

            let RemoteArr = jsonSheet[i]['R. Location'].split('.');

            let RemotePort = '';

            if (typeof jsonSheet[i]['R. Port'] == "string") {
                RemotePort = jsonSheet[i]['R. Port'].split('/');
            } else if (typeof jsonSheet[i]['R. Port'] == "number") {
                RemotePort = ['Ethernet' + jsonSheet[i]['R. Port']];
            }

            let RemoteSlot = '';

            if (jsonSheet[i]['R. Slot']) {
                RemoteSlot = jsonSheet[i]['R. Slot'].split(' ');
            }

            let cableType = 'Cable';

            // Finds the correct cable type and changes it as needed
            const CableType = () => {

                // determines management cables 
                if (LocalPort[0].includes('Management') || RemotePort[0].includes('Management') && jsonSheet[i]['Port Type'] == '1G' || jsonSheet[i]['Port Type'] == '10G') {
                    cableType = 'mgmt';
                    // determines console cables 
                } else if (LocalPort[0].includes('console') || RemotePort[0].includes('console') && jsonSheet[i]['Port Type'] == '1G' || jsonSheet[i]['Port Type'] == '10G') {
                    cableType = 'cons';
                    // determines all copper uplinks to port 49
                } else if ((LocalPort[0].includes('Ethernet49') || RemotePort[0].includes('Ethernet49')) && (jsonSheet[i]['Port Type'] == '1G' || jsonSheet[i]['Port Type'] == '10G')) {
                    cableType = 'uplink';
                    // determines all copper uplinks to port 51
                } else if (LocalPort[0].includes('Ethernet51') || RemotePort[0].includes('Ethernet51') && jsonSheet[i]['Port Type'] == '1G' || jsonSheet[i]['Port Type'] == '10G') {
                    cableType = 'uplink';
                    // determines single mode fiber
                } else if (jsonSheet[i]['Port Type'] == '100G' || LocalSlot[1] != '1' || RemoteSlot[1] != '1') {
                    cableType = 'smfib';
                } else {
                    cableType = 'mmfib';
                }
            };
            CableType();

            console.log(cableType);

            // Object to hold all data of First Location
            const Localobj = {
                Location: LocalArr[0] + '.' + LocalArr[1] + '.' + LocalArr[2] + '.' + LocalArr[3],
                Hall: LocalArr[4],
                Row: parseInt(LocalArr[5]),
                Cab: parseInt(LocalArr[6]),
                RU: parseInt(LocalArr[7]),
                Slot: LocalSlot[1] || 1,
                Port: LocalPort,
                Type: cableType
            };

            // Object to hold all data of Second Location
            const Remoteobj = {
                Location: RemoteArr[0] + '.' + RemoteArr[1] + '.' + RemoteArr[2],
                Hall: RemoteArr[4],
                Row: parseInt(RemoteArr[5]),
                Cab: parseInt(RemoteArr[6]),
                RU: parseInt(RemoteArr[7]),
                Slot: RemoteSlot[1] || 1,
                Port: RemotePort,
                Type: cableType
            };

            // defining new object to use with out of row calculations
            let mdfLocal = {};

            // Uses DB to find remote LIU location and uses that as source to calculate to destination
            function mdfCalc() {
                // updates row so that it is always two digits
                let row = Localobj.Row;
                if (row < 10) {
                    row = '0' + row;
                }

                // var used to run query
                let query = '/api/liu/' + Localobj.Location + '.' + Localobj.Hall + '.' + row;

                // api call to DB returning json of the remote location
                $.get(query, function (data) {

                    const newLocation = data[0].Location.split('.');

                    mdfLocal.Hall = newLocation[4];
                    mdfLocal.Row = parseInt(newLocation[5]);
                    mdfLocal.Cab = parseInt(newLocation[6]);
                    mdfLocal.RU = parseInt(data[0].RU);
                    mdfLocal.Type = Localobj.Type;

                }).then(function () {
                    return mdfLocal;
                });
            };

            // Calculations for length
            // All variables stored in Inches
            const ruWidth = 2; // each RU is 2 in
            const topCopper = 24; // from top RU to copper tray is 24in
            const topFiber = 30; // from top RU to fiber tray is 10in
            const cabWidth = 27; // each cab is 2ft 3 in wide
            const cabLiu = 12; // from cab 1  or cab 35 to the liu tray at the end of the row
            const slack = 12; // extra 1 foot of slack for dressing;
            const cabGap = 48; // every cab gap is 4 FT & they are located between cabs 10-11 & 25-26

            // 1100: 10-11 & 25-26
            // 1500: 5-6 & 20-21
            // 2100: 10-11 & 25-26
            // 2500: 10-11 & 25-26
            // 3100: 10-11 & 25-26
            // 3500: 15-16 & 30-31

            // Code block calculating Connections
            const CabCalc = () => {

                // Calculates the number of cabs apart, and returns only positive numbers
                const cabLengthCalc = (srcobj, rmtobj) => {

                    let cabLength = 0;

                    if (srcobj.Row == 25 || srcobj.Row == 26) {
                        
                    } else {
                        // calculates out of row runs -- goes to LIU 
                        if (srcobj.Row != rmtobj.Row && srcobj.Cab > 17) {
                            cabLength = 35 - srcobj.Cab;
                        } else if (srcobj.Row != rmtobj.Row && srcobj.Cab <= 17) {
                            cabLength = (1 - srcobj.Cab);
                        }

                        // calculates in row - number of cabs seperating the two
                        if (srcobj.Row == rmtobj.Row) {
                            cabLength = srcobj.Cab - rmtobj.Cab;
                        }

                        if (cabLength < 0) {
                            cabLength = cabLength * -1;
                        };
                        return cabLength;
                    }
                };

                // Adds the necessary gaps between the rows that have them
                const GapAdder = (srcobj, rmtobj) => {
                    let gaps = 0;
                    if (srcobj.Row != rmtobj.Row && srcobj.Cab <= 26 && srcobj.Cab >= 17) {
                        gaps = 1;
                    } else if (srcobj.Row != rmtobj.Row && srcobj.Cab <= 17 && srcobj.Cab > 10) {
                        gaps = 1;
                    } else if (srcobj.Row == rmtobj.Row && srcobj.Cab >= 26 && (rmtobj.Cab <= 25 && rmtobj.Cab >= 17)) {
                        gaps = 1;
                    } else if (srcobj.Row == rmtobj.Row && (srcobj.Cab <= 17 && srcobj.Cab <= 11) && rmtobj.Cab <= 10) {
                        gaps = 1;
                    } else if (srcobj.Row == rmtobj.Row && rmtobj.Cab >= 26 && (srcobj.Cab <= 25 && srcobj.Cab >= 17)) {
                        gaps = 1;
                    } else if (srcobj.Row == rmtobj.Row && (rmtobj.Cab <= 17 && rmtobj.Cab <= 11) && srcobj.Cab <= 10) {
                        gaps = 1;
                    } else if (srcobj.Row == rmtobj.Row && srcobj.Cab <= 10 && rmtobj.Cab >= 26) {
                        gaps = 2;
                    } else if (srcobj.Row == rmtobj.Row && rmtobj.Cab <= 10 && srcobj.Cab >= 26) {
                        gaps = 2;
                    }
                    return gaps;
                };


                // Var to hold total length in Inches
                let LengthIn = 0;

                const totalCalc = (srcobj, rmtobj) => {

                    const cabLength = cabLengthCalc(Localobj, Remoteobj);
                    const gaps = GapAdder(Localobj, Remoteobj);
                    const firstRu = 52 - srcobj.RU;
                    const secondRu = 52 - rmtobj.RU;

                    if (srcobj.Row != rmtobj.Row && (srcobj.Cab != rmtobj.Cab)) {
                        LengthIn = (cabLength * cabWidth) + (gaps * cabGap) + cabLiu + (firstRu * ruWidth) + topFiber + slack;
                    } else if (srcobj.Row == rmtobj.Row && (srcobj.Cab != rmtobj.Cab)) {
                        LengthIn = (cabLength * cabWidth) + (gaps * cabGap) + (firstRu * ruWidth) + (secondRu * ruWidth) + (topCopper * 2) + slack;
                    } else if (srcobj.Row == rmtobj.Row && (srcobj.Cab == rmtobj.Cab)) {
                        LengthIn = (firstRu * ruWidth) + slack;
                    }

                    return LengthIn;
                };

                // Holds the lengths of each run in Inches. Converted in function below
                const run1 = totalCalc(Localobj, Remoteobj);
                let run2;

                if (Localobj.Row != Remoteobj.Row) {
                    mdfCalc();
                    run2 = totalCalc(mdfLocal, Remoteobj);
                }

                // used to create additional label if another run is present
                if (run2 > 0) {
                    additonalRun = true;
                };

                // takes in type of cable and adds to json object along with length
                const typeConvert = () => {
                    if (Localobj.Type == "cons") {
                        jsonSheet[i]['Cable Type'] = "Copper";
                        jsonSheet[i]['Run1'] = Math.ceil(run1 / 12) + 'ft';
                        consCables.push(Math.ceil(run1 / 12));

                        if (run2 > 0) {
                            jsonSheet[i]['Run2'] = Math.ceil(run2 / 12) + 'ft';
                            consCables.push(Math.ceil(run2 / 12));
                        }
                    } else if (Localobj.Type == "mgmt") {
                        jsonSheet[i]['Cable Type'] = "Copper";
                        jsonSheet[i]['Run1'] = Math.ceil(run1 / 12) + 'ft';
                        mgmtCables.push(Math.ceil(run1 / 12));

                        if (run2 > 0) {
                            jsonSheet[i]['Run2'] = Math.ceil(run2 / 12) + 'ft';
                            mgmtCables.push(Math.ceil(run2 / 12));
                        }
                    } if (Localobj.Type == "uplink") {
                        jsonSheet[i]['Cable Type'] = "Copper";
                        jsonSheet[i]['Run1'] = Math.ceil(run1 / 12) + 'ft';
                        uplinkCables.push(Math.ceil(run1 / 12));

                        if (run2 > 0) {
                            jsonSheet[i]['Run2'] = Math.ceil(run2 / 12) + 'ft';
                            uplinkCables.push(Math.ceil(run2 / 12));
                        }
                    } else if (Localobj.Type == "smfib") {
                        jsonSheet[i]['Cable Type'] = "Fiber";
                        jsonSheet[i]['Run1'] = Math.ceil(run1 * .0254) + 'm';
                        smfibCables.push(Math.ceil(run1 * .0254));

                        if (run2 > 0) {
                            jsonSheet[i]['Run2'] = Math.ceil(run2 * .0254) + 'm';
                            smfibCables.push(Math.ceil(run2 * .0254));
                        }
                    } else if (Localobj.Type == "mmfib") {
                        jsonSheet[i]['Cable Type'] = "Fiber";
                        jsonSheet[i]['Run1'] = Math.ceil(run1 * .0254) + 'm';
                        mmfibCables.push(Math.ceil(run1 * .0254));

                        if (run2 > 0) {
                            jsonSheet[i]['Run2'] = Math.ceil(run2 * .0254) + 'm';
                            mmfibCables.push(Math.ceil(run2 * .0254));
                        }
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

                sethinclu = false;
                rethinclu = false;
                if (Remoteobj.Port.includes('eth') || Remoteobj.Port.includes('Eth')) {
                    rethinclu = true;
                } else if (Localobj.Port.includes('eth') || Localobj.Port.includes('Eth')) {
                    sethinclu = true;
                }

                // ----------------------

                // defines what will be used from objects to generate the source side of the label
                // correct port so that the label will print easier to read for source
                let srcLabel = Localobj.Hall + '.' + Localobj.Row + '.' + Localobj.Cab + ' U' + Localobj.RU;

                if (srcname.lenth == 4 || srcname.lenth == 5) {
                    srcPort = srcname;
                } else if (Localobj.Port.includes("Management1") || Localobj.Port.includes("Management") || Localobj.Port.includes("management1") || Localobj.Port.includes("management")) {
                    srcPort = 'Mgmt';
                } else if (Localobj.Port.includes("Management2") || Localobj.Port.includes("management2")) {
                    srcPort = 'Mgmt' + srcname[srcname.length - 1];
                } else if (Localobj.Port.includes("Console2") || Localobj.Port.includes("console2")) {
                    srcPort = 'Con' + srcname[srcname.length - 1];
                } else if (Localobj.Port.includes("Console1") || Localobj.Port.includes("Console") || Localobj.Port.includes("console1") || Localobj.Port.includes("console")) {
                    srcPort = 'Con';
                } else if (srcname.length == 10 && (Localobj.Slot == "null" || Localobj.Slot == "Null" || Localobj.Slot == "undefined" || Localobj.Slot == 1)) {
                    srcPort = srcname[0] + srcname[1] + srcname[2] + srcname[srcname.length - 2] + srcname[srcname.length - 1];
                } else if (srcname.length == 10 && Localobj.Slot != 1) {
                    srcPort = Localobj.Slot + '/' + Localobj.Port[1];
                } else if (srcname.length == 9 && Localobj.Slot != 1) {
                    srcPort = Localobj.Slot + '/' + Localobj.Port[1];
                } else if (Localobj.Slot == "Null" || Localobj.Slot == "Undefined" || Localobj.Slot == "1" && Localobj.Port == 'Management1' || Localobj.Port == 'Management2' || Localobj.Port == 'Console1' || Localobj.Port == 'Console2') {
                    srcPort = srcintro;
                } else if (Localobj.Port.length == 2 && Localobj.Port != "Management1" || Localobj.Port != 'Management2' || Localobj.Port != 'Console1' || Localobj.Port != 'Console2' && sethinclu == false) {
                    srcPort = srcintro + '/' + Localobj.Port[1];
                } else if (Localobj.Port.length > 2) {
                    srcPort = Localobj.Slot + '/' + srcname[srcname.length - 1];
                } else {
                    srcPort = srcintro;
                }

                // defines what will be used from objects to generate the destination side of the label
                // correct port so that the label will print easier to read for destination
                let rmtLabel = Remoteobj.Hall + '.' + Remoteobj.Row + '.' + Remoteobj.Cab + ' U' + Remoteobj.RU;

                if (rmtname.lenth == 4 || rmtname.lenth == 5) {
                    rmtPort = rmtname;
                } else if (Remoteobj.Port.includes("Management1") || Remoteobj.Port.includes("Management") || Remoteobj.Port.includes("management1") || Remoteobj.Port.includes("management")) {
                    rmtPort = 'Mgmt';
                } else if (Remoteobj.Port.includes("Management2") || Remoteobj.Port.includes("management2")) {
                    rmtPort = 'Mgmt' + rmtname[rmtname.length - 1];
                } else if (Remoteobj.Port.includes("Console2") || Remoteobj.Port.includes("console2")) {
                    rmtPort = 'Con' + rmtname[rmtname.length - 1];
                } else if (Remoteobj.Port.includes("Console1") || Remoteobj.Port.includes("Console") || Remoteobj.Port.includes("console1") || Remoteobj.Port.includes("console")) {
                    rmtPort = 'Con';
                } else if (rmtname.length == 10 && (Remoteobj.Slot == "null" || Remoteobj.Slot == "Null" || Remoteobj.Slot == "undefined" || Remoteobj.Slot == 1)) {
                    rmtPort = rmtname[0] + rmtname[1] + rmtname[2] + rmtname[rmtname.length - 2] + rmtname[rmtname.length - 1];
                } else if (rmtname.length == 10 && Remoteobj.Slot != 1) {
                    rmtPort = Remoteobj.Slot + '/' + Remoteobj.Port[1];
                } else if (rmtname.length == 9 && Remoteobj.Slot != 1) {
                    rmtPort = Remoteobj.Slot + '/' + Remoteobj.Port[1];
                } else if (Remoteobj.Slot = "null" || Remoteobj.Slot == "Null" || Remoteobj.Slot == "undefined" || Remoteobj.Slot == 1 && Remoteobj.Port == 'Management1' || Remoteobj.Port == 'Management2' || Remoteobj.Port == 'Console1' || Remoteobj.Port == 'Console2') {
                    rmtPort = rmtintro;
                } else if (Remoteobj.Port.length == 2 && Remoteobj.Port != "Management1" || Remoteobj.Port != 'Management2' || Remoteobj.Port != 'Console1' || Remoteobj.Port != 'Console2' && rethinclu == false) {
                    rmtPort = rmtintro + '/' + Remoteobj.Port[1];
                } else if (Remoteobj.Port.length > 2) {
                    rmtPort = Remoteobj.Slot + '/' + rmtname[rmtname.length - 1];
                } else {
                    rmtPort = rmtintro;
                }

                // Objects that will be used to print to sheet
                labelobj.srcLabel = srcLabel;
                labelobj.srcPort = srcPort;
                labelobj.rmtLabel = rmtLabel + ' ' + rmtPort;

                labelobj2.srcLabel = rmtLabel;
                labelobj2.srcPort = rmtPort;
                labelobj2.rmtLabel = srcLabel + ' ' + srcPort;

                // console.log(Remoteobj)

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

                // evaluates if additonal run will be made and adds the second label to new sheet
                // the rows cannot be equal, this will prevent in row / cons & mgmt from being added to second sheet
                if (Localobj.Row != Remoteobj.Row && additonalRun) {
                    if (i == 0) {
                        n = i + 1;
                        run2labels[i] = labelobj;
                        run2labels[n] = labelobj2;
                    } else {
                        let j = i + i;
                        n = j + 1;
                        run2labels[j] = labelobj;
                        run2labels[n] = labelobj2;
                    }
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
        const ws_name_label = "Run 1 Labels";
        const ws_name_run2label = "Run 2 Labels";
        const ws_name_length = 'Lengths';

        // Variables to convert data into sheets
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(jsonSheet);
        const ws_labels = XLSX.utils.json_to_sheet(labelSheet);
        const ws_run2labels = XLSX.utils.json_to_sheet(run2labels);
        const ws_lengths = XLSX.utils.json_to_sheet(lenData);


        //add worksheets to workbook
        XLSX.utils.book_append_sheet(wb, ws, ws_name);
        XLSX.utils.book_append_sheet(wb, ws_labels, ws_name_label);
        if (run2labels.length > 0) {
            XLSX.utils.book_append_sheet(wb, ws_run2labels, ws_name_run2label);
        }
        XLSX.utils.book_append_sheet(wb, ws_lengths, ws_name_length);

        //writes workbook
        XLSX.writeFile(wb, filename);

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