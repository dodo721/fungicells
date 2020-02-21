function initData (size) {
    data = []
    for (let i = 0; i < size; i ++) {
        data[i] = []
        for (let j = 0; j < size; j ++) {
            data[i][j] = [0,0]
        }
    }
    return data
}

let procId = 0

function stop () {
    clearInterval(procId)
    console.log("stopped")
    $('#stopBtn').prop("disabled", true)
}

function findDiffs (oldData, newData) {
    let diffs = []
    for (let i = 0; i < oldData.length; i ++) {
        for (let j = 0; j < oldData.length; j ++) {
            if (oldData[i][j] !== newData[i][j])
                diffs.push([i,j,oldData[i][j],newData[i][j]])
        }
    }
    return diffs
}

function cloneData (oldData) {
    newData = []
    let size = oldData.length
    for (let i = 0; i < size; i ++) {
        newData[i] = []
        for (let j = 0; j < size; j ++) {
            newData[i][j] = oldData[i][j].slice()
        }
    }
    return newData
}

$(document).ready(() => {

    const canvas = $("#canvas")[0];
    const ctx = canvas.getContext("2d");
    let size = 400
    let data = initData(size)

    /*
    TYPES:
    0 - fungi/empty
    1 - food
    2 - obstacle
    */

    function drawAll (data, ignoreValue) {
        for (let i = 0; i < size; i ++) {
            for (let j = 0; j < size; j ++) {
                draw(i, j, data, ignoreValue)
            }
        }
    }

    function draw (i, j, data, ignoreValue) {
        let color = []
        let value = ignoreValue ? data[i][j][0] === 0 ? 0 : 255 : data[i][j][0] * 255
        switch (data[i][j][1]) {
            case 0:
                color = [0,value,0]
                break
            case 1:
                color = [0, 0, value]
                break
            case 2:
                color = [value, 0, 0]
                break
        }
        ctx.fillStyle = "rgb(" + color[0] + "," + color[1] + "," + color[2] + ")"
        ctx.fillRect(i, j, 1, 1)
    }

    const fungiDensity = 0.001
    const foodDensity = 0.001
    const obstacleDensity = 0.002

    for (let i = 0; i < size; i ++) {
        for (let j = 0; j < size; j ++) {
            const isFungi = Math.random() < fungiDensity
            const isFood = Math.random() < foodDensity
            const isObstacle = Math.random() < obstacleDensity
            data[i][j][1] = isObstacle ? 2 : isFood ? 1 : 0
            if (data[i][j][1] !== 0) {
                data[i][j][0] = 1
            } else if (isFungi) {
                data[i][j][0] = 1
            }
        }
    }

    drawAll(data)

    function findAdjCells (i, j, data) {
        let cells = []
        for (let x = -1; x < 2; x ++) {
            if (i+x >= data.length || i+x < 0)
                continue
            for (let y = -1; y < 2; y ++) {
                if (j+y >= data[i+x].length || j+y < 0)
                    continue
                else if (x === 0 && y === 0){
                    continue
                }
                const cell = data[i+x][j+y]
                if (!cell)
                    console.log("Undefined at [" + (i+x) + "," + (j+y) + "], data.length: " + data.length + ", data[].length: " + data[i+x].length)
                cells.push([i+x, j+y])
            }
        }
        return cells
    }

    function sim (oldData) {
        let newData = cloneData(oldData)
        for (let i = 0; i < size; i ++) {
            for (let j = 0; j < size; j ++) {
                const value = oldData[i][j][0]
                const type = oldData[i][j][1]
                if (type === 0 && value > 0) {
                    adjFungi = findAdjCells(i, j, oldData)
                    for (let k = 0; k < adjFungi.length; k ++) {
                        //console.log("Making an update...")
                        const coord = adjFungi[k]
                        const cell = oldData[coord[0]][coord[1]]
                        if (cell[0] < 1 && cell[1] === 0) {
                            newData[cell[0]][cell[1]][0] += 1 / 8
                            newData[i][j][0] -= 1 / 8
                        }
                    }
                }
            }
        }
        return newData
    }

    function step () {
        let newData = sim(data)
        drawAll(newData, true)
        console.log("Stepped")
        //diffs = findDiffs(data, newData)
        //console.log(diffs)
        data = newData
    }

    function start () {
        console.log("Starting!")
        procId = setInterval(step, 10)
    }

    setTimeout(start, 1000)

})