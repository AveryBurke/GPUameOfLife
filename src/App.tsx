import React, { useCallback, useMemo, useState } from "react";
import ControlPanel from "./ControlPanel";
import GOL from "./GOL";

const App = () => {
    async function fetchD() {
        //@ts-check
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
            throw new Error("No appropriate GPUAdapter found.");
        }

        const device = await adapter.requestDevice();
        return [device]

    }
    const fetchDevice = useCallback(async () => {
        const [device] = await fetchD()
        return [device]
    }, [])


    const [width, setWidth] = useState(48)
    const [height, setHeight] = useState(48)
    const [interval, setInterval] = useState(200)
    const onHeightChange = useCallback((height: number) => {
        setHeight(height)
    }, [])

    const onWidthChange = useCallback((width: number) => {
        setWidth(width)
    }, [])

    const onIntervalChange = useCallback((interval:number) =>{
        setInterval(interval)
    }, [])

    const heightSliderProps = useMemo(() => ({
        value: height,
        max: 1024,
        min: 16,
        step: 16,
        onChange: onHeightChange,
        label: "height"
    }), [height])

    const widthSliderProps = useMemo(() => ({
        value: width,
        max: 1024,
        min: 16,
        step: 16,
        onChange: onWidthChange,
        label: "width"
    }), [width])

    const intervalSliderProps = useMemo(() => ({
        value: interval,
        max: 1000,
        min: 20,
        step: 20,
        onChange: onIntervalChange,
        label: "ms"
    }),[interval])

    const GOLprops = useMemo(() => ({
        fetchDevice,
        width,
        height,
        interval
    }),[width, height, interval])

    const controlePanelProps = { sliderProps: [intervalSliderProps, widthSliderProps, heightSliderProps] }
    return (<div className="container">
        <ControlPanel {...controlePanelProps} />
        <GOL {...GOLprops} />
    </div>)
}

export default App