import svgPaths from "./svg-189sfn0wi7";

export default function MagicWand() {
  return (
    <div className="relative size-full" data-name="magic wand">
      <div className="absolute inset-[-6%_-26.05%_0_-26.05%]">
        <svg className="block size-full" fill="none" height="100.7" preserveAspectRatio="none" viewBox="0 0 30.4214 100.7" width="30.4214">
          <g id="magic wand">
            <g id="Rectangle 3">
              <g filter="url(#filter1_i_0_4)">
                <path d={svgPaths.p324ba0b0} fill="#B693AF" />
              </g>
              <path d={svgPaths.p2ead6000} stroke="#1A2B4A" style={{ mixBlendMode: "overlay" }} />
            </g>
            <g filter="url(#filter2_f_0_4)" id="Star 2">
              <path d={svgPaths.p9d13080} fill="#FDE68A" fillOpacity="0.2" />
              <path d={svgPaths.pe0b480} stroke="#F59E0B" strokeLinejoin="round" strokeOpacity="0.2" strokeWidth="1.7" style={{ mixBlendMode: "lighten" }} />
            </g>
            <g id="Star 1">
              <path d={svgPaths.pe0b480} fill="#FDE68A" />
              <path d={svgPaths.pe0b480} stroke="#F59E0B" strokeLinejoin="round" strokeWidth="1.7" style={{ mixBlendMode: "lighten" }} />
            </g>
          </g>
          <defs>
            <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="83" id="filter1_i_0_4" width="8" x="10.2107" y="17.7">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
              <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
              <feOffset dx="2" dy="-7" />
              <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
              <feColorMatrix type="matrix" values="0 0 0 0 0.52549 0 0 0 0 0.937255 0 0 0 0 0.67451 0 0 0 1 0" />
              <feBlend in2="shape" mode="darken" result="effect1_innerShadow_0_4" />
            </filter>
            <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="29.4902" id="filter2_f_0_4" width="30.4214" x="1.19209e-07" y="-2.38419e-07">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
              <feGaussianBlur result="effect1_foregroundBlur_0_4" stdDeviation="2" />
            </filter>
          </defs>
        </svg>
      </div>
    </div>
  );
}