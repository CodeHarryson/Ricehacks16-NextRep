import svgPaths from "./svg-ejkzc6mnu8";

function MapBackground() {
  return (
    <div className="absolute h-[843.99px] left-[0.5px] top-[0.53px] w-[390px]" data-name="MapBackground">
      <svg className="absolute block inset-0 size-full" fill="none" height="843.99" preserveAspectRatio="none" viewBox="0 0 390 843.99" width="390">
        <g clipPath="url(#clip0_0_117)" id="MapBackground">
          <ellipse cx="194.5" cy="550" fill="#58CC02" fillOpacity="0.45" id="Ellipse 2" rx="650.5" ry="418" />
        </g>
        <defs>
          <clipPath id="clip0_0_117">
            <rect fill="white" height="843.99" width="390" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function CharacterSprite() {
  return (
    <div className="absolute h-[39.998px] left-0 top-[-1.3px] w-[27.997px]" data-name="CharacterSprite">
      <svg className="absolute block inset-0 size-full" fill="none" height="39.9984" preserveAspectRatio="none" viewBox="0 0 27.9967 39.9984" width="27.9967">
        <g clipPath="url(#clip0_0_119)" id="CharacterSprite">
          <path d={svgPaths.p1ed697c0} fill="black" fillOpacity="0.35" id="Vector" />
          <path d={svgPaths.p2a0d0f00} fill="#1A0D2E" id="Vector_2" />
          <path d={svgPaths.p3d78b300} fill="#1A0D2E" id="Vector_3" />
          <path d={svgPaths.p12893c00} fill="#9B59B6" id="Vector_4" />
          <path d={svgPaths.p3165b180} fill="#9B59B6" id="Vector_5" />
          <path d={svgPaths.pe72300} fill="#9B59B6" id="Vector_6" />
          <path d={svgPaths.p1c9540c0} fill="#7D3C98" id="Vector_7" />
          <path d={svgPaths.pd4c8500} fill="#7D3C98" id="Vector_8" />
          <path d={svgPaths.p23f5ee00} fill="#BB8FCE" id="Vector_9" />
          <path d={svgPaths.pecc9c00} fill="#7D3C98" id="Vector_10" opacity="0.8" />
          <path d={svgPaths.p38837f00} fill="#7D3C98" id="Vector_11" opacity="0.8" />
          <path d={svgPaths.p1e16ab20} fill="#E91E63" id="Vector_12" opacity="0.9" />
          <path d={svgPaths.p26a89800} fill="white" id="Vector_13" opacity="0.6" />
          <path d={svgPaths.pd880680} fill="black" fillOpacity="0.35" id="Vector_14" />
          <path d={svgPaths.p34656200} fill="#F0C68D" id="Vector_15" />
          <path d={svgPaths.p172d2700} fill="#F0C68D" id="Vector_16" />
          <path d={svgPaths.p344d1c00} fill="#E8A870" id="Vector_17" opacity="0.5" />
          <path d={svgPaths.p3749de00} fill="#E8A870" id="Vector_18" opacity="0.5" />
          <path d={svgPaths.p48cb500} fill="#0D0820" id="Vector_19" />
          <path d={svgPaths.p27e9d770} fill="#0D0820" id="Vector_20" />
          <path d={svgPaths.p36b5a440} fill="#0D0820" id="Vector_21" />
          <path d={svgPaths.p302f2480} fill="#1A1A2E" id="Vector_22" />
          <path d={svgPaths.p5505100} fill="#1A1A2E" id="Vector_23" />
          <path d={svgPaths.p259a700} fill="white" id="Vector_24" />
          <path d={svgPaths.p32c69000} fill="white" id="Vector_25" />
          <path d={svgPaths.p38b0d600} id="Vector_26" stroke="#8A6A4A" strokeWidth="0.629926" />
        </g>
        <defs>
          <clipPath id="clip0_0_119">
            <rect fill="white" height="39.9984" width="27.9967" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function CharacterSpriteTransform() {
  return (
    <div className="content-stretch flex flex-col h-[39.998px] items-start relative shrink-0 w-[27.997px]" data-name="CharacterSprite:transform">
      <CharacterSprite />
    </div>
  );
}

function Container3() {
  return (
    <div className="bg-[rgba(255,255,255,0.8)] border-[#58cc02] border-[2.028px] border-solid content-stretch flex items-center justify-center p-[4px] relative rounded-[22687700px] shadow-[0px_0px_20px_0px_rgba(88,204,2,0.45)] shrink-0" data-name="Container">
      <CharacterSpriteTransform />
    </div>
  );
}

function Container4() {
  return <div className="bg-[#58cc02] relative rounded-[22687700px] shadow-[0px_0px_8px_0px_#58cc02] shrink-0 size-[8px]" data-name="Container" />;
}

function ContainerMargin() {
  return (
    <div className="content-stretch flex flex-col items-start pt-[2px] relative shrink-0" data-name="Container:margin">
      <Container4 />
    </div>
  );
}

function Container2() {
  return (
    <div className="absolute content-stretch flex flex-col items-center left-[174.99px] top-[486.57px]" data-name="Container">
      <Container3 />
      <ContainerMargin />
    </div>
  );
}

function Container5() {
  return (
    <div className="bg-[#ff4b4b] border-[1.352px] border-[rgba(255,255,255,0.5)] border-solid content-stretch drop-shadow-[0px_1px_1.5px_rgba(0,0,0,0.1),0px_1px_1px_rgba(0,0,0,0.1)] flex flex-col items-center px-[6px] py-[2px] relative rounded-[22687700px] shrink-0" data-name="Container">
      <p className="[word-break:break-word] font-['Nunito:Black',sans-serif] font-black leading-[13.5px] relative shrink-0 text-[9px] text-center text-white whitespace-nowrap">Lvl 12</p>
    </div>
  );
}

function CharacterSprite1() {
  return (
    <div className="h-[39.998px] relative shrink-0 w-[27.997px]" data-name="CharacterSprite">
      <svg className="absolute block inset-0 size-full" fill="none" height="39.9984" preserveAspectRatio="none" viewBox="0 0 27.9967 39.9984" width="27.9967">
        <g clipPath="url(#clip0_0_13)" id="CharacterSprite">
          <path d={svgPaths.p1ed697c0} fill="black" fillOpacity="0.35" id="Vector" />
          <path d={svgPaths.p2a0d0f00} fill="#2C3E50" id="Vector_2" />
          <path d={svgPaths.p3d78b300} fill="#2C3E50" id="Vector_3" />
          <path d={svgPaths.p12893c00} fill="#E74C3C" id="Vector_4" />
          <path d={svgPaths.p3165b180} fill="#E74C3C" id="Vector_5" />
          <path d={svgPaths.pe72300} fill="#E74C3C" id="Vector_6" />
          <path d={svgPaths.p1c9540c0} fill="#C0392B" id="Vector_7" />
          <path d={svgPaths.pd4c8500} fill="#C0392B" id="Vector_8" />
          <path d={svgPaths.p23f5ee00} fill="#FF6B6B" id="Vector_9" />
          <path d={svgPaths.p3f9efac0} fill="#FF8C00" id="Vector_10" opacity="0.85" />
          <path d={svgPaths.pffdb700} fill="#FF8C00" id="Vector_11" opacity="0.6" />
          <path d={svgPaths.pd880680} fill="black" fillOpacity="0.35" id="Vector_12" />
          <path d={svgPaths.p34656200} fill="#F4C68D" id="Vector_13" />
          <path d={svgPaths.p172d2700} fill="#F4C68D" id="Vector_14" />
          <path d={svgPaths.p344d1c00} fill="#E8A870" id="Vector_15" opacity="0.5" />
          <path d={svgPaths.p3749de00} fill="#E8A870" id="Vector_16" opacity="0.5" />
          <path d={svgPaths.pd8d4000} fill="#1A0A00" id="Vector_17" />
          <path d={svgPaths.p3a31500} fill="#1A0A00" id="Vector_18" />
          <path d={svgPaths.p18b1d380} fill="#1A0A00" id="Vector_19" />
          <path d={svgPaths.pde40380} fill="#1A0A00" id="Vector_20" />
          <path d={svgPaths.p302f2480} fill="#1A1A2E" id="Vector_21" />
          <path d={svgPaths.p5505100} fill="#1A1A2E" id="Vector_22" />
          <path d={svgPaths.p259a700} fill="white" id="Vector_23" />
          <path d={svgPaths.p32c69000} fill="white" id="Vector_24" />
          <path d={svgPaths.p38b0d600} id="Vector_25" stroke="#8A6A4A" strokeWidth="0.629926" />
        </g>
        <defs>
          <clipPath id="clip0_0_13">
            <rect fill="white" height="39.9984" width="27.9967" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Container6() {
  return (
    <div className="bg-[rgba(255,255,255,0.93)] border-[#ff4b4b] border-[2.028px] border-solid content-stretch flex items-center justify-center p-[3px] relative rounded-[22687700px] shadow-[0px_2px_12px_0px_rgba(255,75,75,0.33)] shrink-0" data-name="Container">
      <CharacterSprite1 />
    </div>
  );
}

function Container7() {
  return <div className="bg-[#ff4b4b] relative rounded-[22687700px] shrink-0 size-[6px]" data-name="Container" />;
}

function PlayerMarker() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[2px] items-center left-[148.15px] top-[300.55px]" data-name="PlayerMarker">
      <Container5 />
      <Container6 />
      <Container7 />
    </div>
  );
}

function Container8() {
  return (
    <div className="bg-[#4a90e2] border-[1.352px] border-[rgba(255,255,255,0.5)] border-solid content-stretch drop-shadow-[0px_1px_1.5px_rgba(0,0,0,0.1),0px_1px_1px_rgba(0,0,0,0.1)] flex flex-col items-center px-[6px] py-[2px] relative rounded-[22687700px] shrink-0" data-name="Container">
      <p className="[word-break:break-word] font-['Nunito:Black',sans-serif] font-black leading-[13.5px] relative shrink-0 text-[9px] text-center text-white whitespace-nowrap">Lvl 8</p>
    </div>
  );
}

function CharacterSprite2() {
  return (
    <div className="h-[39.998px] relative shrink-0 w-[27.997px]" data-name="CharacterSprite">
      <svg className="absolute block inset-0 size-full" fill="none" height="39.9984" preserveAspectRatio="none" viewBox="0 0 27.9967 39.9984" width="27.9967">
        <g clipPath="url(#clip0_0_91)" id="CharacterSprite">
          <path d={svgPaths.p1ed697c0} fill="black" fillOpacity="0.35" id="Vector" />
          <path d={svgPaths.p2a0d0f00} fill="#1A252F" id="Vector_2" />
          <path d={svgPaths.p3d78b300} fill="#1A252F" id="Vector_3" />
          <path d={svgPaths.p12893c00} fill="#3498DB" id="Vector_4" />
          <path d={svgPaths.p3165b180} fill="#3498DB" id="Vector_5" />
          <path d={svgPaths.pe72300} fill="#3498DB" id="Vector_6" />
          <path d={svgPaths.p1c9540c0} fill="#2471C8" id="Vector_7" />
          <path d={svgPaths.pd4c8500} fill="#2471C8" id="Vector_8" />
          <path d={svgPaths.p23f5ee00} fill="#5DADE2" id="Vector_9" />
          <path d={svgPaths.p27771930} fill="#5DADE2" id="Vector_10" opacity="0.5" />
          <path d={svgPaths.pc5000} fill="white" id="Vector_11" opacity="0.12" />
          <path d={svgPaths.paa1fc00} fill="#1ABC9C" id="Vector_12" opacity="0.9" />
          <path d={svgPaths.pd880680} fill="black" fillOpacity="0.35" id="Vector_13" />
          <path d={svgPaths.p34656200} fill="#E8B87A" id="Vector_14" />
          <path d={svgPaths.p172d2700} fill="#E8B87A" id="Vector_15" />
          <path d={svgPaths.p344d1c00} fill="#E8A870" id="Vector_16" opacity="0.5" />
          <path d={svgPaths.p3749de00} fill="#E8A870" id="Vector_17" opacity="0.5" />
          <path d={svgPaths.p26f34000} fill="#0D1B2A" id="Vector_18" />
          <path d={svgPaths.p127af600} fill="#2471C8" id="Vector_19" />
          <path d={svgPaths.p3b5e0180} fill="#2471C8" id="Vector_20" />
          <path d={svgPaths.p302f2480} fill="#1A1A2E" id="Vector_21" />
          <path d={svgPaths.p5505100} fill="#1A1A2E" id="Vector_22" />
          <path d={svgPaths.p259a700} fill="white" id="Vector_23" />
          <path d={svgPaths.p32c69000} fill="white" id="Vector_24" />
          <g id="Vector_25">
            <path d="M11.8986 9.8504H16.0981Z" fill="black" />
            <path d="M11.8986 9.8504H16.0981" stroke="#8A6A4A" strokeLinecap="round" strokeWidth="0.699917" />
          </g>
        </g>
        <defs>
          <clipPath id="clip0_0_91">
            <rect fill="white" height="39.9984" width="27.9967" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Container9() {
  return (
    <div className="bg-[rgba(255,255,255,0.93)] border-[#4a90e2] border-[2.028px] border-solid content-stretch flex items-center justify-center p-[3px] relative rounded-[22687700px] shadow-[0px_2px_12px_0px_rgba(74,144,226,0.33)] shrink-0" data-name="Container">
      <CharacterSprite2 />
    </div>
  );
}

function Container10() {
  return <div className="bg-[#4a90e2] relative rounded-[22687700px] shrink-0 size-[6px]" data-name="Container" />;
}

function PlayerMarker1() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[2px] items-center left-[85.81px] top-[451.88px]" data-name="PlayerMarker">
      <Container8 />
      <Container9 />
      <Container10 />
    </div>
  );
}

function Container11() {
  return (
    <div className="bg-[#ff4b4b] border-[1.352px] border-[rgba(255,255,255,0.5)] border-solid content-stretch drop-shadow-[0px_1px_1.5px_rgba(0,0,0,0.1),0px_1px_1px_rgba(0,0,0,0.1)] flex flex-col items-center px-[6px] py-[2px] relative rounded-[22687700px] shrink-0" data-name="Container">
      <p className="[word-break:break-word] font-['Nunito:Black',sans-serif] font-black leading-[13.5px] relative shrink-0 text-[9px] text-center text-white whitespace-nowrap">Lvl 6</p>
    </div>
  );
}

function CharacterSprite3() {
  return (
    <div className="h-[39.998px] relative shrink-0 w-[27.997px]" data-name="CharacterSprite">
      <svg className="absolute block inset-0 size-full" fill="none" height="39.9984" preserveAspectRatio="none" viewBox="0 0 27.9967 39.9984" width="27.9967">
        <g clipPath="url(#clip0_0_13)" id="CharacterSprite">
          <path d={svgPaths.p1ed697c0} fill="black" fillOpacity="0.35" id="Vector" />
          <path d={svgPaths.p2a0d0f00} fill="#2C3E50" id="Vector_2" />
          <path d={svgPaths.p3d78b300} fill="#2C3E50" id="Vector_3" />
          <path d={svgPaths.p12893c00} fill="#E74C3C" id="Vector_4" />
          <path d={svgPaths.p3165b180} fill="#E74C3C" id="Vector_5" />
          <path d={svgPaths.pe72300} fill="#E74C3C" id="Vector_6" />
          <path d={svgPaths.p1c9540c0} fill="#C0392B" id="Vector_7" />
          <path d={svgPaths.pd4c8500} fill="#C0392B" id="Vector_8" />
          <path d={svgPaths.p23f5ee00} fill="#FF6B6B" id="Vector_9" />
          <path d={svgPaths.p3f9efac0} fill="#FF8C00" id="Vector_10" opacity="0.85" />
          <path d={svgPaths.pffdb700} fill="#FF8C00" id="Vector_11" opacity="0.6" />
          <path d={svgPaths.pd880680} fill="black" fillOpacity="0.35" id="Vector_12" />
          <path d={svgPaths.p34656200} fill="#F4C68D" id="Vector_13" />
          <path d={svgPaths.p172d2700} fill="#F4C68D" id="Vector_14" />
          <path d={svgPaths.p344d1c00} fill="#E8A870" id="Vector_15" opacity="0.5" />
          <path d={svgPaths.p3749de00} fill="#E8A870" id="Vector_16" opacity="0.5" />
          <path d={svgPaths.pd8d4000} fill="#1A0A00" id="Vector_17" />
          <path d={svgPaths.p3a31500} fill="#1A0A00" id="Vector_18" />
          <path d={svgPaths.p18b1d380} fill="#1A0A00" id="Vector_19" />
          <path d={svgPaths.pde40380} fill="#1A0A00" id="Vector_20" />
          <path d={svgPaths.p302f2480} fill="#1A1A2E" id="Vector_21" />
          <path d={svgPaths.p5505100} fill="#1A1A2E" id="Vector_22" />
          <path d={svgPaths.p259a700} fill="white" id="Vector_23" />
          <path d={svgPaths.p32c69000} fill="white" id="Vector_24" />
          <path d={svgPaths.p38b0d600} id="Vector_25" stroke="#8A6A4A" strokeWidth="0.629926" />
        </g>
        <defs>
          <clipPath id="clip0_0_13">
            <rect fill="white" height="39.9984" width="27.9967" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Container12() {
  return (
    <div className="bg-[rgba(255,255,255,0.93)] border-[#ff4b4b] border-[2.028px] border-solid content-stretch flex items-center justify-center p-[3px] relative rounded-[22687700px] shadow-[0px_2px_12px_0px_rgba(255,75,75,0.33)] shrink-0" data-name="Container">
      <CharacterSprite3 />
    </div>
  );
}

function Container13() {
  return <div className="bg-[#ff4b4b] relative rounded-[22687700px] shrink-0 size-[6px]" data-name="Container" />;
}

function PlayerMarker2() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[2px] items-center left-[273.01px] top-[267.47px]" data-name="PlayerMarker">
      <Container11 />
      <Container12 />
      <Container13 />
    </div>
  );
}

function Container14() {
  return (
    <div className="bg-[#a855f7] border-[1.352px] border-[rgba(255,255,255,0.5)] border-solid content-stretch drop-shadow-[0px_1px_1.5px_rgba(0,0,0,0.1),0px_1px_1px_rgba(0,0,0,0.1)] flex flex-col items-center px-[6px] py-[2px] relative rounded-[22687700px] shrink-0" data-name="Container">
      <p className="[word-break:break-word] font-['Nunito:Black',sans-serif] font-black leading-[13.5px] relative shrink-0 text-[9px] text-center text-white whitespace-nowrap">Lvl 15</p>
    </div>
  );
}

function CharacterSprite4() {
  return (
    <div className="h-[39.998px] relative shrink-0 w-[27.997px]" data-name="CharacterSprite">
      <svg className="absolute block inset-0 size-full" fill="none" height="39.9984" preserveAspectRatio="none" viewBox="0 0 27.9967 39.9984" width="27.9967">
        <g clipPath="url(#clip0_0_47)" id="CharacterSprite">
          <path d={svgPaths.p1ed697c0} fill="black" fillOpacity="0.35" id="Vector" />
          <path d={svgPaths.p2a0d0f00} fill="#1A0D2E" id="Vector_2" />
          <path d={svgPaths.p3d78b300} fill="#1A0D2E" id="Vector_3" />
          <path d={svgPaths.p12893c00} fill="#9B59B6" id="Vector_4" />
          <path d={svgPaths.p3165b180} fill="#9B59B6" id="Vector_5" />
          <path d={svgPaths.pe72300} fill="#9B59B6" id="Vector_6" />
          <path d={svgPaths.p1c9540c0} fill="#7D3C98" id="Vector_7" />
          <path d={svgPaths.pd4c8500} fill="#7D3C98" id="Vector_8" />
          <path d={svgPaths.p23f5ee00} fill="#BB8FCE" id="Vector_9" />
          <path d={svgPaths.pecc9c00} fill="#7D3C98" id="Vector_10" opacity="0.8" />
          <path d={svgPaths.p38837f00} fill="#7D3C98" id="Vector_11" opacity="0.8" />
          <path d={svgPaths.p1e16ab20} fill="#E91E63" id="Vector_12" opacity="0.9" />
          <path d={svgPaths.p26a89800} fill="white" id="Vector_13" opacity="0.6" />
          <path d={svgPaths.pd880680} fill="black" fillOpacity="0.35" id="Vector_14" />
          <path d={svgPaths.p34656200} fill="#F0C68D" id="Vector_15" />
          <path d={svgPaths.p172d2700} fill="#F0C68D" id="Vector_16" />
          <path d={svgPaths.p344d1c00} fill="#E8A870" id="Vector_17" opacity="0.5" />
          <path d={svgPaths.p3749de00} fill="#E8A870" id="Vector_18" opacity="0.5" />
          <path d={svgPaths.p48cb500} fill="#0D0820" id="Vector_19" />
          <path d={svgPaths.p27e9d770} fill="#0D0820" id="Vector_20" />
          <path d={svgPaths.p36b5a440} fill="#0D0820" id="Vector_21" />
          <path d={svgPaths.p302f2480} fill="#1A1A2E" id="Vector_22" />
          <path d={svgPaths.p5505100} fill="#1A1A2E" id="Vector_23" />
          <path d={svgPaths.p259a700} fill="white" id="Vector_24" />
          <path d={svgPaths.p32c69000} fill="white" id="Vector_25" />
          <path d={svgPaths.p38b0d600} id="Vector_26" stroke="#8A6A4A" strokeWidth="0.629926" />
        </g>
        <defs>
          <clipPath id="clip0_0_47">
            <rect fill="white" height="39.9984" width="27.9967" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Container15() {
  return (
    <div className="bg-[rgba(255,255,255,0.93)] border-[#a855f7] border-[2.028px] border-solid content-stretch flex items-center justify-center p-[3px] relative rounded-[22687700px] shadow-[0px_2px_12px_0px_rgba(168,85,247,0.33)] shrink-0" data-name="Container">
      <CharacterSprite4 />
    </div>
  );
}

function Container16() {
  return <div className="bg-[#a855f7] relative rounded-[22687700px] shrink-0 size-[6px]" data-name="Container" />;
}

function PlayerMarker3() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[2px] items-center left-[249.55px] top-[489.01px]" data-name="PlayerMarker">
      <Container14 />
      <Container15 />
      <Container16 />
    </div>
  );
}

function Container17() {
  return (
    <div className="bg-[#4a90e2] border-[1.352px] border-[rgba(255,255,255,0.5)] border-solid content-stretch drop-shadow-[0px_1px_1.5px_rgba(0,0,0,0.1),0px_1px_1px_rgba(0,0,0,0.1)] flex flex-col items-center px-[6px] py-[2px] relative rounded-[22687700px] shrink-0" data-name="Container">
      <p className="[word-break:break-word] font-['Nunito:Black',sans-serif] font-black leading-[13.5px] relative shrink-0 text-[9px] text-center text-white whitespace-nowrap">Lvl 10</p>
    </div>
  );
}

function CharacterSprite5() {
  return (
    <div className="h-[39.998px] relative shrink-0 w-[27.997px]" data-name="CharacterSprite">
      <svg className="absolute block inset-0 size-full" fill="none" height="39.9984" preserveAspectRatio="none" viewBox="0 0 27.9967 39.9984" width="27.9967">
        <g clipPath="url(#clip0_0_91)" id="CharacterSprite">
          <path d={svgPaths.p1ed697c0} fill="black" fillOpacity="0.35" id="Vector" />
          <path d={svgPaths.p2a0d0f00} fill="#1A252F" id="Vector_2" />
          <path d={svgPaths.p3d78b300} fill="#1A252F" id="Vector_3" />
          <path d={svgPaths.p12893c00} fill="#3498DB" id="Vector_4" />
          <path d={svgPaths.p3165b180} fill="#3498DB" id="Vector_5" />
          <path d={svgPaths.pe72300} fill="#3498DB" id="Vector_6" />
          <path d={svgPaths.p1c9540c0} fill="#2471C8" id="Vector_7" />
          <path d={svgPaths.pd4c8500} fill="#2471C8" id="Vector_8" />
          <path d={svgPaths.p23f5ee00} fill="#5DADE2" id="Vector_9" />
          <path d={svgPaths.p27771930} fill="#5DADE2" id="Vector_10" opacity="0.5" />
          <path d={svgPaths.pc5000} fill="white" id="Vector_11" opacity="0.12" />
          <path d={svgPaths.paa1fc00} fill="#1ABC9C" id="Vector_12" opacity="0.9" />
          <path d={svgPaths.pd880680} fill="black" fillOpacity="0.35" id="Vector_13" />
          <path d={svgPaths.p34656200} fill="#E8B87A" id="Vector_14" />
          <path d={svgPaths.p172d2700} fill="#E8B87A" id="Vector_15" />
          <path d={svgPaths.p344d1c00} fill="#E8A870" id="Vector_16" opacity="0.5" />
          <path d={svgPaths.p3749de00} fill="#E8A870" id="Vector_17" opacity="0.5" />
          <path d={svgPaths.p26f34000} fill="#0D1B2A" id="Vector_18" />
          <path d={svgPaths.p127af600} fill="#2471C8" id="Vector_19" />
          <path d={svgPaths.p3b5e0180} fill="#2471C8" id="Vector_20" />
          <path d={svgPaths.p302f2480} fill="#1A1A2E" id="Vector_21" />
          <path d={svgPaths.p5505100} fill="#1A1A2E" id="Vector_22" />
          <path d={svgPaths.p259a700} fill="white" id="Vector_23" />
          <path d={svgPaths.p32c69000} fill="white" id="Vector_24" />
          <g id="Vector_25">
            <path d="M11.8986 9.8504H16.0981Z" fill="black" />
            <path d="M11.8986 9.8504H16.0981" stroke="#8A6A4A" strokeLinecap="round" strokeWidth="0.699917" />
          </g>
        </g>
        <defs>
          <clipPath id="clip0_0_91">
            <rect fill="white" height="39.9984" width="27.9967" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Container18() {
  return (
    <div className="bg-[rgba(255,255,255,0.93)] border-[#4a90e2] border-[2.028px] border-solid content-stretch flex items-center justify-center p-[3px] relative rounded-[22687700px] shadow-[0px_2px_12px_0px_rgba(74,144,226,0.33)] shrink-0" data-name="Container">
      <CharacterSprite5 />
    </div>
  );
}

function Container19() {
  return <div className="bg-[#4a90e2] relative rounded-[22687700px] shrink-0 size-[6px]" data-name="Container" />;
}

function PlayerMarker4() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[2px] items-center left-[158.89px] top-[122.44px]" data-name="PlayerMarker">
      <Container17 />
      <Container18 />
      <Container19 />
    </div>
  );
}

function ProgressStreakStrip() {
  return <div className="absolute backdrop-blur-[8px] bg-[#ffc300] border-[#ad6404] border-[2.028px] border-solid h-[33px] left-[-18px] rounded-[16px] top-[-2px] w-[149px]" data-name="Progress Streak strip" />;
}

function FlameIcon() {
  return (
    <div className="aspect-[13.99839973449707/13.99839973449707] overflow-clip relative shrink-0 w-full" data-name="FlameIcon">
      <div className="absolute bottom-[16.67%] left-1/4 right-1/4 top-[8.33%]" data-name="Vector">
        <div className="absolute inset-[-2.22%_-4%_-2.67%_-4%]">
          <svg className="block size-full" fill="none" height="58.9981" preserveAspectRatio="none" viewBox="0 0 40.5 58.9981" width="40.5">
            <path d={svgPaths.p26682f70} fill="#FF9600" id="Vector" stroke="#C97200" strokeWidth="3" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[45.83%_45.83%_33.33%_45.83%]" data-name="Vector">
        <svg className="absolute block inset-0 size-full" fill="none" height="15.625" preserveAspectRatio="none" viewBox="0 0 6.25 15.625" width="6.25">
          <path d={svgPaths.p291c09f0} fill="#FFD700" id="Vector" opacity="0.7" />
        </svg>
      </div>
    </div>
  );
}

function Container21() {
  return (
    <div className="absolute content-stretch flex flex-col items-center left-[19px] top-[-25px] w-[75px]" data-name="Container">
      <FlameIcon />
    </div>
  );
}

function FlameIcon1() {
  return (
    <div className="aspect-[13.99839973449707/13.99839973449707] overflow-clip relative shrink-0 w-full" data-name="FlameIcon">
      <div className="absolute bottom-[16.67%] left-1/4 right-1/4 top-[8.33%]" data-name="Vector">
        <div className="absolute inset-[-2.22%_-4%_-2.67%_-4%]">
          <svg className="block size-full" fill="none" height="58.9981" preserveAspectRatio="none" viewBox="0 0 40.5 58.9981" width="40.5">
            <path d={svgPaths.p26682f70} fill="#FF9600" id="Vector" stroke="#C97200" strokeWidth="3" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[45.83%_45.83%_33.33%_45.83%]" data-name="Vector">
        <svg className="absolute block inset-0 size-full" fill="none" height="15.625" preserveAspectRatio="none" viewBox="0 0 6.25 15.625" width="6.25">
          <path d={svgPaths.p291c09f0} fill="#FFD700" id="Vector" opacity="0.7" />
        </svg>
      </div>
    </div>
  );
}

function Container22() {
  return (
    <div className="absolute content-stretch flex flex-col items-center left-[94px] top-[-25px] w-[75px]" data-name="Container">
      <FlameIcon1 />
    </div>
  );
}

function Container23() {
  return <div className="absolute bg-white border-2 border-[#c8d0e0] border-solid h-[46px] left-[189px] rounded-[22687700px] top-[-9px] w-[48px]" data-name="Container" />;
}

function Container24() {
  return <div className="absolute bg-white h-[29px] left-[180px] rounded-[22687700px] top-0 w-[31px]" data-name="Container" />;
}

function StreakStrip() {
  return (
    <div className="absolute backdrop-blur-[8px] bg-[rgba(255,255,255,0.93)] border-2 border-[#c8d0e0] border-solid h-[33px] left-[90px] rounded-[16px] top-[66px] w-[234px]" data-name="StreakStrip">
      <ProgressStreakStrip />
      <Container21 />
      <Container22 />
      <Container23 />
      <Container24 />
    </div>
  );
}

function CharacterSprite6() {
  return (
    <div className="absolute h-[138px] left-[-4px] top-[-4px] w-[97px]" data-name="CharacterSprite">
      <svg className="absolute block inset-0 size-full" fill="none" height="138" preserveAspectRatio="none" viewBox="0 0 97 138" width="97">
        <g id="CharacterSprite">
          <path d={svgPaths.p1e775780} fill="#9B59B6" id="Vector" />
          <path d={svgPaths.p2069de00} fill="#7D3C98" id="Vector_2" />
          <path d={svgPaths.p2f0b0f00} fill="#7D3C98" id="Vector_3" />
          <path d={svgPaths.p387f0180} fill="#F0C68D" id="Vector_4" />
          <path d={svgPaths.p177dbc00} fill="#F0C68D" id="Vector_5" />
          <path d={svgPaths.p349a1100} fill="#E8A870" id="Vector_6" opacity="0.5" />
          <path d={svgPaths.p9556b80} fill="#E8A870" id="Vector_7" opacity="0.5" />
          <path d={svgPaths.p3e09ea00} fill="#0D0820" id="Vector_8" />
          <path d={svgPaths.p13fa9f00} fill="#0D0820" id="Vector_9" />
          <path d={svgPaths.pc859580} fill="#0D0820" id="Vector_10" />
          <path d={svgPaths.p16084b00} fill="#1A1A2E" id="Vector_11" />
          <path d={svgPaths.p4cd2200} fill="#1A1A2E" id="Vector_12" />
          <path d={svgPaths.p20188f00} fill="white" id="Vector_13" />
          <path d={svgPaths.p3e294200} fill="white" id="Vector_14" />
          <path d={svgPaths.p2aa3b680} id="Vector_15" stroke="#8A6A4A" strokeWidth="0.629926" />
        </g>
      </svg>
    </div>
  );
}

function Container25() {
  return (
    <div className="absolute bg-[#f7f0ff] border-4 border-[#a855f7] border-solid h-[91px] left-[9px] rounded-[22687700px] top-[35px] w-[94px]" data-name="Container">
      <CharacterSprite6 />
    </div>
  );
}

function Container20() {
  return (
    <div className="absolute h-[143px] left-[19.5px] top-[-0.47px] w-[348px]" data-name="Container">
      <StreakStrip />
      <Container25 />
    </div>
  );
}

function MapScreen() {
  return (
    <div className="absolute h-[843.991px] left-0 overflow-clip top-0 w-[390px]" data-name="MapScreen">
      <Container2 />
      <PlayerMarker />
      <PlayerMarker1 />
      <PlayerMarker2 />
      <PlayerMarker3 />
      <PlayerMarker4 />
      <Container20 />
    </div>
  );
}

function CalendarIcon() {
  return (
    <div className="relative shrink-0 size-[26px]" data-name="CalendarIcon">
      <svg className="absolute block inset-0 size-full" fill="none" height="26" preserveAspectRatio="none" viewBox="0 0 26 26" width="26">
        <g id="CalendarIcon">
          <path d={svgPaths.p2faed300} id="Vector" stroke="#9AAAC4" strokeWidth="2.38333" />
          <path d="M3.25 9.75H22.75" id="Vector_2" stroke="#9AAAC4" strokeWidth="2.38333" />
          <path d={svgPaths.p23a970a0} id="Vector_3" stroke="#9AAAC4" strokeLinecap="round" strokeWidth="2.38333" />
          <path d={svgPaths.p278fe700} fill="#9AAAC4" id="Vector_4" />
          <path d={svgPaths.p339e7e00} fill="#9AAAC4" id="Vector_5" />
        </g>
      </svg>
    </div>
  );
}

function Button() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[4px] items-center left-[54.5px] pb-[4px] top-[16.99px]" data-name="Button">
      <CalendarIcon />
      <p className="[word-break:break-word] font-['Nunito:Bold',sans-serif] font-bold leading-[15px] relative shrink-0 text-[#9aaac4] text-[10px] text-center whitespace-nowrap">Ranks</p>
    </div>
  );
}

function DumbbellIcon() {
  return (
    <div className="relative shrink-0 size-[27.997px]" data-name="DumbbellIcon">
      <svg className="absolute block inset-0 size-full" fill="none" height="27.9967" preserveAspectRatio="none" viewBox="0 0 27.9967 27.9967" width="27.9967">
        <g id="DumbbellIcon">
          <path d={svgPaths.p3c0be100} fill="white" id="Vector" />
          <path d={svgPaths.p31ee6500} fill="white" id="Vector_2" />
          <path d={svgPaths.p2f499200} fill="white" id="Vector_3" />
          <path d={svgPaths.p130f3900} fill="white" id="Vector_4" />
          <path d={svgPaths.p36cbf380} fill="white" id="Vector_5" />
        </g>
      </svg>
    </div>
  );
}

function Container26() {
  return (
    <div className="border-[#ff9090] border-[2.705px] border-solid content-stretch drop-shadow-[0px_6px_12px_rgba(255,75,75,0.45)] flex items-center justify-center relative rounded-[33.998px] shrink-0 size-[67.995px]" style={{ backgroundImage: "linear-gradient(145.0000003379585deg, rgb(255, 107, 107) 6.1733%, rgb(255, 75, 75) 93.827%)" }} data-name="Container">
      <DumbbellIcon />
    </div>
  );
}

function Button1() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[4px] items-center left-[159.82px] top-[-21.01px]" data-name="Button">
      <Container26 />
      <p className="[word-break:break-word] font-['Nunito:Bold',sans-serif] font-bold leading-[15px] relative shrink-0 text-[#ff4b4b] text-[10px] text-center whitespace-nowrap">Workout</p>
    </div>
  );
}

