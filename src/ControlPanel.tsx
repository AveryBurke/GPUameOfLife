import React, { useState, useMemo, useCallback, Fragment } from "react";
import Slider from './Slider'

type SliderProps = {
    value: number,
    label: string,
    min: number,
    max: number,
    step:number,
    onChange: (input: number) => void
}

const ControlPanel = ({sliderProps}:{sliderProps:SliderProps[]}) => {

    const sliders = sliderProps.map((sliderProp, i) => <Slider key = {`${i}_slider`} {...sliderProp}/>)


    return (
        <div className="controlePanelContainer">
            {sliders}
        </div>)
}

export default ControlPanel