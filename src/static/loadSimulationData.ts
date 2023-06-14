import computeShader from "../shaders/computeShader";
import cellShader from "../shaders/cellShader";

export default function loadSimulationData(
    {
        device,
        workGroupSize,
        vertices,
        gridWidth,
        gridHeight,
        canvasFormat,
        renderFun }:
        {
            device: any,
            workGroupSize: number,
            vertices: Float32Array,
            gridWidth: number,
            gridHeight: number,
            canvasFormat: any
            renderFun: any
        }) {


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

    for (let i = 0; i < cellStateArray.length; ++i) {
        cellStateArray[i] = Math.random() > 0.9 ? 1 : 0;
    }
    
    device.queue.writeBuffer(cellStateStorage[0], 0, cellStateArray);
    device.queue.writeBuffer(cellStateStorage[1], 0, cellStateArray);

    const vertexBufferLayout = {
        arrayStride: 8,
        attributes: [{
            format: "float32x2",
            offset: 0,
            shaderLocation: 0, // Position, see vertex shader
        }],
    };

    const simulationShaderModule = device.createShaderModule(computeShader)

    const cellShaderModule = device.createShaderModule(cellShader);

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

    return renderFun({
        device,
        cellStateStorage,
        simulationPipeline,
        bindGroups,
        workGroupSize,
        gridWidth,
        gridHeight,
        cellPipeline,
        vertexBuffer,
        vertices,
        step:0
    })
}