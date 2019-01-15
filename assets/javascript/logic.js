
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
            // console.log(Localobj);
            // console.log(Remoteobj);

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

            // Code block calculating Fiber connections that go out of cab
            const outCabCalc = () => {
            };

            if (Localobj.Row !== Remoteobj.Row && Localobj.Type == "Fiber") {
                outCabCalc();
            };

            // Code block calculating In Cab Copper Connections
            const inCabCalc = () => {

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

                // Logic that adds the necessary gaps between the rows that have them
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
                const inCabLength = LengthIn / 12;
                const inCabMeter = inCabLength * .3048;

                const typeConvert = () => {
                    if (Localobj.Type == "Copper") {
                        console.log(inCabLength + ' FT in cab copper connection');
                    } else if (Localobj.Type == "Fiber") {
                        console.log(inCabMeter + ' Meter in cab Fiber connection');
                    }
                }
                typeConvert();
            };

            // if rows are equal and cable type is copper runs in calc for length. Its called in cab but it does all of in row
            if (Localobj.Row == Remoteobj.Row) {
                inCabCalc();
            };
        }; // end of for loop
        // 
        // 
        // Beginning of code to write info to new workbook and trigger a download
        // 
        //  
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, worksheet);

        /* write workbook (use type 'binary') */
        var wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });

        /* generate a download */
        function s2ab(s) {
            var buf = new ArrayBuffer(s.length);
            var view = new Uint8Array(buf);
            for (var i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
            return buf;
        }

        saveAs(new Blob([s2ab(wbout)], { type: "application/octet-stream" }), "sheetjs.xlsx");

    };

    if (rABS) reader.readAsBinaryString(f); else reader.readAsArrayBuffer(f);
};

const upload = document.getElementById('upload');
upload.addEventListener('change', handleFile, false);