import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ControlPanel from "./ControlPanel";
import GOL from "./GOL";

const App = () => {
    async function fetchDAndA() {
        //@ts-check
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
            throw new Error("No appropriate GPUAdapter found.");
        }

        const device = await adapter.requestDevice();
        return [adapter, device]

    }
    const fetchDeviceAndAdapter = useCallback(async () => {
        const [adapter, device] = await fetchDAndA()
        return [adapter, device]
    }, [])


    const [width, setWidth] = useState(48)
    const [height, setHeight] = useState(48)
    const onHeightChange = useCallback((height: number) => {
        setHeight(height)
    }, [])

    const onWidthChange = useCallback((width: number) => {
        setWidth(width)
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

    const GOLprops = useMemo(() => ({
        fetchDeviceAndAdapter,
        width,
        height
    }),[width,height])

    const controlePanelProps = { sliderProps: [widthSliderProps, heightSliderProps] }
    return (<div className="container">
        <ControlPanel {...controlePanelProps} />
        <GOL {...GOLprops} />
    </div>)
}

export default App