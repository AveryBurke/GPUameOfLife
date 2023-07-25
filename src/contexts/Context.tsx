import React, { createContext, useEffect, useState } from 'react';

type Status = "idel" | "loading" | "complete" | "error"
type Vals = { device: any, status: Status }
const AsynContext = createContext<Vals>({ device: null, status: "idel" });

const AsynContexProvider = (props: React.PropsWithChildren) => {
    const [device, setDevice] = useState<any>()
    const [status, setStatus] = useState<Status>('idel')
    async function fetchDevice() {
        //@ts-check
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
            setStatus("error")
        } else {
            const device = await adapter.requestDevice();
            setDevice(device)
        }
    }

    useEffect(() => {
        setStatus('loading')
        fetchDevice()
    }, [])

    useEffect(() => {
        if (device){
            setStatus('complete')
        }
    },[device])

    return (
        <AsynContext.Provider value={{ device, status }}>
            {props.children}
        </AsynContext.Provider>
    )
}

export {AsynContext, AsynContexProvider}