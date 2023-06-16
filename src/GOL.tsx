import React, { useEffect, useState, useRef, useCallback } from "react";
import useDynamicInterval from "./hooks/useDynamicInterval";
import paint from "./static/paint";
import loadSimulationData from "./static/loadSimulationData";
import renderGOL from "./static/renderGOL";

const vertices = new Float32Array([
    //   X,    Y,
    -0.8, -0.8,
    0.8, -0.8,
    0.8, 0.8,

    -0.8, -0.8,
    0.8, 0.8,
    -0.8, 0.8,
]);

const GOL = ({ fetchDevice, width, height, interval }: { fetchDevice: (() => Promise<any[]>), width: number, height: number, interval: number }) => {
    const ratio = window.devicePixelRatio
    const [device, setDevice] = useState<any>(null)
    const [mouseState, setMouseState] = useState<"up" | "down">("up")
    const [ready, setReady] = useState(false)
    const [simulation, setSimulation] = useState<any>()
    const [inputArray, setInputArray] = useState<Uint32Array>(new Uint32Array(width * height))
    const refCanvas = useRef<HTMLCanvasElement>(null)
    const refCtx = useRef<any>(null)
    const [inputArrayHasChanged, setHasChanged] = useState(false)

    useEffect(() => {
        async function handleFetchDevice() {
            const [device] = await fetchDevice()
            setDevice(device)
        }
        handleFetchDevice()
    }, [])

    useEffect(() => {
        if (refCanvas.current && !refCtx.current) {
            refCtx.current = refCanvas.current.getContext("webgpu");
        }
    }, [refCanvas.current])

    useEffect(() => {
        if (device && refCtx.current) {
            const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
            refCtx.current.configure({
                device,
                format: canvasFormat,
            });
            setReady(true);
        }
    }, [device, refCtx.current])

    const hanldePaint = (event: MouseEvent, canvas: HTMLCanvasElement) => {
        const offsetRatio = Math.min(width, height) / Math.max(width, height)
        paint(event, canvas, width, height, inputArray, window.devicePixelRatio, offsetRatio)
        setHasChanged(true)
    }

    //initilize the simulation, once the deivce is fetched and the context is configured
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