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
    onChange:any,
}
) => {
    const [sliderValue, setSliderValue] = useState(value)
    useEffect(() => {
        setSliderValue(value)
    }, [value])
    return (
        <div className="slider">
          <div>label</div>
          <input
            min={min}
            max={max}
            type="range"
            value={value}
            className={`slider`}
            id = {`${label}_slider`}
            onChange={onChange}
          />
        </div>
      );
}

export default Slider