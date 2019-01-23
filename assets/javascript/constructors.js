

let liu_obj = {};

// constructor that makes each liu location object
function Liu(hall, row, cab, RU) {
    this.hall = hall;
    this.row = row;
    this.cab = cab;
    this.RU = RU;
};

let temp = new Liu(1100, 25, 19, 48);

for (let i = 35; i < 48; i += 4){
    temp = new Liu(1100, 25, 19, i);
    liu_obj[i] = temp;
}

console.log(liu_obj)

module.exports = liu_obj;