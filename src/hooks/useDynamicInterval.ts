//slightly modified from https://usehooks-ts.com/react-hook/use-timeout
import { useEffect, useRef } from 'react'

function useDynamicInterval(callback:any, delay:number) {
  const savedCallback = useRef(callback)
  const savedID = useRef(0)
  // Remember the latest callback if it changes.
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // Set up the timeout.
  useEffect(() => {
    //clear the previous setInterval when changing intervals
    clearTimeout(savedID.current)
    // Don't schedule if no delay is specified.
    if (delay === null) {
      return
    }

    const id = setInterval(() => savedCallback.current(), delay)
    savedID.current = id
    return () => clearTimeout(id)
  }, [delay])
}

export default useDynamicInterval