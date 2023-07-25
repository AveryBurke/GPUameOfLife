import React, { useCallback, useMemo, useState, useContext } from "react";
import ControlPanel from "./ControlPanel";
import GOL from "./GOL";
import {AsynContext} from "./contexts/Context";

const App = () => {

    const {status} = useContext(AsynContext)
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
        width,
        height,
        interval
    }),[width, height, interval])

    const controlePanelProps = { sliderProps: [intervalSliderProps, widthSliderProps, heightSliderProps] }
    return (
    <div className="container">
        <ControlPanel {...controlePanelProps} />
        {status === "complete" ? <GOL {...GOLprops} /> : <span>{status}</span>}
    </div>)
}

export default App