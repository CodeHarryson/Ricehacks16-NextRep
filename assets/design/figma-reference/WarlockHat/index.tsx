import svgPaths from "./svg-ya5fdplm2l";

export default function WarlockHat() {
  return (
    <div className="relative size-full" data-name="warlock hat">
      <div className="absolute inset-[0_-2.62%_0_0]">
        <svg className="block size-full" fill="none" height="104.475" preserveAspectRatio="none" viewBox="0 0 117.5 104.475" width="117.5">
          <g id="warlock hat">
            <g id="Polygon 1">
              <g filter="url(#filter0_i_0_4)">
                <path d={svgPaths.p1e846a80} fill="#5959B6" />
              </g>
              <path d={svgPaths.p2c5c3400} stroke="#52229B" strokeLinejoin="round" strokeWidth="3" />
            </g>
            <g id="Ellipse 1">
              <g filter="url(#filter1_i_0_4)">
                <path d={svgPaths.p13cda700} fill="#C5E2E7" />
              </g>
              <path d={svgPaths.p399b4300} stroke="#B5D1FF" strokeWidth="3" style={{ mixBlendMode: "plus-lighter" }} />
            </g>
          </g>
          <defs>
            <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="74.9263" id="filter0_i_0_4" width="100" x="17.4998" y="11.3695">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
              <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
              <feOffset dy="-7" />
              <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
              <feColorMatrix type="matrix" values="0 0 0 0 0.490196 0 0 0 0 0.235294 0 0 0 0 0.596078 0 0 0 1 0" />
              <feBlend in2="shape" mode="color-dodge" result="effect1_innerShadow_0_4" />
            </filter>
            <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="19.9792" id="filter1_i_0_4" width="19.6784" x="2.8115" y="32.2804">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
              <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
              <feOffset dy="4" />
              <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
              <feColorMatrix type="matrix" values="0 0 0 0 0.52549 0 0 0 0 0.937255 0 0 0 0 0.67451 0 0 0 1 0" />
              <feBlend in2="shape" mode="screen" result="effect1_innerShadow_0_4" />
            </filter>
          </defs>
        </svg>
      </div>
    </div>
  );
}