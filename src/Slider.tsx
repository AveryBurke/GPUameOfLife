import React, {useState, useEffect} from "react";

const Slider = (
{
    min,
    max,
    value,
    label,
    onChange
}:{
    min:number,
    max:number,
    value:number,
    label:string,
    onChange:(value: number) => void,
}
) => {
    const [sliderValue, setSliderValue] = useState(value)
    const [mouseState, setMouseState] = useState<"up" | "down">('up')
    useEffect(() => {
      setSliderValue(value)
    },[value])
    useEffect(() => {
        if (mouseState === 'up'){
          onChange(sliderValue)
        }
    }, [mouseState])

    return (
        <div className="slider">
          <input
            min={min}
            max={max}
            type="range"
            value={sliderValue}
            className={`slider`}
            id = {`${label}_slider`}
            onChange={e => setSliderValue(+e.target.value)}
            onMouseDown={() => setMouseState('down')}
            onMouseUp={() => setMouseState('up')}
          />
        </div>
      );
}

export default Slider