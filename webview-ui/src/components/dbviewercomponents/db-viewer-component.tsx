import { DBViewerComponentBodyDiv, DBViewerComponentHeaderDiv, DBViewerComponentMianDiv } from "../../styles/dbviewcomponentsstyles/dbviewercomponentstyles"
import { VsButton } from "../../styles/reusablecomponentsstyles/button-component-styles"

const DBViewerComponent =()=>{
    return(
        <DBViewerComponentMianDiv>
            <div>
                <DBViewerComponentHeaderDiv>
                    <div>
                        <div>
                            <div> Table Name </div>
                            <div> description about all rows showed </div>

                        </div>
                        <div className="left-items">
                            
                            <div className="db-viewer-action-button ">
                                <VsButton>
                                    options 

                                    
                                    
                                </VsButton>
                            </div>
                            
                            <div className="db-viewer-action-button ">
                                <VsButton>
                                    undo 

                                    
                                    
                                </VsButton>
                            </div>
                            <div className="db-viewer-action-button ">
                                <VsButton>
                                    redo 

                                    
                                    
                                </VsButton>
                            </div>
                            
                            <div className="db-viewer-action-button ">
                                <VsButton>
                                    save 

                                    
                                    
                                </VsButton>
                            </div>

                            <div>
                                <VsButton>
                                    new 

                                    <span>
                                        /
                                    </span>
                                </VsButton>
                            </div>
                        </div>
                    </div>


                </DBViewerComponentHeaderDiv>
                <DBViewerComponentBodyDiv>
                    <div>
                        <div>
                            headers

                        </div>
                    </div>
                </DBViewerComponentBodyDiv>

            </div>


        </DBViewerComponentMianDiv>
    )
}

export default DBViewerComponent