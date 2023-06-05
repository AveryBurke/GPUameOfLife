import React, { useState, useMemo, useCallback } from "react";
import Slider from './Slider'

const ControlPanel = () => {
    const [gridSize, setGridSize] = useState(64)

    const gridChange = useCallback((gridSize:number) =>{
        setGridSize(gridSize * gridSize)
    },[])

    const gridSliderProps = useMemo(() => ({
        value: Math.sqrt(gridSize),
        max: 100,
        min: 4,
        onChange: gridChange,
        label: "grid size"
    }), [gridSize])



    return (
        <div className="controlePanelContainer">
            <Slider {...gridSliderProps} />
        </div>)
}