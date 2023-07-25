import React, { useEffect, useState, useRef, useCallback, useContext } from "react";
import useDynamicInterval from "./hooks/useDynamicInterval";
import paint from "./static/paint";
import loadSimulationData from "./static/loadSimulationData";
import renderGOL from "./static/renderGOL";
import { AsynContext } from "./contexts/Context";

const vertices = new Float32Array([
//   X,   Y,
    -0.8, -0.8,
    0.8, -0.8,
    0.8, 0.8,

    -0.8, -0.8,
    0.8, 0.8,
    -0.8, 0.8,
]);

const GOL = ({ width, height, interval }: {width: number, height: number, interval: number }) => {
    const {device} = useContext(AsynContext)
    const ratio = window.devicePixelRatio
    const [mouseState, setMouseState] = useState<"up" | "down">("up")
    const [ready, setReady] = useState(false)
    const [simulation, setSimulation] = useState<any>()
    const [inputArray, setInputArray] = useState<Uint32Array>(new Uint32Array(width * height))
    const refCanvas = useRef<HTMLCanvasElement>(null)
    const refCtx = useRef<any>(null)
    const [inputArrayHasChanged, setHasChanged] = useState(false)

    useEffect(() => {
        if (refCanvas.current && !refCtx.current) {
            refCtx.current = refCanvas.current.getContext("webgpu");
        }
    }, [refCanvas.current])

    useEffect(() => {
        if (refCtx.current) {
            const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
            refCtx.current.configure({
                device,
                format: canvasFormat,
            });
            setReady(true);
        }
    }, [refCtx.current])

    const hanldePaint = (event: MouseEvent, canvas: HTMLCanvasElement) => {
        const offsetRatio = Math.min(width, height) / Math.max(width, height)
        paint(event, canvas, width, height, inputArray, window.devicePixelRatio, offsetRatio)
        setHasChanged(true)
    }

    //initilize the simulation
    useEffect(() => {
        if (ready && refCtx.current) {
            const simulation = loadSimulationData({ device, workGroupSize: 16, vertices, gridWidth: width, gridHeight: height, canvasFormat: navigator.gpu.getPreferredCanvasFormat(), renderFun: renderGOL })
            setSimulation(() => simulation)
        }
    }, [ready])

    useEffect(() => {
        if (ready && refCtx.current) {
            setInputArray(new Uint32Array(width * height))
            const simulation = loadSimulationData({ device, workGroupSize: 16, vertices, gridWidth: width, gridHeight: height, canvasFormat: navigator.gpu.getPreferredCanvasFormat(), renderFun: renderGOL })
            setSimulation(() => simulation)
        }
    }, [width, height])

    const sim = useCallback(() => {
        if (typeof simulation === "function" && refCtx.current) {
            simulation(refCtx.current,inputArray)
            if (inputArrayHasChanged){
                setInputArray(new Uint32Array(width * height))
                setHasChanged(false)
            }
        }
    },[simulation, inputArrayHasChanged])

    useDynamicInterval(sim,interval)

    return <canvas
        ref={refCanvas}
        onMouseMove={function (e) {
            const { nativeEvent, target } = e
            if (mouseState === 'down') {
                hanldePaint(nativeEvent, target as HTMLCanvasElement)
            }
        }}
        onClick={function (e) {
            const { nativeEvent, target } = e
                console.log(nativeEvent.offsetX, nativeEvent.offsetY)
                hanldePaint(nativeEvent, target as HTMLCanvasElement)
        }}
        onMouseDown={() => setMouseState('down')}
        onMouseUp={() => setMouseState('up')}
        onMouseOut={() => setMouseState('up')}
        width={600 * ratio}
        height={600 * ratio}
        style={{ width: `${600}px`, height: `${600}px` }}
    />
}

export default React.memo(GOL)