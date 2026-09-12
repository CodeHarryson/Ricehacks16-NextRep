import svgPaths from "./svg-5prhvuth4s";

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

function Container1() {
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

function Container2() {
  return (
    <div className="absolute content-stretch flex flex-col items-center left-[94px] top-[-25px] w-[75px]" data-name="Container">
      <FlameIcon1 />
    </div>
  );
}

function Container3() {
  return <div className="absolute bg-white border-2 border-[#c8d0e0] border-solid h-[46px] left-[189px] rounded-[22687700px] top-[-9px] w-[48px]" data-name="Container" />;
}

function Container4() {
  return <div className="absolute bg-white h-[29px] left-[180px] rounded-[22687700px] top-0 w-[31px]" data-name="Container" />;
}

function StreakStrip() {
  return (
    <div className="absolute backdrop-blur-[8px] bg-[rgba(255,255,255,0.93)] border-2 border-[#c8d0e0] border-solid h-[33px] left-[90px] rounded-[16px] top-[66px] w-[234px]" data-name="StreakStrip">
      <ProgressStreakStrip />
      <Container1 />
      <Container2 />
      <Container3 />
      <Container4 />
    </div>
  );
}

function CharacterSprite() {
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

function Container5() {
  return (
    <div className="absolute bg-[#f7f0ff] border-4 border-[#a855f7] border-solid h-[91px] left-[9px] rounded-[22687700px] top-[35px] w-[94px]" data-name="Container">
      <CharacterSprite />
    </div>
  );
}

export default function Container() {
  return (
    <div className="relative size-full" data-name="Container">
      <StreakStrip />
      <Container5 />
    </div>
  );
}