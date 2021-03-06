const w : number = window.innerWidth, h : number = window.innerHeight
const tris : number = 4
const scDiv : number = 0.51
const scGap : number = 0.05
const nodes : number = 5
const sizeFactor : number = 3
const strokeFactor : number = 120
const triSizeFactor : number = 4
const color : String = '#1A237E'

const getInverse: Function = (n : number) : number => 1 / n

const divideScale : Function = (scale : number, i : number, n : number) : number => {
    return Math.min(getInverse(n), Math.max(0, scale - i * getInverse(n))) * n
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
    const lSize : number = size / triSizeFactor
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
        const sc : number = divideScale(sc1, j, tris)
        console.log(sc)
        context.save()
        context.rotate(deg * j)
        context.translate(0, size)
        context.beginPath()
        context.moveTo(-lSize/2, 0)
        context.lineTo(lSize/2, 0)
        context.lineTo(0, -lSize * sc)
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
            this.animated = false
            clearInterval(this.interval)
        }
    }
}

class TriEitherSideCircleStage {
    canvas : HTMLCanvasElement = document.createElement('canvas')
    context : CanvasRenderingContext2D
    renderer : Renderer = new Renderer()
    initCanvas() {
        this.canvas.width = w
        this.canvas.height = h
        this.context = this.canvas.getContext('2d')
        document.body.appendChild(this.canvas)
    }

    render() {
        this.renderer.render(this.context)
    }

    handleTap() {
        this.canvas.onmousedown = () => {
            this.renderer.handleTap(() => {
                this.render()
            })
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

class TriEitherSideCircle {
    root : TESCNode = new TESCNode(0)
    curr : TESCNode = this.root
    dir : number = 1
    draw(context : CanvasRenderingContext2D ) {
        if (this.root) {
            this.root.draw((ctx : CanvasRenderingContext2D, i : number, scale : number) => {
                drawTESCNode(ctx, i, scale)
            }, context)
        }
    }

    update(cb : Function) {
        this.curr.update(() => {
            this.curr = this.curr.getNext(this.dir, () => {
                this.dir *= -1
            })
            console.log(this.curr)
            cb()
        })
    }

    startUpdating(cb : Function) {
        this.curr.startUpdating(cb)
    }
}

class Renderer {
    tesc : TriEitherSideCircle = new TriEitherSideCircle()
    animator : Animator = new Animator()

    render(context : CanvasRenderingContext2D) {
        context.fillStyle = '#BDBDBD'
        context.fillRect(0, 0, w, h)
        this.tesc.draw(context)
    }

    handleTap(cb : Function) {
        this.tesc.startUpdating(() => {
            this.animator.start(() => {
                cb()
                this.tesc.update(() => {
                    this.animator.stop()
                    cb()
                })
            })
        })
    }
}
