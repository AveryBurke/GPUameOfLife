export default ({
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
})