export default function updateGrid({
    device,
    cellStateStorage,
    indexArray,
    simulationPipeline,
    bindGroups,
    workGroupSize,
    gridWidth,
    gridHeight,
    cellPipeline,
    vertexBuffer,
    vertices,
    step
}) {
    return function simulation(context: any) {
        /*  
        Command buffers are a buffer of commands. You create encoders. 
        The encoders encode commands into the command buffer. 
        You then finish the encoder and it gives you the command buffer it created. 
        You can then submit that command buffer to have WebGPU execute the commands.
    */

        device.queue.writeBuffer(cellStateStorage[2], 0, indexArray);
        const encoder = device.createCommandEncoder();
        //start a compute pass
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
}