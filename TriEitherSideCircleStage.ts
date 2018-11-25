const w : number = window.innerWidth, h : number = window.innerHeight
const tris : number = 2
const scDiv : number = 0.51
const scGap : number = 0.05

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
