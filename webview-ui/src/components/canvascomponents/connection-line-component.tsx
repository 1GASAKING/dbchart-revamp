import { useConnection } from "@xyflow/react";

interface ConnectionLineProp{
    xorign:number,
    xend:number,
    yorign:number,
    yend:number,

}
const ConnectionLineComponent =({xorign,yorign,xend,yend}:ConnectionLineProp)=>{
      const { fromHandle } = useConnection();

    if (!fromHandle?.id) return null;

    return(
         <g>
      <path
        fill="none"
        stroke={fromHandle.id}
        strokeWidth={1.5}
        className="animated"
        d={`M${xorign},${yorign} C ${xorign} ${yend} ${xorign} ${yend} ${xend},${yend}`}
      />
      <circle
        cx={xend}
        cy={yend}
        fill="#fff"
        r={3}
        stroke={fromHandle.id}
        strokeWidth={1.5}
      />
    </g>
    )
}

export default ConnectionLineComponent
