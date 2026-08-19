import { useState } from "react";
import Tooltip from "../shared/Tooltip";
import { SideBarMainDiv, SideBarSection, SideBarSectionHeader, SideBarContent, ToggleCheckbox } from "../../styles/sidebarcomponentsstyles/sidebarcomponentstyles";
import ConnectionComponent from "./connectionscomponents/connectioncomponent";
import { DBConnectionDialog } from "../dbconnectioncomponents/db-connection-dialog";
import { vscode } from "../../utils/vscode";
import { WebviewMessageType } from "@shared/webview/webviewmessage";

const SideBarComponent = () => {
    const [showConnectionDialog, setShowConnectionDialog] = useState(false);

    const OpenEditor =()=>{

        vscode._postMessage(
            {messageType: WebviewMessageType.OPEN_EDITOR}
        )
    }
    return (
        <>
        {showConnectionDialog && (
            <DBConnectionDialog
                onClose={() => setShowConnectionDialog(false)}
                onConnected={() => {}}
            />
        )}
        <SideBarMainDiv>
            <div>
                <SideBarSection >
                    <div>
                        <ToggleCheckbox id="connections-toggle" defaultChecked />
                        <SideBarSectionHeader>
                            <div className="section-header">
                                <label htmlFor="connections-toggle" className="section-label-holder">
                                    <div className="icon-container">
                                        <i className="codicon codicon-chevron-up"></i>
                                    </div>
                                    <div>
                                        <h4 className="text-container">
                                            Connections
                                        </h4>
                                    </div>
                                </label>

                                <div className="section-action-group-holder">

                                    <Tooltip text="Link connection">
                                        <div className="icon-container section-action-holder">
                                            <i className="codicon codicon-link"></i>
                                        </div>
                                    </Tooltip>
                                    <Tooltip text="new connection">
                                        <div className="icon-container section-action-holder" onClick={() => setShowConnectionDialog(true)}>
                                            <i className="codicon codicon-add"></i>
                                        </div>
                                    </Tooltip>
                                    <Tooltip text="open editor">
                                        <div className="icon-container section-action-holder" onClick={()=>{OpenEditor()}}>
                                            <i className="codicon codicon-eye"></i>
                                        </div>
                                    </Tooltip>
                                </div>
                            </div>




                        </SideBarSectionHeader>


                        <SideBarContent className="connections-section">
                            {/* Section content goes here */}

                            <ConnectionComponent />


                        </SideBarContent>
                    </div>
                </SideBarSection>
                <SideBarSection>
                    <div>
                        <ToggleCheckbox id="bookmark-toggle" defaultChecked />
                        <SideBarSectionHeader>
                            <div className="section-header">
                                <label htmlFor="bookmark-toggle" className="section-label-holder">
                                    <div className="icon-container">
                                        <i className="codicon codicon-chevron-up"></i>
                                    </div>
                                    <div>
                                        <h4 className="text-container">
                                            BOOKMARK
                                        </h4>
                                    </div>
                                </label>

                                <div className="section-action-group-holder">

                                    <Tooltip text="Link connection">
                                        <div className="icon-container section-action-holder">
                                            <i className="codicon codicon-link"></i>
                                        </div>
                                    </Tooltip>
                                    <Tooltip text="collpase all">
                                        <div className="icon-container section-action-holder">
                                            <i className="codicon codicon-collapse-all"></i>
                                        </div>
                                    </Tooltip>
                                </div>
                            </div>


                        </SideBarSectionHeader>

                        <SideBarContent>
                            {/* Section content goes here */}
                        </SideBarContent>
                    </div>
                </SideBarSection>
                <SideBarSection>
                    <div>
                        <ToggleCheckbox id="query-toggle" defaultChecked />
                        <SideBarSectionHeader>
                            <div className="section-header">
                                <label htmlFor="query-toggle" className="section-label-holder">
                                    <div className="icon-container">
                                        <i className="codicon codicon-chevron-up"></i>
                                    </div>
                                    <div>
                                        <h4 className="text-container">
                                            query history
                                        </h4>
                                    </div>
                                </label>

                                <div className="section-action-group-holder">

                                    <Tooltip text="Link connection">
                                        <div className="icon-container section-action-holder">
                                            <i className="codicon codicon-link"></i>
                                        </div>
                                    </Tooltip>
                                    <Tooltip text="collpase all">
                                        <div className="icon-container section-action-holder">
                                            <i className="codicon codicon-collapse-all"></i>
                                        </div>
                                    </Tooltip>
                                </div>
                            </div>


                        </SideBarSectionHeader>

                        <SideBarContent>
                            {/* Section content goes here */}
                        </SideBarContent>
                    </div>
                </SideBarSection>
            </div>
        </SideBarMainDiv>
        </>
    );
};

export default SideBarComponent
