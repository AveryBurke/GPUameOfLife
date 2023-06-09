import React, { useEffect, useState, useRef, useCallback } from "react";
import loadSimulationData from "./static/loadSimulationData";
import renderGOL from "./static/renderGOL";

type FetchDeviceAndAdapter = () => Promise<any[]>

const vertices = new Float32Array([
        //   X,    Y,
        -0.8, -0.8,
        0.8, -0.8,
        0.8, 0.8,

        -0.8, -0.8,
        0.8, 0.8,
        -0.8, 0.8,
    ]);

const GOL = ({ fetchDeviceAndAdapter, width, height}: { fetchDeviceAndAdapter: FetchDeviceAndAdapter, width:number, height:number}) => {
    const ratio = window.devicePixelRatio
    const [state, setState] = useState<{ device: any, adapter: any }>({ device: null, adapter: null })
    const [ready, setReady] = useState(false)
    const [runningSimulation, setRunningSimulation] = useState<any>(null)
    const refCanvas = useRef<HTMLCanvasElement>(null)
    const refCtx = useRef<any>(null)
    useEffect(() => {
        async function handleFetchDeviceAndAdapter() {
            const [adapter, device] = await fetchDeviceAndAdapter()
            setState({ device, adapter })
        }
        handleFetchDeviceAndAdapter()
    }, [])
    useEffect(() => {
        if (refCanvas.current && !refCtx.current) {
            refCtx.current = refCanvas.current.getContext("webgpu");
        }
    }, [refCanvas.current])

    useEffect(() => {
        const { device, adapter } = state
        if (device && adapter && refCtx.current) setReady(true)
    }, [state, refCtx.current])

 

    useEffect(() => {
        if (ready) {
            //kill the current running simulaiton
            clearInterval(runningSimulation)
            const {device} = state 
            const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
            refCtx.current.configure({
                device,
                format: canvasFormat,
            });
            if (refCanvas.current){
            const simulation = loadSimulationData({device,workGroupSize:16,vertices,gridWidth:width,gridHeight:height,canvas:refCanvas.current,canvasFormat,renderFun:renderGOL})
           
            //create a new running simulation
            const runningSimulation = setInterval(() => {
                simulation(refCtx.current)
            },200)
            setRunningSimulation(runningSimulation)
        }
        }
    }, [ready, width, height])

    

    return <canvas ref={refCanvas} width={600 * ratio} height={600 * ratio} style={{ width: `${600}px`, height: `${600}px` }} />
}

export default React.memo(GOL)