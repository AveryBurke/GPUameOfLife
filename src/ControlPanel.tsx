import React, { useState, useMemo, useCallback } from "react";
import Slider from './Slider'

const ControlPanel = () => {
    const [gridSize, setGridSize] = useState(10)

    const gridChange = useCallback((gridSize:number) =>{
        setGridSize(gridSize)
    },[])

    const gridSliderProps = useMemo(() => ({
        value: gridSize,
        max: 100,
        min: 4,
        onChange: gridChange,
        label: "grid size"
    }), [gridSize])



    return (
        <div className="controlePanelContainer">
            <div>grid size: {gridSize} by {gridSize} </div>
            <Slider {...gridSliderProps} />
        </div>)
}

export default ControlPanel