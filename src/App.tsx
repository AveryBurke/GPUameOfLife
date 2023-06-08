import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ControlPanel from "./ControlPanel";
async function app(canvas: HTMLCanvasElement) {

    //@ts-ignore
    if (!navigator.gpu) {
        throw new Error("WebGPU not supported on this browser.");
    }
    //@ts-check
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        throw new Error("No appropriate GPUAdapter found.");
    }

    const device = await adapter.requestDevice();
    const context = canvas!.getContext("webgpu");
    const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device: device,
        format: canvasFormat,
    });

    const workGroupSize = 16
    const gridWidth = 208
    const gridHeight = 208


    const vertices = new Float32Array([
        //   X,    Y,
        -0.8, -0.8,
        0.8, -0.8,
        0.8, 0.8,

        -0.8, -0.8,
        0.8, 0.8,
        -0.8, 0.8,
    ]);

    const uniformArray = new Float32Array([gridWidth, gridHeight])
    const uniformBuffer = device.createBuffer({
        label: "Grid Uniforms",
        size: uniformArray.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(uniformBuffer, 0, uniformArray);

    const vertexBuffer = device.createBuffer({
        label: "Cell vertices",
        size: vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });


    device.queue.writeBuffer(vertexBuffer, /*bufferOffset=*/0, vertices);

    // Create an array representing the active state of each cell.
    const cellStateArray = new Uint32Array(gridWidth * gridHeight);

    // Create a storage buffer to hold the cell state.
    const cellStateStorage = [
        device.createBuffer({
            label: "Cell State A",
            size: cellStateArray.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        }),
        device.createBuffer({
            label: "Cell State B",
            size: cellStateArray.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        }),
        device.createBuffer({
            label: 'Cell State Input Buffer',
            size: cellStateArray.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        })
    ];

    // Set each cell to a random state, then copy the JavaScript array 
    // into the storage buffer.
    for (let i = 0; i < cellStateArray.length; ++i) {
        cellStateArray[i] = Math.random() > 0.9 ? 1 : 0;
    }
    let prevX = 0,
        prevY = 0
    const paint = (event: MouseEvent, canvas: HTMLCanvasElement) => {
        const { offsetX, offsetY } = event
        const [adjustX, adjustY] = [offsetX * window.devicePixelRatio, offsetY * window.devicePixelRatio]
        if (prevX !== adjustX && prevY !== adjustY) {
            prevX = adjustX
            prevY = adjustY
            const squareSize = canvas.height / gridHeight
            const xCoord = Math.ceil((adjustX) / squareSize) - 1
            const yCoord = gridHeight - Math.ceil((adjustY) / squareSize)
            const index = yCoord * gridWidth + xCoord
            indexArray[index] ^= 1
        }
    }
    let indexArray = new Uint32Array(gridWidth * gridHeight)
    let mouseDown = false
    canvas?.addEventListener('click', (event) => {
        if (canvas) {
            paint(event, canvas)
        }
    })
    canvas?.addEventListener('mousedown', (event) => {
        mouseDown = true
    })
    canvas?.addEventListener('mouseup', () => {
        mouseDown = false
    })
    canvas?.addEventListener('mousemove', (event) => {
        if (canvas && mouseDown) {
            paint(event, canvas)
        }
    })
    device.queue.writeBuffer(cellStateStorage[0], 0, cellStateArray);

    // // Mark every other cell of the second grid as active.
    // for (let i = 0; i < cellStateArray.length; i++) {
    //     cellStateArray[i] = i % 2;
    // }
    device.queue.writeBuffer(cellStateStorage[1], 0, cellStateArray);

    const vertexBufferLayout = {
        arrayStride: 8,
        attributes: [{
            format: "float32x2",
            offset: 0,
            shaderLocation: 0, // Position, see vertex shader
        }],
    };

    const simulationShaderModule = device.createShaderModule({
        label: "Simulation Shader",
        code: `
        @group(0) @binding(0) var<uniform> grid: vec2f;

        @group(0) @binding(1) var<storage> cellStateIn: array<u32>;
        @group(0) @binding(2) var<storage, read_write> cellStateOut: array<u32>;
        @group(0) @binding(3) var<storage, read> inputState: array<u32>;

        //find the cell index. handle out of bounds by "wrapping" the index around the grid
        fn cellIndex(cell: vec2u) -> u32 {
            return (cell.y % u32(grid.y)) * u32(grid.x) +
                   (cell.x % u32(grid.x));
          }
        
        fn cellActive(x: u32, y: u32) -> u32 {
            return cellStateIn[cellIndex(vec2(x, y))];
          }

        @compute @workgroup_size(${workGroupSize}, ${workGroupSize})
        fn computeMain(@builtin(global_invocation_id) cell: vec3u){
            let i = cellIndex(cell.xy);
            let activeNeighbors = cellActive(cell.x+1, cell.y+1) +
                        cellActive(cell.x+1, cell.y) +
                        cellActive(cell.x+1, cell.y-1) +
                        cellActive(cell.x, cell.y-1) +
                        cellActive(cell.x-1, cell.y-1) +
                        cellActive(cell.x-1, cell.y) +
                        cellActive(cell.x-1, cell.y+1) +
                        cellActive(cell.x, cell.y+1);
            /* if the user has selected a cell, then the value for that cell index, in the input state, will be 1 for this round of rendering.
            * then an Xor of the input state and current state will produce the desired result of 
            * flipping the cell state only when the input state is 1. Then the user input takes prefrence of the state update for
            * this render*/
            switch activeNeighbors {
                case 2: {
                    cellStateOut[i] = inputState[i] ^ cellStateIn[i];
                }
                case 3: {
                    cellStateOut[i] = inputState[i] ^ 1;
                }
                default: {
                    cellStateOut[i] = inputState[i] ^ 0;
                }
                }
                
        }
        `
    })

    const cellShaderModule = device.createShaderModule({
        label: "Cell shader",
        code: `
            struct VertexInput {
                @location(0) pos: vec2f,
                @builtin(instance_index) instance: u32,
            };
            
            struct VertexOutput {
                @builtin(position) pos: vec4f,
                @location(0) cell: vec2f
            };

            @group(0) @binding(0) var<uniform> grid: vec2f;
            @group(0) @binding(1) var<storage> cellState: array<u32>;

            @vertex
            fn vertexMain(input: VertexInput) -> VertexOutput {
                let i = f32(input.instance);
                let state = f32(cellState[input.instance]);
                let cell = vec2f(i % grid.x, floor(i / grid.x));
                let cellOffset = cell / grid * 2;
                let gridPos = (input.pos*state+1) / grid - 1 + cellOffset;
                var output:VertexOutput;
                var modify = vec2(1.0, 1.0);
                if (grid.y < grid.x){
                    modify = vec2(1.0, (grid.y / grid.x));
                }
                if (grid.x < grid.y){
                    modify = vec2(grid.x / grid.y, 1.0);
                }
                output.pos = vec4(gridPos * modify, 0, 1);
                output.cell = cell;
                return output;
            }
            
            @fragment
            fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
                let c = input.cell / grid;
                return vec4(c, 1 - c.x, 1);
            }
        `,
    });

    const bindGroupLayout = device.createBindGroupLayout({
        label: "Cell Bind Group Layout",
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT,
            buffer: {} // Grid uniform buffer
        }, {
            binding: 1,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
            buffer: { type: "read-only-storage" } // Cell state input buffer
        }, {
            binding: 2,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: "storage" } // Cell state output buffer
        },
        {
            binding: 3,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: "read-only-storage" } // Cell state input buffer for user data
        }
        ]
    });

    const bindGroups = [
        device.createBindGroup({
            label: "Cell renderer bind group A",
            layout: bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: { buffer: uniformBuffer }
                },
                {
                    binding: 1,
                    resource: { buffer: cellStateStorage[0] }
                },
                {
                    binding: 2,
                    resource: { buffer: cellStateStorage[1] }
                },
                {
                    binding: 3,
                    resource: { buffer: cellStateStorage[2] }
                }
            ],
        }),
        device.createBindGroup({
            label: "Cell renderer bind group B",
            layout: bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: { buffer: uniformBuffer }
                },
                {
                    binding: 1,
                    resource: { buffer: cellStateStorage[1] }
                },
                {
                    binding: 2,
                    resource: { buffer: cellStateStorage[0] }
                },
                {
                    binding: 3,
                    resource: { buffer: cellStateStorage[2] }
                }

            ],
        })
    ];

    const pipelineLayout = device.createPipelineLayout({
        label: "Cell Pipeline Layout",
        bindGroupLayouts: [bindGroupLayout],
    });

    const simulationPipeline = device.createComputePipeline({
        label: "Simulation pipeline",
        layout: pipelineLayout,
        compute: {
            module: simulationShaderModule,
            entryPoint: "computeMain",
        }
    });
    const cellPipeline = device.createRenderPipeline({
        label: "Cell pipeline",
        layout: pipelineLayout,
        vertex: {
            module: cellShaderModule,
            entryPoint: "vertexMain",
            buffers: [vertexBufferLayout]
        },
        fragment: {
            module: cellShaderModule,
            entryPoint: "fragmentMain",
            targets: [{
                format: canvasFormat
            }]
        }
    });

    const updateInterval = 200
    let step = 0

    // Move all of our rendering code into a function
    function updateGrid() {

        // console.log({indexArray})    

        /*  
            Command buffers are a buffer of commands. You create encoders. 
            The encoders encode commands into the command buffer. 
            You then finish the encoder and it gives you the command buffer it created. 
            You can then submit that command buffer to have WebGPU execute the commands.
        */




        device.queue.writeBuffer(cellStateStorage[2], 0, indexArray);
        const encoder = device.createCommandEncoder();
        // //start a compute pass
        const computePass = encoder.beginComputePass();

        computePass.setPipeline(simulationPipeline);
        computePass.setBindGroup(0, bindGroups[step % 2]);
        computePass.dispatchWorkgroups(Math.ceil(gridWidth / workGroupSize), Math.ceil(gridHeight / workGroupSize));
        computePass.end();
        indexArray = new Uint32Array(gridWidth * gridHeight)

        step++; // Increment the step count

        // Start a render pass 

        const pass = encoder.beginRenderPass({
            colorAttachments: [{
                view: context.getCurrentTexture().createView(),
                loadOp: "clear",
                clearValue: { r: 0, g: 0, b: 0.4, a: 1.0 },
                storeOp: "store",
            }]
        });

        // Draw the grid.
        pass.setPipeline(cellPipeline);
        //some logic goes here
        pass.setBindGroup(0, bindGroups[step % 2]);
        pass.setVertexBuffer(0, vertexBuffer);
        pass.draw(vertices.length / 2, gridWidth * gridHeight);

        // End the render pass and submit the command buffer
        pass.end();
        /**
        * It’s important to emphasize that all of these functions we called like setPipeline, 
        * and draw only add commands to a command buffer. 
        * They don’t actually execute the commands. 
        * The commands are executed when we submit the command buffer to the device queue
        */
        device.queue.submit([encoder.finish()]);
    }

    // Schedule updateGrid() to run repeatedly

    setInterval(updateGrid, updateInterval);
    // updateGrid()
}
const App = () => {
    const ratio = window.devicePixelRatio
    const refCanvas = useRef(null)
    const refFunction = useRef<((canvas:HTMLCanvasElement) => Promise<void>) | null>(null)

    const [width, setWidth] = useState(16)
    const [height, setHeight] = useState(16)
    const [timeStep, settimeStep] = useState(1)

    const onTimeStepChange = useCallback((step: number) => {
        settimeStep(step)
    }, []) 

    const onHeightChange = useCallback((height: number) => {
        setHeight(height)
    }, [])

    const onWidthChange = useCallback((width:number) => {
        setWidth(width)
    },[])
    // useCallback(() => {
    //     if (refCanvas.current) app(refCanvas.current)
    // },[width])

    // const timeStepSliderProps = useMemo(() => ({
    //     value: timeStep,
    //     max: 1,
    //     min: 60,
    //     onChange: onTimeStepChange,
    //     label: "step"
    // }), [timeStep])

    const heightSliderProps = useMemo(() => ({
        value: height,
        max: 1024,
        min: 16,
        step:16,
        onChange: onHeightChange,
        label: "height"
    }), [height])

    const widthSliderProps = useMemo(() => ({
        value: width,
        max: 1024,
        min: 16,
        step:16,
        onChange: onWidthChange,
        label: "width"
    }), [width])

    useEffect(() => {
        if (refCanvas.current) {
            refFunction.current = app
            refFunction.current(refCanvas.current)
        }
    }, [])

    useCallback(() => {
        if(refCanvas.current && refFunction.current) refFunction.current(refCanvas.current)
    }, [width])

    const controlePanelProps = {sliderProps:[widthSliderProps, heightSliderProps]}
    return (    
        <div className="container">
            <ControlPanel {...controlePanelProps} />
            <canvas ref={refCanvas} width={600 * ratio} height={600 * ratio} style={{width:`${600}px`,height:`${600}px`}} />
        </div>)
}

export default App