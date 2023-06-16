const paint = (event: MouseEvent, canvas: HTMLCanvasElement, gridWidth:number, gridHeight:number, indexArray:Uint32Array, devicePixelRatio:number, offsetRatio:number) => {
            const { offsetX, offsetY } = event
            const [adjustX, adjustY] = [offsetX * devicePixelRatio, offsetY * devicePixelRatio]
                const squareSize = (canvas.height / gridHeight)
                const xCoord = Math.ceil((adjustX) / squareSize) - 1
                const yCoord = gridHeight - Math.ceil((adjustY) / squareSize)
                const index = yCoord * gridWidth + xCoord
                indexArray[index] ^= 1
        }
export default paint