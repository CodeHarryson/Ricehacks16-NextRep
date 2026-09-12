import svgPaths from "./svg-kbybzq1rfb";

export default function LowTierShield() {
  return (
    <div className="relative size-full" data-name="Low Tier shield">
      <svg className="absolute block inset-0 size-full" fill="none" height="93.114" preserveAspectRatio="none" viewBox="0 0 93.114 93.114" width="93.114">
        <g id="Low Tier shield">
          <g id="Rectangle 1">
            <g filter="url(#filter0_ii_0_4)">
              <path d={svgPaths.p1ad43500} fill="#BE8D4B" />
            </g>
            <path d={svgPaths.p3cb53300} stroke="#7A4F00" strokeWidth="3" />
          </g>
          <g id="Line 1">
            <path d={svgPaths.p1bde4800} fill="#B45309" style={{ mixBlendMode: "plus-darker" }} />
          </g>
          <g id="Line 2">
            <path d={svgPaths.p18733f00} fill="#B45309" style={{ mixBlendMode: "plus-darker" }} />
          </g>
        </g>
        <defs>
          <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="83.6262" id="filter0_ii_0_4" width="69.9746" x="11.7442" y="7.87163">
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
            <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
            <feOffset dy="-8" />
            <feGaussianBlur stdDeviation="0.5" />
            <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.478431 0 0 0 0 0.309804 0 0 0 0 0 0 0 0 0.47 0" />
            <feBlend in2="shape" mode="color-burn" result="effect1_innerShadow_0_4" />
            <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
            <feOffset dy="10" />
            <feGaussianBlur stdDeviation="1.5" />
            <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.530818 0 0 0 0 0.297602 0 0 0 0 0.142125 0 0 0 1 0" />
            <feBlend in2="effect1_innerShadow_0_4" mode="plus-lighter" result="effect2_innerShadow_0_4" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}