import { ComponentProps } from "solid-js";

export const Eight = (props: ComponentProps<"svg">) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
    <g
      id="SVGRepo_tracerCarrier"
      stroke-linecap="round"
      stroke-linejoin="round"
    ></g>
    <g id="SVGRepo_iconCarrier">
      {" "}
      <g clip-path="url(#clip0_429_10994)">
        {" "}
        <circle
          cx="12"
          cy="15"
          r="5"
          stroke="#424242"
          stroke-width="2.5"
          stroke-linejoin="round"
        ></circle>{" "}
        <circle
          cx="12"
          cy="7"
          r="3"
          stroke="#424242"
          stroke-width="2.5"
          stroke-linejoin="round"
        ></circle>{" "}
      </g>{" "}
      <defs>
        {" "}
        <clipPath id="clip0_429_10994">
          {" "}
          <rect width="24" height="24" fill="none"></rect>{" "}
        </clipPath>{" "}
      </defs>{" "}
    </g>
  </svg>
);
