const paint = (event: MouseEvent, canvas: HTMLCanvasElement, gridWidth: number, gridHeight: number, indexArray: Uint32Array, devicePixelRatio: number, offsetRatio: number) => {
        const { offsetX, offsetY } = event
        const squareSize = Math.min((canvas.width / gridWidth), (canvas.height / gridHeight))
        const [adjustX, adjustY] = [offsetX * devicePixelRatio - (canvas.width - (squareSize * gridWidth)) / 4, 
                                offsetY * devicePixelRatio - (canvas.height - (squareSize * gridHeight)) / 4]
        const xCoord = Math.ceil((adjustX) / squareSize) - 1
        const yCoord = gridHeight - Math.ceil((adjustY) / squareSize)
        const index = yCoord * gridWidth + xCoord
        indexArray[index] ^= 1
}
export default paint