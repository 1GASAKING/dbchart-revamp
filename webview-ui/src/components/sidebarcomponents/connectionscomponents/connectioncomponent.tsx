import { useState } from "react"
import { ConnectionComponentDropDown, ConnectionComponentDropDownField, ConnectionComponentField, ConnectionComponentMainDiv, ConnectionComponentSectionDiv, ConnectionComponentToggle } from "../../../styles/sidebarcomponentsstyles/connectioncomponentstyles/connectioncomponentstyle"

const ConnectionComponent = () => {
    const [selectedProject ,setSelectedProject ] = useState<string>();
    return (
        <ConnectionComponentMainDiv>
            <ConnectionComponentSectionDiv>
                <div>
                    
                    <ConnectionComponentToggle id="change-project-toggle" />
                    <ConnectionComponentField>
                        <div>
                            <div className="connection-name">
                                <div>
                                    <h4>
                                        gsgggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg
                                    </h4>

                                </div>


                            </div>
                            <label htmlFor="change-project-toggle">
                                <div className="flex">
                                    <div className="chevron-container">

                                        <i className="codicon codicon-chevron-up"></i>


                                    </div>



                                </div>

                            </label>

                        </div>
                        <ConnectionComponentDropDown>
                            <div>
                                {
                                    data.map((item,index)=>(  <ConnectionComponentDropDownField key={index+"options"}  isSelcted={item === selectedProject } onClick={()=>setSelectedProject(item)}>
                                    <div>
                                        <div className="connection-name">
                                            <div>
                                                <h4>
                                                    gsgggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg
                                                </h4>

                                            </div>


                                        </div>
                                        <div className="flex">
                                            <div className="apps-icon">
                                                <div>
                                                    d

                                                </div>

                                            </div><div className="apps-icon">
                                                <div>
                                                    d

                                                </div>

                                            </div>



                                        </div>
                                    </div>

                                </ConnectionComponentDropDownField>))
                                }

                               

                              

                            </div>

                        </ConnectionComponentDropDown>
                    </ConnectionComponentField>



                </div>

            </ConnectionComponentSectionDiv>

        </ConnectionComponentMainDiv>
    )
}

const data =[
    "id1",
    "id2",
    "id3","id6"
]


export default ConnectionComponent