function ProfileIcon() {
  return (
    <div className="relative shrink-0 size-[26px]" data-name="ProfileIcon">
      <svg className="absolute block inset-0 size-full" fill="none" height="26" preserveAspectRatio="none" viewBox="0 0 26 26" width="26">
        <g id="ProfileIcon">
          <path d={svgPaths.p37103870} id="Vector" stroke="#9AAAC4" strokeWidth="2.38333" />
          <path d={svgPaths.p3ab00000} id="Vector_2" stroke="#9AAAC4" strokeLinecap="round" strokeWidth="2.38333" />
        </g>
      </svg>
    </div>
  );
}

function Button2() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[4px] items-center left-[304.85px] pb-[4px] top-[16.99px]" data-name="Button">
      <ProfileIcon />
      <p className="[word-break:break-word] font-['Nunito:Bold',sans-serif] font-bold leading-[15px] relative shrink-0 text-[#9aaac4] text-[10px] text-center whitespace-nowrap">Profile</p>
    </div>
  );
}

function BottomNav() {
  return (
    <div className="absolute bg-white border-[#c8d0e0] border-solid border-t-[2.028px] h-[79.997px] left-0 top-[763.99px] w-[390px]" data-name="BottomNav">
      <Button />
      <Button1 />
      <Button2 />
    </div>
  );
}

function Container1() {
  return (
    <div className="bg-white h-[843.991px] overflow-clip relative rounded-[44px] shadow-[0px_32px_80px_0px_rgba(0,0,0,0.22),0px_0px_0px_2.5px_#c8d0e0] shrink-0 w-[390px]" data-name="Container">
      <MapBackground />
      <MapScreen />
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <div className="bg-[#e8edf5] content-stretch flex h-[874.935px] items-center justify-center min-h-[874.9349975585938px] relative shrink-0 w-full" data-name="App">
      <Container1 />
    </div>
  );
}

function Container() {
  return (
    <div className="bg-[#e8edf5] content-stretch flex flex-col h-[874.935px] items-start relative shrink-0 w-full" data-name="Container">
      <App />
    </div>
  );
}

function Body() {
  return (
    <div className="bg-[#e8edf5] content-stretch flex flex-col h-[874.935px] items-start relative shrink-0 w-full" data-name="Body">
      <Container />
    </div>
  );
}

export default function GameAppDesignOverview() {
  return (
    <div className="bg-[#e8edf5] content-stretch flex flex-col items-start relative size-full" data-name="Game App Design Overview">
      <Body />
    </div>
  );
}