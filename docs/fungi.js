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
let drawRelative = false
let running = true
let curChart = null
let bulkStat = false
let fungiData = []
let foodData = []
let labels = []
let gCtx = null

function pause () {
    running = !running
    console.log(running ? "Played" : "Paused")
    $('#toggleBtn').prop("disabled", !running)
}

function initGraph (gCtx) {
    chart = new Chart(gCtx, {
        // The type of chart we want to create
        type: 'line',
    
        // The data for our dataset
        data: {
            labels: [],
            datasets: [{
                label: 'Cell population',
                fill:false,
                backgroundColor: 'rgb(255, 99, 132)',
                borderColor: 'rgb(255, 99, 132)',
                data: [],
                lineTension: 0,
                yAxisID: 'y-axis-1'
            },
            {
                label: 'Food count',
                fill:false,
                steppedLine: true,
                backgroundColor: 'blue',
                borderColor: 'blue',
                data: [],
                yAxisID: 'y-axis-2'
            }]
        },
    
        // Configuration options go here
        options: {
            responsive: true,
            hoverMode: 'index',
            stacked: false,
            title: {
                display: true,
                text: 'Simulation stats'
            },
            scales: {
                yAxes: [{
                    type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
                    display: true,
                    position: 'left',
                    id: 'y-axis-1',
                }, {
                    type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
                    display: true,
                    position: 'right',
                    id: 'y-axis-2',
                    ticks: {
                        beginAtZero: true
                    },
                    // grid line settings
                    gridLines: {
                        drawOnChartArea: false, // only want the grid lines for one axis to show up
                    },
                }],
            }
        }
    });
    return chart;
}

function stop () {
    clearInterval(procId)
    if (bulkStat) {
        curChart = initGraph(gCtx)
        curChart.data.labels = labels
        curChart.data.datasets[0].data = fungiData
        curChart.data.datasets[1].data = foodData
        curChart.update()
    }
    console.log("stopped")
    $('#stopBtn').prop("disabled", true)
    $('#pauseBtn').prop("disabled", true)
    $('#toggleBtn').prop("disabled", true)
}

function toggleRelative () {
    drawRelative = !drawRelative
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

function fungiInit () {
    if (curChart)
        curChart.destroy()
    bulkStat = false
    stop()
    let stepNum = 0
    $("#controls").css("display", "inline-block")
    $('#stopBtn').prop("disabled", false)
    $('#pauseBtn').prop("disabled", false)
    $('#toggleBtn').prop("disabled", false)
    const size = parseInt($('#size').val())
    const zoom = parseInt($('#zoom').val())
    console.log("Initializing with size " + size + " and zoom " + zoom)
    const canvas = $("#canvas")[0];
    const ctx = canvas.getContext("2d")
    ctx.canvas.width = size * zoom
    ctx.canvas.height = size * zoom
    let data = initData(size)

    // GRAPH
    const gCanvas = $("#graph")[0]
    gCtx = gCanvas.getContext('2d')
    bulkStat = !($('#displayStats').is(":checked"))
    let chart = bulkStat ? null : initGraph(gCtx)
    curChart = chart
    labels = []
    fungiData = []
    foodData = []

    function updateChart (fungiCount, foodCount) {
        labels.push(stepNum)
        fungiData.push(fungiCount)
        foodData.push(foodCount)
        if (chart) {
            chart.data.labels = labels
            chart.data.datasets[0].data = fungiData
            chart.data.datasets[1].data = foodData
            chart.update()
        }
    }

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
        ctx.fillRect(i * zoom, j * zoom, zoom, zoom)
    }

    const fungiDensity = 0.001
    const foodDensity = 0.001
    const obstacleDensity = 0.002
    const fungiStartVal = 5

    let startFoodCount = 0

    for (let i = 0; i < size; i ++) {
        for (let j = 0; j < size; j ++) {
            const isFungi = Math.random() < fungiDensity
            const isFood = Math.random() < foodDensity
            const isObstacle = Math.random() < obstacleDensity
            data[i][j][1] = isObstacle ? 2 : isFood ? 1 : 0
            if (data[i][j][1] === 1)
                startFoodCount++
            if (data[i][j][1] !== 0) {
                data[i][j][0] = 1
            } else if (isFungi) {
                data[i][j][0] = fungiStartVal
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

    const foodDecay = 0.001
    const foodSupply = 0.5
    const spreadValue = 0.5
    const spreadProb = 0.2
    const spreadThreshold = 0.1
            //diffs = findDiffs(data, newData)
            //console.log(diffs)
    let fungiCount = 0
    let foodCount = 0

    function sim (oldData) {
        let newData = cloneData(oldData)
        fungiCount = 0
        foodCount = 0
        for (let i = 0; i < size; i ++) {
            for (let j = 0; j < size; j ++) {
                const value = oldData[i][j][0]
                const type = oldData[i][j][1]
                if (type === 0 && value > 0) {
                    newData[i][j][0] -= foodDecay
                    adjFungi = findAdjCells(i, j, oldData)
                    for (let k = 0; k < adjFungi.length; k ++) {
                        let cur = adjFungi[k]
                        let oldCell = oldData[cur[0]][cur[1]]
                        if (oldCell[1] == 1) {
                            newData[cur[0]][cur[1]][0] = 2
                            newData[i][j][0] += foodSupply
                        }
                    }
                    let cellDat = null
                    let curDat = oldData[i][j]
                    let cell = null
                    if (Math.random() < value) {
                        function assign () {
                            let x = Math.round(Math.random() * 2) - 1
                            let y = Math.round(Math.random() * 2) - 1
                            if (i+x < size && j+y < size && i+x > 0 && j+y > 0) {
                                cellDat = oldData[i+x][j+y]
                                cell = [i+x, j+y]
                            }
                        }
                        while(cellDat === null)
                            assign()
                        let loopCount = 9
                        while (cellDat[1] !== 0 && ((cellDat[0] < curDat[0] && cellDat[0] !== 0) || (cellDat[0] > curDat[0])) && loopCount > 0) {
                            assign()
                            while(cellDat === null)
                                assign()
                            loopCount--;
                        }
                        if (loopCount <= 0)
                            cellDat = null
                    }
                    if (cellDat) {
                        const toSpread = newData[i][j][0] * spreadValue 
                        newData[cell[0]][cell[1]][0] += toSpread
                        newData[i][j][0] -= toSpread
                    }
                } else if (type === 0 && value < 0) {
                    newData[i][j][0] = 0
                }
                if (newData[i][j][0] > 0 && newData[i][j][1] === 0)
                    fungiCount++
                if (newData[i][j][0] === 1 && newData[i][j][1] === 1)
                    foodCount++
            }
        }
        stepNum++
        return newData
    }

    function step () {
        if (running) {
            let newData = sim(data)
            drawAll(newData, drawRelative)
            data = newData
            updateChart(fungiCount, foodCount)
            if (fungiCount === 0) {
                console.log('All cells dead!')
                alert("All cells died! Simulation stopped")
                stop(gCtx)
            }
            $('#fungiCount').html(fungiCount + " cells remaining, " + foodCount + " food remaining")
        }
    }

    function start () {
        console.log("Starting!")
        procId = setInterval(step, 10)
    }

    setTimeout(start, 1000)

}