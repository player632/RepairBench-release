export const basicOptions = ["none", "detect", "bash", "fish", "zsh", "nushell"];

export const richOptions = [
    {
        label: "General",
        options: [
            {
                name: "Window style: compact",
                value: "window:compact",
                description: "Tighter spacing between controls",
                icon: "W"
            },
            {
                name: "Window style: relaxed",
                value: "window:relaxed",
                description: "Extra spacing for readability",
                icon: "W"
            }
        ]
    },
    {
        label: "Split behavior",
        separatorBefore: true,
        options: [
            {
                name: "Resize split",
                value: "split:resize",
                description: "Arrow keys resize active split",
                icon: "R"
            },
            {
                name: "Focus split",
                value: "split:focus",
                description: "Arrow keys move split focus",
                icon: "F"
            },
            {
                name: "No split action",
                value: "split:none",
                description: "Keep default behavior",
                icon: "-"
            }
        ]
    },
    {
        label: "Experimental",
        separatorBefore: true,
        options: [
            {
                name: "Custom accelerator map",
                value: "exp:accelerator-map",
                description: "Allows user-provided accelerator mapping",
                icon: "X"
            },
            {
                name: "GPU input heuristics",
                value: "exp:gpu-input",
                description: "Uses GPU-backed key processing path",
                icon: "X",
                disabled: true
            }
        ]
    }
];