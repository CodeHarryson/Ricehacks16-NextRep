import svgPaths from "./svg-8403qowjv7";

export default function Gauntlet() {
  return (
    <div className="relative size-full" data-name="Gauntlet">
      <svg className="absolute block inset-0 size-full" fill="none" height="51" preserveAspectRatio="none" viewBox="0 0 52.2353 51" width="52.2353">
        <g id="Gauntlet">
          <g id="weapon hand">
            <mask fill="white" id="path-1-inside-1_0_4">
              <path d={svgPaths.p1219d400} />
            </mask>
            <g filter="url(#filter0_ii_0_4)">
              <path d={svgPaths.p1219d400} fill="#D35B5B" />
            </g>
            <path d={svgPaths.pe3aa380} fill="#A22626" mask="url(#path-1-inside-1_0_4)" style={{ mixBlendMode: "multiply" }} />
          </g>
          <g id="Line 3">
            <path d={svgPaths.p293b3e80} stroke="#860E0E" strokeLinecap="round" strokeWidth="2" style={{ mixBlendMode: "darken" }} />
          </g>
        </g>
        <defs>
          <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="40.9836" id="filter0_ii_0_4" width="39.0837" x="6.767" y="3.69505">
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
            <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
            <feOffset dy="-7" />
            <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.490196 0 0 0 0 0.235294 0 0 0 0 0.596078 0 0 0 1 0" />
            <feBlend in2="shape" mode="multiply" result="effect1_innerShadow_0_4" />
            <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
            <feOffset dx="5" dy="4" />
            <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.345098 0 0 0 0 0.8 0 0 0 0 0.00784314 0 0 0 1 0" />
            <feBlend in2="effect1_innerShadow_0_4" mode="screen" result="effect2_innerShadow_0_4" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}