import React, { useState, useEffect } from "react";

const Slider = (
  {
    min,
    max,
    step,
    value,
    label,
    onChange
  }: {
    min: number,
    max: number,
    step:number,
    value: number,
    label: string,
    onChange: (value: number) => void,
  }
) => {
  const [sliderWidth, setSliderWidth] = useState<`${number}%`>(`${((value - min) / (max - min) )* 100}%`)
  const [sliderValue, setSliderValue] = useState(value)
  const [mouseState, setMouseState] = useState<"up" | "down">('up')

  const changeWidth = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const { nativeEvent: { offsetX }, currentTarget: { offsetWidth } } = e
    if (mouseState === 'down') {
      const quantizedX = Math.ceil(offsetX / step) * step
      const precentage: number = quantizedX / offsetWidth 

      setSliderWidth(`${(offsetX / offsetWidth) * 100}%`)
      setSliderValue(Math.floor(max * precentage) + min)
    }
  }

  const onNumberChange = (value:number) => {
    if (min <= value && value <= max){
    setSliderWidth(`${((value - min) / (max - min) ) * 100}%`)
    setSliderValue(value)
    onChange(value)
  }
  }

  useEffect(() => {
    setSliderValue(value)
  }, [value])
  useEffect(() => {
    if (mouseState === 'up') {
      onChange(sliderValue)
      setSliderWidth(`${((sliderValue - min) / (max - min) )* 100}%`)
    }
  }, [mouseState])

  return (
    <div className="slider-wrapper">
      <span>{label}</span>
      <div className="slider-parent"
        onClick={e => changeWidth(e)}
        onMouseDown={(e) => {
          setMouseState('down')
          changeWidth(e)
        }}
        onMouseMove={(e) => changeWidth(e)}
        onMouseUp={() => setMouseState('up')}
      >
        <div className="slider"
          style={{ width: sliderWidth }}
        >
        </div>
      </div>
      <input
        className="number"
        type="number"
        maxLength={4}
        max={max}
        min={min}
        step={step}
        style={{ appearance: "none" }}
        value={sliderValue}
        onChange={e => onNumberChange(+e.target.value)}
      />
    </div>
  );
}

export default Slider