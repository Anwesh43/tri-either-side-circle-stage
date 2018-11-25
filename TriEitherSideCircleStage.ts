const w : number = window.innerWidth, h : number = window.innerHeight
const tris : number = 2
const scDiv : number = 0.51
const scGap : number = 0.05
const nodes : number = 5
const sizeFactor : number = 3
const strokeFactor : number = 3
const triSizeFactor : number = 12
const color : String = '#1A237E'

const getInverse: Function = (n : number) : number => 1 / n

const divideScale : Function = (scale : number, i : number, n : number) : number => {
    return Math.min(getInverse(n), Math.max(0, scale - i * getInverse(n)))
}

const scaleFactor : Function = (scale : number) : number => Math.floor(scale / scDiv)

const mirrorValue : Function = (scale : number, a : number, b : number) : number => {
    const k : number = scaleFactor(scale)
    return (1 - k) * getInverse(a) + k * getInverse(b)
}

const updateScale : Function = (scale : number, a : number, b : number, dir : number) : number =>{
    return mirrorValue(scale, a , b) * scGap * dir
}

const drawTESCNode : Function = (context : CanvasRenderingContext2D, i : number, scale : number) => {
    const sc1 : number = divideScale(scale, 0, 2)
    const sc2 : number = divideScale(scale, 1, 2)
    const gap : number = w / (nodes + 1)
    const size : number = gap / sizeFactor
    const deg : number = (2 * Math.PI) / (tris)
    const lSize : number = size / 10
    context.lineCap = 'round'
    context.lineWidth = Math.min(w, h) / strokeFactor
    context.strokeStyle = color
    context.fillStyle = color
    context.save()
    context.translate(gap * (i + 1), h/2)
    context.rotate(Math.PI/2 * sc2)
    context.save()
    context.beginPath()
    context.arc(0, 0, size, 0, 2 * Math.PI)
    context.clip()
    context.beginPath()
    context.arc(0, 0, (size - context.lineWidth/2), 0, 2 * Math.PI)
    context.stroke()
    for (var j = 0; j < tris; j++) {
        const sc : number = divideScale(sc1, i, tris)
        context.save()
        context.translate(0, -size)
        context.beginPath()
        context.moveTo(-size/triSizeFactor, 0)
        context.lineTo(size/triSizeFactor, 0)
        context.lineTo(0, -size/(triSizeFactor/2))
        context.fill()
        context.restore()
    }
    context.restore()
    context.restore()
}

class State {
    scale : number = 0
    dir : number = 0
    prevScale : number = 0

    update(cb : Function) {
        this.scale += updateScale(this.scale, tris, 1, this.dir)
        if (Math.abs(this.scale - this.prevScale) > 1) {
            this.scale = this.prevScale + this.dir
            this.dir = 0
            this.prevScale = this.scale
            cb()
        }
    }

    startUpdating(cb : Function) {
        if (this.dir == 0) {
            this.dir = 1 - 2 * this.prevScale
            cb()
        }
    }
}

class Animator {
    animated : boolean = false
    interval : number

    start(cb : Function) {
        if (!this.animated) {
            this.animated = true
            this.interval = setInterval(cb, 50)
        }
    }

    stop() {
        if (this.animated) {
            this.animated = true
            clearInterval(this.interval)
        }
    }
}

class TriEitherSideCircleStage {
    canvas : HTMLCanvasElement = document.createElement('canvas')
    context : CanvasRenderingContext2D

    initCanvas() {
        this.canvas.width = w
        this.canvas.height = h
        this.context = this.canvas.getContext('2d')
        document.body.appendChild(this.canvas)
    }

    render() {

    }

    handleTap() {
        this.canvas.onmousedown = () => {

        }
    }

    static init() {
        const stage : TriEitherSideCircleStage = new TriEitherSideCircleStage()
        stage.initCanvas()
        stage.render()
        stage.handleTap()
    }
}

class TESCNode {
    state : State = new State()
    next : TESCNode
    prev : TESCNode

    constructor(private i : number) {
        this.addNeighbor()
    }

    addNeighbor() {
        if (this.i < nodes - 1) {
            this.next = new TESCNode(this.i + 1)
            this.next.prev = this
        }
    }

    update(cb : Function) {
        this.state.update(cb)
    }

    startUpdating(cb : Function) {
        this.state.startUpdating(cb)
    }

    draw(cb : Function, context : CanvasRenderingContext2D) {
        cb(context, this.i, this.state.scale)
        if (this.next) {
            this.next.draw(cb, context)
        }
    }

    getNext(dir : number, cb : Function) : TESCNode {
        var curr : TESCNode = this.prev
        if (dir == 1) {
            curr = this.next
        }
        if (curr) {
            return curr
        }
        cb()
        return this
    }

}
